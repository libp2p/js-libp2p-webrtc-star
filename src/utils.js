'use strict'

const multiaddr = require('multiaddr')

function cleanUrlSIO (ma) {
  const maStrSplit = ma.toString().split('/')

  if (!multiaddr.isName(ma)) {
    return 'http://' + maStrSplit[3] + ':' + maStrSplit[5]
  } else {
    const wsProto = ma.protos()[2].name
    if (wsProto === 'ws') {
      return 'http://' + maStrSplit[3]
    } else if (wsProto === 'wss') {
      return 'https://' + maStrSplit[3]
    } else {
      throw new Error('invalid multiaddr' + ma.toString())
    }
  }
}

exports = module.exports
exports.cleanUrlSIO = cleanUrlSIO
