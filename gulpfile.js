'use strict'

const gulp = require('gulp')
const sigServer = require('./src/sig-server')

let sigS

gulp.task('test:node:before', boot)
gulp.task('test:node:after', stop)
gulp.task('test:browser:before', boot)
gulp.task('test:browser:after', stop)

function boot (done) {
  const options = {
    port: 15555,
    host: '127.0.0.1'
  }

  sigServer.start(options, (err, server) => {
    if (err) {
      throw err
    }
    sigS = server
    console.log('signalling on:', server.info.uri)
    done()
  })
}

function stop (done) {
  sigS.stop(done)
}

require('aegir/gulp')(gulp)
