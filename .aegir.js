'use strict'

const sigServer = require('./src/sig-server')
let firstRun = true
let sigServers = []

async function before () {
  const options1 = {
    port: 15555,
    host: '127.0.0.1',
    metrics: firstRun
  }

  const options2 = {
    port: 15556,
    host: '127.0.0.1',
    metrics: false
  }

  const options3 = {
    port: 15557,
    host: '127.0.0.1',
    metrics: false
  }

  if (firstRun) { firstRun = false }

  sigServers.push(await sigServer.start(options1))
  sigServers.push(await sigServer.start(options2))
  sigServers.push(await sigServer.start(options3))

  console.log('signalling on:')
  sigServers.forEach((sig) => console.log(sig.info.uri))
}

async function after () {
  await Promise.all(sigServers.map(s => s.stop()))
}

module.exports = {
  test: {
    before,
    after
  }
}
