/* eslint-env mocha */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const multiaddr = require('multiaddr')
const webrtcSupport = require('webrtcsupport')
const isNode = require('detect-node')
const WebRTCStar = require('../../src')

describe('peer discovery', () => {
  if (!webrtcSupport.support && !isNode) {
    return console.log('WebRTC not available')
  }

  let ws1
  const ma1 = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/15555/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo3A')

  let ws2
  const ma2 = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/15555/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo3B')

  it('listen on the first', (done) => {
    ws1 = new WebRTCStar()

    const listener = ws1.createListener((conn) => {})
    listener.listen(ma1, (err) => {
      expect(err).to.not.exist()
      done()
    })
  })

  it('listen on the second, discover the first', (done) => {
    ws2 = new WebRTCStar()

    ws1.discovery.once('peer', (peerInfo) => {
      expect(peerInfo.multiaddrs[0]).to.deep.equal(ma2)
      done()
    })

    const listener = ws2.createListener((conn) => {})
    listener.listen(ma2, (err) => {
      expect(err).to.not.exist()
    })
  })
})
