/* eslint-env mocha */

// @ts-expect-error no types
import wrtc from 'wrtc'
// @ts-expect-error no types
import electronWebRTC from 'electron-webrtc'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { webRTCStar } from '../src/index.js'
import dialTests from './transport/dial.js'
import listenTests from './transport/listen.js'
import discoveryTests from './transport/discovery.js'
import filterTests from './transport/filter.js'
import multipleSignalServersTests from './transport/multiple-signal-servers.js'
import trackTests from './transport/track.js'
import reconnectTests from './transport/reconnect.node.js'
import type { PeerTransport } from './index.js'
import { mockRegistrar, mockUpgrader } from '@libp2p/interface-mocks'
import type { WebRTCStar, WebRTCStarDiscovery } from '../src/transport.js'
import { EventEmitter } from '@libp2p/interfaces/events'

// TODO: Temporary fix per wrtc issue
// https://github.com/node-webrtc/node-webrtc/issues/636#issuecomment-774171409
process.on('beforeExit', (code) => process.exit(code))

describe('transport: with wrtc', () => {
  const create = async (): Promise<PeerTransport> => {
    const peerId = await createEd25519PeerId()
    const wrtcStar = webRTCStar({ wrtc })
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
  multipleSignalServersTests(create)
  trackTests(create)
  discoveryTests(create)
  filterTests(create)
  reconnectTests(create)
})

// TODO: Electron-webrtc is currently unreliable on linux
describe.skip('transport: with electron-webrtc', () => {
  const create = async (): Promise<PeerTransport> => {
    const peerId = await createEd25519PeerId()
    const wrtcStar = webRTCStar({ wrtc: electronWebRTC() })
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
  multipleSignalServersTests(create)
  trackTests(create)
  discoveryTests(create)
  filterTests(create)
  reconnectTests(create)
})
