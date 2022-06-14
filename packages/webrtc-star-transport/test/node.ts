/* eslint-env mocha */

// @ts-expect-error no types
import wrtc from 'wrtc'
// @ts-expect-error no types
import electronWebRTC from 'electron-webrtc'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { WebRTCStar } from '../src/index.js'
import dialTests from './transport/dial.js'
import listenTests from './transport/listen.js'
import discoveryTests from './transport/discovery.js'
import filterTests from './transport/filter.js'
import multipleSignalServersTests from './transport/multiple-signal-servers.js'
import trackTests from './transport/track.js'
import reconnectTests from './transport/reconnect.node.js'
import { Components } from '@libp2p/components'

// TODO: Temporary fix per wrtc issue
// https://github.com/node-webrtc/node-webrtc/issues/636#issuecomment-774171409
process.on('beforeExit', (code) => process.exit(code))

describe('transport: with wrtc', () => {
  const create = async () => {
    const peerId = await createEd25519PeerId()
    const ws = new WebRTCStar({
      wrtc
    })
    ws.init(new Components({ peerId }))

    return ws
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
  const create = async () => {
    const peerId = await createEd25519PeerId()
    const ws = new WebRTCStar({
      wrtc: electronWebRTC()
    })
    ws.init(new Components({ peerId }))

    return ws
  }

  dialTests(create)
  listenTests(create)
  multipleSignalServersTests(create)
  trackTests(create)
  discoveryTests(create)
  filterTests(create)
  reconnectTests(create)
})
