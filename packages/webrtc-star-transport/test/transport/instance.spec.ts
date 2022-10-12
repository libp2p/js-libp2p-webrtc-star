/* eslint-env mocha */

import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { expect } from 'aegir/chai'
import { webRTCStar } from '../../src/index.js'

describe('instantiate the transport', () => {
  it('create', async () => {
    const wstar = webRTCStar()({ peerId: await createEd25519PeerId() })
    expect(wstar).to.exist()
  })
})
