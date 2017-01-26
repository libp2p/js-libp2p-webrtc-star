'use strict'

const gulp = require('gulp')
const parallel = require('async/parallel')
const sigServer = require('./src/sig-server')

let sigS, sigS2

gulp.task('test:node:before', boot)
gulp.task('test:node:after', stop)
gulp.task('test:browser:before', boot)
gulp.task('test:browser:after', stop)

function boot (done) {
  const options = {
    port: 15555,
    host: '127.0.0.1'
  }
  const options2 = {
    port: 15556,
    host: '127.0.0.1'
  }

  parallel([
    first,
    second
  ], done)
  function first (cb) {
    sigServer.start(options, (err, server) => {
      if (err) {
        throw err
      }
      sigS = server
      console.log('signalling on:', server.info.uri)
      cb()
    })
  }
  function second (cb) {
    sigServer.start(options2, (err, server) => {
      if (err) {
        throw err
      }
      sigS2 = server
      console.log('signalling 2 on:', server.info.uri)
      cb()
    })
  }
}
function stop (done) {
  parallel([
    first,
    second
  ], done)
  function first (cb) {
    sigS.stop(() => cb())
  }
  function second (cb) {
    sigS2.stop(() => cb())
  }
}

require('aegir/gulp')(gulp)
