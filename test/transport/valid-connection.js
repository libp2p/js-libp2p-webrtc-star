/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const multiaddr = require('multiaddr')
const pipe = require('it-pipe')

module.exports = (create) => {
  describe('valid Connection', () => {
    let ws1

    const base = (id) => {
      return `/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star/ipfs/${id}`
    }
    const ma1 = multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo3A'))

    let ws2
    const ma2 = multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo3B'))

    let conn

    before(async () => {
      // first
      ws1 = create()
      const listener1 = ws1.createListener((conn) => pipe(conn, conn))

      // second
      ws2 = create()
      const listener2 = ws2.createListener((conn) => pipe(conn, conn))

      await Promise.all([listener1.listen(ma1), listener2.listen(ma2)])

      conn = await ws1.dial(ma2)
    })

    it('get observed addrs', () => {
      const addrs = conn.getObservedAddrs()
      expect(addrs[0].toString()).to.equal(ma2.toString())
    })
  })
}
