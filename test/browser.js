/* eslint-env mocha */
'use strict'

const WStar = require('..')
const PeerId = require('peer-id')

const mockUpgrader = {
  upgradeInbound: maConn => maConn,
  upgradeOutbound: maConn => maConn
}

describe('browser RTC', () => {
  const create = async () => {
    const localPeer = await PeerId.create()
    return new WStar({
      upgrader: {
        upgradeInbound: maConn => maConn,
        upgradeOutbound: maConn => maConn,
        localPeer
      }
    })
  }

  require('./transport/dial.js')(create)
  require('./transport/listen.js')(create)
  require('./transport/discovery.js')(create)
  require('./transport/filter.js')(create)
})
