import debug from 'debug'
import { EventEmitter } from 'events'
import errCode from 'err-code'
import randombytes from 'iso-random-stream/src/random.js'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { Pushable, pushable } from 'it-pushable'
import defer, { DeferredPromise } from 'p-defer'
import { WebRTCDataChannel } from './channel.js'
import delay from 'delay'
import type { WRTC } from './interface.js'
import type { Duplex } from 'it-stream-types'

// const ICECOMPLETE_TIMEOUT = 5 * 1000

export interface Logger {
  (...opts: any[]): void
  error: (...opts: any[]) => void
}

const DEFAULT_PEER_CONNECTION_CONFIG: RTCConfiguration = {
  iceServers: [{
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:global.stun.twilio.com:3478'
    ]
  }]
}

function getBrowserRTC (): WRTC {
  if (typeof globalThis === 'undefined') {
    throw errCode(new Error('No WebRTC support detected'), 'ERR_WEBRTC_SUPPORT')
  }

  const wrtc = {
    // @ts-expect-error browser prefixed property names
    RTCPeerConnection: globalThis.RTCPeerConnection ?? globalThis.mozRTCPeerConnection ?? globalThis.webkitRTCPeerConnection,
    // @ts-expect-error browser prefixed property names
    RTCSessionDescription: globalThis.RTCSessionDescription ?? globalThis.mozRTCSessionDescription ?? globalThis.webkitRTCSessionDescription,
    // @ts-expect-error browser prefixed property names
    RTCIceCandidate: globalThis.RTCIceCandidate ?? globalThis.mozRTCIceCandidate ?? globalThis.webkitRTCIceCandidate
  }

  if (wrtc.RTCPeerConnection == null) {
    throw errCode(new Error('No WebRTC support detected'), 'ERR_WEBRTC_SUPPORT')
  }

  return wrtc
}

export interface WebRTCPeerOptions {
  id?: string
  wrtc?: WRTC
  peerConnectionConfig?: RTCConfiguration
}

export class WebRTCPeer extends EventEmitter implements Duplex<Uint8Array> {
  public id: string
  public source: Pushable<Uint8Array>
  public sink: (source: AsyncIterable<Uint8Array> | Iterable<Uint8Array>) => Promise<void>
  public closed: boolean
  protected wrtc: WRTC
  protected peerConnection: RTCPeerConnection
  protected channel?: WebRTCDataChannel
  protected log: Logger
  private readonly connected: DeferredPromise<void>

  constructor (opts: WebRTCPeerOptions & { logPrefix: string }) {
    super()

    this.id = opts.id ?? uint8ArrayToString(randombytes(4), 'hex').slice(0, 7)
    this.log = Object.assign(debug(`libp2p:webrtc-star:peer:${opts.logPrefix}:${this.id}`), {
      error: debug(`libp2p:webrtc-star:peer:${opts.logPrefix}:${this.id}:error`)
    })
    this.wrtc = opts.wrtc ?? getBrowserRTC()
    this.peerConnection = new this.wrtc.RTCPeerConnection(
      Object.assign({}, DEFAULT_PEER_CONNECTION_CONFIG, opts.peerConnectionConfig)
    )
    this.closed = false
    this.connected = defer()

    // duplex properties
    this.source = pushable()
    this.sink = async (source) => {
      await this.connected.promise

      if (this.channel == null) {
        throw errCode(new Error('Connected but no channel?!'), 'ERR_DATA_CHANNEL')
      }

      for await (const buf of source) {
        await this.channel.send(buf)
      }

      await this.close()
    }
  }

  protected handleDataChannelEvent (event: { channel?: RTCDataChannel}) {
    if (event.channel == null) {
      // In some situations `pc.createDataChannel()` returns `undefined` (in wrtc),
      // which is invalid behavior. Handle it gracefully.
      // See: https://github.com/feross/simple-peer/issues/163
      this.close(errCode(new Error('Data channel event is missing `channel` property'), 'ERR_DATA_CHANNEL'))
        .catch(err => {
          this.log('Error closing after event channel was found to be null', err)
        })

      return
    }

    this.channel = new WebRTCDataChannel(event.channel, {
      log: this.log,
      onMessage: (event) => {
        this.source.push(new Uint8Array(event.data))
      },
      onOpen: () => {
        this.connected.resolve()
        this.emit('ready')
      },
      onClose: () => {
        this.close().catch(err => {
          this.log('error closing connection after channel close', err)
        })
      },
      onError: (err) => {
        this.close(err).catch(err => {
          this.log('error closing connection after channel error', err)
        })
      }
    })
  }

  async close (err?: Error) {
    this.closed = true

    if (err == null && this.channel != null) {
      // wait for the channel to flush all data before closing the channel
      while (this.channel.bufferedAmount > 0) {
        await delay(100)
      }
    }

    this.channel?.close()
    this.peerConnection.close()
    this.source.end(err)
    this.emit('close')
  }
}
