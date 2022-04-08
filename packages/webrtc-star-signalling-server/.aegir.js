let firstRun = true
let sigServers = []

async function boot () {
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

  if (firstRun) {
    firstRun = false
  }

  const { sigServer } = await import('./dist/src/index.js')

  sigServers.push(await sigServer(options1))
  sigServers.push(await sigServer(options2))
  sigServers.push(await sigServer(options3))

  console.log('signalling on:')
  sigServers.forEach((sig) => console.log(sig.info.uri))
}

async function stop () {
  await Promise.all(sigServers.map(s => s.stop()))
}

/** @type {import('aegir').PartialOptions} */
export default {
  test: {
    before: boot,
    after: stop
  },
  build: {
    bundle: false
  }
}
