/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const multiaddr = require('multiaddr')
const parallel = require('run-parallel')

const WebRTCStar = require('../../src/webrtc-star')

describe('dial and destroy', () => {
  let ws1
  const mh1 = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/15555/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooon')

  let ws2
  const mh2 = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/15555/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooooS')

  let connCatcher = (conn) => {
    conn.pipe(conn)
  }

  it('listen on the first', (done) => {
    ws1 = new WebRTCStar()

    ws1.createListener(mh1, (conn) => {
      connCatcher(conn)
    }, (err) => {
      expect(err).to.not.exist
      done()
    })
  })

  it('listen on the second', (done) => {
    ws2 = new WebRTCStar()

    ws2.createListener(mh2, (conn) => {
      connCatcher(conn)
    }, (err) => {
      expect(err).to.not.exist
      done()
    })
  })

  it('dial and destroy from dialer', (done) => {
    connCatcher = (conn) => {
      conn.on('close', done)
    }

    ws1.dial(mh2, { ready: (err, conn) => {
      expect(err).to.not.exist
      // When things are all in the same thread..
      setTimeout(conn.destroy, 100)
    }})
  })

  it('dial and destroy from listener', (done) => {
    connCatcher = (conn) => {
      conn.destroy()
    }

    ws1.dial(mh2, { ready: (err, conn) => {
      expect(err).to.not.exist
      conn.on('close', done)
    }})
  })

  it('close', (done) => {
    parallel([
      ws1.close,
      ws2.close
    ], done)
  })
})
