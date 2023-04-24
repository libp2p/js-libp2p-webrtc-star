/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { multiaddr } from '@multiformats/multiaddr'
import { pipe } from 'it-pipe'
import type { WebRTCStar } from '../../src/transport.js'
import { mockRegistrar, mockUpgrader } from '@libp2p/interface-mocks'
import type { Upgrader } from '@libp2p/interface-transport'
import type { PeerTransport } from '../index.js'
import { EventEmitter } from '@libp2p/interfaces/events'

const ma1 = multiaddr('/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star')
const ma2 = multiaddr('/ip4/127.0.0.1/tcp/15556/ws/p2p-webrtc-star')
const protocol = '/echo/1.0.0'

export default (create: () => Promise<PeerTransport>): void => {
  describe('multiple signal servers', () => {
    let ws1: WebRTCStar
    let ws2: WebRTCStar
    let upgrader: Upgrader

    beforeEach(async () => {
      ({ transport: ws1 } = await create())
      ;({ transport: ws2 } = await create())

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
    })

    it('can listen on multiple signal servers with the same transport', async () => {
      const listener1 = ws1.createListener({ upgrader })
      await listener1.listen(ma1)

      const listener2 = ws1.createListener({ upgrader })
      await listener2.listen(ma2)

      expect(Array.from(ws1.sigServers.keys())).to.have.lengthOf(2)

      await Promise.all([
        listener1.close(),
        listener2.close()
      ])

      expect(Array.from(ws1.sigServers.keys())).to.have.lengthOf(0)
    })

    it('can dial the first listener using multiple signal servers in one listener', async function () {
      // Listen on two signalling servers in one instance
      const listener1m1 = ws1.createListener({
        upgrader,
        handler: (conn) => {
          void conn.newStream([protocol])
            .then((stream) => {
              void pipe(stream, stream)
            })
        }
      })
      await listener1m1.listen(ma1)

      const listener1m2 = ws1.createListener({
        upgrader,
        handler: (conn) => {
          void conn.newStream([protocol])
            .then((stream) => {
              void pipe(stream, stream)
            })
        }
      })
      await listener1m2.listen(ma2)

      expect(Array.from(ws1.sigServers.keys())).to.have.lengthOf(2)

      // Create Listener 2 listening on the first signalling server
      const listener2 = ws2.createListener({
        upgrader,
        handler: (conn) => {
          void conn.newStream([protocol])
            .then((stream) => {
              void pipe(stream, stream)
            })
        }
      })
      await listener2.listen(ma1)

      expect(Array.from(ws2.sigServers.keys())).to.have.lengthOf(1)

      // // Use first of the signal addresses
      const [sigRefs1] = ws1.sigServers.values()

      await ws2.dial(sigRefs1.signallingAddr, { upgrader })

      await Promise.all([
        listener1m1.close(),
        listener1m2.close(),
        listener2.close()
      ])
    })

    it('can dial the last listener using multiple signal servers in one listener', async function () {
      // Listen on two signalling servers in one instance
      const listener1m1 = ws1.createListener({
        upgrader,
        handler: (conn) => {
          void conn.newStream([protocol])
            .then((stream) => {
              void pipe(stream, stream)
            })
        }
      })
      await listener1m1.listen(ma1)

      const listener1m2 = ws1.createListener({
        upgrader,
        handler: (conn) => {
          void conn.newStream([protocol])
            .then((stream) => {
              void pipe(stream, stream)
            })
        }
      })
      await listener1m2.listen(ma2)

      expect(Array.from(ws1.sigServers.keys())).to.have.lengthOf(2)

      // Create Listener 2 listening on the last signalling server
      const listener2 = ws2.createListener({
        upgrader,
        handler: (conn) => {
          void conn.newStream([protocol])
            .then((stream) => {
              void pipe(stream, stream)
            })
        }
      })
      await listener2.listen(ma2)

      expect(Array.from(ws2.sigServers.keys())).to.have.lengthOf(1)

      // // Use last of the signal addresses
      const [, sigRefs2] = ws1.sigServers.values()

      await ws2.dial(sigRefs2.signallingAddr, { upgrader })

      await Promise.all([
        listener1m1.close(),
        listener1m2.close(),
        listener2.close()
      ])
    })

    it('can close a single listener', async function () {
      const listener1m1 = ws1.createListener({ upgrader })
      await listener1m1.listen(ma1)

      const listener1m2 = ws1.createListener({ upgrader })
      await listener1m2.listen(ma2)

      expect(Array.from(ws1.sigServers.keys())).to.have.lengthOf(2)

      await listener1m1.close()
      expect(Array.from(ws1.sigServers.keys())).to.have.lengthOf(1)

      // Use the second multiaddr to dial
      const listener2 = ws2.createListener({
        upgrader,
        handler: (conn) => {
          void conn.newStream([protocol])
            .then((stream) => {
              void pipe(stream, stream)
            })
        }
      })
      await listener2.listen(ma2)

      // The first was cleaned up on close
      const [sigRefs] = ws1.sigServers.values()

      await ws2.dial(sigRefs.signallingAddr, { upgrader })

      await Promise.all([
        listener1m2.close(),
        listener2.close()
      ])
    })
  })
}
