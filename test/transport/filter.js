/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const multiaddr = require('multiaddr')

module.exports = (create) => {
  describe('filter', () => {
    it('filters non valid webrtc-star multiaddrs', async () => {
      const ws = await create('a')

      const maArr = [
        multiaddr('/p2p-webrtc-star/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo1'),
        multiaddr('/p2p-webrtc-star'),
        multiaddr('/p2p-webrtc-star/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo4' +
          '/p2p-circuit/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo1')
      ]

      const filtered = ws.filter(maArr)
      expect(filtered.length).to.equal(3)
    })

    it('filter a single addr for this transport', async () => {
      const ws = await create('a')
      const ma = multiaddr('/p2p-webrtc-star/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo1')

      const filtered = ws.filter(ma)
      expect(filtered.length).to.equal(1)
    })
  })
}
