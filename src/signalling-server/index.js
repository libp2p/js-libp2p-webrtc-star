'use strict'

const Hapi = require('hapi')
const config = require('./config')
const log = config.log

exports = module.exports

exports.start = (port, callback) => {
  if (typeof port === 'function') {
    callback = port
    port = undefined
  }

  if (!port) {
    port = config.hapi.port
  }

  const http = new Hapi.Server(config.hapi.options)

  http.connection({
    port: port
  })

  http.start((err) => {
    if (err) {
      return callback(err)
    }
    log('signaling server has started on: ' + http.info.uri)
    http.peers = require('./routes-ws')(http).peers

    callback(null, http.info)
  })

  return http
}
