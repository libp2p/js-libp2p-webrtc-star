'use strict'

const debug = require('debug')
const log = debug('signalling-server')
log.error = debug('signalling-server:error')

const conf = {
  log: log,
  hapi: {
    port: process.env.PORT || 13579,
    host: '0.0.0.0',
    options: {
      connections: {
        routes: {
          cors: true
        }
      }
    }
  },
  refreshPeerListIntervalMS: 10000,
  // this would reset the de-dup list for each peer
  // so after X amount of seconds the peer will receive
  // a all the peers again. It should be considerably
  // larger that refreshPeerListIntervalMS
  clearPeersSentListInterval: 1000 * 60 * 60 * 5 // clean every 5 mins
}

module.exports = conf
