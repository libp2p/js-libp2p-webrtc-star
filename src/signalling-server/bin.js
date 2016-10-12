#!/usr/bin/env node

'use strict'

const sigServer = require('./index')
const argv = require('minimist')(process.argv.slice(2))

sigServer.start(argv.port || argv.p || 9090, (err, info) => {
  if (err) {
    throw err
  }
  console.log('Signalling server started on:', info.uri)
})

process.on('SIGINT', () => {
  sigServer.stop(() => {
    console.log('Signalling server stopped')
    process.exit()
  })
})
