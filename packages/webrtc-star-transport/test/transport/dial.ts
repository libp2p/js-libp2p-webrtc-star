/* eslint-env mocha */
import { expect } from 'aegir/chai'
import { multiaddr } from '@multiformats/multiaddr'
import type { Multiaddr } from '@multiformats/multiaddr'
import { pipe } from 'it-pipe'
import all from 'it-all'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import sinon from 'sinon'
import { WebRTCReceiver } from '@libp2p/webrtc-peer'
import { cleanUrlSIO } from '../../src/utils.js'
import type { WebRTCStar } from '../../src/transport.js'
import type { Listener, Upgrader } from '@libp2p/interface-transport'
import pWaitFor from 'p-wait-for'
import type { HandshakeSignal } from '@libp2p/webrtc-star-protocol'
import { mockRegistrar, mockUpgrader } from '@libp2p/interface-mocks'
import type { PeerTransport } from '../index.js'
import type { Source } from 'it-stream-types'
import type { Uint8ArrayList } from 'uint8arraylist'
import { EventEmitter } from '@libp2p/interfaces/events'

async function * toBytes (source: Source<Uint8ArrayList>): AsyncGenerator<Uint8Array, void, undefined> {
  for await (const list of source) {
    yield * list
  }
}

export default (create: () => Promise<PeerTransport>): void => {
  describe('dial', () => {
    let ws1: WebRTCStar
    let ws2: WebRTCStar
    let ma1: Multiaddr
    let ma2: Multiaddr
    let listener1: Listener
    let listener2: Listener
    let upgrader: Upgrader

    const maHSDNS = multiaddr('/dns/star-signal.cloud.ipfs.team/wss/p2p-webrtc-star')
    const maHSIP = multiaddr('/ip4/188.166.203.82/tcp/20000/wss/p2p-webrtc-star')
    const maLS = multiaddr('/ip4/127.0.0.1/tcp/15555/wss/p2p-webrtc-star')

    if (process.env.WEBRTC_STAR_REMOTE_SIGNAL_DNS != null) {
      // test with deployed signalling server using DNS
      console.log('Using DNS:', maHSDNS) // eslint-disable-line no-console
      ma1 = maHSDNS
      ma2 = maHSDNS
    } else if (process.env.WEBRTC_STAR_REMOTE_SIGNAL_IP != null) {
      // test with deployed signalling server using IP
      console.log('Using IP:', maHSIP) // eslint-disable-line no-console
      ma1 = maHSIP
      ma2 = maHSIP
    } else {
      ma1 = maLS
      ma2 = maLS
    }

    beforeEach(async () => {
      const protocol = '/echo/1.0.0'
      const registrar = mockRegistrar()
      void registrar.handle(protocol, ({ stream }) => {
        void pipe(
          stream,
          stream
        )
      })
      upgrader = mockUpgrader({
        registrar,
        events: new EventEmitter()
      })

      // first
      ;({ transport: ws1 } = await create())
      listener1 = ws1.createListener({
        upgrader,
        handler: (conn) => {
          expect(conn.remoteAddr).to.exist()

          void conn.newStream([protocol])
            .then((stream) => {
              void pipe(stream, stream)
            })
        }
      })

      // second
      ;({ transport: ws2 } = await create())
      listener2 = ws2.createListener({
        upgrader,
        handler: (conn) => {
          expect(conn.remoteAddr).to.exist()

          void conn.newStream([protocol])
            .then((stream) => {
              void pipe(stream, stream)
            })
        }
      })

      await Promise.all([
        listener1.listen(ma1),
        listener2.listen(ma2)
      ])
    })

    afterEach(async () => {
      await Promise.all(
        [listener1, listener2].map(async l => { await l.close() })
      )
    })

    it('dial on IPv4, check promise', async function () {
      // Use one of the signal addresses
      const [sigRefs] = ws2.sigServers.values()

      const conn = await ws1.dial(sigRefs.signallingAddr, { upgrader })
      const stream = await conn.newStream(['/echo/1.0.0'])
      const data = uint8ArrayFromString('some data')
      const values = await pipe(
        [data],
        stream,
        toBytes,
        async (source) => await all(source)
      )

      expect(values).to.deep.equal([data])
    })

    it('dial offline / non-exist()ent node on IPv4, check promise rejected', function () {
      const maOffline = multiaddr('/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2f')

      return expect(ws1.dial(maOffline, { upgrader })).to.eventually.be.rejected().and.have.property('code', 'ERR_SIGNALLING_FAILED')
    })

    it('dial unknown signal server, check promise rejected', function () {
      const maOffline = multiaddr('/ip4/127.0.0.1/tcp/15559/ws/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2f')

      return expect(ws1.dial(maOffline, { upgrader })).to.eventually.be.rejected().and.have.property('code', 'ERR_UNKNOWN_SIGNAL_SERVER')
    })

    it.skip('dial on IPv6', (done) => {
      // TODO IPv6 not supported yet
    })

    it('receive ws-handshake event without intentId, check channel not created', () => {
      const server = ws2.sigServers.get(cleanUrlSIO(ma2))

      if (server == null) {
        throw new Error(`No sigserver found for ma ${ma2.toString()}`)
      }

      server.socket.emit('ws-handshake', {
        // @ts-expect-error invalid field
        intentId: null,
        srcMultiaddr: ma1.toString(),
        dstMultiaddr: ma2.toString(),
        // @ts-expect-error invalid field
        signal: {}
      })

      expect(server.channels.size).to.equal(0)
    })

    it('receive ws-handshake event but channel already exists, check channel.handleSignal called', async () => {
      const server = ws2.sigServers.get(cleanUrlSIO(ma2))

      if (server == null) {
        throw new Error(`No sigserver found for ma ${ma2.toString()}`)
      }

      const channel = { handleSignal: sinon.fake(), close: () => {} }
      // @ts-expect-error invalid field
      server.channels.set('intent-id', channel)

      const listeners = server.socket.listeners('ws-handshake')
      expect(listeners.length).to.equal(1)

      const message: HandshakeSignal = {
        intentId: 'intent-id',
        srcMultiaddr: ma1.toString(),
        dstMultiaddr: ma2.toString(),
        signal: {
          type: 'candidate',
          candidate: {
            candidate: 'derp'
          }
        }
      }

      listeners[0](message)

      await pWaitFor(() => channel.handleSignal.callCount === 1)

      expect(channel.handleSignal.callCount).to.equal(1)
    })

    it('receive ws-handshake event but signal type is not offer, check message saved to pendingIntents', () => {
      const server = ws2.sigServers.get(cleanUrlSIO(ma2))

      if (server == null) {
        throw new Error(`No sigserver found for ma ${ma2.toString()}`)
      }

      const message: HandshakeSignal = {
        intentId: 'intent-id',
        srcMultiaddr: ma1.toString(),
        dstMultiaddr: ma2.toString(),
        signal: {
          type: 'candidate',
          candidate: {
            candidate: 'derp'
          }
        }
      }

      const listeners = server.socket.listeners('ws-handshake')
      expect(listeners.length).to.equal(1)
      listeners[0](message)

      expect(server.pendingSignals.get('intent-id')).to.deep.equal([message])
    })

    it('receive ws-handshake event, the signal type is offer and exists pending intents, check pending intents consumed', () => {
      const server = ws2.sigServers.get(cleanUrlSIO(ma2))

      if (server == null) {
        throw new Error(`No sigserver found for ma ${ma2.toString()}`)
      }

      const message1: HandshakeSignal = {
        intentId: 'intent-id',
        srcMultiaddr: ma1.toString(),
        dstMultiaddr: ma2.toString(),
        signal: {
          type: 'candidate',
          candidate: {
            candidate: 'derp'
          }
        }
      }

      server.pendingSignals.set('intent-id', [message1])

      const fake = sinon.fake()
      const stub = sinon.stub(WebRTCReceiver.prototype, 'handleSignal').callsFake(fake)
      const message2: HandshakeSignal = {
        intentId: 'intent-id',
        srcMultiaddr: ma1.toString(),
        dstMultiaddr: ma2.toString(),
        signal: {
          type: 'offer',
          sdp: 'v=hello'
        }
      }

      const listeners = server.socket.listeners('ws-handshake')
      expect(listeners.length).to.equal(1)
      listeners[0](message2)

      expect(server.channels.size).to.equal(1)
      expect(server.pendingSignals.get('intent-id')).to.have.lengthOf(0)
      // create the channel and consume the pending intent
      expect(fake.callCount).to.equal(2)
      stub.restore()
    })
  })
}
