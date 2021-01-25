/* eslint-env mocha */
'use strict'

const wrtc = require('wrtc')
const electronWebRTC = require('electron-webrtc')
const PeerId = require('peer-id')
const WStar = require('..')

require('./sig-server-next.js')
require('./sig-server.js')

const mockUpgrader = {
  upgradeInbound: maConn => maConn,
  upgradeOutbound: maConn => maConn
}

describe('transport: with wrtc', () => {
  const create = async () => {
    const localPeer = await PeerId.create()
    return new WStar({
      upgrader: {
        upgradeInbound: maConn => maConn,
        upgradeOutbound: maConn => maConn,
        localPeer
      },
      wrtc
    })
  }

  require('./transport/dial.js')(create)
  require('./transport/listen.js')(create)
  require('./transport/track.js')(create)
  require('./transport/discovery.js')(create)
  require('./transport/filter.js')(create)
  require('./transport/reconnect.node.js')(create)
})

// TODO: Electron-webrtc is currently unreliable on linux
describe.skip('transport: with electron-webrtc', () => {
  const create = () => {
    return new WStar({ upgrader: mockUpgrader, wrtc: electronWebRTC() })
  }

  require('./transport/dial.js')(create)
  require('./transport/listen.js')(create)
  require('./transport/track.js')(create)
  require('./transport/discovery.js')(create)
  require('./transport/filter.js')(create)
  // TODO ensure that nodes from wrtc close properly (race issue in travis)
  // require('./transport/reconnect.node.js')(create)
})
