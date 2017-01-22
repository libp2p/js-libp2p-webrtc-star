#!/usr/bin/env node

'use strict'

/*
 * Because dokku doesn't want to forget the first Procfile, even after 4
 * destroys!
 */
require('../sig-server/bin.js')
