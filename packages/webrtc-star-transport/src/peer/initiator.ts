import { WebRTCPeer } from './peer.js'
import { WebRTCHandshake } from './handshake.js'
import randombytes from 'iso-random-stream/src/random.js'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { pEvent } from 'p-event'
import delay from 'delay'
import type { WebRTCPeerOptions } from './peer.js'
import type { WebRTCHandshakeOptions } from './handshake.js'
import type { AnswerSignal, Signal } from '@libp2p/webrtc-star-protocol'
import type { WebRTCPeerEvents } from './interface.js'

const ICECOMPLETE_TIMEOUT = 1000

export interface WebRTCInitiatorOptions extends WebRTCPeerOptions {
  dataChannelLabel?: string
  dataChannelInit?: RTCDataChannelInit
  offerOptions?: RTCOfferOptions
}

export class WebRTCInitiator extends WebRTCPeer implements WebRTCPeerEvents {
  private readonly handshake: WebRTCInitiatorHandshake

  constructor (opts: WebRTCInitiatorOptions) {
    super({
      ...opts,
      logPrefix: 'initiator'
    })

    this.handleDataChannelEvent({
      channel: this.peerConnection.createDataChannel(
        opts.dataChannelLabel ?? uint8ArrayToString(randombytes(20), 'hex').slice(0, 7),
        opts.dataChannelInit
      )
    })

    this.handshake = new WebRTCInitiatorHandshake({
      log: this.log,
      peerConnection: this.peerConnection,
      wrtc: this.wrtc,
      offerOptions: opts.offerOptions
    })
    this.handshake.on('signal', event => this.emit('signal', event))
  }

  handleSignal (signal: Signal) {
    this.handshake.handleSignal(signal).catch(err => {
      this.log('error handling signal %o %o', signal, err)
    })
  }
}

interface WebRTCInitiatorHandshakeOptions extends WebRTCHandshakeOptions {
  offerOptions?: RTCOfferOptions
}

class WebRTCInitiatorHandshake extends WebRTCHandshake {
  private readonly options: WebRTCInitiatorHandshakeOptions

  constructor (options: WebRTCInitiatorHandshakeOptions) {
    super(options)

    this.options = options
    this.status = 'idle'

    this.peerConnection.addEventListener('icecandidate', (event) => {
      if (event.candidate == null) {
        return
      }

      this.emit('signal', {
        type: 'candidate',
        candidate: {
          candidate: event.candidate.candidate,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          sdpMid: event.candidate.sdpMid
        }
      })
      this.emit('ice-candidate')
    })
  }

  async handleRenegotiate () {
    if (this.status === 'negotiating') {
      this.log('already negotiating, queueing')
      return
    }

    this.status = 'negotiating'

    const offer = await this.peerConnection.createOffer(this.options.offerOptions)

    await this.peerConnection.setLocalDescription(offer)

    // wait for at least one candidate before sending the offer
    await pEvent(this, 'ice-candidate')
    await delay(ICECOMPLETE_TIMEOUT)

    this.emit('signal', this.peerConnection.localDescription)
  }

  async handleAnswer (signal: AnswerSignal) {
    await this.peerConnection.setRemoteDescription(new this.wrtc.RTCSessionDescription(signal))
    this.status = 'idle'
  }
}
