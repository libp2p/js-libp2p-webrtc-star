'use strict'

const webrtcSupport = require('webrtcsupport')

require('./webrtc-star/test-filter.js')
require('./webrtc-star/test-join-and-leave.js')

if (webrtcSupport.support) {
  require('./webrtc-star/test-dial-and-listen.js')
  require('./webrtc-star/test-discovery.js')
}
