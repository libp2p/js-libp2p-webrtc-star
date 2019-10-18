'use strict'

const EventEmitter = require('events')
const log = require('debug')('libp2p:webrtc-star:listener')

const multiaddr = require('multiaddr')

const io = require('socket.io-client')
const SimplePeer = require('simple-peer')
const pDefer = require('p-defer')

const toConnection = require('./socket-to-conn')
const { cleanUrlSIO } = require('./utils')

const sioOptions = {
  transports: ['websocket'],
  'force new connection': true,
   query: {
    wrtcstar: true,
   },
}

module.exports = ({ handler, upgrader }, WebRTCStar, options = {}) => {
  const listener = new EventEmitter()

  listener.__connections = []
  listener.listen = (ma) => {
    const defer = pDefer()

    WebRTCStar.maSelf = ma
    const sioUrl = cleanUrlSIO(ma)

    log('Dialing to Signalling Server on: ' + sioUrl)
    listener.io = io.connect(sioUrl, sioOptions)

    const incommingDial = async (offer) => {
      if (offer.answer || offer.err) {
        return
      }

      const spOptions = {
        trickle: false,
        ...options
      }

      // Use custom WebRTC implementation
      if (WebRTCStar.wrtc) { spOptions.wrtc = WebRTCStar.wrtc }

      const channel = new SimplePeer(spOptions)

      const maConn = toConnection(channel)
      log('new inbound connection %s', maConn.remoteAddr)

      const conn = await upgrader.upgradeInbound(maConn)
      log('inbound connection %s upgraded', maConn.remoteAddr)

      trackConn(listener, maConn)

      channel.once('connect', () => {
        listener.emit('connection', conn)
        handler(conn)
      })

      channel.once('signal', (signal) => {
        offer.signal = signal
        offer.answer = true
        listener.io.emit('ss-handshake', offer)
      })

      channel.signal(offer.signal)
    }

    listener.io.once('connect_error', (err) => defer.reject(err))
    listener.io.once('error', (err) => {
      listener.emit('error', err)
      listener.emit('close')
    })

    listener.io.on('ws-handshake', incommingDial)
    listener.io.on('ws-peer', WebRTCStar._peerDiscovered)

    listener.io.on('connect', () => {
      listener.io.emit('ss-join', ma.toString())
    })

    listener.io.once('connect', () => {
      listener.emit('listening')
      defer.resolve()
    })

    return defer.promise
  }

  listener.close = () => {
    listener.__connections.forEach(maConn => maConn.close())
    listener.io && listener.io.emit('ss-leave')
    listener.emit('close')
  }

  listener.getAddrs = () => {
    return [WebRTCStar.maSelf]
  }

  WebRTCStar.listenersRefs[multiaddr.toString()] = listener
  return listener
}

function trackConn (listener, maConn) {
  listener.__connections.push(maConn)

  const untrackConn = () => {
    listener.__connections = listener.__connections.filter(c => c !== maConn)
  }

  maConn.conn.once('close', untrackConn)
}
