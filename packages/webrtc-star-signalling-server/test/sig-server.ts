/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { multiaddr } from '@multiformats/multiaddr'
import { SigServer, sigServer } from '../src/index.js'
import pWaitFor from 'p-wait-for'
import { pEvent } from 'p-event'
import type { WebRTCStarSocket } from '@libp2p/webrtc-star-protocol'

export default (clientName: string, io: (url: string, opts: any) => WebRTCStarSocket, sioOptions: any): void => {
  describe(`signalling ${clientName}`, () => {
    let sioUrl: string
    let sigS: SigServer
    let c1: WebRTCStarSocket
    let c2: WebRTCStarSocket
    let c3: WebRTCStarSocket
    let c4: WebRTCStarSocket

    const base = (id: string): string => {
      return `/ip4/127.0.0.1/tcp/9090/ws/p2p-webrtc-star/ipfs/${id}`
    }

    const c1mh = multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo1'))
    const c2mh = multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo2'))
    const c3mh = multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo3'))
    const c4mh = multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo4'))

    it('start and stop signalling server (default port)', async () => {
      const server = await sigServer()

      expect(server.info.port).to.equal(13579)
      expect(server.info.protocol).to.equal('http')
      expect(server.info.address).to.equal('0.0.0.0')

      await server.stop()
    })

    it('start and stop signalling server (default port) and spam it with invalid requests', (done) => {
      sigServer().then(server => {
        expect(server.info.port).to.equal(13579)
        expect(server.info.protocol).to.equal('http')
        expect(server.info.address).to.equal('0.0.0.0')

        const cl = io(server.info.uri, sioOptions)
        cl.on('connect', async () => {
          // @ts-expect-error not a valid handler
          cl.emit('ss-handshake', null)
          // @ts-expect-error not a valid handler
          cl.emit('ss-handshake', 1)
          // @ts-expect-error not a valid handler
          cl.emit('ss-handshake', [1, 2, 3])
          // @ts-expect-error not a valid handler
          cl.emit('ss-handshake', {})

          await server.stop()

          done()
        })
        cl.on('disconnect', () => {
          cl.close()
        })
      }, done)
    })

    it('start and stop signalling server (custom port)', async () => {
      const options = {
        port: 12345
      }

      const server = await sigServer(options)

      expect(server.info.port).to.equal(12345)
      expect(server.info.protocol).to.equal('http')
      expect(server.info.address).to.equal('0.0.0.0')

      await server.stop()
    })

    it('start signalling server for client tests', async () => {
      const options = {
        port: 12345
      }

      const server = await sigServer(options)

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
      c1 = io(sioUrl, sioOptions)
      c1.on('connect', done)
    })

    it('connect three more clients', (done) => {
      let count = 0

      c2 = io(sioUrl, sioOptions)
      c3 = io(sioUrl, sioOptions)
      c4 = io(sioUrl, sioOptions)

      c2.on('connect', connected)
      c3.on('connect', connected)
      c4.on('connect', connected)

      function connected (): void {
        if (++count === 3) { done() }
      }
    })

    it('ss-join first client', async () => {
      c1.emit('ss-join', c1mh.toString())

      await pWaitFor(() => sigS.peers.size === 1)
    })

    it('ss-join and ss-leave second client', async () => {
      c2.emit('ss-join', c2mh.toString())

      await pWaitFor(() => sigS.peers.size === 2)

      c2.emit('ss-leave', c2mh.toString())

      await pWaitFor(() => sigS.peers.size === 1)
    })

    it('ss-join and disconnect third client', async () => {
      c3.emit('ss-join', c3mh.toString())

      await pWaitFor(() => sigS.peers.size === 2)

      c3.disconnect()

      await pWaitFor(() => sigS.peers.size === 1)
    })

    it('ss-join the fourth', async () => {
      c4.emit('ss-join', c4mh.toString())

      const multiaddr = await pEvent(c1, 'ws-peer')

      expect(multiaddr).to.equal(c4mh.toString())
      expect(sigS.peers.size).to.equal(2)
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
        dstMultiaddr: c4mh.toString(),
        intentId: 'intent-id',
        signal: {
          type: 'offer',
          sdp: 'sdp'
        }
      })
    })

    it('c1 handshake c2 fail (does not exist() anymore)', (done) => {
      c1.once('ws-handshake', (offer) => {
        expect(offer.err).to.exist()
        done()
      })

      c1.emit('ss-handshake', {
        srcMultiaddr: c1mh.toString(),
        dstMultiaddr: c2mh.toString(),
        intentId: 'intent-id',
        signal: {
          type: 'offer',
          sdp: 'sdp'
        }
      })
    })

    it('disconnects every client', (done) => {
      [c1, c2, c3, c4].forEach((c) => c.disconnect())
      done()
    })

    it('emits ws-peer every 10 seconds', function (done) {
      this.timeout(50000)
      let peersEmitted = 0

      c1 = io(sioUrl, sioOptions)
      c2 = io(sioUrl, sioOptions)
      c1.emit('ss-join', 'c1')
      c2.emit('ss-join', 'c2')

      c1.on('ws-peer', (p) => {
        expect(p).to.be.equal('c2')
        check()
      })

      function check (): void {
        if (++peersEmitted === 2) {
          done()
        }
      }
    })

    it('stop signalling server', async () => {
      c1.disconnect()
      c2.disconnect()

      await sigS.stop()
    })
  })
}
