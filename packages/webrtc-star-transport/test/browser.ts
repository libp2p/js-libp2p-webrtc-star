/* eslint-env mocha */

import { webRTCStar } from '../src/index.js'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import dialTests from './transport/dial.js'
import listenTests from './transport/listen.js'
import discoveryTests from './transport/discovery.js'
import filterTests from './transport/filter.js'
import { mockRegistrar, mockUpgrader } from '@libp2p/interface-mocks'

describe('browser RTC', () => {
  const create = async () => {
    const peerId = await createEd25519PeerId()
    const ws = webRTCStar()({ peerId })

    const registrar = mockRegistrar()
    const upgrader = mockUpgrader({ registrar })

    return {
      peerId,
      transport: ws,
      registrar,
      upgrader
    }
  }

  dialTests(create)
  listenTests(create)
  discoveryTests(create)
  filterTests(create)
})
