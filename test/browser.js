'use strict'

const webrtcSupport = require('webrtcsupport')

require('./webrtc-star/test-instance.js')
require('./webrtc-star/test-filter.js')

if (webrtcSupport.support) {
  require('./webrtc-star/test-listen.js')
  require('./webrtc-star/test-dial.js')
  require('./webrtc-star/test-discovery.js')
  require('./webrtc-star/test-valid-connection.js')
}
