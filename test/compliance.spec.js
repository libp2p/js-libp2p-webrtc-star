/* eslint-env mocha */
'use strict'

const wrtc = require('wrtc')

const sinon = require('sinon')
const testsTransport = require('interface-transport')
const testsDiscovery = require('interface-discovery')
const multiaddr = require('multiaddr')

const WStar = require('../src')

describe('interface-transport compliance', () => {
  testsTransport({
    setup ({ upgrader }) {
      const ws = new WStar({ upgrader, wrtc: wrtc })

      const base = (id) => {
        return `/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star/p2p/${id}`
      }

      const addrs = [
        multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2a')),
        multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2b')),
        multiaddr(base('QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2c'))
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
  testsDiscovery({
    setup () {
      const mockUpgrader = {
        upgradeInbound: maConn => maConn,
        upgradeOutbound: maConn => maConn
      }
      const ws = new WStar({ upgrader: mockUpgrader, wrtc: wrtc })

      return ws.discovery
    }
  })
})
