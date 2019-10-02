/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

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
