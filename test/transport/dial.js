/* eslint-env mocha */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const multiaddr = require('multiaddr')
const {parallel, waterfall} = require('async')
const pull = require('pull-stream')
const promisify = require('promisify-es6')
const Utils = require('../utils')

module.exports = (create) => {
  describe('dial', () => {
    let ws1
    let ws2
    let m
    let ma1
    let ma2

    const maHSDNS = '/dns/star-signal.cloud.ipfs.team'
    const maHSIP = '/ip4/188.166.203.82/tcp/20000'

    const maLS = '/ip4/127.0.0.1/tcp/15555'
    const maGen = (base, id) => multiaddr(`${base}/wss/p2p-webrtc-star/ipfs/${id}`) // https
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

    before(async () => {
      let listener

      m = await create('m')
      ws1 = await create('a')
      ws2 = await create('b')

      await promisify((cb) => Utils.Exchange.before(ws1.exchange, ws2.exchange, m.exchange, cb))()

      listener = ws1.createListener((conn) => pull(conn, conn))
      await promisify(listener.listen)(ma1)
      listener = ws2.createListener((conn) => pull(conn, conn))
      await promisify(listener.listen)(ma2)
    })

    it('dial on IPv4, check callback', function (done) {
      this.timeout(20 * 1000)

      ws1.dial(ma2, (err, conn) => {
        expect(err).to.not.exist()

        const data = Buffer.from('some data')

        pull(
          pull.values([data]),
          conn,
          pull.collect((err, values) => {
            expect(err).to.not.exist()
            expect(values).to.be.eql([data])
            done()
          })
        )
      })
    })

    it('dial offline / non-exist()ent node on IPv4, check callback', function (done) {
      this.timeout(20 * 1000)
      let maOffline = multiaddr('/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star/ipfs/ABCD')
      ws1.dial(maOffline, (err, conn) => {
        expect(err).to.exist()
        done()
      })
    })

    it.skip('dial on IPv6', (done) => {
      // TODO IPv6 not supported yet
    })

    after(async () => {
      await new Promise((resolve, reject) => {
        waterfall([
          cb => parallel([ws1.exchange, ws2.exchange, m.exchange].map(e => cb => e.stop(cb)), e => cb(e)),
          cb => parallel([ws1.exchange.swarm, ws2.exchange.swarm, m.exchange.swarm].map(p => cb => p.stop(cb)), e => cb(e))
        ], e => e ? reject(e) : resolve())
      })
    })
  })
}
