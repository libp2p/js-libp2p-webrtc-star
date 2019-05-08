'use strict'

const sigServer = require('./src/sig-server')
let firstRun = true
let sigS

async function boot (done) {
  const options = {
    port: 15555,
    host: '127.0.0.1',
    metrics: false // firsrun TODO: needs https://github.com/libp2p/js-libp2p-webrtc-star/issues/174
  }

  if (firstRun) { firstRun = false }

  sigS = await sigServer.start(options)

  console.log('signalling on:', sigS.info.uri)

  done()
}

async function stop (done) {
  await sigS.stop()

  done()
}

module.exports = {
  hooks: {
    pre: boot,
    post: stop
  }
}
