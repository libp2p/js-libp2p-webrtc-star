'use strict'

const debug = require('debug')
const log = debug('libp2p:webrtc-star')

const multiaddr = require('multiaddr')
const mafmt = require('mafmt')
const Id = require('peer-id')

const withIs = require('class-is')
const EE = require('events').EventEmitter
const assert = require('assert')

const SimplePeer = require('simple-peer')
const webrtcSupport = require('webrtcsupport')

const Connection = require('interface-connection').Connection
const toPull = require('stream-to-pull-stream')

const setImmediate = require('async/setImmediate')
const once = require('once')
const noop = once(() => {})

class WebRTCStar {
  constructor (options) {
    options = options || {}

    if (options.wrtc) {
      this.wrtc = options.wrtc
    }

    assert(options.exchange, 'Exchange missing!')
    this.exchange = options.exchange
  }

  dial (ma, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    callback = callback ? once(callback) : noop

    let b58 = ma.toString().split('ipfs/').pop()

    log('dialing %s %s', ma, b58)

    const spOptions = { initiator: true, trickle: false }

    // Use custom WebRTC implementation
    if (this.wrtc) { spOptions.wrtc = this.wrtc }

    const channel = new SimplePeer(spOptions)

    const conn = new Connection(toPull.duplex(channel))
    let connected = false

    channel.on('signal', (signal) => {
      log('dial#%s got signal', ma)
      this.exchange.request(Id.createFromB58String(b58), 'webrtc', Buffer.from(JSON.stringify({signal, ma: '/ip4/0.0.0.0/tcp/127.0.0.1'})), (err, result) => { // TODO: fix this
        if (err) {
          log('dial#%s exchange failed %s', ma, err)
          return callback(err)
        }

        let offer
        try {
          offer = JSON.parse(String(result))
        } catch (err) {
          log('dial#%s malformed response %s', ma, err)
          return callback(err)
        }

        channel.once('connect', () => {
          log('dial#%s connected', ma)
          connected = true
          conn.destroy = channel.destroy.bind(channel)

          channel.once('close', () => conn.destroy())

          conn.getObservedAddrs = (callback) => callback(null, [ma])

          callback(null, conn)
        })

        channel.signal(offer.signal)
      })
    })

    channel.once('timeout', () => callback(new Error('timeout')))

    channel.once('error', (err) => {
      if (!connected) { callback(err) }
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

      if (!webrtcSupport.support && !this.wrtc) {
        return setImmediate(() => callback(new Error('no WebRTC support')))
      }

      log('listening on %s', ma)

      let ns = listener.ns = 'webrtc' // TODO: should this be ma.toString() ?
      listener.ma = ma

      this.exchange.listen(ns, (request, cb) => {
        let offer

        try {
          offer = JSON.parse(String(request))
        } catch (err) {
          log('got malformed offer', err)
          return cb(err)
        }

        const spOptions = { trickle: false }

        // Use custom WebRTC implementation
        if (self.wrtc) { spOptions.wrtc = self.wrtc }

        const channel = new SimplePeer(spOptions)

        const conn = new Connection(toPull.duplex(channel))

        channel.once('connect', () => {
          log('connected')

          conn.getObservedAddrs = (callback) => {
            return callback(null, [multiaddr(offer.ma)]) // TODO: this isn't really safe AT ALL...
          }

          listener.emit('connection', conn)
          handler(conn)
        })

        channel.once('signal', (signal) => {
          log('sending back signal')
          cb(null, Buffer.from(JSON.stringify({signal, ma: listener.ma.toString()})))
        })

        channel.signal(offer.signal)
      })
    }

    listener.close = (callback) => {
      callback = callback ? once(callback) : noop

      this.exchange.unhandle(listener.ns)

      setImmediate(callback)
    }

    listener.getAddrs = (callback) => {
      setImmediate(() => callback(null, listener.ma ? [listener.ma] : []))
    }

    return listener
  }

  filter (multiaddrs) {
    if (!Array.isArray(multiaddrs)) {
      multiaddrs = [multiaddrs]
    }

    return multiaddrs.filter((ma) => {
      if (ma.protoNames().indexOf('p2p-circuit') > -1) {
        return false
      }

      return mafmt.WebRTCStar.matches(ma)
    })
  }
}

module.exports = withIs(WebRTCStar, { className: 'WebRTCStar', symbolName: '@libp2p/js-libp2p-webrtc-star/webrtcstar' })
