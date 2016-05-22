/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const multiaddr = require('multiaddr')

const WebRTCStar = require('../../src/webrtc-star')

describe('peer discovery', () => {
  let ws1
  const mh1 = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/15555/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooooA')

  let ws2
  const mh2 = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/15555/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooooB')

  it('listen on the first', (done) => {
    ws1 = new WebRTCStar()

    ws1.createListener(mh1, (conn) => {}, (err) => {
      expect(err).to.not.exist
      done()
    })
  })

  it('listen on the second, discover the first', (done) => {
    ws2 = new WebRTCStar()

    ws1.discovery.on('peer', (peerInfo) => {
      expect(peerInfo.multiaddrs[0]).to.deep.equal(mh2)
      done()
    })

    ws2.createListener(mh2, (conn) => {}, (err) => {
      expect(err).to.not.exist
    })
  })
})
