/* eslint-env mocha */

import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { expect } from 'aegir/chai'
import { webRTCStar } from '../../src/index.js'

describe('instantiate the transport', () => {
  it('create transport', async () => {
    const wstar = webRTCStar().transport({ peerId: await createEd25519PeerId() })
    expect(wstar).to.exist()
  })

  it('create discovery', async () => {
    const wstar = webRTCStar().discovery({ peerId: await createEd25519PeerId() })
    expect(wstar).to.exist()
  })
})
