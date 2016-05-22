/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const multiaddr = require('multiaddr')

const WebRTCStar = require('../../src/webrtc-star')

describe('join and leave the signalling server', () => {
  let ws

  it('listen', (done) => {
    ws = new WebRTCStar()
    const mh = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/15555/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooooA')

    ws.createListener(mh, (conn) => {}, (err) => {
      expect(err).to.not.exist
      done()
    })
  })

  it('close', (done) => {
    ws.close(done)
  })
})
