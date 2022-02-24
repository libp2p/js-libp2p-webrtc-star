#!/usr/bin/env node
/* eslint-disable no-console */

// Usage: $0 [--host <host>] [--port <port>] [--disable-metrics]

import { sigServer } from '../dist/src/index.js'
import minimist from 'minimist'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const info = require('../package.json')

const argv = minimist(process.argv.slice(2), {
  alias: {
    p: 'port',
    h: 'host',
    'disable-metrics': 'disableMetrics'
  }
})

;(async () => {
  const server = await sigServer({
    port: argv.port || process.env.PORT || 9090,
    host: argv.host || process.env.HOST || '0.0.0.0',
    metrics: !(argv.disableMetrics || process.env.DISABLE_METRICS)
  })

  console.log(`${info.name}@${info.version}`)
  console.log('Listening on:', server.info.uri)

  process.on('SIGINT', async () => {
    await server.stop()
    console.log('Signalling server stopped')
    process.exit()
  })
})()
