/* eslint-env mocha */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const multiaddr = require('multiaddr')

module.exports = (create) => {
  describe('listen', () => {
    let ws

    const ma = multiaddr('/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star')

    before(() => {
      ws = create()
    })

    it('listen, check for promise', async () => {
      const listener = ws.createListener(() => {})

      await listener.listen(ma)
      listener.close()
    })

    it('listen, check for listening event', async () => {
      const listener = ws.createListener(() => {})

      const p = new Promise((resolve) => {
        listener.once('listening', () => {
          listener.close()
          resolve()
        })
      })

      await listener.listen(ma)
      await p
    })

    it('listen, check for the close event', async () => {
      const listener = ws.createListener(() => {})

      await listener.listen(ma)
      const p = new Promise((resolve) => {
        listener.once('close', () => resolve())
      })

      listener.close()
      await p
    })

    it.skip('listen on IPv6 addr', () => {
      // TODO IPv6 not supported yet
    })

    it('getAddrs', async () => {
      const listener = ws.createListener(() => {})

      await listener.listen(ma)

      const addrs = listener.getAddrs()
      const expectedAddr = ma.encapsulate(`/p2p/${ws._upgrader.localPeer.toB58String()}`)
      expect(addrs[0]).to.deep.equal(expectedAddr)

      listener.close()
    })
  })
}
