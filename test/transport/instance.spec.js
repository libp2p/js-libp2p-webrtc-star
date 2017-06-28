/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const WebRTCStar = require('../../src')

describe('instantiate the transport', () => {
  it('create', () => {
    const wstar = new WebRTCStar()
    expect(wstar).to.exist()
  })

  it('create without new', () => {
    expect(() => WebRTCStar()).to.throw()
  })
})
