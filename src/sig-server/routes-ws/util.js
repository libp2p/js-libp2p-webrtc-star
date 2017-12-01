'use strict'

const multiaddr = require('multiaddr')
const Id = require('peer-id')
const crypto = require('libp2p-crypto')
const mafmt = require('mafmt')

function getIdAndValidate (pub, id, cb) {
  Id.createFromPubKey(Buffer.from(pub, 'hex'), (err, _id) => {
    if (err) {
      return cb(new Error('Crypto error'))
    }

    if (_id.toB58String() !== id) {
      return cb(new Error('Id is not matching'))
    }

    return cb(null, crypto.keys.unmarshalPublicKey(Buffer.from(pub, 'hex')))
  })
}

exports = module.exports
exports.getIdAndValidate = getIdAndValidate
exports.validateMa = (ma) => mafmt.WebRTCStar.matches(multiaddr(ma))
