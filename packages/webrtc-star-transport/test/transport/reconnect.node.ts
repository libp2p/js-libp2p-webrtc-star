/* eslint-env mocha */

import { expect } from 'aegir/utils/chai.js'
import { Multiaddr } from '@multiformats/multiaddr'
import { sigServer } from '@libp2p/webrtc-star-signalling-server'
import { pEvent } from 'p-event'
import type { SigServer } from '@libp2p/webrtc-star-signalling-server'
import type { WebRTCStar } from '../../src/index.js'
import type { Listener } from '@libp2p/interfaces/transport'
import { mockUpgrader } from '@libp2p/interface-compliance-tests/mocks'

const SERVER_PORT = 13580

export default (create: () => Promise<WebRTCStar>) => {
  describe('reconnect to signaling server', () => {
    let sigS: SigServer
    let ws1: WebRTCStar
    let ws2: WebRTCStar
    let ws3: WebRTCStar
    let listener1: Listener
    let listener2: Listener
    let listener3: Listener
    const signallerAddr = new Multiaddr('/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star')

    before(async () => {
      sigS = await sigServer({ port: SERVER_PORT })
    })

    after(async () => {
      await sigS.stop()

      if (listener1 != null) {
        await listener1.close()
      }

      if (listener2 != null) {
        await listener2.close()
      }

      if (listener3 != null) {
        await listener3.close()
      }
    })

    it('listen on the first', async () => {
      ws1 = await create()

      listener1 = ws1.createListener({ upgrader: mockUpgrader() })
      await ws1.discovery.start()

      await listener1.listen(signallerAddr)
    })

    it('listen on the second, discover the first', async () => {
      ws2 = await create()

      listener2 = ws2.createListener({ upgrader: mockUpgrader() })

      await listener2.listen(signallerAddr)
      const { detail: { multiaddrs } } = await pEvent<'peer', { detail: { multiaddrs: Multiaddr[] } }>(ws1.discovery, 'peer')

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
      ws3 = await create()

      listener3 = ws3.createListener({ upgrader: mockUpgrader() })
      await listener3.listen(signallerAddr)

      const { detail: { multiaddrs } } = await pEvent<'peer', { detail: { multiaddrs: Multiaddr[] } }>(ws1.discovery, 'peer')

      // Check first of the signal addresses
      const [sigRefs] = ws3.sigServers.values()

      expect(multiaddrs.some((m) => m.equals(sigRefs.signallingAddr))).to.equal(true)
    })
  })
}
