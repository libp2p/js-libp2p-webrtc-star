import { EventEmitter } from 'events'
import debug from 'debug'
import errCode from 'err-code'
import { connect } from 'socket.io-client'
import pDefer from 'p-defer'
import { WebRTCReceiver } from './peer/receiver.js'
import { toMultiaddrConnection } from './socket-to-conn.js'
import { cleanUrlSIO } from './utils.js'
import { CODE_P2P } from './constants.js'
import { base58btc } from 'multiformats/bases/base58'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { Upgrader, ConnectionHandler, Listener, MultiaddrConnection } from '@libp2p/interfaces/transport'
import type { WebRTCStar, WebRTCStarListenerOptions, SignalServer } from './index.js'
import type { PeerId } from '@libp2p/peer-id'
import type { WebRTCReceiverOptions } from './peer/receiver'
import type { WebRTCStarSocket, HandshakeSignal, Signal } from '@libp2p/webrtc-star-protocol'

const log = Object.assign(debug('libp2p:webrtc-star:listener'), {
  error: debug('libp2p:webrtc-star:listener:error')
})

const sioOptions = {
  transports: ['websocket'],
  'force new connection': true,
  path: '/socket.io-next/' // This should be removed when socket.io@2 support is removed
}

class SigServer extends EventEmitter implements SignalServer {
  public signallingAddr: Multiaddr
  public socket: WebRTCStarSocket
  public connections: MultiaddrConnection[]
  public channels: Map<string, WebRTCReceiver>
  public pendingSignals: Map<string, HandshakeSignal[]>

  private readonly upgrader: Upgrader
  private readonly handler: ConnectionHandler
  private readonly channelOptions?: WebRTCReceiverOptions

  constructor (signallingUrl: string, signallingAddr: Multiaddr, upgrader: Upgrader, handler: ConnectionHandler, channelOptions?: WebRTCReceiverOptions) {
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
      this.emit('error', err)
    })
    this.socket.once('error', (err: Error) => {
      this.emit('error', err)
    })

    this.socket.on('ws-handshake', this.handleWsHandshake)
    this.socket.on('ws-peer', (maStr) => this.emit('peer', maStr))
    this.socket.on('connect', () => this.socket.emit('ss-join', signallingAddr.toString()))
    this.socket.once('connect', () => this.emit('listening'))
  }

  _createChannel (intentId: string, srcMultiaddr: string, dstMultiaddr: string) {
    const channelOptions: WebRTCReceiverOptions = {
      ...this.channelOptions
    }

    const channel = new WebRTCReceiver(channelOptions)

    const onError = (err: Error) => {
      log.error('incoming connection errored', err)
    }

    channel.on('error', onError)
    channel.once('close', () => {
      channel.removeListener('error', onError)
    })

    channel.on('signal', (signal: Signal) => {
      this.socket.emit('ss-handshake', {
        intentId,
        srcMultiaddr,
        dstMultiaddr,
        answer: true,
        signal
      })
    })

    channel.once('ready', () => {
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

            channel.once('close', untrackConn)

            this.emit('connection', conn)
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
    this.socket.close()

    await Promise.all([
      ...this.connections.map(async maConn => await maConn.close()),
      ...Array.from(this.channels.values()).map(async channel => await channel.close())
    ])

    this.emit('close')
    this.removeAllListeners()
  }
}

export function createListener (upgrader: Upgrader, handler: ConnectionHandler, peerId: PeerId, transport: WebRTCStar, options: WebRTCStarListenerOptions) {
  let listeningAddr: Multiaddr | undefined
  let signallingUrl: string

  const listener: Listener = Object.assign(new EventEmitter(), {
    listen: async (ma: Multiaddr) => {
      // Should only be used if not already listening
      if (listeningAddr != null) {
        throw errCode(new Error('listener already in use'), 'ERR_ALREADY_LISTENING')
      }

      const defer = pDefer<void>() // eslint-disable-line @typescript-eslint/no-invalid-void-type

      // Should be kept unmodified
      listeningAddr = ma

      let signallingAddr: Multiaddr
      if (!ma.protoCodes().includes(CODE_P2P)) {
        signallingAddr = ma.encapsulate(`/p2p/${peerId.toString(base58btc)}`)
      } else {
        signallingAddr = ma
      }

      signallingUrl = cleanUrlSIO(ma)

      log('connecting to signalling server on: %s', signallingUrl)
      const server: SignalServer = new SigServer(signallingUrl, signallingAddr, upgrader, handler, options.channelOptions)
      server.on('error', (err) => {
        log('error connecting to signalling server %o', err)
        server.close().catch(err => {
          log.error('error closing server after error', err)
        })
        defer.reject(err)
      })
      server.on('listening', () => {
        log('connected to signalling server')
        listener.emit('listening')
        defer.resolve()
      })
      server.on('peer', (maStr) => transport.peerDiscovered(maStr))
      server.on('connection', (conn) => {
        if (conn.remoteAddr == null) {
          try {
            conn.remoteAddr = ma.decapsulateCode(CODE_P2P).encapsulate(`/p2p/${conn.remotePeer.toString(base58btc)}`)
          } catch (err) {
            log.error('could not determine remote address', err)
          }
        }

        listener.emit('connection', conn)
      })

      // Store listen and signal reference addresses
      transport.sigServers.set(signallingUrl, server)

      return await defer.promise
    },
    close: async () => {
      const server = transport.sigServers.get(signallingUrl)

      if (server != null) {
        await server.close()
        transport.sigServers.delete(signallingUrl)
      }

      listener.emit('close')

      // Reset state
      listeningAddr = undefined
    },
    getAddrs: () => {
      if (listeningAddr != null) {
        return [
          listeningAddr
        ]
      }

      return []
    }
  })

  return listener
}
