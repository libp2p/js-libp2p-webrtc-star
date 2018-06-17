/* eslint-env mocha */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const multiaddr = require('multiaddr')
const cleanMultiaddr = require('../src/utils').cleanMultiaddr
const cleanUrlSIO = require('../src/utils').cleanUrlSIO

describe('utils', () => {
  const legacyMultiaddrStringDNS = '/libp2p-webrtc-star/dns4/star-signal.cloud.ipfs.team/tcp/443/wss/ipfs/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'
  const legacyMultiaddrStringIP = '/libp2p-webrtc-star/ip4/127.0.0.1/tcp/1212/wss/ipfs/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'

  const modernMultiaddrStringDNS = '/dns4/star-signal.cloud.ipfs.team/tcp/443/wss/p2p-webrtc-star/ipfs/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'
  const modernMultiaddrStringIP = '/ip4/127.0.0.1/tcp/1212/wss/p2p-webrtc-star/ipfs/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'

  const modernMultiaddrStringDNS2 = '/dns4/star-signal.cloud.ipfs.team/tcp/9999/wss/p2p-webrtc-star/ipfs/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'
  const modernMultiaddrStringDNS3 = '/dns4/star-signal.cloud.ipfs.team/tcp/80/ws/p2p-webrtc-star/ipfs/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'
  const modernMultiaddrStringDNS4 = '/dns4/star-signal.cloud.ipfs.team/tcp/8080/ws/p2p-webrtc-star/ipfs/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'

  const invalidMultiaddrStringDNS = '/dns4/star-signal.cloud.ipfs.team/udp/8080/wss/p2p-webrtc-star/ipfs/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'
  const invalidMultiaddrStringDNS2 = '/dns4/star-signal.cloud.ipfs.team/tcp/8080/p2p-webrtc-star/ipfs/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'
  const invalidMultiaddrStringDNS3 = '/dns4/star-signal.cloud.ipfs.team/ws/p2p-webrtc-star/ipfs/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'

  // Create actual multiaddrs
  const modernMultiaddrDNS = multiaddr(modernMultiaddrStringDNS)
  const modernMultiaddrDNS2 = multiaddr(modernMultiaddrStringDNS2)
  const modernMultiaddrDNS3 = multiaddr(modernMultiaddrStringDNS3)
  const modernMultiaddrDNS4 = multiaddr(modernMultiaddrStringDNS4)

  const invalidMultiaddrDNS = multiaddr(invalidMultiaddrStringDNS)
  const invalidMultiaddrDNS2 = multiaddr(invalidMultiaddrStringDNS2)
  const invalidMultiaddrDNS3 = multiaddr(invalidMultiaddrStringDNS3)

  it('cleanMultiaddr webrtc-star legacy', () => {
    const newMultiaddrStringDNS = cleanMultiaddr(legacyMultiaddrStringDNS)
    const newMultiaddrStringIP = cleanMultiaddr(legacyMultiaddrStringIP)

    expect(newMultiaddrStringDNS).to.not.equal(legacyMultiaddrStringDNS)
    expect(newMultiaddrStringIP).to.not.equal(legacyMultiaddrStringIP)
    expect(newMultiaddrStringDNS).to.equal(modernMultiaddrStringDNS)
    expect(newMultiaddrStringIP).to.equal(modernMultiaddrStringIP)
  })

  it('cleanMultiaddr webrtc-star modern', () => {
    const newMultiaddrStringDNS = cleanMultiaddr(modernMultiaddrStringDNS)
    const newMultiaddrStringIP = cleanMultiaddr(modernMultiaddrStringIP)

    expect(newMultiaddrStringDNS).to.equal(modernMultiaddrStringDNS)
    expect(newMultiaddrStringIP).to.equal(modernMultiaddrStringIP)
  })
})
