import { logger } from '@libp2p/logger'

const log = logger('signalling-server')

export const config = {
  log,
  hapi: {
    port: process.env.PORT ?? 13579,
    host: '0.0.0.0',
    options: {
      routes: {
        cors: true
      }
    }
  },
  refreshPeerListIntervalMS: 10000
}
