/* eslint-env mocha */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const cleanMultiaddr = require('../src/utils').cleanMultiaddr

describe('utils', () => {
  const legacyMultiaddrStringDNS = '/libp2p-webrtc-star/dns4/star-signal.cloud.ipfs.team/wss/ipfs/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'
  const legacyMultiaddrStringIP = '/libp2p-webrtc-star/ip4/127.0.0.1/tcp/1212/wss/ipfs/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'

  const modernMultiaddrStringDNS = '/dns4/star-signal.cloud.ipfs.team/wss/p2p-webrtc-star/ipfs/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'
  const modernMultiaddrStringIP = '/ip4/127.0.0.1/tcp/1212/wss/p2p-webrtc-star/ipfs/QmWxLfixekyv6GAzvDEtXfXjj7gb1z3G8i5aQNHLhw1zA1'

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
