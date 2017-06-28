/* eslint-env mocha */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const multiaddr = require('multiaddr')
const sigServer = require('../../src/sig-server')

const SERVER_PORT = 13580

module.exports = (create) => {
  describe('reconnect to signaling server', () => {
    let sigS
    let ws1
    const ma1 = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/13580/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo6A')

    let ws2
    const ma2 = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/13580/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo6B')

    let ws3
    const ma3 = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/13580/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo6C')

    before((done) => {
      sigS = sigServer.start({ port: SERVER_PORT }, done)
    })

    after((done) => sigS.stop(done))

    it('listen on the first', (done) => {
      ws1 = create()

      const listener = ws1.createListener((conn) => {})
      listener.listen(ma1, (err) => {
        expect(err).to.not.exist()
        done()
      })
    })

    it('listen on the second, discover the first', (done) => {
      ws2 = create()

      ws1.discovery.once('peer', (peerInfo) => {
        expect(peerInfo.multiaddrs.has(ma2)).to.equal(true)
        done()
      })

      const listener = ws2.createListener((conn) => {})
      listener.listen(ma2, (err) => {
        expect(err).to.not.exist()
      })
    })

    it('stops the server', (done) => {
      sigS.stop(done)
    })

    it('starts the server again', (done) => {
      sigS = sigServer.start({ port: SERVER_PORT }, done)
    })

    it('wait a bit for clients to reconnect', (done) => {
      setTimeout(done, 2000)
    })

    it('listen on the third, first discovers it', (done) => {
      ws3 = create()

      const listener = ws3.createListener((conn) => {})
      listener.listen(ma3, (err) => expect(err).to.not.exist())

      ws1.discovery.once('peer', (peerInfo) => {
        expect(peerInfo.multiaddrs.has(ma3)).to.equal(true)
        done()
      })
    })
  })
}
