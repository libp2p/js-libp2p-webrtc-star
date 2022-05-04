import { logger } from '@libp2p/logger'
import errCode from 'err-code'
import { connect } from 'socket.io-client'
import pDefer from 'p-defer'
import { WebRTCReceiver } from '@libp2p/webrtc-peer'
import { toMultiaddrConnection } from './socket-to-conn.js'
import { cleanUrlSIO } from './utils.js'
import { CODE_P2P } from './constants.js'
import type { PeerId } from '@libp2p/interfaces/peer-id'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { Upgrader, ConnectionHandler, Listener, MultiaddrConnection, ListenerEvents } from '@libp2p/interfaces/transport'
import type { WebRTCStar, WebRTCStarListenerOptions, SignalServer, SignalServerServerEvents } from './index.js'
import type { WebRTCReceiverInit } from '@libp2p/webrtc-peer'
import type { WebRTCStarSocket, HandshakeSignal } from '@libp2p/webrtc-star-protocol'
import { EventEmitter, CustomEvent } from '@libp2p/interfaces/events'

const log = logger('libp2p:webrtc-star:listener')

const sioOptions = {
  transports: ['websocket'],
  'force new connection': true,
  path: '/socket.io-next/' // This should be removed when socket.io@2 support is removed
}

class SigServer extends EventEmitter<SignalServerServerEvents> implements SignalServer {
  public signallingAddr: Multiaddr
  public socket: WebRTCStarSocket
  public connections: MultiaddrConnection[]
  public channels: Map<string, WebRTCReceiver>
  public pendingSignals: Map<string, HandshakeSignal[]>

  private readonly upgrader: Upgrader
  private readonly handler: ConnectionHandler
  private readonly channelOptions?: WebRTCReceiverInit

  constructor (signallingUrl: string, signallingAddr: Multiaddr, upgrader: Upgrader, handler: ConnectionHandler, channelOptions?: WebRTCReceiverInit) {
    super()

    this.signallingAddr = signallingAddr
    this.socket = connect(signallingUrl, sioOptions)
    this.connections = []
    this.channels = new Map()
    this.pendingSignals = new Map()

    this.upgrader = upgrader
    this.handler = handler
    this.channelOptions = channelOptions

    this.handleWsHandshake = this.handleWsHandshake.bind(this)

    this.socket.once('connect_error', (err) => {
      this.dispatchEvent(new CustomEvent('error', {
        detail: err
      }))
    })
    this.socket.once('error', (err: Error) => {
      this.dispatchEvent(new CustomEvent('error', {
        detail: err
      }))
    })

    this.socket.on('ws-handshake', this.handleWsHandshake)
    this.socket.on('ws-peer', (maStr) => {
      this.dispatchEvent(new CustomEvent('peer', {
        detail: maStr
      }))
    })
    this.socket.on('connect', () => this.socket.emit('ss-join', signallingAddr.toString()))
    this.socket.once('connect', () => {
      this.dispatchEvent(new CustomEvent('listening'))
    })
  }

  _createChannel (intentId: string, srcMultiaddr: string, dstMultiaddr: string) {
    const channelOptions: WebRTCReceiverInit = {
      ...this.channelOptions
    }

    const channel = new WebRTCReceiver(channelOptions)

    const onError = (evt: CustomEvent<Error>) => {
      const err = evt.detail

      log.error('incoming connection errored', err)
    }

    channel.addEventListener('error', onError)
    channel.addEventListener('close', () => {
      channel.removeEventListener('error', onError)
    }, {
      once: true
    })

    channel.addEventListener('signal', (evt) => {
      const signal = evt.detail

      this.socket.emit('ss-handshake', {
        intentId,
        srcMultiaddr,
        dstMultiaddr,
        answer: true,
        signal
      })
    })

    channel.addEventListener('ready', () => {
      const maConn = toMultiaddrConnection(channel, { remoteAddr: this.signallingAddr })
      log('new inbound connection %s', maConn.remoteAddr)

      try {
        this.upgrader.upgradeInbound(maConn)
          .then(conn => {
            log('inbound connection %s upgraded', maConn.remoteAddr)

            this.connections.push(maConn)

            const untrackConn = () => {
              this.connections = this.connections.filter(c => c !== maConn)
              this.channels.delete(intentId)
              this.pendingSignals.delete(intentId)
            }

            channel.addEventListener('close', untrackConn, {
              once: true
            })

            this.dispatchEvent(new CustomEvent('connection', {
              detail: conn
            }))
            this.handler(conn)
          })
          .catch(err => {
            log.error('inbound connection failed to upgrade', err)
            maConn.close().catch(err => {
              log.error('inbound connection failed to close after failing to upgrade', err)
            })
          })
      } catch (err: any) {
        log.error('inbound connection failed to upgrade', err)
        maConn.close().catch(err => {
          log.error('inbound connection failed to close after failing to upgrade', err)
        })
      }
    }, {
      once: true
    })

    return channel
  }

