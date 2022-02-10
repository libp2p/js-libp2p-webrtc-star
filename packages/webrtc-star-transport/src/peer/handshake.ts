import { EventEmitter } from 'events'
import errCode from 'err-code'
import type { WRTC, Logger } from './interface.js'
import type { Signal, OfferSignal, AnswerSignal, CandidateSignal, RenegotiateSignal, GoodbyeSignal } from '@libp2p/webrtc-star-protocol'

export interface WebRTCHandshakeOptions {
  log: Logger
  peerConnection: RTCPeerConnection
  offerOptions?: RTCOfferOptions
  wrtc: WRTC
}

export class WebRTCHandshake extends EventEmitter {
  protected log: Logger
  protected peerConnection: RTCPeerConnection
  protected status: 'idle' | 'negotiating'
  protected wrtc: WRTC

  constructor (options: WebRTCHandshakeOptions) {
    super()

    this.log = options.log
    this.peerConnection = options.peerConnection
    this.wrtc = options.wrtc
    this.status = 'idle'

    this.peerConnection.addEventListener('negotiationneeded', () => {
      this.log('peer connection negotiation needed')

      this.handleRenegotiate({ type: 'renegotiate' }).catch(err => {
        this.log.error('could not renegotiate %o', err)
      })
    })
  }

  async handleSignal (signal: Signal) {
    this.log('incoming signal "%s"', signal.type)

    if (signal.type === 'offer') {
      return await this.handleOffer(signal)
    } else if (signal.type === 'answer') {
      return await this.handleAnswer(signal)
    } else if (signal.type === 'candidate') {
      return await this.handleCandidate(signal)
    } else if (signal.type === 'renegotiate') {
      return await this.handleRenegotiate(signal)
    } else if (signal.type === 'goodbye') {
      return await this.handleGoodye(signal)
    } else {
      // @ts-expect-error all types are handled above
      this.log(`Unknown signal type ${signal.type}`) // eslint-disable-line @typescript-eslint/restrict-template-expressions
    }
  }

  async handleOffer (signal: OfferSignal) {}
  async handleAnswer (signal: AnswerSignal) {}
  async handleRenegotiate (signal: RenegotiateSignal) {}
  async handleGoodye (signal: GoodbyeSignal) {
    this.peerConnection.close()
  }

  async handleCandidate (signal: CandidateSignal) {
    const iceCandidate = new this.wrtc.RTCIceCandidate(signal.candidate)

    try {
      await this.peerConnection.addIceCandidate(iceCandidate)
    } catch (err) {
      if (iceCandidate.address == null || iceCandidate.address.endsWith('.local')) {
        this.log('ignoring unsupported ICE candidate.')
      } else {
        throw errCode(err, 'ERR_ADD_ICE_CANDIDATE')
      }
    }
  }
}
