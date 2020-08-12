/* eslint-env mocha */

'use strict'

const { expect } = require('aegir/utils/chai')
const multiaddr = require('multiaddr')
const sigServer = require('../../src/sig-server')

const SERVER_PORT = 13580

module.exports = (create) => {
  describe('reconnect to signaling server', () => {
    let sigS
    let ws1
    let ws2
    let ws3
    const signallerAddr = multiaddr('/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star')

    before(async () => {
      sigS = await sigServer.start({ port: SERVER_PORT })
    })

    after(async () => {
      await sigS.stop()
    })

    it('listen on the first', async () => {
      ws1 = await create()

      const listener = ws1.createListener(() => {})
      ws1.discovery.start()

      await listener.listen(signallerAddr)
    })

    it('listen on the second, discover the first', async () => {
      ws2 = await create()

      const p = new Promise((resolve) => {
        ws1.discovery.once('peer', ({ multiaddrs }) => {
          expect(multiaddrs.some((m) => m.equals(ws2._signallingAddr))).to.equal(true)
          resolve()
        })
      })

      const listener = ws2.createListener(() => {})

      await listener.listen(signallerAddr)
      await p
    })

    it('stops the server', async () => {
      await sigS.stop()
    })

    it('starts the server again', async () => {
      sigS = await sigServer.start({ port: SERVER_PORT })
    })

    it('wait a bit for clients to reconnect', (done) => {
      setTimeout(done, 2000)
    })

    it('listen on the third, first discovers it', async () => {
      ws3 = await create()

      const listener = ws3.createListener(() => {})
      await listener.listen(signallerAddr)

      await new Promise((resolve) => {
        ws1.discovery.once('peer', ({ multiaddrs }) => {
          expect(multiaddrs.some((m) => m.equals(ws3._signallingAddr))).to.equal(true)
          resolve()
        })
      })
    })
  })
}
