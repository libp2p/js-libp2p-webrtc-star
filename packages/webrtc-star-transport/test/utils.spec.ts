/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { Multiaddr } from '@multiformats/multiaddr'
import { cleanMultiaddr, cleanUrlSIO } from '../src/utils.js'

describe('utils', () => {
  const legacyMultiaddrStringDNS = '/libp2p-webrtc-star/dns4/star-signal.cloud.ipfs.team/tcp/443/wss/p2p/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'
  const legacyMultiaddrStringIP = '/libp2p-webrtc-star/ip4/127.0.0.1/tcp/1212/wss/p2p/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'

  const modernMultiaddrStringDNS = '/dns4/star-signal.cloud.ipfs.team/tcp/443/wss/p2p-webrtc-star/p2p/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'
  const modernMultiaddrStringIP = '/ip4/127.0.0.1/tcp/1212/wss/p2p-webrtc-star/p2p/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'

  const modernMultiaddrStringDNS2 = '/dns4/star-signal.cloud.ipfs.team/tcp/9999/wss/p2p-webrtc-star/p2p/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'
  const modernMultiaddrStringDNS3 = '/dns4/star-signal.cloud.ipfs.team/tcp/80/ws/p2p-webrtc-star/p2p/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'
  const modernMultiaddrStringDNS4 = '/dns4/star-signal.cloud.ipfs.team/tcp/8080/ws/p2p-webrtc-star/p2p/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'
  const modernMultiaddrStringDNS5 = '/dns4/libp2p-webrtc-star-signal.cloud.ipfs.team/tcp/8080/ws/p2p-webrtc-star/p2p/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'

  const invalidMultiaddrStringDNS = '/dns4/star-signal.cloud.ipfs.team/udp/8080/wss/p2p-webrtc-star/p2p/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'
  const invalidMultiaddrStringDNS2 = '/dns4/star-signal.cloud.ipfs.team/tcp/8080/p2p-webrtc-star/p2p/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'
  const invalidMultiaddrStringDNS3 = '/dns4/star-signal.cloud.ipfs.team/ws/p2p-webrtc-star/p2p/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'

  // Create actual multiaddrs
  const modernMultiaddrDNS = new Multiaddr(modernMultiaddrStringDNS)
  const modernMultiaddrDNS2 = new Multiaddr(modernMultiaddrStringDNS2)
  const modernMultiaddrDNS3 = new Multiaddr(modernMultiaddrStringDNS3)
  const modernMultiaddrDNS4 = new Multiaddr(modernMultiaddrStringDNS4)
  const modernMultiaddrDNS5 = new Multiaddr(modernMultiaddrStringDNS5)

  const invalidMultiaddrDNS = new Multiaddr(invalidMultiaddrStringDNS)
  const invalidMultiaddrDNS2 = new Multiaddr(invalidMultiaddrStringDNS2)
  const invalidMultiaddrDNS3 = new Multiaddr(invalidMultiaddrStringDNS3)

  it('cleanUrlSIO webrtc-star modern', () => {
    const newUrlSIOStringDNS = cleanUrlSIO(modernMultiaddrDNS)
    const newUrlSIOStringDNS2 = cleanUrlSIO(modernMultiaddrDNS2)
    const newUrlSIOStringDNS3 = cleanUrlSIO(modernMultiaddrDNS3)
    const newUrlSIOStringDNS4 = cleanUrlSIO(modernMultiaddrDNS4)
    const newUrlSIOStringDNS5 = cleanUrlSIO(modernMultiaddrDNS5)

    expect(() => cleanUrlSIO(modernMultiaddrDNS)).to.not.throw()
    expect(() => cleanUrlSIO(invalidMultiaddrDNS)).to.throw(Error, 'invalid multiaddr')
    expect(() => cleanUrlSIO(invalidMultiaddrDNS2)).to.throw(Error, 'invalid multiaddr')
    expect(() => cleanUrlSIO(invalidMultiaddrDNS3)).to.throw(Error, 'invalid multiaddr')

    expect(newUrlSIOStringDNS).to.equal('https://star-signal.cloud.ipfs.team')
    expect(newUrlSIOStringDNS2).to.equal('https://star-signal.cloud.ipfs.team:9999')
    expect(newUrlSIOStringDNS3).to.equal('http://star-signal.cloud.ipfs.team')
    expect(newUrlSIOStringDNS4).to.equal('http://star-signal.cloud.ipfs.team:8080')
    expect(newUrlSIOStringDNS5).to.equal('http://libp2p-webrtc-star-signal.cloud.ipfs.team:8080')
  })

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
    const newMultiaddrStringDNS5 = cleanMultiaddr(modernMultiaddrStringDNS5) // fix issue #369
    const newMultiaddrStringIP = cleanMultiaddr(modernMultiaddrStringIP)

    expect(newMultiaddrStringDNS).to.equal(modernMultiaddrStringDNS)
    expect(newMultiaddrStringDNS5).to.equal(modernMultiaddrStringDNS5)
    expect(newMultiaddrStringIP).to.equal(modernMultiaddrStringIP)
  })
})
