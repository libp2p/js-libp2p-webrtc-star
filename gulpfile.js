'use strict'

const gulp = require('gulp')
const sigServer = require('./src/signalling-server')

let sigS

gulp.task('test:node:before', boot)
gulp.task('test:node:after', stop)
gulp.task('test:browser:before', boot)
gulp.task('test:browser:after', stop)

function boot (done) {
  sigS = sigServer.start(15555, (err, info) => {
    if (err) {
      throw err
    }
    console.log('sig-server started on:', info.uri)
    done()
  })
}

function stop (done) {
  sigS.stop(done)
}

require('aegir/gulp')(gulp)
