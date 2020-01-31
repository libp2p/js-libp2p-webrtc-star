#!/usr/bin/env node
/* eslint-disable no-console */

'use strict'

const signalling = require('./index')
const argv = require('minimist')(process.argv.slice(2))

;(async () => {
  const server = await signalling.start({
    port: argv.port || argv.p || process.env.PORT || 9090,
    host: argv.host || argv.h || process.env.HOST || '0.0.0.0',
    metrics: !(argv.disableMetrics || process.env.DISABLE_METRICS)
  })

  console.log('Listening on:', server.info.uri)

  process.on('SIGINT', async () => {
    await server.stop()
    console.log('Signalling server stopped')
    process.exit()
  })
})()
