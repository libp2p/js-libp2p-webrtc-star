/* eslint-env mocha */

import { expect } from 'aegir/utils/chai.js'
import { WebRTCStar } from '../../src/index.js'
import { mockUpgrader } from '@libp2p/interface-compliance-tests/transport/utils'
import { PeerId } from '@libp2p/peer-id'

describe('instantiate the transport', () => {
  it('create', () => {
    const wstar = new WebRTCStar({
      peerId: PeerId.fromString('12D3KooWJKCJW8Y26pRFNv78TCMGLNTfyN8oKaFswMRYXTzSbSst'),
      upgrader: mockUpgrader()
    })
    expect(wstar).to.exist()
  })

  it('create without new', () => {
    // @ts-expect-error WebRTCStar is a class and needs new
    expect(() => WebRTCStar()).to.throw()
  })
})
