/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const multiaddr = require('multiaddr')
const series = require('async/series')
const pull = require('pull-stream')

const WebRTCStar = require('../../src/webrtc-star')
const sigServer = require('../../src/signalling')

describe('dial', () => {
  let ws1
  // const ma1 = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/15555/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2a')

  const ma1 = multiaddr('/libp2p-webrtc-star/ip4/188.166.203.82/tcp/20000/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2a')

  let ws2
  // const ma2 = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/15555/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2b')

  const ma2 = multiaddr('/libp2p-webrtc-star/ip4/188.166.203.82/tcp/20000/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2b')

  before((done) => {
    series([
      first,
      second
    ], done)

    function first (next) {
      ws1 = new WebRTCStar()

      const listener = ws1.createListener((conn) => {
        pull(conn, conn)
      })

      listener.listen(ma1, next)
    }

    function second (next) {
      ws2 = new WebRTCStar()

      const listener = ws2.createListener((conn) => {
        pull(conn, conn)
      })
      listener.listen(ma2, next)
    }
  })

  it('dial on IPv4, check callback', (done) => {
    ws1.dial(ma2, (err, conn) => {
      expect(err).to.not.exist

      const data = new Buffer('some data')

      pull(
        pull.values([data]),
        conn,
        pull.collect((err, values) => {
          expect(err).to.not.exist
          expect(values).to.be.eql([data])
          done()
        })
      )
    })
  })
  it('dial offline / non-existent node on IPv4, check callback', (done) => {
    let maOffline = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/15555/ws/ipfs/ABCD')
    ws1.dial(maOffline, (err, conn) => {
      expect(err).to.exist
      done()
    })
  })

  it.skip('dial on IPv6', (done) => {
    // TODO IPv6 not supported yet
  })
})
describe('complex dial scenarios', () => {
<<<<<<< HEAD
  let ws1, ws2, listenerToClose
  const ma1 = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/15555/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooA1')
  const ma1b = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/15555/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooA2')
  const ma2 = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/15555/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooB1')
  before((done) => {
    series([
      first,
      second,
      third,
      fourth
    ], done)

=======
  let ws1, ws2, ws3, sigS2
  const ma1a = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/15555/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooA1')
  const ma1b = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/15555/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooA2')
  const ma1c = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/15556/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooA3')
  const ma2 = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/15555/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooB1')
  const ma3 = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/15556/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooC1')
  before((done) => {
    series([
      boot,
      first,
      second,
      third,
      fourth,
      fifth
    ], done)

    function boot (done) {
      const options = {
        port: 15556,
        host: '127.0.0.1'
      }

      sigServer.start(options, (err, server) => {
        if (err) {
          throw err
        }
        sigS2 = server
        console.log('signalling 2 on:', server.info.uri)
        done()
      })
    }
>>>>>>> err/callbackisAlreadyCalled
    function first (next) {
      ws1 = new WebRTCStar()

      const listener = ws1.createListener((conn) => {
        pull(conn, conn)
      })

<<<<<<< HEAD
      listenerToClose = listener
      listener.listen(ma1, next)
=======
      // close immediately
      listener.listen(ma1a, () => {
        listener.close(next)
      })
>>>>>>> err/callbackisAlreadyCalled
    }

    function second (next) {
      const listener = ws1.createListener((conn) => {
        pull(conn, conn)
      })

      listener.listen(ma1b, next)
    }
    function third (next) {
<<<<<<< HEAD
      listenerToClose.close(next)
=======
      const listener = ws1.createListener((conn) => {
        pull(conn, conn)
      })

      listener.listen(ma1c, next)
>>>>>>> err/callbackisAlreadyCalled
    }

    function fourth (next) {
      ws2 = new WebRTCStar()

      const listener = ws2.createListener((conn) => {
        pull(conn, conn)
      })
      listener.listen(ma2, next)
    }
<<<<<<< HEAD
  })

  it('dial closed listener should error', (done) => {
    ws2.dial(ma1, (err, conn) => {
=======
    function fifth (next) {
      ws3 = new WebRTCStar()

      const listener = ws3.createListener((conn) => {
        pull(conn, conn)
      })
      listener.listen(ma3, next)
    }
  })
  after((done) => sigS2.stop(done))

  it('dial closed listener should error', (done) => {
    ws2.dial(ma1a, (err, conn) => {
>>>>>>> err/callbackisAlreadyCalled
      expect(err).to.exist
      done()
    })
  })

  it('dial after listener 0 is closed and its signalling connection disconnected', (done) => {
    ws1.dial(ma2, (err, conn) => {
      expect(err).to.not.exist

      const data = new Buffer('some data')

      pull(
        pull.values([data]),
        conn,
        pull.collect((err, values) => {
          expect(err).to.not.exist
          expect(values).to.be.eql([data])
          done()
        })
      )
    })
  })
<<<<<<< HEAD
=======
  it('dial a second node on a different signaling server', (done) => {
    ws1.dial(ma3, (err, conn) => {
      expect(err).to.not.exist

      const data = new Buffer('some data')

      pull(
        pull.values([data]),
        conn,
        pull.collect((err, values) => {
          expect(err).to.not.exist
          expect(values).to.be.eql([data])
          done()
        })
      )
    })
  })
>>>>>>> err/callbackisAlreadyCalled
})

