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
  describe('valid Connection', () => {
    let m
    let ws1
    let ws2

    const base = (id) => {
      return `/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star/ipfs/${id}`
    }

    const ma1 = multiaddr(base('Qmf2uGBMP8VcLYAbh7katNyXyhiptYoUf1kLzbFd1jpRbf'))
    const ma2 = multiaddr(base('QmY6yfBGWghP7NcW3gFeJC9FgRQe2rbV8BkfyWAYfBAT3g'))

    let conn

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

      await promisify((cb) => (conn = ws1.dial(ma2, cb)))()
    })

    it('get observed addrs', (done) => {
      conn.getObservedAddrs((err, addrs) => {
        expect(err).to.not.exist()
        expect(addrs[0].toString()).to.equal(ma2.toString())
        done()
      })
    })

    it('get Peer Info', (done) => {
      conn.getPeerInfo((err, peerInfo) => {
        expect(err).to.exist()
        done()
      })
    })

    it('set Peer Info', (done) => {
      conn.setPeerInfo('info')
      conn.getPeerInfo((err, peerInfo) => {
        expect(err).to.not.exist()
        expect(peerInfo).to.equal('info')
        done()
      })
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
