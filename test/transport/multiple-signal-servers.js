/* eslint-env mocha */

'use strict'

// const { expect } = require('aegir/utils/chai')
const { Multiaddr } = require('multiaddr')

const ma1 = new Multiaddr('/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star')
const ma2 = new Multiaddr('/ip4/127.0.0.1/tcp/15556/ws/p2p-webrtc-star')

module.exports = (create) => {
  describe('multiple signal servers', () => {
    let ws

    beforeEach(async () => {
      ws = await create()
    })

    it('can listen on multiple signal servers', async () => {
      const listener = ws.createListener(() => { })

      await listener.listen(ma1)
      await listener.listen(ma2)

      listener.close()
    })

    it('can dial with multiple signal servers', async () => {

    })
  })
}
