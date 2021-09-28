/* eslint-env mocha */
'use strict'

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
