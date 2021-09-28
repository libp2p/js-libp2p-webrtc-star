'use strict'

const EventEmitter = require('events')
const debug = require('debug')
const log = debug('libp2p:webrtc-star:listener')
log.error = debug('libp2p:webrtc-star:listener:error')

const errCode = require('err-code')
const io = require('socket.io-client')
const SimplePeer = require('libp2p-webrtc-peer')
const pDefer = require('p-defer')

const toConnection = require('./socket-to-conn')
const { cleanUrlSIO } = require('./utils')
const { CODE_P2P } = require('./constants')

const sioOptions = {
  transports: ['websocket'],
  'force new connection': true,
  path: '/socket.io-next/' // This should be removed when socket.io@2 support is removed
}

module.exports = ({ handler, upgrader }, WebRTCStar, options = {}) => {
  const listener = new EventEmitter()
  let listeningAddr
  let signallingUrl

  listener.__connections = []
  listener.__spChannels = new Map()
  listener.__pendingIntents = new Map()
  listener.listen = (ma) => {
    // Should only be used if not already listening
    if (listeningAddr) {
      throw errCode(new Error('listener already in use'), 'ERR_ALREADY_LISTENING')
    }

    const defer = pDefer()

    // Should be kept unmodified
    listeningAddr = ma

    let signallingAddr
    if (!ma.protoCodes().includes(CODE_P2P) && upgrader.localPeer) {
      signallingAddr = ma.encapsulate(`/p2p/${upgrader.localPeer.toB58String()}`)
    } else {
      signallingAddr = ma
    }

    listener.on('error', () => defer.reject())

    signallingUrl = cleanUrlSIO(ma)

    log('Dialing to Signalling Server on: ' + signallingUrl)
    listener.io = io.connect(signallingUrl, sioOptions)

    const incomingDial = (offer) => {
      if (offer.answer || offer.err || !offer.intentId) {
        return
      }

      const intentId = offer.intentId
      let pendings = listener.__pendingIntents.get(intentId)
      if (!pendings) {
        pendings = []
        listener.__pendingIntents.set(intentId, pendings)
      }

      let channel = listener.__spChannels.get(intentId)
      if (channel) {
        channel.signal(offer.signal)
        return
      } else if (offer.signal.type !== 'offer') {
        pendings.push(offer)
        return
      }

      const spOptions = {
        trickle: false,
        ...options
      }

      // Use custom WebRTC implementation
      if (WebRTCStar.wrtc) { spOptions.wrtc = WebRTCStar.wrtc }

      channel = new SimplePeer(spOptions)

      const onError = (err) => {
        log.error('incoming connection errored', err)
      }

      channel.on('error', onError)
      channel.once('close', (...args) => {
        channel.removeListener('error', onError)
      })

      channel.on('signal', (signal) => {
        offer.signal = signal
        offer.answer = true
        listener.io.emit('ss-handshake', offer)
      })

      channel.signal(offer.signal)
      for (const pendingOffer of pendings) {
        channel.signal(pendingOffer.signal)
      }
      listener.__pendingIntents.set(intentId, [])

      channel.once('connect', async () => {
        const maConn = toConnection(channel)
        log('new inbound connection %s', maConn.remoteAddr)

        let conn
        try {
          conn = await upgrader.upgradeInbound(maConn)
        } catch (err) {
          log.error('inbound connection failed to upgrade', err)
          return maConn.close()
        }

        if (!conn.remoteAddr) {
          try {
            conn.remoteAddr = ma.decapsulateCode(CODE_P2P).encapsulate(`/p2p/${conn.remotePeer.toB58String()}`)
          } catch (err) {
            log.error('could not determine remote address', err)
          }
        }

        log('inbound connection %s upgraded', maConn.remoteAddr)

        trackConn(listener, maConn, intentId)

        listener.emit('connection', conn)
        handler(conn)
      })
      listener.__spChannels.set(intentId, channel)
    }

    listener.io.once('connect_error', (err) => defer.reject(err))
    listener.io.once('error', (err) => {
      listener.emit('error', err)
      listener.emit('close')
    })

    listener.io.on('ws-handshake', incomingDial)
    listener.io.on('ws-peer', WebRTCStar._peerDiscovered)

    listener.io.on('connect', () => {
      listener.io.emit('ss-join', signallingAddr.toString())
    })

    listener.io.once('connect', () => {
      listener.emit('listening')
      defer.resolve()
    })

    // Store listen and signal reference addresses
    WebRTCStar.sigReferences.set(signallingUrl, {
      listener,
      signallingAddr
    })

    return defer.promise
  }

  listener.close = async () => {
    // Close listener
    const ref = WebRTCStar.sigReferences.get(signallingUrl)
    if (ref && ref.listener.io) {
      ref.listener.io.emit('ss-leave')
      ref.listener.io.close()
    }

    await Promise.all(listener.__connections.map(maConn => maConn.close()))
    listener.emit('close')
    listener.removeAllListeners()

    // Reset state
    listeningAddr = undefined
    WebRTCStar.sigReferences.delete(signallingUrl)
  }

  listener.getAddrs = () => {
    return [listeningAddr]
  }

  return listener
}

function trackConn (listener, maConn, intentId) {
  listener.__connections.push(maConn)

  const untrackConn = () => {
    listener.__connections = listener.__connections.filter(c => c !== maConn)
    listener.__spChannels.delete(intentId)
    listener.__pendingIntents.delete(intentId)
  }

  maConn.conn.once('close', untrackConn)
}
