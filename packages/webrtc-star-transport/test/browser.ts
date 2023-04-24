/* eslint-env mocha */

import { webRTCStar } from '../src/index.js'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import dialTests from './transport/dial.js'
import listenTests from './transport/listen.js'
import discoveryTests from './transport/discovery.js'
import filterTests from './transport/filter.js'
import { mockRegistrar, mockUpgrader } from '@libp2p/interface-mocks'
import type { PeerTransport } from './index.js'
import type { WebRTCStar, WebRTCStarDiscovery } from '../src/transport.js'
import { EventEmitter } from '@libp2p/interfaces/events'

describe('browser RTC', () => {
  const create = async (): Promise<PeerTransport> => {
    const peerId = await createEd25519PeerId()
    const wrtcStar = webRTCStar()
    const transport = wrtcStar.transport({ peerId }) as WebRTCStar
    const discovery = wrtcStar.discovery() as WebRTCStarDiscovery

    const registrar = mockRegistrar()
    const upgrader = mockUpgrader({
      registrar,
      events: new EventEmitter()
    })

    const peerTransport: PeerTransport = {
      peerId,
      transport,
      discovery,
      registrar,
      upgrader
    }

    return peerTransport
  }

  dialTests(create)
  listenTests(create)
  discoveryTests(create)
  filterTests(create)
})
