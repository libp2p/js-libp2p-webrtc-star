'use strict'

const debug = require('debug')
const log = debug('libp2p:webrtc-star')
const multiaddr = require('multiaddr')
const mafmt = require('mafmt')
const parallel = require('run-parallel')
const io = require('socket.io-client')
const EE = require('events').EventEmitter
const SimplePeer = require('simple-peer')
const Duplexify = require('duplexify')
const peerId = require('peer-id')
const PeerInfo = require('peer-info')

exports = module.exports = WebRTCStar

function WebRTCStar () {
  if (!(this instanceof WebRTCStar)) {
    return new WebRTCStar()
  }

  const listeners = []
  let mhSelf
  this.discovery = new EE()

  this.dial = function (multiaddr, options) {
    if (!options) {
      options = {}
    }

    options.ready = options.ready || function noop () {}
    const pt = new Duplexify()

    const intentId = (~~(Math.random() * 1e9)).toString(36) + Date.now()
    const sioClient = listeners[0]
    const conn = new SimplePeer({ initiator: true, trickle: false })

    conn.on('signal', function (signal) {
      sioClient.emit('ss-handshake', {
        intentId: intentId,
        srcMultiaddr: mhSelf.toString(),
        dstMultiaddr: multiaddr.toString(),
        signal: signal
      })
    })

    sioClient.on('ws-handshake', (offer) => {
      if (offer.intentId !== intentId || !offer.answer) {
        return
      }

      conn.on('connect', () => {
        pt.setReadable(conn)
        pt.setWritable(conn)

        pt.destroy = conn.destroy.bind(conn)

        conn.on('close', () => {
          pt.emit('close')
        })

        pt.getObservedAddrs = () => {
          return [multiaddr]
        }
        options.ready(null, pt)
      })
      conn.signal(offer.signal)
    })

    return pt
  }

  this.createListener = (multiaddrs, handler, callback) => {
    if (!Array.isArray(multiaddrs)) {
      multiaddrs = [multiaddrs]
    }

    const sioOptions = {
      transports: ['websocket'],
      'force new connection': true
    }
    // for now it only supports listening in one signalling server
    // no technical limitation why not to do more :)
    const mh = multiaddrs[0]
    mhSelf = mh
    // I know.. "websockets connects on a http endpoint, but through a
    // tcp port"
    const sioUrl = 'http://' + mh.toString().split('/')[3] + ':' + mh.toString().split('/')[5]
    const sioClient = io.connect(sioUrl, sioOptions)
    sioClient.on('connect_error', callback)
    sioClient.on('connect', () => {
      sioClient.emit('ss-join', multiaddrs[0].toString())
      sioClient.on('ws-handshake', incommingDial)
      sioClient.on('ws-peer', peerDiscovered.bind(this))
      listeners.push(sioClient)
      callback()
    })

    function incommingDial (offer) {
      if (offer.answer) {
        return
      }

      const conn = new SimplePeer({ trickle: false })

      conn.on('connect', () => {
        conn.getObservedAddrs = () => {
          return []
        }

        handler(conn)
      })

      conn.on('signal', function (signal) {
        offer.signal = signal
        offer.answer = true
        sioClient.emit('ss-handshake', offer)
      })

      conn.signal(offer.signal)
    }
  }

  this.close = (callback) => {
    if (listeners.length === 0) {
      log('Called close with no active listeners')
      return callback()
    }

    parallel(listeners.map((listener) => {
      return (cb) => {
        listener.emit('ss-leave')
        cb()
      }
    }), callback)
  }

  this.filter = (multiaddrs) => {
    if (!Array.isArray(multiaddrs)) {
      multiaddrs = [multiaddrs]
    }
    return multiaddrs.filter((ma) => {
      return mafmt.WebRTCStar.matches(ma)
    })
  }

  function peerDiscovered (mh) {
    const id = peerId.createFromB58String(mh.split('/')[8])
    const peer = new PeerInfo(id)
    peer.multiaddr.add(multiaddr(mh))
    this.discovery.emit('peer', peer)
  }
}
