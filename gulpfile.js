'use strict'

const gulp = require('gulp')
const sigServer = require('./src/signalling-server')

let sigS

gulp.task('test:browser:before', (done) => {
  sigS = sigServer.start(15555, (err, info) => {
    if (err) {
      throw err
    }
    console.log('sig-server started on:', info.uri)
    done()
  })
})

gulp.task('test:browser:after', (done) => {
  sigS.stop(done)
})

require('aegir/gulp')(gulp)
