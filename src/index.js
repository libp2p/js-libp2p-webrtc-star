'use strict'

const debug = require('debug')
const log = debug('libp2p:webrtc-star')
const multiaddr = require('multiaddr')
const mafmt = require('mafmt')
const io = require('socket.io-client')
const EE = require('events').EventEmitter
const wrtc = require('wrtc')
const isNode = require('detect-node')
const SimplePeer = require('simple-peer')
const PeerId = require('peer-id')
const PeerInfo = require('peer-info')
const Connection = require('interface-connection').Connection
const toPull = require('stream-to-pull-stream')
const once = require('once')

const noop = once(() => {})

const sioOptions = {
  transports: ['websocket'],
  'force new connection': true
}

function cleanUrlSIO (ma) {
  const maStrSplit = ma.toString().split('/')
  if (!multiaddr.isName(ma)) {
    return 'http://' + maStrSplit[3] + ':' + maStrSplit[5]
  } else {
    const wsProto = ma.protos()[2].name
    if (wsProto === 'ws') {
      return 'http://' + maStrSplit[3]
    } else if (wsProto === 'wss') {
      return 'https://' + maStrSplit[3]
    } else {
      throw new Error('invalid multiaddr' + ma.toString())
    }
  }
}

class WebRTCStar {
  constructor () {
    this.sioOptions = {
      transports: ['websocket'],
      'force new connection': true
    }

    this.discovery = new EE()
    this.listenersRefs = {}
    this._peerDiscovered = this._peerDiscovered.bind(this)
  }

  dial (ma, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }
    callback = callback ? once(callback) : noop

    const intentId = (~~(Math.random() * 1e9)).toString(36) + Date.now()
    const keys = Object.keys(this.listenersRefs)
        .filter((key) => cleanUrlSIO(ma) === cleanUrlSIO(multiaddr(key)))
    const listener = this.listenersRefs[keys[0]]
    if (!listener) return callback(new Error('signalling server not connected'))
    const sioClient = listener.io

    const spOptions = {
      initiator: true,
      trickle: false
    }
    if (isNode) {
      spOptions.wrtc = wrtc
    }
    const channel = new SimplePeer(spOptions)

    const conn = new Connection(toPull.duplex(channel))
    let connected = false
    channel.on('signal', (signal) => {
      sioClient.emit('ss-handshake', {
        intentId: intentId,
        srcMultiaddr: listener.ma.toString(),
        dstMultiaddr: ma.toString(),
        signal: signal
      })
    })

    channel.once('timeout', () => callback(new Error('timeout')))

    channel.once('error', (err) => {
      if (!connected) {
        callback(err)
      }
    })

    // NOTE: aegir segfaults if we do .once on the socket.io event emitter and we
    // are clueless as to why.
    sioClient.on('ws-handshake', (offer) => {
      if (offer.intentId === intentId && offer.err) {
        return callback(new Error(offer.err))
      }

      if (offer.intentId !== intentId || !offer.answer) {
        return
      }

      channel.once('connect', () => {
        connected = true
        conn.destroy = channel.destroy.bind(channel)

        channel.once('close', () => conn.destroy())

        conn.getObservedAddrs = (callback) => callback(null, [ma])

        callback(null, conn)
      })

      channel.signal(offer.signal)
    })

    return conn
  }

  createListener (options, handler) {
    if (typeof options === 'function') {
      handler = options
      options = {}
    }

    const listener = new EE()

    listener.listen = (ma, callback) => {
      callback = callback ? once(callback) : noop

      const sioUrl = cleanUrlSIO(ma)

      log('Dialing to Signalling Server on: ' + sioUrl)

      listener.io = io.connect(sioUrl, sioOptions)
      listener.ma = ma

      listener.io.once('connect_error', callback)
      listener.io.once('error', (err) => {
        listener.emit('error', err)
        listener.emit('close')
      })

      listener.io.once('connect', () => {
        listener.io.emit('ss-join', ma.toString())
        listener.io.on('ws-handshake', incommingDial)
        listener.io.on('ws-peer', this._peerDiscovered)
        this.listenersRefs[ma.toString()] = listener
        listener.emit('listening')
        callback()
      })

      listener.close = (callback) => {
        callback = callback ? once(callback) : noop

        listener.io.emit('ss-leave', ma.toString())
        setImmediate(() => {
          listener.io.disconnect()
          listener.emit('close')
          callback()
          delete this.listenersRefs[ma.toString()]
        })
      }
      listener.getAddrs = (callback) => {
        setImmediate(() => callback(null, [ma]))
      }

      function incommingDial (offer) {
        if (offer.answer || offer.err) {
          return
        }

        const spOptions = {
          trickle: false
        }

        if (isNode) {
          spOptions.wrtc = wrtc
        }

        const channel = new SimplePeer(spOptions)

        const conn = new Connection(toPull.duplex(channel))

        channel.once('connect', () => {
          conn.getObservedAddrs = (callback) => {
            return callback(null, [offer.srcMultiaddr])
          }

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
    }

    return listener
  }

  filter (multiaddrs) {
    if (!Array.isArray(multiaddrs)) {
      multiaddrs = [multiaddrs]
    }
    return multiaddrs.filter((ma) => {
      return mafmt.WebRTCStar.matches(ma)
    })
  }

  _peerDiscovered (maStr) {
    log('Peer Discovered:', maStr)
    const split = maStr.split('/ipfs/')
    const peerIdStr = split[split.length - 1]
    const peerId = PeerId.createFromB58String(peerIdStr)
    const peerInfo = new PeerInfo(peerId)
    peerInfo.multiaddr.add(multiaddr(maStr))
    this.discovery.emit('peer', peerInfo)
  }
}

exports = module.exports = WebRTCStar
