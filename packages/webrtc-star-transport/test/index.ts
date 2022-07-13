import type { Registrar } from '@libp2p/interface-registrar'
import type { PeerId } from '@libp2p/interface-peer-id'
import type { Upgrader } from '@libp2p/interface-transport'
import type { WebRTCStar } from '../src'

export interface PeerTransport {
  peerId: PeerId
  transport: WebRTCStar
  upgrader: Upgrader
  registrar: Registrar
}
