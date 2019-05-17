const RendezvousExchange = require('libp2p-exchange-rendezvous')
const WebRTCStarClass = require('./index')

function WebRTCStarFactory (options) {
  const WebRTCStarProxy = {
    construct(target, args) {
      options.exchange = new RendezvousExchange(args[0].libp2p, {enableServer: true})
      options.exchange.start(() => {})
      return new target(Object.assign(args[0], options))
    }
  }

  return new Proxy(WebRTCStarClass, WebRTCStarProxy)
}

module.exports = WebRTCStarFactory
