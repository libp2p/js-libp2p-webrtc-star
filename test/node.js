/* eslint-env mocha */
'use strict'

const wrtc = require('wrtc')
const electronWebRTC = require('electron-webrtc')
const WStar = require('..')

require('./sig-server.js')

describe('transport: with wrtc', () => {
  const create = () => {
    return new WStar({ wrtc: wrtc })
  }

  require('./transport/dial.js')(create)
  require('./transport/listen.js')(create)
  require('./transport/discovery.js')(create)
  require('./transport/filter.js')(create)
  require('./transport/valid-connection.js')(create)
  require('./transport/reconnect.node.js')(create)
})

describe('transport: with electron-wrtc', () => {
  const create = () => {
    return new WStar({ wrtc: electronWebRTC() })
  }

  require('./transport/dial.js')(create)
  require('./transport/listen.js')(create)
  require('./transport/discovery.js')(create)
  require('./transport/filter.js')(create)
  require('./transport/valid-connection.js')(create)
  // TODO ensure that nodes from wrtc close properly (race issue in travis)
  // require('./transport/reconnect.node.js')(create)
})
