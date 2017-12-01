'use strict'

const config = require('../config')
const log = config.log
const SocketIO = require('socket.io')
const client = require('prom-client')
const uuid = require('uuid')
const multiaddr = require('multiaddr')
const util = require('./util')

/* eslint-disable standard/no-callback-literal */
// Needed because JSON.stringify(Error) returns "{}"

const fake = {
  gauge: {
    set: () => {}
  },
  counter: {
    inc: () => {}
  }
}

const types = {
  string: (v) => (typeof v === 'string'),
  object: (v) => (typeof v === 'object'),
  multiaddr: (v) => {
    if (!types.string(v)) { return }

    try {
      multiaddr(v)
      return true
    } catch (err) {
      return false
    }
  },
  function: (v) => (typeof v === 'function')
}

module.exports = (http, hasMetrics) => {
  const io = new SocketIO(http.listener)
  io._on = io.on
  io.on = (ev, fnc) => {
    io._on(ev, function () {
      try {
        fnc.apply(this, arguments)
      } catch (e) {
        log(e)
      }
    })
  }
  io.on('connection', handle)

  const peers = {}
  const nonces = {}

  const peersMetric = hasMetrics ? new client.Gauge({ name: 'signalling_peers', help: 'peers online now' }) : fake.gauge
  const dialsSuccessTotal = hasMetrics ? new client.Counter({ name: 'signalling_dials_total_success', help: 'sucessfully completed dials since server started' }) : fake.counter
  const dialsFailureTotal = hasMetrics ? new client.Counter({ name: 'signalling_dials_total_failure', help: 'failed dials since server started' }) : fake.counter
  const dialsTotal = hasMetrics ? new client.Counter({ name: 'signalling_dials_total', help: 'all dials since server started' }) : fake.counter
  const joinsSuccessTotal = hasMetrics ? new client.Counter({ name: 'signalling_joins_total_success', help: 'sucessfully completed joins since server started' }) : fake.counter
  const joinsFailureTotal = hasMetrics ? new client.Counter({ name: 'signalling_joins_total_failure', help: 'failed joins since server started' }) : fake.counter
  const joinsTotal = hasMetrics ? new client.Counter({ name: 'signalling_joins_total', help: 'all joins since server started' }) : fake.counter

  const refreshMetrics = () => peersMetric.set(Object.keys(peers).length)

  this.peers = () => {
    return peers
  }

  function safeEmit (addr, event, arg) {
    const peer = peers[addr]
    if (!peer) {
      log('trying to emit %s but peer is gone', event)
      return
    }

    peer.emit(event, arg)
  }

  function handle (socket) {
    socket.on('ss-join', join.bind(socket))
    socket.on('ss-leave', leave.bind(socket))
    socket.on('disconnect', disconnect.bind(socket)) // socket.io own event
    socket.on('ss-handshake', forwardHandshake)
  }

  function join (multiaddr, pub, cb) {
    const socket = this
    if (!types.function(cb)) return
    if (!types.multiaddr(multiaddr)) return cb('Invalid ma')
    if (!types.string(pub)) return cb('Arg2 invalid')

    const log = socket.log = config.log.bind(config.log, '[' + socket.id + ']')

    if (config.strictMultiaddr && !util.validateMa(multiaddr)) {
      joinsTotal.inc()
      joinsFailureTotal.inc()
      return cb('Invalid multiaddr')
    }

    if (config.cryptoChallenge) {
      if (!pub.length) {
        joinsTotal.inc()
        joinsFailureTotal.inc()
        return cb('Crypto Challenge required but no Id provided')
      }

      if (!nonces[socket.id]) {
        nonces[socket.id] = {}
      }

      if (nonces[socket.id][multiaddr]) {
        log('response cryptoChallenge', multiaddr)

        nonces[socket.id][multiaddr].key.verify(nonces[socket.id][multiaddr].nonce, Buffer.from(pub, 'hex'), (err, ok) => {
          if (err || !ok) {
            joinsTotal.inc()
            joinsFailureTotal.inc()
          }
          if (err) { return cb('Crypto error') } // the errors NEED to be a string otherwise JSON.stringify() turns them into {}
          if (!ok) { return cb('Signature Invalid') }

          joinFinalize(socket, multiaddr, cb)
        })
      } else {
        joinsTotal.inc()
        const addr = multiaddr.split('ipfs/').pop()

        log('do cryptoChallenge', multiaddr, addr)

        util.getIdAndValidate(pub, addr, (err, key) => {
          if (err) { joinsFailureTotal.inc(); return cb(err) }
          const nonce = uuid() + uuid()

          socket.once('disconnect', () => {
            delete nonces[socket.id]
          })

          nonces[socket.id][multiaddr] = { nonce: nonce, key: key }
          cb(null, nonce)
        })
      }
    } else {
      joinsTotal.inc()
      joinFinalize(socket, multiaddr, cb)
    }
  }

  // join this signaling server network
  function joinFinalize (socket, multiaddr, cb) {
    peers[multiaddr] = socket
    let refreshInterval = setInterval(sendPeers, config.refreshPeerListIntervalMS)

    socket.once('ss-leave', stopSendingPeers)
    socket.once('disconnect', stopSendingPeers)

    sendPeers()

    function sendPeers () {
      Object.keys(peers).forEach((mh) => {
        if (mh === multiaddr) {
          return
        }
        safeEmit(mh, 'ws-peer', multiaddr)
      })
    }

    function stopSendingPeers () {
      if (refreshInterval) {
        clearInterval(refreshInterval)
        refreshInterval = null
      }
    }

    joinsSuccessTotal.inc()
    refreshMetrics()
    cb()
  }

  function leave (multiaddr) {
    if (!multiaddr) { return }
    if (peers[multiaddr]) {
      delete peers[multiaddr]
      refreshMetrics()
    }
  }

  function disconnect () {
    Object.keys(peers).forEach((mh) => {
      if (peers[mh].id === this.id) {
        delete peers[mh]
      }
      refreshMetrics()
    })
  }

  // forward an WebRTC offer to another peer
  function forwardHandshake (offer) {
    dialsTotal.inc()
    if (offer == null || typeof offer !== 'object' || !offer.srcMultiaddr || !offer.dstMultiaddr) { return dialsFailureTotal.inc() }
    if (offer.answer) {
      dialsSuccessTotal.inc()
      safeEmit(offer.srcMultiaddr, 'ws-handshake', offer)
    } else {
      if (peers[offer.dstMultiaddr]) {
        safeEmit(offer.dstMultiaddr, 'ws-handshake', offer)
      } else {
        dialsFailureTotal.inc()
        offer.err = 'peer is not available'
        safeEmit(offer.srcMultiaddr, 'ws-handshake', offer)
      }
    }
  }

  return this
}
