/* eslint-env mocha */
'use strict'

const WStar = require('..')
const Utils = require('./utils')

const create = async (id) => {
  return new WStar({ exchange: await Utils(id) })
}

require('./transport/dial.js')(create)
require('./transport/listen.js')(create)
require('./transport/filter.js')(create)
require('./transport/valid-connection.js')(create)