  handleWsHandshake (offer: HandshakeSignal) {
    log('incoming handshake. signal type "%s" is answer %s', offer.signal.type, offer.answer)

    if (offer.answer === true || offer.err != null || offer.intentId == null) {
      return
    }

    const intentId = offer.intentId
    let pendingSignals = this.pendingSignals.get(intentId)

    if (pendingSignals == null) {
      pendingSignals = []
      this.pendingSignals.set(intentId, pendingSignals)
    }

    pendingSignals.push(offer)

    let channel = this.channels.get(intentId)

    if (channel == null) {
      if (offer.signal.type !== 'offer') {
        log('handshake is not an offer and channel does not exist, buffering until we receive an offer')
        return
      }

      log('creating new channel to handle offer handshake')
      channel = this._createChannel(offer.intentId, offer.srcMultiaddr, offer.dstMultiaddr)
      this.channels.set(intentId, channel)
    } else {
      log('channel already exists, using it to handle handshake')
    }

    while (pendingSignals.length > 0) {
      const handshake = pendingSignals.shift()

      if (handshake?.signal != null) {
        channel.handleSignal(handshake.signal)
      }
    }
  }

  async close () {
    // Close listener
    this.socket.emit('ss-leave', this.signallingAddr.toString())
    this.socket.removeAllListeners()
    this.socket.close()

    await Promise.all([
      ...this.connections.map(async maConn => await maConn.close()),
      ...Array.from(this.channels.values()).map(async channel => await channel.close())
    ])

    this.dispatchEvent(new CustomEvent('close'))
  }
}

class WebRTCListener extends EventEmitter<ListenerEvents> implements Listener {
  private listeningAddr?: Multiaddr
  private signallingUrl?: string
  private readonly upgrader: Upgrader
  private readonly handler: ConnectionHandler
  private readonly peerId: PeerId
  private readonly transport: WebRTCStar
  private readonly options: WebRTCStarListenerOptions

  constructor (upgrader: Upgrader, handler: ConnectionHandler, peerId: PeerId, transport: WebRTCStar, options: WebRTCStarListenerOptions) {
    super()

    this.upgrader = upgrader
    this.handler = handler
    this.peerId = peerId
    this.transport = transport
    this.options = options
  }

  async listen (ma: Multiaddr) {
    // Should only be used if not already listening
    if (this.listeningAddr != null) {
      throw errCode(new Error('listener already in use'), 'ERR_ALREADY_LISTENING')
    }

    const defer = pDefer<void>() // eslint-disable-line @typescript-eslint/no-invalid-void-type

    // Should be kept unmodified
    this.listeningAddr = ma

    let signallingAddr: Multiaddr
    if (!ma.protoCodes().includes(CODE_P2P)) {
      signallingAddr = ma.encapsulate(`/p2p/${this.peerId.toString()}`)
    } else {
      signallingAddr = ma
    }

    this.signallingUrl = cleanUrlSIO(ma)

    log('connecting to signalling server on: %s', this.signallingUrl)
    const server: SignalServer = new SigServer(this.signallingUrl, signallingAddr, this.upgrader, this.handler, this.options.channelOptions)
    server.addEventListener('error', (evt) => {
      const err = evt.detail

      log('error connecting to signalling server %o', err)
      server.close().catch(err => {
        log.error('error closing server after error', err)
      })
      defer.reject(err)
    })
    server.addEventListener('listening', () => {
      log('connected to signalling server')
      this.dispatchEvent(new CustomEvent('listening'))
      defer.resolve()
    })
    server.addEventListener('peer', (evt) => {
      this.transport.peerDiscovered(evt.detail)
    })
    server.addEventListener('connection', (evt) => {
      const conn = evt.detail

      if (conn.remoteAddr == null) {
        try {
          conn.remoteAddr = ma.decapsulateCode(CODE_P2P).encapsulate(`/p2p/${conn.remotePeer.toString()}`)
        } catch (err) {
          log.error('could not determine remote address', err)
        }
      }

      this.dispatchEvent(new CustomEvent('connection', {
        detail: conn
      }))
    })

    // Store listen and signal reference addresses
    this.transport.sigServers.set(this.signallingUrl, server)

    return await defer.promise
  }

  async close () {
    if (this.signallingUrl != null) {
      const server = this.transport.sigServers.get(this.signallingUrl)

      if (server != null) {
        await server.close()
        this.transport.sigServers.delete(this.signallingUrl)
      }
    }

    this.dispatchEvent(new CustomEvent('close'))

    // Reset state
    this.listeningAddr = undefined
  }

  getAddrs () {
    if (this.listeningAddr != null) {
      return [
        this.listeningAddr
      ]
    }

    return []
  }
}

export function createListener (upgrader: Upgrader, handler: ConnectionHandler, peerId: PeerId, transport: WebRTCStar, options: WebRTCStarListenerOptions) {
  return new WebRTCListener(upgrader, handler, peerId, transport, options)
}
