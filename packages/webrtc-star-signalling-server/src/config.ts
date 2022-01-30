import debug from 'debug'

const log = Object.assign(debug('signalling-server'), {
  error: debug('signalling-server:error')
})

export const config = {
  log: log,
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
