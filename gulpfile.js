'use strict'

const gulp = require('gulp')
const forEach = require('async/each')
const sigServer = require('./src/sig-server')

let sigServers = []

gulp.task('test:node:before', boot)
gulp.task('test:node:after', stop)
gulp.task('test:browser:before', boot)
gulp.task('test:browser:after', stop)

function boot (done) {
  const options = [
    {
      port: 15555,
      host: '127.0.0.1'
    },
    {
      port: 15556,
      host: '127.0.0.1'
    }]

  forEach(options, (options, cb) => {
    sigServer.start(options, (err, server) => {
      if (err) {
        throw err
      }
      sigServers.push(server)
      console.log('signalling on:', server.info.uri)
      cb()
    })
  }, done)
}

function stop (done) {
  forEach(sigServers, (sigS, cb) => {
    sigS.stop()
    cb()
  }, done)
}

require('aegir/gulp')(gulp)
