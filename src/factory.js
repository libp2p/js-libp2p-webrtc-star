const RendezvousExchange = require('libp2p-exchange-rendezvous')
const WebRTCStarClass = require('./index')

function WebRTCStarFactory (options) {
  const WebRTCStarProxy = {
    construct(target, [nodeOpts]) {
      options.exchange = new RendezvousExchange(nodeOpts.libp2p, {enableServer: true})
      nodeOpts.libp2p.on("start", () => options.exchange.start(() => {}))
      nodeOpts.libp2p.on("stop", () => options.exchange.stop(() => {}))

      return new target(Object.assign(nodeOpts, options))
    }
  }

  return new Proxy(WebRTCStarClass, WebRTCStarProxy)
}

module.exports = WebRTCStarFactory
