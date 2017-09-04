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

function cleanMultiaddr (maStr) {
  const legacy = '/libp2p-webrtc-star'

  if (maStr.indexOf(legacy) !== -1) {
    maStr = maStr.substring(legacy.length, maStr.length)
    let ma = multiaddr(maStr)
    const tuppleIPFS = ma.stringTuples().filter((tupple) => {
      return tupple[0] === 421 // ipfs code
    })[0]

    ma = ma.decapsulate('ipfs')
    ma = ma.encapsulate('p2p-webrtc-star')
    ma = ma.encapsulate(`/ipfs/${tuppleIPFS[1]}`)
    maStr = ma.toString()
  }

  return maStr
}

exports = module.exports
exports.cleanUrlSIO = cleanUrlSIO
exports.cleanMultiaddr = cleanMultiaddr
