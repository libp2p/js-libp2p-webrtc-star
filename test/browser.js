/* eslint-env mocha */
'use strict'

const WStar = require('..')

const mockUpgrader = {
  upgradeInbound: maConn => maConn,
  upgradeOutbound: maConn => maConn
}

describe('browser RTC', () => {
  const create = () => {
    return new WStar({ upgrader: mockUpgrader })
  }

  require('./transport/dial.js')(create)
  require('./transport/listen.js')(create)
  require('./transport/discovery.js')(create)
  require('./transport/filter.js')(create)
})
