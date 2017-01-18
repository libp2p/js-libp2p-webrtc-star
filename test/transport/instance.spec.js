/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const WebRTCStar = require('../../src')

describe('instantiate the transport', () => {
  it('create', () => {
    const wstar = new WebRTCStar()
    expect(wstar).to.exist
  })

  it('create without new', () => {
    expect(() => {
      WebRTCStar()
    }).to.throw()
  })
})
