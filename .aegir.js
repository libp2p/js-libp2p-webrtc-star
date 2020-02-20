'use strict'

const sigServer = require('./src/sig-server')
let firstRun = true
let sigS

async function boot () {
  const options = {
    port: 15555,
    host: '127.0.0.1',
    metrics: firstRun
  }

  if (firstRun) { firstRun = false }

  sigS = await sigServer.start(options)

  console.log('signalling on:', sigS.info.uri)
}

async function stop () {
  await sigS.stop()
}

module.exports = {
  hooks: {
    pre: boot,
    post: stop
  }
}
