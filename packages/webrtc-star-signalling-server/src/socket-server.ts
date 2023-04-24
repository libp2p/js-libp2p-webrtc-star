import { config } from './config.js'
import { Server } from 'socket.io'
import client from 'prom-client'
import type { HandshakeSignal, WebRTCStarSocket } from '@libp2p/webrtc-star-protocol'

const log = config.log

const fake = {
  gauge: {
    set: () => {}
  },
  counter: {
    inc: () => {}
  }
}

export function socketServer (peers: Map<string, WebRTCStarSocket>, hasMetrics: boolean, refreshPeerListIntervalMS: number): Server {
  const io = new Server({
    allowEIO3: true // allow socket.io v2 clients to connect
  })
  // @ts-expect-error types are different?
  io.on('connection', (socket) => { handle(socket) })

  const peersMetric = hasMetrics ? new client.Gauge({ name: 'webrtc_star_peers', help: 'peers online now' }) : fake.gauge
  const dialsSuccessTotal = hasMetrics ? new client.Counter({ name: 'webrtc_star_dials_total_success', help: 'successfully completed dials since server started' }) : fake.counter
  const dialsFailureTotal = hasMetrics ? new client.Counter({ name: 'webrtc_star_dials_total_failure', help: 'failed dials since server started' }) : fake.counter
  const dialsTotal = hasMetrics ? new client.Counter({ name: 'webrtc_star_dials_total', help: 'all dials since server started' }) : fake.counter
  const joinsSuccessTotal = hasMetrics ? new client.Counter({ name: 'webrtc_star_joins_total_success', help: 'successfully completed joins since server started' }) : fake.counter
  const joinsFailureTotal = hasMetrics ? new client.Counter({ name: 'webrtc_star_joins_total_failure', help: 'failed joins since server started' }) : fake.counter
  const joinsTotal = hasMetrics ? new client.Counter({ name: 'webrtc_star_joins_total', help: 'all joins since server started' }) : fake.counter

  const refreshMetrics = (): void => { peersMetric.set(peers.size) }

  function safeEmit (maStr: string, event: any, arg: any): void {
    const peer = peers.get(maStr)

    if (peer == null) {
      log('trying to emit %s but peer is gone', event)
      return
    }

    peer.emit(event, arg)
  }

  function handle (socket: WebRTCStarSocket): void {
    let multiaddr: string

    // join this signaling server network
    socket.on('ss-join', (maStr: string) => {
      joinsTotal.inc()

      if (maStr == null) {
        joinsFailureTotal.inc(); return
      }

      multiaddr = maStr

      peers.set(multiaddr, socket)

      socket.once('ss-leave', stopSendingPeers)
      socket.once('disconnect', stopSendingPeers)

      let refreshInterval: NodeJS.Timer | undefined = setInterval(sendPeers, refreshPeerListIntervalMS)
      sendPeers()

      function sendPeers (): void {
        for (const mh of peers.keys()) {
          if (mh === multiaddr) {
            continue
          }

          safeEmit(mh, 'ws-peer', multiaddr)
        }
      }

      function stopSendingPeers (): void {
        if (refreshInterval != null) {
          clearInterval(refreshInterval)
          refreshInterval = undefined
        }
      }

      joinsSuccessTotal.inc()
      refreshMetrics()
    })
    socket.on('ss-leave', () => {
      peers.delete(multiaddr)

      refreshMetrics()
    })

    // socket.io own event
    socket.on('disconnect', () => {
      peers.delete(multiaddr)

      refreshMetrics()
    })

    // forward an WebRTC offer to another peer
    socket.on('ss-handshake', (offer: HandshakeSignal) => {
      dialsTotal.inc()

      if (offer == null || typeof offer !== 'object' || offer.srcMultiaddr == null || offer.dstMultiaddr == null) {
        dialsFailureTotal.inc(); return
      }

      if (offer.answer === true) {
        dialsSuccessTotal.inc()
        safeEmit(offer.srcMultiaddr, 'ws-handshake', offer)
      } else {
        if (peers.has(offer.dstMultiaddr)) {
          safeEmit(offer.dstMultiaddr, 'ws-handshake', offer)
        } else {
          dialsFailureTotal.inc()
          offer.err = 'peer is not available'
          safeEmit(offer.srcMultiaddr, 'ws-handshake', offer)
        }
      }
    })
  }

  return io
}
