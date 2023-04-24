import { Server } from '@hapi/hapi'
import Inert from '@hapi/inert'

import { config } from './config.js'
// @ts-expect-error no types
import menoetius from 'menoetius'
import path, { dirname } from 'path'
import { socketServer } from './socket-server.js'
import type { WebRTCStarSocket } from '@libp2p/webrtc-star-protocol'
import type { Server as SocketServer } from 'socket.io'
import { fileURLToPath } from 'url'

const currentDir = dirname(fileURLToPath(import.meta.url))

const log = config.log

interface Options {
  port?: number
  host?: string
  metrics?: boolean
  refreshPeerListIntervalMS?: number
}

export interface SigServer extends Server {
  peers: Map<string, WebRTCStarSocket>
  io: SocketServer
}

export async function sigServer (options: Options = {}): Promise<SigServer> {
  const port = options.port ?? config.hapi.port
  const host = options.host ?? config.hapi.host
  const peers = new Map<string, WebRTCStarSocket>()

  const http: SigServer = Object.assign(new Server({
    ...config.hapi.options,
    port,
    host
  }), {
    peers,
    io: socketServer(
      peers,
      options.metrics ?? false,
      options.refreshPeerListIntervalMS ?? config.refreshPeerListIntervalMS
    )
  })

  http.io.attach(http.listener, {
    path: '/socket.io' // v2/v3/v4 clients can use this path
  })
  http.io.attach(http.listener, {
    path: '/socket.io-next' // v3/v4 clients might be using this path
  })
  http.events.on('stop', () => { http.io.close() })

  await http.register(Inert)
  await http.start()

  log('signaling server has started on: ' + http.info.uri)

  http.route({
    method: 'GET',
    path: '/',
    handler: (request, reply) => reply.file(path.join(currentDir, 'index.html'), {
      confine: false
    })
  })

  if (options.metrics === true) {
    log('enabling metrics')
    await menoetius.instrument(http)
  }

  return http
}
