/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const multiaddr = require('multiaddr')
const WebRTCStar = require('../../src/webrtc-star')

describe('listen', () => {
  let ws

  const ma = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/15555/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooooA')

  before(() => {
    ws = new WebRTCStar()
  })

  it('listen, check for callback', (done) => {
    const listener = ws.createListener((conn) => {})

    listener.listen(ma, (err) => {
      expect(err).to.not.exist
      listener.close(done)
    })
  })

  it('listen, check for listening event', (done) => {
    const listener = ws.createListener((conn) => {})

    listener.once('listening', () => {
      listener.close(done)
    })
    listener.listen(ma)
  })

  it('listen, check for the close event', (done) => {
    const listener = ws.createListener((conn) => {})
    listener.listen(ma, (err) => {
      expect(err).to.not.exist
      listener.once('close', done)
      listener.close()
    })
  })

  it.skip('close listener with connections, through timeout', (done) => {
    // TODO ? Should this apply ?
  })

  it.skip('listen on IPv6 addr', (done) => {
    // TODO IPv6 not supported yet
  })

  it('getAddrs', (done) => {
    const listener = ws.createListener((conn) => {})
    listener.listen(ma, (err) => {
      expect(err).to.not.exist
      listener.getAddrs((err, addrs) => {
        expect(err).to.not.exist
        expect(addrs[0]).to.deep.equal(ma)
        listener.close(done)
      })
    })
  })
})
