/* eslint-env mocha */
'use strict'

const wrtc = require('wrtc')
const electronWebRTC = require('electron-webrtc')
const PeerId = require('peer-id')
const WStar = require('..')
const sigServerTests = require('./sig-server')

// Test v4, v3 and v2 clients against the socket server

sigServerTests(
  'socket.io-client@v4 (next path)',
  require('socket.io-client'), {
    transports: ['websocket'],
    forceNew: true,
    path: '/socket.io-next/' // TODO: This should be removed when socket.io@2 support is removed
  }
)
sigServerTests(
  'socket.io-client@v3 (next path)',
  require('socket.io-client-v3'), {
    transports: ['websocket'],
    forceNew: true,
    path: '/socket.io-next/' // TODO: This should be removed when socket.io@2 support is removed
  }
)
sigServerTests(
  'socket.io-client@v2 (next path)',
  require('socket.io-client-v2'), {
    transports: ['websocket'],
    forceNew: true,
    path: '/socket.io-next/' // TODO: This should be removed when socket.io@2 support is removed
  }
)
sigServerTests(
  'socket.io-client@v4 (root path)',
  require('socket.io-client'), {
    transports: ['websocket'],
    forceNew: true
  }
)
sigServerTests(
  'socket.io-client@v3 (root path)',
  require('socket.io-client-v3'), {
    transports: ['websocket'],
    forceNew: true
  }
)
sigServerTests(
  'socket.io-client@v2 (root path)',
  require('socket.io-client-v2'), {
    transports: ['websocket'],
    forceNew: true
  }
)

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
  require('./transport/multiple-signal-servers.js')(create)
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
  require('./transport/multiple-signal-servers.js')(create)
  require('./transport/track.js')(create)
  require('./transport/discovery.js')(create)
  require('./transport/filter.js')(create)
  // TODO ensure that nodes from wrtc close properly (race issue in travis)
  // require('./transport/reconnect.node.js')(create)
})
