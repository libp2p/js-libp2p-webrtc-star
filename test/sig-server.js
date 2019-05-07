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

  const base = (id) => {
    return `/ip4/127.0.0.1/tcp/9090/ws/p2p-webrtc-star/ipfs/${id}`
  }

  let c1mh = multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo1'))
  let c2mh = multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo2'))
  let c3mh = multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo3'))
  let c4mh = multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo4'))

  it('start and stop signalling server (default port)', async () => {
    const server = await sigServer.start()

    expect(server.info.port).to.equal(13579)
    expect(server.info.protocol).to.equal('http')
    expect(server.info.address).to.equal('0.0.0.0')

    await server.stop()
  })

  it('start and stop signalling server (default port) and spam it with invalid requests', async () => {
    const server = await sigServer.start()

    expect(server.info.port).to.equal(13579)
    expect(server.info.protocol).to.equal('http')
    expect(server.info.address).to.equal('0.0.0.0')

    const cl = io.connect(server.info.uri)
    cl.on('connect', async () => {
      cl.emit('ss-handshake', null)
      cl.emit('ss-handshake', 1)
      cl.emit('ss-handshake', [1, 2, 3])
      cl.emit('ss-handshake', {})

      await server.stop()
    })
  })

  it('start and stop signalling server (custom port)', async () => {
    const options = {
      port: 12345
    }

    const server = await sigServer.start(options)

    expect(server.info.port).to.equal(12345)
    expect(server.info.protocol).to.equal('http')
    expect(server.info.address).to.equal('0.0.0.0')
    await server.stop()
  })

  it('start signalling server for client tests', async () => {
    const options = {
      port: 12345
    }

    const server = await sigServer.start(options)

    expect(server.info.port).to.equal(12345)
    expect(server.info.protocol).to.equal('http')
    expect(server.info.address).to.equal('0.0.0.0')
    sioUrl = server.info.uri
    sigS = server
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
    c1.once('ws-peer', (multiaddr) => {
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

  it('disconnects every client', (done) => {
    [c1, c2, c3, c4].forEach((c) => c.disconnect())
    done()
  })

  it('emits ws-peer every 10 seconds', function (done) {
    this.timeout(50000)
    let peersEmitted = 0

    c1 = io.connect(sioUrl, sioOptions)
    c2 = io.connect(sioUrl, sioOptions)
    c1.emit('ss-join', 'c1')
    c2.emit('ss-join', 'c2')

    c1.on('ws-peer', (p) => {
      expect(p).to.be.equal('c2')
      check()
    })

    function check () {
      if (++peersEmitted === 2) {
        done()
      }
    }
  })

  it('stop signalling server', () => {
    parallel([
      (cb) => {
        c1.disconnect()
        cb()
      },
      (cb) => {
        c2.disconnect()
        cb()
      }
    ], async () => {
      await sigS.stop()
    })
  })
})
