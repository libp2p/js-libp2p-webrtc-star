/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { multiaddr } from '@multiformats/multiaddr'
import { pEvent } from 'p-event'
import type { WebRTCStar } from '../../src/transport.js'
import { mockUpgrader } from '@libp2p/interface-mocks'
import type { PeerTransport } from '../index.js'
import { EventEmitter } from '@libp2p/interfaces/events'

export default (create: () => Promise<PeerTransport>): void => {
  describe('listen', () => {
    let ws: WebRTCStar
    const ma = multiaddr('/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star')

    before(async () => {
      ({ transport: ws } = await create())
    })

    it('listen, check for promise', async () => {
      const listener = ws.createListener({
        upgrader: mockUpgrader({
          events: new EventEmitter()
        })
      })

      await listener.listen(ma)
      await listener.close()
    })

    it('listen, check for listening event', async () => {
      const listener = ws.createListener({
        upgrader: mockUpgrader({
          events: new EventEmitter()
        })
      })

      void listener.listen(ma)
      await pEvent(listener, 'listening')
      await listener.close()
    })

    it('listen, check for the close event', async () => {
      const listener = ws.createListener({
        upgrader: mockUpgrader({
          events: new EventEmitter()
        })
      })

      await listener.listen(ma)
      void listener.close()
      await pEvent(listener, 'close')
    })

    it.skip('listen on IPv6 addr', () => {
      // TODO IPv6 not supported yet
    })

    it('should throw an error if it cannot listen on the given multiaddr', async () => {
      const listener = ws.createListener({
        upgrader: mockUpgrader({
          events: new EventEmitter()
        })
      })
      const ma = multiaddr('/ip4/127.0.0.1/tcp/15554/ws/p2p-webrtc-star')

      await expect(listener.listen(ma))
        .to.eventually.be.rejected()
    })

    it('getAddrs', async () => {
      const listener = ws.createListener({
        upgrader: mockUpgrader({
          events: new EventEmitter()
        })
      })
      const ma = multiaddr('/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star')

      await listener.listen(ma)

      const addrs = listener.getAddrs()
      expect(addrs[0]).to.deep.equal(ma)

      await listener.close()
    })

    it('getAddrs with peer id', async () => {
      const listener = ws.createListener({
        upgrader: mockUpgrader({
          events: new EventEmitter()
        })
      })
      const ma = multiaddr('/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooooA')

      await listener.listen(ma)

      const addrs = listener.getAddrs()
      expect(addrs[0]).to.deep.equal(ma)

      await listener.close()
    })

    it('can only listen on one address per listener', async () => {
      const listener = ws.createListener({
        upgrader: mockUpgrader({
          events: new EventEmitter()
        })
      })

      await listener.listen(ma)

      try {
        await listener.listen(ma)
      } catch (err) {
        expect(err).to.exist()
        await listener.close()
        return
      }
      throw new Error('can only listen on one address per listener')
    })
  })
}
