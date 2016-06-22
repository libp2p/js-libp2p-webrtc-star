/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const WebRTCStar = require('./../../src')

describe('instantiate the transport', () => {
  it('create', (done) => {
    const wstar = new WebRTCStar()
    expect(wstar).to.exist
    done()
  })

  it('create without new', (done) => {
    const wstar = WebRTCStar()
    expect(wstar).to.exist
    done()
  })
})
