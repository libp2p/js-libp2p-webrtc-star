/* eslint-env mocha */

import { WebRTCStar } from '../src/index.js'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { mockUpgrader } from '@libp2p/interface-compliance-tests/transport/utils'
import dialTests from './transport/dial.js'
import listenTests from './transport/listen.js'
import discoveryTests from './transport/discovery.js'
import filterTests from './transport/filter.js'

describe('browser RTC', () => {
  const create = async () => {
    return new WebRTCStar({
      peerId: await createEd25519PeerId(),
      upgrader: mockUpgrader()
    })
  }

  dialTests(create)
  listenTests(create)
  discoveryTests(create)
  filterTests(create)
})
