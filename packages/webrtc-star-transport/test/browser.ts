/* eslint-env mocha */

import { WebRTCStar } from '../src/index.js'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import dialTests from './transport/dial.js'
import listenTests from './transport/listen.js'
import discoveryTests from './transport/discovery.js'
import filterTests from './transport/filter.js'
import { Components } from '@libp2p/interfaces/components'

describe('browser RTC', () => {
  const create = async () => {
    const ws = new WebRTCStar()
    ws.init(new Components({ peerId: await createEd25519PeerId() }))

    return ws
  }

  dialTests(create)
  listenTests(create)
  discoveryTests(create)
  filterTests(create)
})
