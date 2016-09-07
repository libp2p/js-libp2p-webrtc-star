'use strict'

const debug = require('debug')
const log = debug('libp2p:webrtc-star')
const multiaddr = require('multiaddr')
const mafmt = require('mafmt')
const io = require('socket.io-client')
const EE = require('events').EventEmitter
const SimplePeer = require('simple-peer')
const peerId = require('peer-id')
const PeerInfo = require('peer-info')
const Connection = require('interface-connection').Connection
const toPull = require('stream-to-pull-stream')

exports = module.exports = WebRTCStar

const sioOptions = {
  transports: ['websocket'],
  'force new connection': true
}

function WebRTCStar () {
  if (!(this instanceof WebRTCStar)) {
    return new WebRTCStar()
  }

  let maSelf
  const listeners = {}
  this.discovery = new EE()

  this.dial = function (ma, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    if (!callback) {
      callback = function noop () {}
    }

    const intentId = (~~(Math.random() * 1e9)).toString(36) + Date.now()
    const sioClient = listeners[Object.keys(listeners)[0]].io
    const channel = new SimplePeer({ initiator: true, trickle: false })

    const conn = new Connection(toPull.duplex(channel))
    let connected = false

    channel.on('signal', function (signal) {
      sioClient.emit('ss-handshake', {
        intentId: intentId,
        srcMultiaddr: maSelf.toString(),
        dstMultiaddr: ma.toString(),
        signal: signal
      })
    })

    channel.on('timeout', () => {
      callback(new Error('timeout'))
    })

    channel.on('error', (err) => {
      if (!connected) {
        callback(err)
      }
    })

    sioClient.on('ws-handshake', (offer) => {
      if (offer.intentId !== intentId || !offer.answer) {
        return
      }

      channel.on('connect', () => {
        connected = true
        conn.destroy = channel.destroy.bind(channel)

        channel.on('close', () => {
          conn.destroy()
        })

        conn.getObservedAddrs = (callback) => {
          return callback(null, [ma])
        }

        callback(null, conn)
      })

      channel.signal(offer.signal)
    })

    return conn
  }

  this.createListener = (options, handler) => {
    if (typeof options === 'function') {
      handler = options
      options = {}
    }

    const listener = new EE()

    listener.listen = (ma, callback) => {
      if (!callback) {
        callback = function noop () {}
      }
      maSelf = ma

      const sioUrl = 'http://' + ma.toString().split('/')[3] + ':' + ma.toString().split('/')[5]

      listener.io = io.connect(sioUrl, sioOptions)
      listener.io.on('connect_error', callback)
      listener.io.on('connect', () => {
        listener.io.emit('ss-join', ma.toString())
        listener.io.on('ws-handshake', incommingDial)
        listener.io.on('ws-peer', peerDiscovered.bind(this))
        listener.emit('listening')
        callback()
      })

      function incommingDial (offer) {
        if (offer.answer) { return }

        const channel = new SimplePeer({ trickle: false })
        const conn = new Connection(toPull.duplex(channel))

        channel.on('connect', () => {
          conn.getObservedAddrs = (callback) => {
            return callback(null, [offer.srcMultiaddr])
          }

          listener.emit('connection', conn)
          handler(conn)
        })

        channel.on('signal', (signal) => {
          offer.signal = signal
          offer.answer = true
          listener.io.emit('ss-handshake', offer)
        })

        channel.signal(offer.signal)
      }
    }

    listener.close = (callback) => {
      if (!callback) {
        callback = function noop () {}
      }
      listener.io.emit('ss-leave')
      setTimeout(() => {
        listener.emit('close')
        callback()
      }, 100)
    }

    listener.getAddrs = (callback) => {
      process.nextTick(() => {
        callback(null, [maSelf])
      })
    }

    listeners[multiaddr.toString()] = listener
    return listener
  }

  this.filter = (multiaddrs) => {
    if (!Array.isArray(multiaddrs)) {
      multiaddrs = [multiaddrs]
    }
    return multiaddrs.filter((ma) => {
      return mafmt.WebRTCStar.matches(ma)
    })
  }

  function peerDiscovered (maStr) {
    log('Peer Discovered:', maStr)
    const id = peerId.createFromB58String(maStr.split('/')[8])
    const peer = new PeerInfo(id)
    peer.multiaddr.add(multiaddr(maStr))
    this.discovery.emit('peer', peer)
  }
}
