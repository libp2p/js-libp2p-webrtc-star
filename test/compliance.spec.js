/* eslint-env mocha */
'use strict'

const wrtc = require('wrtc')

const sinon = require('sinon')
const testsTransport = require('libp2p-interfaces/src/transport/tests')
const testsDiscovery = require('libp2p-interfaces/src/peer-discovery/tests')
const { Multiaddr } = require('multiaddr')

const WStar = require('../src')

describe('interface-transport compliance', function () {
  this.timeout(10e3)
  testsTransport({
    setup ({ upgrader }) {
      const ws = new WStar({ upgrader, wrtc: wrtc })

      const base = (id) => {
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
    }
  })
})

describe('interface-discovery compliance', () => {
  let intervalId

  testsDiscovery({
    setup () {
      const mockUpgrader = {
        upgradeInbound: maConn => maConn,
        upgradeOutbound: maConn => maConn
      }
      const ws = new WStar({ upgrader: mockUpgrader, wrtc: wrtc })
      const maStr = '/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2d'

      intervalId = setInterval(() => ws._peerDiscovered(maStr), 1000)

      return ws.discovery
    },
    teardown () {
      clearInterval(intervalId)
    }
  })
})
