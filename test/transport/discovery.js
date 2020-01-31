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
    let ws2
    let ws3
    let ws4
    let ws1Listener
    const signallerAddr = multiaddr('/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star')

    it('listen on the first', async () => {
      ws1 = await create()
      ws1Listener = ws1.createListener(() => { })
      ws1.discovery.start()

      await ws1Listener.listen(signallerAddr)
    })

    it('listen on the second, discover the first', async () => {
      ws2 = await create()
      const listener = ws2.createListener(() => { })
      ws2.discovery.start()

      const p = new Promise((resolve) => {
        ws1.discovery.once('peer', (peerInfo) => {
          expect(peerInfo.multiaddrs.has(ws2._signallingAddr)).to.equal(true)
          resolve()
        })
      })

      listener.listen(signallerAddr)
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

      ws3 = await create()
      const listener = ws3.createListener(() => { })
      ws3.discovery.start()

      await listener.listen(signallerAddr)
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
      ws4 = await create()
      const listener = ws4.createListener(() => { })
      ws4.discovery.start()

      await listener.listen(signallerAddr)
      await p
    })
  })
}
