/* eslint-env mocha */
/* eslint-disable no-console */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const multiaddr = require('multiaddr')
const pipe = require('it-pipe')

module.exports = (create) => {
  describe('track connections', () => {
    let ws1
    let ws2
    let ma1
    let ma2
    let listener

    const maHSDNS = '/dns/star-signal.cloud.ipfs.team'
    const maHSIP = '/ip4/188.166.203.82/tcp/20000'

    const maLS = '/ip4/127.0.0.1/tcp/15555'
    const maGen = (base, id) => multiaddr(`${base}/wss/p2p-webrtc-star/p2p/${id}`) // https
    // const maGen = (base, id) => multiaddr(`${base}/ws/p2p-webrtc-star/ipfs/${id}`)

    if (process.env.WEBRTC_STAR_REMOTE_SIGNAL_DNS) {
      // test with deployed signalling server using DNS
      console.log('Using DNS:', maHSDNS)
      ma1 = maGen(maHSDNS, 'QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2a')
      ma2 = maGen(maHSDNS, 'QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2b')
    } else if (process.env.WEBRTC_STAR_REMOTE_SIGNAL_IP) {
      // test with deployed signalling server using IP
      console.log('Using IP:', maHSIP)
      ma1 = maGen(maHSIP, 'QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2a')
      ma2 = maGen(maHSIP, 'QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2b')
    } else {
      ma1 = maGen(maLS, 'QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2a')
      ma2 = maGen(maLS, 'QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2b')
    }

    beforeEach(async () => {
      // first
      ws1 = create()
      listener = ws1.createListener((conn) => pipe(conn, conn))

      // second
      ws2 = create()
      const listener2 = ws2.createListener((conn) => pipe(conn, conn))

      await Promise.all([listener.listen(ma1), listener2.listen(ma2)])
    })

    it('should untrack conn after being closed', async function () {
      this.timeout(20e3)
      expect(listener.__connections).to.have.lengthOf(0)

      const conn = await ws1.dial(ma1)
      expect(listener.__connections).to.have.lengthOf(1)

      await conn.close()

      // wait for listener to know of the disconnect
      await new Promise((resolve) => {
        setTimeout(resolve, 5000)
      })

      expect(listener.__connections).to.have.lengthOf(0)
    })
  })
}
