/* eslint-env mocha */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const multiaddr = require('multiaddr')
const series = require('async/series')

module.exports = (create) => {
  describe('peer discovery', () => {
    let ws1
    let ws1Listener
    const base = (id) => {
      return `/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star/ipfs/${id}`
    }
    const ma1 = multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo3A'))

    let ws2
    const ma2 = multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo3B'))

    let ws3
    const ma3 = multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo3C'))

    let ws4
    const ma4 = multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo3D'))

    it('listen on the first', (done) => {
      series([
        (cb) => {
          ws1 = create()
          ws1Listener = ws1.createListener((conn) => {})
          ws1.discovery.start(cb)
        },
        (cb) => {
          ws1Listener.listen(ma1, cb)
        }
      ], (err) => {
        expect(err).to.not.exist()
        done()
      })
    })

    it('listen on the second, discover the first', (done) => {
      let listener

      ws1.discovery.once('peer', (peerInfo) => {
        expect(peerInfo.multiaddrs.has(ma2)).to.equal(true)
        done()
      })

      series([
        (cb) => {
          ws2 = create()
          listener = ws2.createListener((conn) => {})
          ws2.discovery.start(cb)
        },
        (cb) => {
          listener.listen(ma2, cb)
        }
      ], (err) => {
        expect(err).to.not.exist()
      })
    })

    // this test is mostly validating the non-discovery test mechanism works
    it('listen on the third, verify ws-peer is discovered', (done) => {
      let listener
      let discoveredPeer = false
      // resolve on peer discovered
      ws1.discovery.once('peer', (peerInfo) => {
        discoveredPeer = true
      })
      ws1Listener.io.once('ws-peer', (maStr) => {
        expect(discoveredPeer).to.equal(true)
        done()
      })

      series([
        (cb) => {
          ws3 = create()
          listener = ws3.createListener((conn) => {})
          ws3.discovery.start(cb)
        },
        (cb) => {
          listener.listen(ma3, cb)
        }
      ], (err) => {
        expect(err).to.not.exist()
      })
    })

    it('listen on the fourth, ws-peer is not discovered', (done) => {
      let listener
      let discoveredPeer = false
      // resolve on peer discovered
      ws1.discovery.once('peer', (peerInfo) => {
        discoveredPeer = true
      })
      ws1Listener.io.once('ws-peer', (maStr) => {
        expect(discoveredPeer).to.equal(false)
        done()
      })

      series([
        (cb) => {
          ws1.discovery.stop(cb)
        },
        (cb) => {
          ws4 = create()
          listener = ws4.createListener((conn) => {})
          ws4.discovery.start(cb)
        },
        (cb) => {
          listener.listen(ma4, cb)
        }
      ], (err) => {
        expect(err).to.not.exist()
      })
    })
  })
}
