/* eslint-env mocha */

// @ts-expect-error no types
import wrtc from 'wrtc'
import sinon from 'sinon'
import { Multiaddr } from '@multiformats/multiaddr'
import testsTransport from '@libp2p/interface-compliance-tests/transport'
import testsDiscovery from '@libp2p/interface-compliance-tests/peer-discovery'
import { WebRTCStar } from '../src/index.js'
import { mockUpgrader } from '@libp2p/interface-compliance-tests/mocks'
import pWaitFor from 'p-wait-for'
import { peerIdFromString } from '@libp2p/peer-id'

describe('interface-transport compliance', function () {
  testsTransport({
    async setup (args) {
      if (args == null) {
        throw new Error('No args')
      }

      const { upgrader } = args
      const peerId = peerIdFromString('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2a')
      const ws = new WebRTCStar({ upgrader, wrtc, peerId })

      const base = (id: string) => {
        return `/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star/p2p/${id}`
      }

      const addrs = [
        new Multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2a')),
        new Multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2b')),
        new Multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2c'))
      ]

      // Used by the dial tests to simulate a delayed connect
      const connector = {
        delay () {},
        restore () {
          sinon.restore()
        }
      }

      return { transport: ws, addrs, connector }
    },
    async teardown () {}
  })
})

describe('interface-discovery compliance', () => {
  let intervalId: NodeJS.Timer

  testsDiscovery({
    async setup () {
      const peerId = peerIdFromString('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2d')
      const ws = new WebRTCStar({ upgrader: mockUpgrader(), wrtc, peerId })
      const maStr = '/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2d'

      // only discover peers while discovery is running
      void pWaitFor(() => ws.discovery.isStarted())
        .then(() => {
          intervalId = setInterval(() => {
            if (ws.discovery.isStarted()) {
              ws.peerDiscovered(maStr)
            }
          }, 1000)

          if (intervalId.unref != null) {
            intervalId.unref()
          }
        })

      return ws.discovery
    },
    async teardown () {
      clearInterval(intervalId)
    }
  })
})
