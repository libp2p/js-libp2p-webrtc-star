/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { multiaddr } from '@multiformats/multiaddr'
import type { Multiaddr } from '@multiformats/multiaddr'
import { sigServer } from '@libp2p/webrtc-star-signalling-server'
import type { SigServer } from '@libp2p/webrtc-star-signalling-server'
import type { Listener } from '@libp2p/interface-transport'
import { mockUpgrader } from '@libp2p/interface-mocks'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { pushable } from 'it-pushable'
import pWaitFor from 'p-wait-for'
import type { PeerTransport } from '../index.js'
import pDefer from 'p-defer'
import delay from 'delay'
import type { WebRTCStar } from '../../src/transport.js'
import { pEvent } from 'p-event'
import { EventEmitter } from '@libp2p/interfaces/events'

const SERVER_PORT = 13580

export default (create: () => Promise<PeerTransport>): void => {
  describe('reconnect to signaling server', () => {
    let sigS: SigServer
    let ws1: WebRTCStar
    let ws2: WebRTCStar
    let ws3: WebRTCStar
    let listener1: Listener
    let listener2: Listener
    let listener3: Listener
    const signallerAddr = multiaddr(`/ip4/127.0.0.1/tcp/${SERVER_PORT}/ws/p2p-webrtc-star`)

    before(async () => {
      sigS = await sigServer({ port: SERVER_PORT })
    })

    after(async () => {
      if (listener1 != null) {
        await listener1.close()
      }

      if (listener2 != null) {
        await listener2.close()
      }

      if (listener3 != null) {
        await listener3.close()
      }

      await sigS.stop()
    })

    it('listen on the first', async () => {
      ({ transport: ws1 } = await create())

      listener1 = ws1.createListener({
        upgrader: mockUpgrader({
          events: new EventEmitter()
        })
      })
      await ws1.discovery().start()

      await listener1.listen(signallerAddr)
    })

    it('listen on the second, discover the first', async () => {
      ({ transport: ws2 } = await create())

      listener2 = ws2.createListener({
        upgrader: mockUpgrader({
          events: new EventEmitter()
        })
      })

      await listener2.listen(signallerAddr)
      const { detail: { multiaddrs } } = await pEvent<'peer', { detail: { multiaddrs: Multiaddr[] } }>(ws1.discovery(), 'peer')

      // Check first of the signal addresses
      const [sigRefs] = ws2.sigServers.values()

      expect(multiaddrs.map(m => m.toString())).to.include(sigRefs.signallingAddr.toString())
    })

    it('stops the server', async () => {
      await sigS.stop()
    })

    it('starts the server again', async () => {
      sigS = await sigServer({ port: SERVER_PORT })
    })

    it('wait a bit for clients to reconnect', (done) => {
      setTimeout(done, 2000)
    })

    it('listen on the third, first discovers it', async () => {
      ({ transport: ws3 } = await create())

      listener3 = ws3.createListener({
        upgrader: mockUpgrader({
          events: new EventEmitter()
        })
      })
      await listener3.listen(signallerAddr)

      const { detail: { multiaddrs } } = await pEvent<'peer', { detail: { multiaddrs: Multiaddr[] } }>(ws1.discovery(), 'peer')

      // Check first of the signal addresses
      const [sigRefs] = ws3.sigServers.values()

      expect(multiaddrs.some((m) => m.equals(sigRefs.signallingAddr))).to.equal(true)
    })
  })

  describe('can close signaling server without dropping existing connections or streams', () => {
    let sigS: SigServer
    let listener1: Listener
    let listener2: Listener
    let listener3: Listener
    const signallerAddr = multiaddr(`/ip4/127.0.0.1/tcp/${SERVER_PORT}/ws/p2p-webrtc-star`)

    before(async () => {
      sigS = await sigServer({
        port: SERVER_PORT,
        refreshPeerListIntervalMS: 100
      })
    })

    after(async () => {
      if (listener1 != null) {
        await listener1.close()
      }

      if (listener2 != null) {
        await listener2.close()
      }

      if (listener3 != null) {
        await listener3.close()
      }

      await sigS.stop()
    })

    it('does not drop connections when the signalling server disconnects', async () => {
      const peer1 = await create()
      const peer2 = await create()
      const peer3 = await create()

      // returns a promise that resolves when peer1 has discovered peer2 and peer3
      async function discoverPeers (): Promise<void> {
        const peer2Discovered = pDefer()
        const peer3Discovered = pDefer()

        peer1.transport.discovery().addEventListener('peer', event => {
          const discoveredPeer = event.detail.id

          if (discoveredPeer.equals(peer2.peerId)) {
            peer2Discovered.resolve()
          }

          if (discoveredPeer.equals(peer3.peerId)) {
            peer3Discovered.resolve()
          }
        })

        await Promise.all([
          peer2Discovered.promise,
          peer3Discovered.promise
        ])
      }

      const protocol = '/test/protocol/1.0.0'
      const received: Uint8Array[] = []

      listener1 = peer1.transport.createListener({
        upgrader: mockUpgrader({
          events: new EventEmitter()
        })
      })
      await peer1.transport.discovery().start()
      await listener1.listen(signallerAddr)

      // wait for peer discovery
      let discover = discoverPeers()

      // collect messages sent from peer 1 -> peer 2
      void peer2.registrar.handle(protocol, ({ stream }) => {
        void Promise.resolve().then(async () => {
          for await (const data of stream.source) {
            received.push(data.subarray())
          }
        })
      })
      listener2 = peer2.transport.createListener({ upgrader: peer2.upgrader })
      await listener2.listen(signallerAddr)

      listener3 = peer3.transport.createListener({ upgrader: peer3.upgrader })
      await listener3.listen(signallerAddr)

      // wait for peer discovery
      await discover

      // ws1 dial ws2
      const connection = await peer1.transport.dial(signallerAddr.encapsulate(`/p2p/${peer2.peerId.toString()}`), {
        upgrader: peer1.upgrader
      })
      const stream = await connection.newStream(protocol)

      // send messages from peer 1 -> peer 2
      const sender = pushable()
      void stream.sink(sender)

      expect(received).to.be.empty()

      sender.push(uint8ArrayFromString('message 1'))

      await pWaitFor(() => {
        return received.length === 1
      })

      // stop the signalling server
      await sigS.stop({ timeout: 1 })

      // wait for all connections to close
      await delay(1000)

      // send another message
      sender.push(uint8ArrayFromString('message 2'))

      // should still receive the message
      await pWaitFor(() => {
        return received.length === 2
      })

      // should not have closed connection or stream
      expect(connection.stat.timeline.close).to.not.be.ok()
      expect(stream.stat.timeline.close).to.not.be.ok()

      // fail to dial a peer through the signalling server
      await expect(peer1.transport.dial(signallerAddr.encapsulate(`/p2p/${peer3.peerId.toString()}`), {
        upgrader: peer1.upgrader
      })).to.eventually.be.rejected()

      // setup promise that resolves after we rediscover peers
      discover = discoverPeers()

      // start the signalling server again
      await sigS.start()

      // wait to reconnect to the server
      await delay(1000)

      // send a final message
      sender.push(uint8ArrayFromString('message 3'))

      await pWaitFor(() => {
        return received.length === 3
      })

      // wait for peer rediscovery
      await discover

      // can dial again
      await expect(peer1.transport.dial(signallerAddr.encapsulate(`/p2p/${peer3.peerId.toString()}`), {
        upgrader: peer1.upgrader
      })).to.eventually.be.ok()
    })
  })
}
