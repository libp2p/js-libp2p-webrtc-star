import type { PeerDiscovery } from '@libp2p/interface-peer-discovery'
import type { Transport } from '@libp2p/interface-transport'
import { WebRTCStar, WebRTCStarComponents, WebRTCStarInit } from './transport.js'

export interface WebRTCStarTuple {
  transport: (components: WebRTCStarComponents) => Transport
  discovery: (components?: WebRTCStarComponents) => PeerDiscovery
}

export function webRTCStar (init: WebRTCStarInit = {}): WebRTCStarTuple {
  const transport = new WebRTCStar(init)

  return {
    transport: (components: WebRTCStarComponents) => {
      transport.peerId = components.peerId
      return transport
    },
    discovery: transport.discovery
  }
}
