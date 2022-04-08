/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { Multiaddr } from '@multiformats/multiaddr'
import { pEvent } from 'p-event'
import { cleanUrlSIO } from '../../src/utils.js'
import type { WebRTCStar } from '../../src/index.js'
import type { Listener } from '@libp2p/interfaces/src/transport'
import { mockUpgrader } from '@libp2p/interface-compliance-tests/mocks'

export default (create: () => Promise<WebRTCStar>) => {
  describe('peer discovery', () => {
    let ws1: WebRTCStar
    let ws2: WebRTCStar
    let ws3: WebRTCStar
    let ws4: WebRTCStar
    let ws1Listener: Listener
    const signallerAddr = new Multiaddr('/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star')

    after(async () => {
      if (ws1Listener != null) {
        await ws1Listener.close()
      }
    })

    it('listen on the first', async () => {
      ws1 = await create()
      ws1Listener = ws1.createListener({ upgrader: mockUpgrader() })
      await ws1.discovery.start()

      await ws1Listener.listen(signallerAddr)
    })

    it('listen on the second, discover the first', async () => {
      ws2 = await create()
      const listener = ws2.createListener({ upgrader: mockUpgrader() })
      await ws2.discovery.start()

      await listener.listen(signallerAddr)
      const { detail: { multiaddrs } } = await pEvent<'peer', { detail: { multiaddrs: Multiaddr[] } }>(ws1.discovery, 'peer')

      // Check first of the signal addresses
      const [sigRefs] = ws2.sigServers.values()

      expect(multiaddrs.map(m => m.toString())).to.include(sigRefs.signallingAddr.toString())

      await listener.close()
    })

    // this test is mostly validating the non-discovery test mechanism works
    it('listen on the third, verify ws-peer is discovered', async () => {
      const server = ws1.sigServers.get(cleanUrlSIO(signallerAddr))

      if (server == null) {
        throw new Error(`No sigserver found for ma ${signallerAddr.toString()}`)
      }

      let discoveredPeer = false

      ws1.discovery.addEventListener('peer', () => {
        discoveredPeer = true
      }, {
        once: true
      })

      ws3 = await create()
      const listener = ws3.createListener({ upgrader: mockUpgrader() })
      await ws3.discovery.start()

      await listener.listen(signallerAddr)
      await pEvent(server.socket, 'ws-peer')

      expect(discoveredPeer).to.equal(true)

      await listener.close()
    })

    it('listen on the fourth, ws-peer is not discovered', async () => {
      const server = ws1.sigServers.get(cleanUrlSIO(signallerAddr))

      if (server == null) {
        throw new Error(`No sigserver found for ma ${signallerAddr.toString()}`)
      }

      let discoveredPeer = false

      ws1.discovery.addEventListener('peer', () => {
        discoveredPeer = true
      }, {
        once: true
      })

      void ws1.discovery.stop()
      ws4 = await create()
      const listener = ws4.createListener({ upgrader: mockUpgrader() })
      void ws4.discovery.start()

      await listener.listen(signallerAddr)
      await pEvent(server.socket, 'ws-peer')

      expect(discoveredPeer).to.equal(false)

      await listener.close()
    })
  })
}
