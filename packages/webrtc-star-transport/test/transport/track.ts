/* eslint-env mocha */
/* eslint-disable no-console */

import { expect } from 'aegir/chai'
import { multiaddr } from '@multiformats/multiaddr'
import type { Multiaddr } from '@multiformats/multiaddr'
import { pipe } from 'it-pipe'
import pWaitFor from 'p-wait-for'
import { cleanUrlSIO } from '../../src/utils.js'
import type { WebRTCStar } from '../../src/transport.js'
import type { Listener, Upgrader } from '@libp2p/interface-transport'
import { mockRegistrar, mockUpgrader } from '@libp2p/interface-mocks'
import type { PeerTransport } from '../index.js'
import { EventEmitter } from '@libp2p/interfaces/events'

const protocol = '/echo/1.0.0'

export default (create: () => Promise<PeerTransport>): void => {
  describe('track connections', () => {
    let ws1: WebRTCStar
    let ws2: WebRTCStar
    let ma: Multiaddr
    let listener: Listener
    let remoteListener: Listener
    let upgrader: Upgrader

    const maHSDNS = multiaddr('/dns/star-signal.cloud.ipfs.team/wss/p2p-webrtc-star')
    const maHSIP = multiaddr('/ip4/188.166.203.82/tcp/20000/wss/p2p-webrtc-star')
    const maLS = multiaddr('/ip4/127.0.0.1/tcp/15555/wss/p2p-webrtc-star')

    if (process.env.WEBRTC_STAR_REMOTE_SIGNAL_DNS != null) {
      // test with deployed signalling server using DNS
      console.log('Using DNS:', maHSDNS)
      ma = maHSDNS
    } else if (process.env.WEBRTC_STAR_REMOTE_SIGNAL_IP != null) {
      // test with deployed signalling server using IP
      console.log('Using IP:', maHSIP)
      ma = maHSIP
    } else {
      ma = maLS
    }

    beforeEach(async () => {
      const registrar = mockRegistrar()
      void registrar.handle(protocol, ({ stream }) => {
        void pipe(
          stream,
          stream
        )
      })
      upgrader = mockUpgrader({
        registrar,
        events: new EventEmitter()
      })

      // first
      ;({ transport: ws1 } = await create())
      listener = ws1.createListener({
        upgrader,
        handler: (conn) => {
          void conn.newStream([protocol])
            .then((stream) => {
              void pipe(stream, stream)
            })
        }
      })

      // second
      ;({ transport: ws2 } = await create())
      remoteListener = ws2.createListener({
        upgrader,
        handler: (conn) => {
          void conn.newStream([protocol])
            .then((stream) => {
              void pipe(stream, stream)
            })
        }
      })

      await Promise.all([listener.listen(ma), remoteListener.listen(ma)])
    })

    afterEach(async () => {
      await Promise.all([listener, remoteListener].map(async l => { await l.close() }))
    })

    it('should untrack conn after being closed', async function () {
      const server = ws1.sigServers.get(cleanUrlSIO(ma))

      if (server == null) {
        throw new Error(`No sigserver found for ma ${ma.toString()}`)
      }

      expect(server.connections).to.have.lengthOf(0)

      // Use one of the signal addresses
      const [sigRef] = ws2.sigServers.values()

      const conn = await ws1.dial(sigRef.signallingAddr, { upgrader })

      const remoteServer = ws2.sigServers.get(cleanUrlSIO(ma))

      if (remoteServer == null) {
        throw new Error(`No sigserver found for ma ${ma.toString()}`)
      }

      // Wait for the listener to begin tracking, this happens after signaling is complete
      await pWaitFor(() => remoteServer.connections.length === 1)
      expect(remoteServer.channels.size).to.equal(1)
      expect(remoteServer.pendingSignals.size).to.equal(1)

      await conn.close()

      // Wait for tracking to clear
      await pWaitFor(() => remoteServer.connections.length === 0)
      expect(remoteServer.channels.size).to.equal(0)
      expect(remoteServer.pendingSignals.size).to.equal(0)
    })
  })
}
