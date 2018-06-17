'use strict'

const multiaddr = require('multiaddr')

function cleanMultiaddr (maStr) {
  const legacy = '/libp2p-webrtc-star'

  if (maStr.indexOf(legacy) !== -1) {
    maStr = maStr.substring(legacy.length, maStr.length)
    let ma = multiaddr(maStr)
    const tuppleIPFS = ma.stringTuples().filter((tupple) => {
      return tupple[0] === 421 // ipfs code
    })[0]

    ma = ma.decapsulate('ipfs')
    ma = ma.encapsulate('/p2p-webrtc-star')
    ma = ma.encapsulate(`/ipfs/${tuppleIPFS[1]}`)
    maStr = ma.toString()
  }

  return maStr
}

module.exports = {
  cleanMultiaddr
}
