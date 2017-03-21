/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const io = require('socket.io-client')
const parallel = require('async/parallel')
const multiaddr = require('multiaddr')

const sigServer = require('../src/sig-server')

describe('signalling', () => {
  const sioOptions = {
    transports: ['websocket'],
    'force new connection': true
  }

  let sioUrl
  let sigS
  let c1
  let c2
  let c3
  let c4

  let c1mh = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/9090/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo1')
  let c2mh = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/9090/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo2')
  let c3mh = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/9090/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo3')
  let c4mh = multiaddr('/libp2p-webrtc-star/ip4/127.0.0.1/tcp/9090/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo4')

  it('start and stop signalling server (default port)', (done) => {
    sigServer.start((err, server) => {
      expect(err).to.not.exist()
      expect(server.info.port).to.equal(13579)
      expect(server.info.protocol).to.equal('http')
      expect(server.info.address).to.equal('0.0.0.0')
      server.stop(done)
    })
  })

  it('start and stop signalling server (custom port)', (done) => {
    const options = {
      port: 12345
    }
    sigServer.start(options, (err, server) => {
      expect(err).to.not.exist()
      expect(server.info.port).to.equal(12345)
      expect(server.info.protocol).to.equal('http')
      expect(server.info.address).to.equal('0.0.0.0')
      server.stop(done)
    })
  })

  it('start signalling server for client tests', (done) => {
    const options = {
      port: 12345
    }

    sigServer.start(options, (err, server) => {
      expect(err).to.not.exist()
      expect(server.info.port).to.equal(12345)
      expect(server.info.protocol).to.equal('http')
      expect(server.info.address).to.equal('0.0.0.0')
      sioUrl = server.info.uri
      sigS = server
      done()
    })
  })

  it('zero peers', () => {
    expect(Object.keys(sigS.peers).length).to.equal(0)
  })

  it('connect one client', (done) => {
    c1 = io.connect(sioUrl, sioOptions)
    c1.on('connect', done)
  })

  it('connect three more clients', (done) => {
    let count = 0

    c2 = io.connect(sioUrl, sioOptions)
    c3 = io.connect(sioUrl, sioOptions)
    c4 = io.connect(sioUrl, sioOptions)

    c2.on('connect', connected)
    c3.on('connect', connected)
    c4.on('connect', connected)

    function connected () {
      if (++count === 3) { done() }
    }
  })

  it('ss-join first client', (done) => {
    c1.emit('ss-join', c1mh.toString())
    setTimeout(() => {
      expect(Object.keys(sigS.peers()).length).to.equal(1)
      done()
    }, 10)
  })

  it('ss-join and ss-leave second client', (done) => {
    c2.emit('ss-join', c2mh.toString())
    setTimeout(() => {
      expect(Object.keys(sigS.peers()).length).to.equal(2)
      c2.emit('ss-leave', c2mh.toString())
      setTimeout(() => {
        expect(Object.keys(sigS.peers()).length).to.equal(1)
        done()
      }, 10)
    }, 10)
  })

  it('ss-join and disconnect third client', (done) => {
    c3.emit('ss-join', c3mh.toString())
    setTimeout(() => {
      expect(Object.keys(sigS.peers()).length).to.equal(2)
      c3.disconnect()
      setTimeout(() => {
        expect(Object.keys(sigS.peers()).length).to.equal(1)
        done()
      }, 10)
    }, 10)
  })

  it('ss-join the fourth', (done) => {
    c1.on('ws-peer', (multiaddr) => {
      expect(multiaddr).to.equal(c4mh.toString())
      expect(Object.keys(sigS.peers()).length).to.equal(2)
      done()
    })
    c4.emit('ss-join', c4mh.toString())
  })

  it('c1 handshake c4', (done) => {
    c4.once('ws-handshake', (offer) => {
      offer.answer = true
      c4.emit('ss-handshake', offer)
    })

    c1.once('ws-handshake', (offer) => {
      expect(offer.err).to.not.exist()
      expect(offer.answer).to.equal(true)
      done()
    })

    c1.emit('ss-handshake', {
      srcMultiaddr: c1mh.toString(),
      dstMultiaddr: c4mh.toString()
    })
  })

  it('c1 handshake c2 fail (does not exist() anymore)', (done) => {
    c1.once('ws-handshake', (offer) => {
      expect(offer.err).to.exist()
      done()
    })

    c1.emit('ss-handshake', {
      srcMultiaddr: c1mh.toString(),
      dstMultiaddr: c2mh.toString()
    })
  })

  it('stop signalling server', (done) => {
    parallel([
      (cb) => {
        c1.disconnect()
        cb()
      },
      (cb) => {
        c2.disconnect()
        cb()
      },
      // done in test
      // (cb) => {
      //  c3.disconnect()
      //  cb()
      // },
      (cb) => {
        c4.disconnect()
        cb()
      }
    ], () => {
      sigS.stop(done)
    })
  })

  /*
  var c1
  var c2
  var c3

  after((done) => {
    c1.disconnect()
    c2.disconnect()
    c3.disconnect()

    done()
  })

  it('io connect', (done) => {
    var count = 0

    c1 = io.connect(url, options)
    c2 = io.connect(url, options)
    c3 = io.connect(url, options)

    c1.on('connect', connected)
    c2.on('connect', connected)
    c3.on('connect', connected)

    function connected () {
      if (++count === 3) {
        done()
      }
    }
  })

  it('join with notify off', (done) => {
    var count = 0

    c1.once('we-ready', completed)
    c2.once('we-ready', completed)

    c1.emit('ss-join', {
      peerId: new Buffer('6bytes').toString('hex'),
      notify: false
    })
    c2.emit('ss-join', {
      peerId: new Buffer('48bits').toString('hex'),
      notify: false
    })

    function completed (err) {
      expect(err).to.not.exist()

      if (++count === 2) {
        done()
      }
    }
  })

  it('join with incorrect Id', (done) => {
    c3.once('we-ready', completed)

    c3.emit('ss-join', {
      peerId: new Buffer('incorrect').toString('hex'),
      notify: false
    })

    function completed (err) {
      expect(err).to.exist()
      done()
    }
  })

  it('io disconnect and connect again', (done) => {
    var count = 0

    c1.disconnect()
    c2.disconnect()
    c3.disconnect()

    c1 = io.connect(url, options)
    c2 = io.connect(url, options)
    c3 = io.connect(url, options)

    c1.on('connect', connected)
    c2.on('connect', connected)
    c3.on('connect', connected)

    function connected () {
      if (++count === 3) {
        done()
      }
    }
  })

  it('2 join with notify on', (done) => {
    // join with 1 and 2, check that only after 2 joins, one gets the message to connect to it, this way we avoid double call collision

    const c1Id = new Buffer('6bytes').toString('hex')
    const c2Id = new Buffer('48bits').toString('hex')

    // console.log('c1', c1Id)
    // console.log('c2', c2Id)

    c1.once('we-update-finger', (update) => {
      expect(update.id).to.equal(c2Id)
      expect(update.row).to.equal('0')
      c2.removeListener('we-update-finger')
      done()
    })
    c2.on('we-update-finger', () => {
      throw new Error('should not happen')
    })

    c1.emit('ss-join', {
      peerId: c1Id,
      notify: true
    })

    c2.emit('ss-join', {
      peerId: c2Id
    })
  })

  it('3rd joins with notify on', (done) => {
    var count = 0

    const c3Id = new Buffer('abcdef').toString('hex')
    // console.log('c3', c3Id)

    c1.once('we-update-finger', receivedUpdate)
    c3.once('we-update-finger', receivedUpdate)

    c3.emit('ss-join', {
      peerId: c3Id,
      notify: true
    })

    function receivedUpdate (update) {
      expect(update).to.exist()
      expect(update.id).to.exist()
      expect(update.row).to.equal('0')

      if (++count === 2) {
        done()
      }
    }
  })
  */
})
