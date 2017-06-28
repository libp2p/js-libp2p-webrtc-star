/* eslint-env mocha */
'use strict'

const WStar = require('..')

const create = () => {
  return new WStar()
}

require('./transport/dial.js')(create)
require('./transport/listen.js')(create)
require('./transport/discovery.js')(create)
require('./transport/filter.js')(create)
require('./transport/valid-connection.js')(create)
