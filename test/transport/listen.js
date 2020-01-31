/* eslint-env mocha */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const multiaddr = require('multiaddr')

module.exports = (create) => {
  describe('listen', () => {
    let ws

    const ma = multiaddr('/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star')

    before(() => {
      ws = create()
    })

    it('listen, check for promise', async () => {
      const listener = ws.createListener(() => {})

      await listener.listen(ma)
      listener.close()
    })

    it('listen, check for listening event', async () => {
      const listener = ws.createListener(() => {})

      const p = new Promise((resolve) => {
        listener.once('listening', () => {
          listener.close()
          resolve()
        })
      })

      await listener.listen(ma)
      await p
    })

    it('listen, check for the close event', async () => {
      const listener = ws.createListener(() => {})

      await listener.listen(ma)
      const p = new Promise((resolve) => {
        listener.once('close', () => resolve())
      })

      listener.close()
      await p
    })

    it.skip('listen on IPv6 addr', () => {
      // TODO IPv6 not supported yet
    })

    it('getAddrs', async () => {
      const listener = ws.createListener(() => {})
      const ma = multiaddr('/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star')

      await listener.listen(ma)

      const addrs = listener.getAddrs()
      expect(addrs[0]).to.deep.equal(ma)

      listener.close()
    })

    it('getAddrs with peer id', async () => {
      const listener = ws.createListener(() => {})
      const ma = multiaddr('/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooooA')

      await listener.listen(ma)

      const addrs = listener.getAddrs()
      expect(addrs[0]).to.deep.equal(ma)

      listener.close()
    })
  })
}
