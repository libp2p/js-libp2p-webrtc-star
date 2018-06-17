'use strict'

const Utils = require('interface-data-exchange/src/test/utils')
const Exchange = require('libp2p-exchange-direct/test/testconfig')
const promisify = require('promisify-es6')

module.exports = async (id) => {
  let peer = await Utils.createPeer(id, Exchange.opt['peer' + id.toUpperCase()])
  await promisify(peer.start.bind(peer))()
  const exchange = new Exchange.Exchange(peer, Exchange.opt['exchange' + id.toUpperCase()])
  await promisify(exchange.start.bind(exchange))()

  return exchange
}

module.exports.Exchange = Exchange
