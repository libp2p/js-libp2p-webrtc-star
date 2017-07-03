'use strict'

const Hapi = require('hapi')
const config = require('./config')
const log = config.log
const epimetheus = require('epimetheus')

exports = module.exports

exports.start = (options, callback) => {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  const port = options.port || config.hapi.port
  const host = options.host || config.hapi.host

  const http = new Hapi.Server(config.hapi.options)

  http.connection({
    port: port,
    host: host
  })

  epimetheus.instrument(http)

  http.start((err) => {
    if (err) {
      return callback(err)
    }

    log('signaling server has started on: ' + http.info.uri)

    http.peers = require('./routes-ws')(http).peers

    callback(null, http)
  })

  return http
}
