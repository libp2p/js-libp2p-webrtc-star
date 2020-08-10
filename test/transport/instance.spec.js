/* eslint-env mocha */
'use strict'

const { expect } = require('aegir/utils/chai')

const WebRTCStar = require('../../src')

const mockUpgrader = {
  upgradeInbound: maConn => maConn,
  upgradeOutbound: maConn => maConn
}

describe('instantiate the transport', () => {
  it('create', () => {
    const wstar = new WebRTCStar({ upgrader: mockUpgrader })
    expect(wstar).to.exist()
  })

  it('create without new', () => {
    expect(() => WebRTCStar()).to.throw()
  })
})
