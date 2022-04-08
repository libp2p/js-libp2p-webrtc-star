/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { WebRTCStar } from '../../src/index.js'

describe('instantiate the transport', () => {
  it('create', () => {
    const wstar = new WebRTCStar()
    expect(wstar).to.exist()
  })

  it('create without new', () => {
    // @ts-expect-error WebRTCStar is a class and needs new
    expect(() => WebRTCStar()).to.throw()
  })
})
