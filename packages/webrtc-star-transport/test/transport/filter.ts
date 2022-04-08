/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { Multiaddr } from '@multiformats/multiaddr'
import type { WebRTCStar } from '../../src/index.js'

export default (create: () => Promise<WebRTCStar>) => {
  describe('filter', () => {
    it('filters non valid webrtc-star multiaddrs', async () => {
      const ws = await create()

      const maArr = [
        new Multiaddr('/ip4/127.0.0.1/tcp/9090/ws/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo1'),
        new Multiaddr('/ip4/127.0.0.1/tcp/9090/ws/p2p-webrtc-star'),
        new Multiaddr('/dnsaddr/libp2p.io/ws/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo1'),
        new Multiaddr('/dnsaddr/signal.libp2p.io/ws/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo1'),
        new Multiaddr('/dnsaddr/signal.libp2p.io/wss/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo1'),
        new Multiaddr('/ip4/127.0.0.1/tcp/9090/ws/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo2'),
        new Multiaddr('/ip4/127.0.0.1/tcp/9090/ws/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo3'),
        new Multiaddr('/ip4/127.0.0.1/tcp/9090/ws/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo4'),
        new Multiaddr('/ip4/127.0.0.1/tcp/9090/ws/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo4'),
        new Multiaddr('/ip4/127.0.0.1/tcp/9090/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo4'),
        new Multiaddr('/ip4/127.0.0.1/tcp/9090/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo4' +
          '/p2p-circuit/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo1')
      ]

      const filtered = ws.filter(maArr)
      expect(filtered.length).to.equal(8)
    })

    it('filter a single addr for this transport', async () => {
      const ws = await create()
      const ma = new Multiaddr('/ip4/127.0.0.1/tcp/9090/ws/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo1')

      const filtered = ws.filter([ma])
      expect(filtered.length).to.equal(1)
    })
  })
}
