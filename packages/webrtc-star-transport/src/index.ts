import { logger } from '@libp2p/logger'
import errcode from 'err-code'
import { AbortError } from 'abortable-iterator'
import { Multiaddr } from '@multiformats/multiaddr'
import * as mafmt from '@multiformats/mafmt'
import { CODE_CIRCUIT } from './constants.js'
import { createListener } from './listener.js'
import { toMultiaddrConnection } from './socket-to-conn.js'
import { cleanMultiaddr, cleanUrlSIO } from './utils.js'
import { WebRTCInitiator } from './peer/initiator.js'
import randomBytes from 'iso-random-stream/src/random.js'
import { toString as uint8ArrayToString } from 'uint8arrays'
import { EventEmitter, CustomEvent } from '@libp2p/interfaces'
import { peerIdFromString } from '@libp2p/peer-id'
import type { PeerId } from '@libp2p/interfaces/peer-id'
import type { WRTC } from './peer/interface.js'
import type { Connection } from '@libp2p/interfaces/connection'
import type { Transport, Upgrader, ListenerOptions, MultiaddrConnection, Listener } from '@libp2p/interfaces/transport'
import type { PeerDiscovery, PeerDiscoveryEvents } from '@libp2p/interfaces/peer-discovery'
import type { AbortOptions } from '@libp2p/interfaces'
import type { WebRTCInitiatorOptions } from './peer/initiator.js'
import type { WebRTCReceiver, WebRTCReceiverOptions } from './peer/receiver.js'
import type { WebRTCStarSocket, HandshakeSignal } from '@libp2p/webrtc-star-protocol'

const webrtcSupport = 'RTCPeerConnection' in globalThis
const log = logger('libp2p:webrtc-star')

const noop = () => {}

class WebRTCStarDiscovery extends EventEmitter<PeerDiscoveryEvents> implements PeerDiscovery {
  public tag = 'webRTCStar'
  private started = false

  isStarted () {
    return this.started
  }

  async start () {
    this.started = true
  }

  async stop () {
    this.started = false
  }

  dispatchEvent (event: CustomEvent) {
    if (!this.isStarted()) {
      return false
    }

    return super.dispatchEvent(event)
  }
}

export interface WebRTCStarOptions {
  upgrader: Upgrader
  peerId: PeerId
  wrtc?: WRTC
}

export interface WebRTCStarDialOptions extends AbortOptions {
  channelOptions?: WebRTCInitiatorOptions
}

export interface WebRTCStarListenerOptions extends ListenerOptions, WebRTCInitiatorOptions {
  channelOptions?: WebRTCReceiverOptions
}

export interface SignalServerServerEvents {
  'error': CustomEvent<Error>
  'listening': CustomEvent
  'peer': CustomEvent<string>
  'connection': CustomEvent<Connection>
}

export interface SignalServer extends EventEmitter<SignalServerServerEvents> {
  signallingAddr: Multiaddr
  socket: WebRTCStarSocket
  connections: MultiaddrConnection[]
  channels: Map<string, WebRTCReceiver>
  pendingSignals: Map<string, HandshakeSignal[]>
  close: () => Promise<void>
}

/**
 * @class WebRTCStar
 */
export class WebRTCStar implements Transport<WebRTCStarDialOptions, WebRTCStarListenerOptions> {
  public wrtc?: WRTC
  public discovery: PeerDiscovery
  public sigServers: Map<string, SignalServer>

  private readonly upgrader: Upgrader
  private readonly peerId: PeerId

  constructor (options: WebRTCStarOptions) {
    if (options.upgrader == null) {
      throw new Error('An upgrader must be provided. See https://github.com/libp2p/interface-transport#upgrader.')
    }

    this.upgrader = options.upgrader
    this.peerId = options.peerId

    if (options.wrtc != null) {
      this.wrtc = options.wrtc
    }

    // Keep Signalling references
    this.sigServers = new Map()

    // Discovery
    this.discovery = new WebRTCStarDiscovery()
    this.peerDiscovered = this.peerDiscovered.bind(this)
  }

  async dial (ma: Multiaddr, options?: WebRTCStarDialOptions) {
    options = options ?? {}
    const rawConn = await this._connect(ma, options)
    const maConn = toMultiaddrConnection(rawConn, { remoteAddr: ma, signal: options.signal })
    log('new outbound connection %s', maConn.remoteAddr)
    const conn = await this.upgrader.upgradeOutbound(maConn)
    log('outbound connection %s upgraded', maConn.remoteAddr)
    return conn
  }

