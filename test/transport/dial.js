/* eslint-env mocha */
/* eslint-disable no-console */

'use strict'

const { expect } = require('aegir/utils/chai')
const { Multiaddr } = require('multiaddr')
const pipe = require('it-pipe')
const { collect } = require('streaming-iterables')
const uint8ArrayFromString = require('uint8arrays/from-string')
const SimplePeer = require('libp2p-webrtc-peer')
const sinon = require('sinon')

function fire (socket, event) {
  const args = [].slice.call(arguments, 2)
  const callbacks = socket._callbacks[`$${event}`]

  for (const callback of callbacks) {
    callback.apply(socket, args)
  }
}

module.exports = (create) => {
  describe('dial', () => {
    let ws1
    let ws2
    let ma1
    let ma2
    let listener1
    let listener2

    const maHSDNS = new Multiaddr('/dns/star-signal.cloud.ipfs.team/wss/p2p-webrtc-star')
    const maHSIP = new Multiaddr('/ip4/188.166.203.82/tcp/20000/wss/p2p-webrtc-star')
    const maLS = new Multiaddr('/ip4/127.0.0.1/tcp/15555/wss/p2p-webrtc-star')

    if (process.env.WEBRTC_STAR_REMOTE_SIGNAL_DNS) {
      // test with deployed signalling server using DNS
      console.log('Using DNS:', maHSDNS)
      ma1 = maHSDNS
      ma2 = maHSDNS
    } else if (process.env.WEBRTC_STAR_REMOTE_SIGNAL_IP) {
      // test with deployed signalling server using IP
      console.log('Using IP:', maHSIP)
      ma1 = maHSIP
      ma2 = maHSIP
    } else {
      ma1 = maLS
      ma2 = maLS
    }

    beforeEach(async () => {
      // first
      ws1 = await create()
      listener1 = ws1.createListener((conn) => {
        expect(conn.remoteAddr).to.exist()
        pipe(conn, conn)
      })

      // second
      ws2 = await create()
      listener2 = ws2.createListener((conn) => pipe(conn, conn))

      await Promise.all([listener1.listen(ma1), listener2.listen(ma2)])
    })

    afterEach(async () => {
      await Promise.all([listener1, listener2].map(l => l.close()))
    })

    it('dial on IPv4, check promise', async function () {
      this.timeout(20 * 1000)

      // Use one of the signal addresses
      const [sigRefs] = ws2.sigReferences.values()

      const conn = await ws1.dial(sigRefs.signallingAddr)
      const data = uint8ArrayFromString('some data')
      const values = await pipe(
        [data],
        conn,
        collect
      )

      expect(values).to.eql([data])
    })

    it('dial offline / non-exist()ent node on IPv4, check promise rejected', async function () {
      this.timeout(20 * 1000)
      const maOffline = new Multiaddr('/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2f')

      return expect(ws1.dial(maOffline)).to.eventually.be.rejected.and.have.property('code', 'ERR_SIGNALLING_FAILED')
    })

    it('dial unknown signal server, check promise rejected', async function () {
      this.timeout(20 * 1000)
      const maOffline = new Multiaddr('/ip4/127.0.0.1/tcp/15559/ws/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2f')

      return expect(ws1.dial(maOffline)).to.eventually.be.rejected.and.have.property('code', 'ERR_UNKNOWN_SIGNAL_SERVER')
    })

    it.skip('dial on IPv6', (done) => {
      // TODO IPv6 not supported yet
    })

    it('receive ws-handshake event withou intentId, check channel not created', () => {
      fire(listener2.io, 'ws-handshake', {
        intentId: null,
        srcMultiaddr: ma1.toString(),
        dstMultiaddr: ma2.toString(),
        signal: {}
      })
      expect(listener2.__spChannels.size).to.equal(0)
    })

    it('receive ws-handshake event but already exists channel, check channel.signal called', () => {
      const channel = { signal: sinon.fake() }
      listener2.__spChannels.set('itent-id', channel)
      fire(listener2.io, 'ws-handshake', {
        intentId: 'itent-id',
        srcMultiaddr: ma1.toString(),
        dstMultiaddr: ma2.toString(),
        signal: {}
      })
      expect(channel.signal.callCount).to.equal(1)
    })

    it('receive ws-handshake event but signal type is not offer, check message saved to peedingIntents', () => {
      const message = {
        intentId: 'itent-id',
        srcMultiaddr: ma1.toString(),
        dstMultiaddr: ma2.toString(),
        signal: {}
      }
      fire(listener2.io, 'ws-handshake', message)
      expect(listener2.__pendingIntents.get('itent-id')).to.deep.equal([message])
    })

    it('receive ws-handshake event, the signal type is offer and exists peeding intents, check peeding intents consumed', () => {
      const message = {
        intentId: 'itent-id',
        srcMultiaddr: ma1.toString(),
        dstMultiaddr: ma2.toString(),
        signal: {}
      }
      listener2.__pendingIntents.set('itent-id', [message])
      const fake = sinon.fake()
      const stub = sinon.stub(SimplePeer.prototype, 'signal').callsFake(fake)
      fire(listener2.io, 'ws-handshake', {
        intentId: 'itent-id',
        srcMultiaddr: ma1.toString(),
        dstMultiaddr: ma2.toString(),
        signal: { type: 'offer' }
      })
      expect(listener2.__spChannels.size).to.equal(1)
      expect(listener2.__pendingIntents.get('itent-id').length).to.equal(0)
      // create the channel and consume the peeding intent
      expect(fake.callCount).to.equal(2)
      stub.restore()
    })
  })
}
