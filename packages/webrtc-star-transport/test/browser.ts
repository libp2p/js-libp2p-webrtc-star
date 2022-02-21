/* eslint-env mocha */

import { WebRTCStar } from '../src/index.js'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { mockRegistrar, mockUpgrader } from '@libp2p/interface-compliance-tests/mocks'
import dialTests from './transport/dial.js'
import listenTests from './transport/listen.js'
import discoveryTests from './transport/discovery.js'
import filterTests from './transport/filter.js'
import { pipe } from 'it-pipe'

describe('browser RTC', () => {
  const create = async () => {
    const protocol = '/echo/1.0.0'
    const registrar = mockRegistrar()
    void registrar.handle(protocol, (evt) => {
      void pipe(
        evt.detail.stream,
        evt.detail.stream
      )
    })
    const upgrader = mockUpgrader({
      registrar
    })

    return new WebRTCStar({
      peerId: await createEd25519PeerId(),
      upgrader
    })
  }

  dialTests(create)
  listenTests(create)
  discoveryTests(create)
  filterTests(create)
})
