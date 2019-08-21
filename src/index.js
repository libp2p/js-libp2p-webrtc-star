'use strict'

const debug = require('debug')
const log = debug('libp2p:webrtc-star')
const errcode = require('err-code')
const { AbortError } = require('interface-transport')

const multiaddr = require('multiaddr')
const mafmt = require('mafmt')
const withIs = require('class-is')
const io = require('socket.io-client')
const { EventEmitter } = require('events')
const SimplePeer = require('simple-peer')
const PeerId = require('peer-id')
const PeerInfo = require('peer-info')
const webrtcSupport = require('webrtcsupport')
const { cleanUrlSIO, cleanMultiaddr } = require('./utils')

const Libp2pSocket = require('./socket')

function noop () { }

const sioOptions = {
  transports: ['websocket'],
  'force new connection': true
}

class WebRTCStar {
  constructor (options = {}) {
    this.maSelf = undefined

    this.sioOptions = {
      transports: ['websocket'],
      'force new connection': true
    }

    if (options.wrtc) {
      this.wrtc = options.wrtc
    }

    this.discovery = new EventEmitter()
    this.discovery.tag = 'webRTCStar'
    this.discovery._isStarted = false
    this.discovery.start = () => {
      this.discovery._isStarted = true
    }
    this.discovery.stop = () => {
      this.discovery._isStarted = false
    }

    this.listenersRefs = {}
    this._peerDiscovered = this._peerDiscovered.bind(this)
  }

  async dial (ma, options = {}) {
    options = {
      ...options,
      initiator: true,
      trickle: false
    }

    // Use custom WebRTC implementation
    if (this.wrtc) { options.wrtc = this.wrtc }

    const rawConn = await this._connect(ma, options)

    return new Libp2pSocket(rawConn, ma, options)
  }

  _connect (ma, options) {
    const cma = ma.decapsulate('/p2p-webrtc-star')
    const cOpts = cma.toOptions()
    log('Dialing %s:%s', cOpts.host, cOpts.port)

    const intentId = (~~(Math.random() * 1e9)).toString(36) + Date.now()

    const sioClient = this
      .listenersRefs[Object.keys(this.listenersRefs)[0]].io

    return new Promise((resolve, reject) => {
      if ((options.signal || {}).aborted) {
        return reject(new AbortError())
      }

      const start = Date.now()
      const channel = new SimplePeer(options)

      const onError = (err) => {
        const msg = `Error dialing ${cOpts.host}:${cOpts.port}: ${err.message}`
        done(errcode(new Error(msg), err.code))
      }

      const onTimeout = () => {
        log('Timeout dialing %s:%s', cOpts.host, cOpts.port)
        const err = errcode(new Error(`Timeout after ${Date.now() - start}ms`), 'ETIMEDOUT')
        // Note: this will result in onError() being called
        channel.emit('error', err)
      }

      const onConnect = () => {
        log('Connected to %s:%s', cOpts.host, cOpts.port)
        done(null, channel)
      }

      const onAbort = () => {
        log('Dial to %s:%s aborted', cOpts.host, cOpts.port)
        channel.destroy()
        done(new AbortError())
      }

      const done = (err, res) => {
        channel.removeListener('error', onError)
        channel.removeListener('timeout', onTimeout)
        channel.removeListener('connect', onConnect)
        options.signal && options.signal.removeEventListener('abort', onAbort)

        err ? reject(err) : resolve(res)
      }

      channel.once('error', onError)
      channel.once('timeout', onTimeout)
      channel.once('connect', onConnect)
      channel.on('close', () => channel.destroy())
      options.signal && options.signal.addEventListener('abort', onAbort)

      channel.on('signal', (signal) => {
        sioClient.emit('ss-handshake', {
          intentId: intentId,
          srcMultiaddr: this.maSelf.toString(),
          dstMultiaddr: ma.toString(),
          signal: signal
        })
      })

      // NOTE: aegir segfaults if we do .once on the socket.io event emitter and we
      // are clueless as to why.
      sioClient.on('ws-handshake', (offer) => {
        if (offer.intentId === intentId && offer.err) {
          reject(offer.err)
        }

        if (offer.intentId !== intentId || !offer.answer) {
          reject(errcode(new Error('invalid offer received'), 'ERR_INVALID_OFFER'))
        }

        channel.signal(offer.signal)
      })
    })
  }

  createListener (options, handler) {
    if (!webrtcSupport.support && !this.wrtc) {
      throw errcode(new Error('no WebRTC support'), 'ERR_NO_WEBRTC_SUPPORT')
    }

    if (typeof options === 'function') {
      handler = options
      options = {}
    }

    handler = handler || noop

    const listener = new EventEmitter()

    listener.listen = (ma) => {
      this.maSelf = ma
      const sioUrl = cleanUrlSIO(ma)

      return new Promise((resolve, reject) => {
        log('Dialing to Signalling Server on: ' + sioUrl)
        listener.io = io.connect(sioUrl, sioOptions)

        const incommingDial = (offer) => {
          if (offer.answer || offer.err) {
            return
          }

          const spOptions = { trickle: false }

          // Use custom WebRTC implementation
          if (this.wrtc) { spOptions.wrtc = this.wrtc }

          const channel = new SimplePeer(spOptions)
          const conn = new Libp2pSocket(channel)

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

        listener.io.once('connect_error', (err) => reject(err))
        listener.io.once('error', (err) => {
          listener.emit('error', err)
          listener.emit('close')
        })

        listener.io.on('ws-handshake', incommingDial)
        listener.io.on('ws-peer', this._peerDiscovered)

        listener.io.on('connect', () => {
          listener.io.emit('ss-join', ma.toString())
        })

        listener.io.once('connect', () => {
          listener.emit('listening')
          resolve()
        })
      })
    }

    listener.close = () => {
      listener.io.emit('ss-leave')
      listener.emit('close')
    }

    listener.getAddrs = () => {
      return [this.maSelf]
    }

    this.listenersRefs[multiaddr.toString()] = listener
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

  _peerDiscovered (maStr) {
    if (!this.discovery._isStarted) return

    log('Peer Discovered:', maStr)
    maStr = cleanMultiaddr(maStr)

    const split = maStr.split('/ipfs/')
    const peerIdStr = split[split.length - 1]
    const peerId = PeerId.createFromB58String(peerIdStr)
    const peerInfo = new PeerInfo(peerId)
    peerInfo.multiaddrs.add(multiaddr(maStr))
    this.discovery.emit('peer', peerInfo)
  }
}

module.exports = withIs(WebRTCStar, { className: 'WebRTCStar', symbolName: '@libp2p/js-libp2p-webrtc-star/webrtcstar' })
