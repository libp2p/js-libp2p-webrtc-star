'use strict'

const { Adapter } = require('interface-transport')
const withIs = require('class-is')
const WebRTCStar = require('.')

// Legacy adapter to old transport & connection interface
class WebRTCStarAdapter extends Adapter {
  constructor () {
    super(new WebRTCStar())
  }
}

module.exports = withIs(WebRTCStarAdapter, {
  className: 'WebRTCStar',
  symbolName: '@libp2p/js-libp2p-webrtc-star/webrtcstar'
})
