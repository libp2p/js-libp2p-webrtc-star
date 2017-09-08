'use strict'

const config = require('../config')
const log = config.log
const SocketIO = require('socket.io')

module.exports = (http) => {
  const io = new SocketIO(http.listener)
  io.on('connection', handle)

  const peers = {}

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

  // join this signaling server network
  function join (multiaddr) {
    if (!multiaddr) { return }
    const socket = peers[multiaddr] = this // socket
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
  }

  function leave (multiaddr) {
    if (!multiaddr) { return }
    if (peers[multiaddr]) {
      delete peers[multiaddr]
    }
  }

  function disconnect () {
    Object.keys(peers).forEach((mh) => {
      if (peers[mh].id === this.id) {
        delete peers[mh]
      }
    })
  }

  // forward an WebRTC offer to another peer
  function forwardHandshake (offer) {
    if (offer == null || typeof offer !== 'object' || !offer.srcMultiaddr || !offer.dstMultiaddr) { return }
    if (offer.answer) {
      safeEmit(offer.srcMultiaddr, 'ws-handshake', offer)
    } else {
      if (peers[offer.dstMultiaddr]) {
        safeEmit(offer.dstMultiaddr, 'ws-handshake', offer)
      } else {
        offer.err = 'peer is not available'
        safeEmit(offer.srcMultiaddr, 'ws-handshake', offer)
      }
    }
  }

  return this
}
