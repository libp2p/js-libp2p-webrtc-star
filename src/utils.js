'use strict'

const multiaddr = require('multiaddr')

function cleanUrlSIO (ma) {
  const maStrSplit = ma.toString().split('/')

  if (!multiaddr.isName(ma)) {
    return 'http://' + maStrSplit[2] + ':' + maStrSplit[4]
  } else {
    const wsProto = ma.protos()[1].name

    if (wsProto === 'ws') {
      return 'http://' + maStrSplit[2]
    } else if (wsProto === 'wss') {
      return 'https://' + maStrSplit[2]
    } else {
      throw new Error('invalid multiaddr' + ma.toString())
    }
  }
}

exports = module.exports
exports.cleanUrlSIO = cleanUrlSIO
