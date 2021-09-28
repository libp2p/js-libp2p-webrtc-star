'use strict'

const { Multiaddr } = require('multiaddr')

function cleanUrlSIO (ma) {
  const maStrSplit = ma.toString().split('/')
  const tcpProto = ma.protos()[1].name
  const wsProto = ma.protos()[2].name
  const tcpPort = ma.stringTuples()[1][1]

  if (tcpProto !== 'tcp' || (wsProto !== 'ws' && wsProto !== 'wss')) {
    throw new Error('invalid multiaddr: ' + ma.toString())
  }

  if (!Multiaddr.isName(ma)) {
    return 'http://' + maStrSplit[2] + ':' + maStrSplit[4]
  }

  if (wsProto === 'ws') {
    return 'http://' + maStrSplit[2] + (tcpPort === '80' ? '' : ':' + tcpPort)
  }

  if (wsProto === 'wss') {
    return 'https://' + maStrSplit[2] + (tcpPort === '443' ? '' : ':' + tcpPort)
  }
}

function cleanMultiaddr (maStr) {
  const legacy = '/libp2p-webrtc-star'

  if (maStr.indexOf(legacy) !== -1) {
    maStr = maStr.substring(legacy.length, maStr.length)
    let ma = new Multiaddr(maStr)
    const tuppleIPFS = ma.stringTuples().filter((tupple) => {
      return tupple[0] === 421 // ipfs code
    })[0]

    ma = ma.decapsulate('p2p')
    ma = ma.encapsulate('/p2p-webrtc-star')
    ma = ma.encapsulate(`/p2p/${tuppleIPFS[1]}`)
    maStr = ma.toString()
  }

  return maStr
}

module.exports = {
  cleanUrlSIO,
  cleanMultiaddr
}
