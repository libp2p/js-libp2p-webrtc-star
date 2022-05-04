// TODO: Temporary fix per wrtc issue
// https://github.com/node-webrtc/node-webrtc/issues/636#issuecomment-774171409
process.on('beforeExit', (code) => process.exit(code))

let firstRun = true

/** @type {import('aegir').PartialOptions} */
export default {
  test: {
    async before () {
      const { sigServer } = await import('@libp2p/webrtc-star-signalling-server')

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

      const sigServers = []

      sigServers.push(await sigServer(options1))
      sigServers.push(await sigServer(options2))
      sigServers.push(await sigServer(options3))

      console.log('signalling on:')
      sigServers.forEach((sig) => console.log(sig.info.uri))

      return {
        sigServers
      }
    },
    async after (_, before) {
      await Promise.all(before.sigServers.map(s => s.stop()))
    }
  }
}
