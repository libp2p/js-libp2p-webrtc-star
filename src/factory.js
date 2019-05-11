const RendezvousExchange = require('libp2p-exchange-rendezvous')
const WebRTCStarClass = require('./index')

function WebRTCStarFactory (options) {
  const WebRTCStarProxy = {
    construct(target, libp2pOpts) {
      options.exchange = new RendezvousExchange(libp2pOpts.libp2p.switch, {enableServer: true})
      return new target(Object.assign(libp2pOpts, options))
    }
  }

  return new Proxy(WebRTCStarClass, WebRTCStarProxy)
}

module.exports = WebRTCStarFactory
