import { Multiaddr } from '@multiformats/multiaddr'

export function cleanUrlSIO (ma: Multiaddr) {
  const maStrSplit = ma.toString().split('/')
  const tcpProto = ma.protos()[1].name
  const wsProto = ma.protos()[2].name
  const tcpPort = ma.stringTuples()[1][1]

  if (tcpProto !== 'tcp' || (wsProto !== 'ws' && wsProto !== 'wss')) {
    throw new Error(`invalid multiaddr: ${ma.toString()}`)
  }

  if (!Multiaddr.isName(ma)) {
    return `http://${maStrSplit[2]}:${maStrSplit[4]}`
  }

  if (wsProto === 'ws') {
    return `http://${maStrSplit[2]}${tcpPort == null || tcpPort === '80' ? '' : `:${tcpPort}`}`
  }

  if (wsProto === 'wss') {
    return `https://${maStrSplit[2]}${tcpPort == null || tcpPort === '443' ? '' : `:${tcpPort}`}`
  }

  throw new Error('invalid multiaddr: ' + ma.toString())
}

export function cleanMultiaddr (maStr: string) {
  const legacy = '/libp2p-webrtc-star'

  if (maStr.startsWith(legacy)) {
    maStr = maStr.substring(legacy.length, maStr.length)
    let ma = new Multiaddr(maStr)
    const tuppleIPFS = ma.stringTuples().filter((tupple) => {
      return tupple[0] === 421 // ipfs code
    })[0]

    if (tuppleIPFS[1] == null) {
      throw new Error('invalid multiaddr: ' + maStr)
    }

    ma = ma.decapsulate('p2p')
    ma = ma.encapsulate('/p2p-webrtc-star')
    ma = ma.encapsulate(`/p2p/${tuppleIPFS[1]}`)
    maStr = ma.toString()
  }

  return maStr
}
