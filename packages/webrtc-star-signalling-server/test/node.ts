/* eslint-env mocha */

import sigServerTests from './sig-server.js'
import { connect as socketClientV4 } from 'socket.io-client'
import { io as socketClientV3 } from 'socket.io-client-v3'
// @ts-expect-error no types
import { connect as socketClientV2 } from 'socket.io-client-v2'

// Test v4, v3 and v2 clients against the socket server

sigServerTests(
  'socket.io-client@v4 (next path)',
  socketClientV4, {
    transports: ['websocket'],
    forceNew: true,
    path: '/socket.io-next/' // TODO: This should be removed when socket.io@2 support is removed
  }
)
sigServerTests(
  'socket.io-client@v3 (next path)',
  // @ts-expect-error types are wrong
  socketClientV3, {
    transports: ['websocket'],
    forceNew: true,
    path: '/socket.io-next/' // TODO: This should be removed when socket.io@2 support is removed
  }
)
sigServerTests(
  'socket.io-client@v2 (next path)',
  socketClientV2, {
    transports: ['websocket'],
    forceNew: true,
    path: '/socket.io-next/' // TODO: This should be removed when socket.io@2 support is removed
  }
)
sigServerTests(
  'socket.io-client@v4 (root path)',
  socketClientV4, {
    transports: ['websocket'],
    forceNew: true
  }
)
sigServerTests(
  'socket.io-client@v3 (root path)',
  // @ts-expect-error types are wrong
  socketClientV3, {
    transports: ['websocket'],
    forceNew: true
  }
)
sigServerTests(
  'socket.io-client@v2 (root path)',
  socketClientV2, {
    transports: ['websocket'],
    forceNew: true
  }
)
