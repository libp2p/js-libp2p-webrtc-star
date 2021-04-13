/* eslint-env mocha */

'use strict'

const { expect } = require('aegir/utils/chai')
const { Multiaddr } = require('multiaddr')
const pipe = require('it-pipe')

const ma1 = new Multiaddr('/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star')
const ma2 = new Multiaddr('/ip4/127.0.0.1/tcp/15556/ws/p2p-webrtc-star')

module.exports = (create) => {
  describe('multiple signal servers', () => {
    let ws1, ws2

    beforeEach(async () => {
      ws1 = await create()
      ws2 = await create()
    })

    it('can listen on multiple signal servers with the same transport', async () => {
      const listener1 = ws1.createListener(() => { })
      await listener1.listen(ma1)

      const listener2 = ws1.createListener(() => { })
      await listener2.listen(ma2)

      expect(Array.from(ws1.sigReferences.keys())).to.have.lengthOf(2)

      await Promise.all([
        listener1.close(),
        listener2.close()
      ])

      expect(Array.from(ws1.sigReferences.keys())).to.have.lengthOf(0)
    })

    it('can dial the first listener using multiple signal servers in one listener', async function () {
      this.timeout(20 * 1000)
      // Listen on two signalling servers in one instance
      const listener1m1 = ws1.createListener((conn) => pipe(conn, conn))
      await listener1m1.listen(ma1)

      const listener1m2 = ws1.createListener((conn) => pipe(conn, conn))
      await listener1m2.listen(ma2)

      expect(Array.from(ws1.sigReferences.keys())).to.have.lengthOf(2)

      // Create Listener 2 listening on the first signalling server
      const listener2 = ws2.createListener((conn) => pipe(conn, conn))
      await listener2.listen(ma1)

      expect(Array.from(ws2.sigReferences.keys())).to.have.lengthOf(1)

      // // Use first of the signal addresses
      const [sigRefs1] = ws1.sigReferences.values()

      await ws2.dial(sigRefs1.signallingAddr)

      await Promise.all([
        listener1m1.close(),
        listener1m2.close(),
        listener2.close()
      ])
    })

    it('can dial the last listener using multiple signal servers in one listener', async function () {
      this.timeout(20 * 1000)
      // Listen on two signalling servers in one instance
      const listener1m1 = ws1.createListener((conn) => pipe(conn, conn))
      await listener1m1.listen(ma1)

      const listener1m2 = ws1.createListener((conn) => pipe(conn, conn))
      await listener1m2.listen(ma2)

      expect(Array.from(ws1.sigReferences.keys())).to.have.lengthOf(2)

      // Create Listener 2 listening on the last signalling server
      const listener2 = ws2.createListener((conn) => pipe(conn, conn))
      await listener2.listen(ma2)

      expect(Array.from(ws2.sigReferences.keys())).to.have.lengthOf(1)

      // // Use last of the signal addresses
      const [, sigRefs2] = ws1.sigReferences.values()

      await ws2.dial(sigRefs2.signallingAddr)

      await Promise.all([
        listener1m1.close(),
        listener1m2.close(),
        listener2.close()
      ])
    })

    it('can close a single listener', async function () {
      this.timeout(20 * 1000)

      const listener1m1 = ws1.createListener(() => { })
      await listener1m1.listen(ma1)

      const listener1m2 = ws1.createListener(() => { })
      await listener1m2.listen(ma2)

      expect(Array.from(ws1.sigReferences.keys())).to.have.lengthOf(2)

      await listener1m1.close()
      expect(Array.from(ws1.sigReferences.keys())).to.have.lengthOf(1)

      // Use the second multiaddr to dial
      const listener2 = ws2.createListener((conn) => pipe(conn, conn))
      await listener2.listen(ma2)

      // The first was cleaned up on close
      const [sigRefs] = ws1.sigReferences.values()

      await ws2.dial(sigRefs.signallingAddr)

      await Promise.all([
        listener1m2.close(),
        listener2.close()
      ])
    })
  })
}