  async _connect (ma: Multiaddr, options: WebRTCStarDialOptions) {
    if (options.signal?.aborted === true) {
      throw new AbortError()
    }

    const channelOptions = {
      ...(options.channelOptions ?? {})
    }

    // Use custom WebRTC implementation
    if (this.wrtc != null) {
      channelOptions.wrtc = this.wrtc
    }

    const cOpts = ma.toOptions()
    const intentId = uint8ArrayToString(randomBytes(36), 'hex')

    return await new Promise<WebRTCInitiator>((resolve, reject) => {
      const sio = this.sigServers.get(cleanUrlSIO(ma))

      if (sio?.socket == null) {
        return reject(errcode(new Error('unknown signal server to use'), 'ERR_UNKNOWN_SIGNAL_SERVER'))
      }

      let connected: boolean = false

      log('dialing %s:%s', cOpts.host, cOpts.port)
      const channel = new WebRTCInitiator(channelOptions)

      const onError = (err: Error) => {
        if (!connected) {
          const msg = `connection error ${cOpts.host}:${cOpts.port}: ${err.message}`
          log.error(msg)
          done(err)
        }
      }

      const onReady = () => {
        connected = true

        log('connection opened %s:%s', cOpts.host, cOpts.port)
        done()
      }

      const onAbort = () => {
        log.error('connection aborted %s:%s', cOpts.host, cOpts.port)
        channel.close().finally(() => {
          done(new AbortError())
        })
      }

      const done = (err?: Error) => {
        channel.removeListener('ready', onReady)
        options.signal?.removeEventListener('abort', onAbort)

        if (err == null) {
          resolve(channel)
        } else {
          reject(err)
        }
      }

      channel.on('error', onError)
      channel.once('ready', onReady)
      channel.on('close', () => {
        channel.removeListener('error', onError)
      })
      options.signal?.addEventListener('abort', onAbort)

      channel.on('signal', (signal) => {
        sio.socket.emit('ss-handshake', {
          intentId: intentId,
          srcMultiaddr: sio.signallingAddr.toString(),
          dstMultiaddr: ma.toString(),
          signal: signal
        })
      })

      sio.socket.on('ws-handshake', (offer) => {
        if (offer.intentId === intentId && offer.err != null) {
          channel.close().finally(() => {
            reject(errcode(new Error(offer.err), 'ERR_SIGNALLING_FAILED'))
          })
        }

        if (offer.intentId !== intentId || offer.answer == null || channel.closed) {
          return
        }

        channel.handleSignal(offer.signal)
      })
    })
  }

  /**
   * Creates a WebrtcStar listener. The provided `handler` function will be called
   * anytime a new incoming Connection has been successfully upgraded via
   * `upgrader.upgradeInbound`.
   */
  createListener (options?: WebRTCStarListenerOptions): Listener {
    if (!webrtcSupport && this.wrtc == null) {
      throw errcode(new Error('no WebRTC support'), 'ERR_NO_WEBRTC_SUPPORT')
    }

    options = options ?? {}
    options.channelOptions = options.channelOptions ?? {}

    if (this.wrtc != null) {
      options.channelOptions.wrtc = this.wrtc
    }

    return createListener(this.upgrader, options.handler ?? noop, this.peerId, this, options)
  }

  /**
   * Takes a list of `Multiaddr`s and returns only valid TCP addresses
   */
  filter (multiaddrs: Multiaddr[]) {
    multiaddrs = Array.isArray(multiaddrs) ? multiaddrs : [multiaddrs]

    return multiaddrs.filter((ma) => {
      if (ma.protoCodes().includes(CODE_CIRCUIT)) {
        return false
      }

      return mafmt.WebRTCStar.matches(ma)
    })
  }

  peerDiscovered (maStr: string) {
    log('peer discovered: %s', maStr)
    maStr = cleanMultiaddr(maStr)

    const ma = new Multiaddr(maStr)
    const peerIdStr = ma.getPeerId()

    if (peerIdStr == null) {
      return
    }

    const peerId = peerIdFromString(peerIdStr)

    this.discovery.dispatchEvent(new CustomEvent('peer', {
      detail: {
        id: peerId,
        multiaddrs: [ma],
        protocols: []
      }
    }))
  }
}
