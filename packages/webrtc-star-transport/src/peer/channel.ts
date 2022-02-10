import errCode from 'err-code'
import defer, { DeferredPromise } from 'p-defer'
import type { Logger } from './interface.js'

const MAX_BUFFERED_AMOUNT = 64 * 1024
const CHANNEL_CLOSING_TIMEOUT = 5 * 1000

export interface WebRTCDataChannelOptions {
  onMessage: (event: MessageEvent<Uint8Array>) => void
  onOpen: () => void
  onClose: () => void
  onError: (err: Error) => void
  log: Logger
}

export class WebRTCDataChannel {
  public label: string
  private readonly channel: RTCDataChannel
  private readonly closingInterval: NodeJS.Timer
  private open: DeferredPromise<void>
  private readonly log: Logger

  constructor (channel: RTCDataChannel, opts: WebRTCDataChannelOptions) {
    this.label = channel.label
    this.open = defer()
    this.channel = channel
    this.channel.binaryType = 'arraybuffer'
    this.log = opts.log

    if (typeof this.channel.bufferedAmountLowThreshold === 'number') {
      this.channel.bufferedAmountLowThreshold = MAX_BUFFERED_AMOUNT
    }

    channel.addEventListener('message', event => {
      opts.onMessage(event)
    })
    channel.addEventListener('bufferedamountlow', () => {
      this.log('stop backpressure: bufferedAmount %d', this.channel.bufferedAmount)
      this.open.resolve()
    })
    channel.addEventListener('open', () => {
      this.open.resolve()
      opts.onOpen()
    })
    channel.addEventListener('close', () => {
      opts.onClose()
    })
    channel.addEventListener('error', event => {
      // @ts-expect-error ChannelErrorEvent is just an Event in the types?
      if (event.error?.message === 'Transport channel closed') {
        return this.close()
      }

      // @ts-expect-error ChannelErrorEvent is just an Event in the types?
      opts.log.error('channel encounter an error in state "%s" message: "%s" detail: "%s', channel.readyState, event.error?.message, event.error?.errorDetail) // eslint-disable-line @typescript-eslint/restrict-template-expressions

      // @ts-expect-error ChannelErrorEvent is just an Event in the types?
      const err = event.error instanceof Error
        // @ts-expect-error ChannelErrorEvent is just an Event in the types?
        ? event.error
        // @ts-expect-error ChannelErrorEvent is just an Event in the types?
        : new Error(`datachannel error: ${event.error?.message} ${event.error?.errorDetail}`) // eslint-disable-line @typescript-eslint/restrict-template-expressions

      opts.onError(errCode(err, 'ERR_DATA_CHANNEL'))
    })

    // HACK: Chrome will sometimes get stuck in readyState "closing", let's check for this condition
    // https://bugs.chromium.org/p/chromium/issues/detail?id=882743
    let isClosing = false
    this.closingInterval = setInterval(() => { // No "onclosing" event
      if (channel.readyState === 'closing') {
        if (isClosing) {
          opts.onClose() // closing timed out: equivalent to onclose firing
        }
        isClosing = true
      } else {
        isClosing = false
      }
    }, CHANNEL_CLOSING_TIMEOUT)
  }

  async send (data: Uint8Array) {
    await this.open.promise

    this.channel.send(data)

    if (this.channel.bufferedAmount > MAX_BUFFERED_AMOUNT) {
      this.log('start backpressure: bufferedAmount %d', this.channel.bufferedAmount)
      this.open = defer()
    }
  }

  close () {
    clearInterval(this.closingInterval)
    this.channel.close()
  }

  get bufferedAmount () {
    return this.channel.bufferedAmount
  }
}
