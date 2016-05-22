/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const multiaddr = require('multiaddr')
const parallel = require('run-parallel')
const bl = require('bl')

const WebRTCStar = require('../../src/webrtc-star')

describe('listen and dial', () => {
  let ws1
  const mh1 = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/15555/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooooA')

  let ws2
  const mh2 = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/15555/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooooB')

  it('listen on the first', (done) => {
    ws1 = new WebRTCStar()

    ws1.createListener(mh1, (conn) => {
      conn.pipe(conn)
    }, (err) => {
      expect(err).to.not.exist
      done()
    })
  })

  it('listen on the second', (done) => {
    ws2 = new WebRTCStar()

    ws2.createListener(mh2, (conn) => {
      conn.pipe(conn)
    }, (err) => {
      expect(err).to.not.exist
      done()
    })
  })

  it('dial', (done) => {
    const conn = ws1.dial(mh2)
    const text = 'Hello World'
    conn.pipe(bl((err, data) => {
      expect(err).to.not.exist
      expect(data.toString()).to.equal(text)
      done()
    }))

    conn.write(text)
    conn.end()
  })

  it('close', (done) => {
    parallel([
      ws1.close,
      ws2.close
    ], done)
  })
})
