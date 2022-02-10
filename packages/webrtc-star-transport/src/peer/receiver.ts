import { WebRTCPeer } from './peer.js'
import { WebRTCHandshake } from './handshake.js'
import type { WebRTCPeerOptions } from './peer.js'
import type { WebRTCHandshakeOptions } from './handshake.js'
import type { WebRTCPeerEvents } from './interface.js'
import type { OfferSignal, Signal, CandidateSignal } from '@libp2p/webrtc-star-protocol'

export interface WebRTCReceiverOptions extends WebRTCPeerOptions {
  answerOptions?: RTCAnswerOptions
}

export class WebRTCReceiver extends WebRTCPeer implements WebRTCPeerEvents {
  private readonly handshake: WebRTCReceiverHandshake

  constructor (opts: WebRTCReceiverOptions) {
    super({
      ...opts,
      logPrefix: 'receiver'
    })

    this.handshake = new WebRTCReceiverHandshake({
      log: this.log,
      peerConnection: this.peerConnection,
      wrtc: this.wrtc,
      answerOptions: opts.answerOptions
    })

    this.handshake.on('signal', event => this.emit('signal', event))
    this.peerConnection.addEventListener('datachannel', (event) => {
      this.handleDataChannelEvent(event)
    })
  }

  handleSignal (signal: Signal) {
    this.handshake.handleSignal(signal).catch(err => {
      this.log('error handling signal %o %o', signal, err)
    })
  }
}

interface WebRTCReceiverHandshakeOptions extends WebRTCHandshakeOptions {
  answerOptions?: RTCAnswerOptions
}

class WebRTCReceiverHandshake extends WebRTCHandshake {
  private readonly options: WebRTCReceiverHandshakeOptions
  private iceCandidates: CandidateSignal[]

  constructor (options: WebRTCReceiverHandshakeOptions) {
    super(options)

    this.options = options
    this.status = 'idle'
    this.iceCandidates = []
  }

  async handleRenegotiate () {
    this.emit('signal', {
      type: 'renegotiate'
    })
  }

  async handleOffer (signal: OfferSignal) {
    await this.peerConnection.setRemoteDescription(new this.wrtc.RTCSessionDescription(signal))

    // add any candidates we were send before the offer arrived
    for (const candidate of this.iceCandidates) {
      await this.handleCandidate(candidate)
    }
    this.iceCandidates = []

    const answer = await this.peerConnection.createAnswer(this.options.answerOptions)

    await this.peerConnection.setLocalDescription(answer)

    this.emit('signal', this.peerConnection.localDescription)
  }

  async handleCandidate (signal: CandidateSignal) {
    if (this.peerConnection.remoteDescription == null || this.peerConnection.remoteDescription.type == null) {
      // we haven't been sent an offer yet, cache the remote ICE candidates
      this.iceCandidates.push(signal)

      return
    }

    await super.handleCandidate(signal)
  }
}
