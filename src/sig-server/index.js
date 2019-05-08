/* eslint no-unreachable: "warn" */

'use strict'

const Hapi = require('@hapi/hapi')
const Inert = require('@hapi/inert')

const config = require('./config')
const log = config.log
const epimetheus = require('epimetheus')
const path = require('path')

exports = module.exports

exports.start = async (options = {}) => {
  const port = options.port || config.hapi.port
  const host = options.host || config.hapi.host

  const http = new Hapi.Server({
    ...config.hapi.options,
    port,
    host
  })

  await http.register(Inert)
  await http.start()

  log('signaling server has started on: ' + http.info.uri)

  http.peers = require('./routes-ws')(http, options.metrics).peers

  http.route({
    method: 'GET',
    path: '/',
    handler: (request, reply) => reply.file(path.join(__dirname, 'index.html'), {
      confine: false
    })
  })

  if (options.metrics) {
    // TODO: reenable epimetheus when support
    log('wait for epimetheus support')
    throw new Error('epimetheus is currently not supported by hapi. Needs: https://github.com/libp2p/js-libp2p-webrtc-star/issues/174')
    epimetheus.instrument(http)
  }

  return http
}
