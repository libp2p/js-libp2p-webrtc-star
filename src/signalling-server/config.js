'use strict'

const debug = require('debug')
const log = debug('signalling-server')
log.error = debug('signalling-server:error')

module.exports = {
  log: log,
  hapi: {
    port: process.env.PORT || 8134,
    options: {
      connections: {
        routes: {
          cors: true
        }
      }
    }
  }
}
