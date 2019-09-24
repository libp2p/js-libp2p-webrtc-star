/* eslint-env mocha */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const multiaddr = require('multiaddr')

module.exports = (create) => {
  describe('peer discovery', () => {
    let ws1
    let ws1Listener
    const base = (id) => {
      return `/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star/p2p/${id}`
    }
    const ma1 = multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo3A'))

    let ws2
    const ma2 = multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo3B'))

    let ws3
    const ma3 = multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo3C'))

    let ws4
    const ma4 = multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo3D'))

    it('listen on the first', async () => {
      ws1 = create()
      ws1Listener = ws1.createListener(() => { })
      ws1.discovery.start()

      await ws1Listener.listen(ma1)
    })

    it('listen on the second, discover the first', async () => {
      ws2 = create()
      const listener = ws2.createListener(() => { })
      ws2.discovery.start()

      const p = new Promise((resolve) => {
        ws1.discovery.once('peer', (peerInfo) => {
          expect(peerInfo.multiaddrs.has(ma2)).to.equal(true)
          resolve()
        })
      })

      listener.listen(ma2)
      await p
    })

    // this test is mostly validating the non-discovery test mechanism works
    it('listen on the third, verify ws-peer is discovered', async () => {
      let discoveredPeer = false

      ws1.discovery.once('peer', () => {
        discoveredPeer = true
      })

      // resolve on peer discovered
      const p = new Promise((resolve) => {
        ws1Listener.io.once('ws-peer', () => {
          expect(discoveredPeer).to.equal(true)
          resolve()
        })
      })

      ws3 = create()
      const listener = ws3.createListener(() => { })
      ws3.discovery.start()

      await listener.listen(ma3)
      await p
    })

    it('listen on the fourth, ws-peer is not discovered', async () => {
      let discoveredPeer = false

      ws1.discovery.once('peer', () => {
        discoveredPeer = true
      })
      // resolve on peer discovered
      const p = new Promise((resolve) => {
        ws1Listener.io.once('ws-peer', () => {
          expect(discoveredPeer).to.equal(false)
          resolve()
        })
      })

      ws1.discovery.stop()
      ws4 = create()
      const listener = ws4.createListener(() => { })
      ws4.discovery.start()

      await listener.listen(ma4)
      await p
    })
  })
}
