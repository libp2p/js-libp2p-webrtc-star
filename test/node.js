/* eslint-env mocha */
'use strict'

const wrtc = require('wrtc')
const electronWebRTC = require('electron-webrtc')
const WStar = require('..')
const Utils = require('./utils')

describe('transport: with wrtc', () => {
  const create = async (id) => {
    return new WStar({ exchange: await Utils(id), wrtc: wrtc })
  }

  require('./transport/dial.js')(create)
  require('./transport/listen.js')(create)
  require('./transport/filter.js')(create)
  require('./transport/valid-connection.js')(create)
})

describe('transport: with electron-wrtc', () => {
  const create = async (id) => {
    return new WStar({ exchange: await Utils(id), wrtc: electronWebRTC() })
  }

  require('./transport/dial.js')(create)
  require('./transport/listen.js')(create)
  require('./transport/filter.js')(create)
  require('./transport/valid-connection.js')(create)
})
