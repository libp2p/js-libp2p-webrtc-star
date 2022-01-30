import type { EventEmitter } from 'events'
import type { Signal } from '@libp2p/webrtc-star-protocol'

export interface Logger {
  (...opts: any[]): void
  error: (...opts: any[]) => void
}

export interface WRTC {
  RTCPeerConnection: typeof RTCPeerConnection
  RTCSessionDescription: typeof RTCSessionDescription
  RTCIceCandidate: typeof RTCIceCandidate
}

interface WebRCTEvents {
  'signal': Signal
  'ready': never
  'close': never
}

export interface WebRTCPeerEvents extends EventEmitter {
  on: (<U extends keyof WebRCTEvents> (event: U, listener: (event: WebRCTEvents[U]) => void) => this)
  once: (<U extends keyof WebRCTEvents> (event: U, listener: (event: WebRCTEvents[U]) => void) => this)
  emit: (<U extends keyof WebRCTEvents> (name: U, event: WebRCTEvents[U]) => boolean)
}
