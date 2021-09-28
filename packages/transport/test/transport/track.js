/* eslint-env mocha */
/* eslint-disable no-console */

'use strict'

const { expect } = require('aegir/utils/chai')
const { Multiaddr } = require('multiaddr')
const pipe = require('it-pipe')
const pWaitFor = require('p-wait-for')

module.exports = (create) => {
  describe('track connections', () => {
    let ws1
    let ws2
    let ma
    let listener
    let remoteListener

    const maHSDNS = new Multiaddr('/dns/star-signal.cloud.ipfs.team/wss/p2p-webrtc-star')
    const maHSIP = new Multiaddr('/ip4/188.166.203.82/tcp/20000/wss/p2p-webrtc-star')
    const maLS = new Multiaddr('/ip4/127.0.0.1/tcp/15555/wss/p2p-webrtc-star')

    if (process.env.WEBRTC_STAR_REMOTE_SIGNAL_DNS) {
      // test with deployed signalling server using DNS
      console.log('Using DNS:', maHSDNS)
      ma = maHSDNS
    } else if (process.env.WEBRTC_STAR_REMOTE_SIGNAL_IP) {
      // test with deployed signalling server using IP
      console.log('Using IP:', maHSIP)
      ma = maHSIP
    } else {
      ma = maLS
    }

    beforeEach(async () => {
      // first
      ws1 = await create()
      listener = ws1.createListener((conn) => pipe(conn, conn))

      // second
      ws2 = await create()
      remoteListener = ws2.createListener((conn) => pipe(conn, conn))

      await Promise.all([listener.listen(ma), remoteListener.listen(ma)])
    })

    afterEach(async () => {
      await Promise.all([listener, remoteListener].map(l => l.close()))
    })

    it('should untrack conn after being closed', async function () {
      expect(listener.__connections).to.have.lengthOf(0)

      // Use one of the signal addresses
      const [sigRefs] = ws2.sigReferences.values()

      const conn = await ws1.dial(sigRefs.signallingAddr)

      // Wait for the listener to begin tracking, this happens after signaling is complete
      await pWaitFor(() => remoteListener.__connections.length === 1)
      expect(remoteListener.__spChannels.size).to.equal(1)
      expect(remoteListener.__pendingIntents.size).to.equal(1)

      await conn.close()

      // Wait for tracking to clear
      await pWaitFor(() => remoteListener.__connections.length === 0)
      expect(remoteListener.__spChannels.size).to.equal(0)
      expect(remoteListener.__pendingIntents.size).to.equal(0)
    })
  })
}
