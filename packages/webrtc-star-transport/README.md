# js-libp2p-webrtc-star <!-- omit in toc -->

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://protocol.ai) [![](https://img.shields.io/badge/project-libp2p-yellow.svg?style=flat-square)](http://libp2p.io/) [![](https://img.shields.io/badge/freenode-%23libp2p-yellow.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23libp2p) [![Discourse posts](https://img.shields.io/discourse/https/discuss.libp2p.io/posts.svg)](https://discuss.libp2p.io) [![](https://img.shields.io/codecov/c/github/libp2p/js-libp2p-webrtc-star.svg?style=flat-square)](https://codecov.io/gh/libp2p/js-libp2p-webrtc-star) [![Build Status](https://github.com/libp2p/js-libp2p-webrtc-star/actions/workflows/js-test-and-release.yml/badge.svg?branch=master)](https://github.com/libp2p/js-libp2p-webrtc-star/actions/workflows/js-test-and-release.yml) [![Dependency Status](https://david-dm.org/libp2p/js-libp2p-webrtc-star.svg?style=flat-square)](https://david-dm.org/libp2p/js-libp2p-webrtc-star) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)

[![](https://raw.githubusercontent.com/libp2p/interface-transport/master/img/badge.png)](https://github.com/libp2p/js-libp2p-interfaces/blob/master/packages/libp2p-interfaces/src/transport/README.md)
[![](https://raw.githubusercontent.com/libp2p/interface-connection/master/img/badge.png)](https://github.com/libp2p/js-libp2p-interfaces/blob/master/packages/libp2p-interfaces/src/connection/README.md)
[![](https://raw.githubusercontent.com/libp2p/interface-peer-discovery/master/img/badge.png)](https://github.com/libp2p/js-libp2p-interfaces/blob/master/packages/libp2p-interfaces/src/peer-discovery/README.md)

> libp2p WebRTC transport

## Table of Contents <!-- omit in toc -->

- [Description](#description)
- [Install](#install)
- [Usage](#usage)
  - [Using this module in Node.js (read: not in the browser)](#using-this-module-in-nodejs-read-not-in-the-browser)
  - [Using this module in the Browser](#using-this-module-in-the-browser)
- [Signalling server](#signalling-server)
- [API](#api)
  - [Transport](#transport)
  - [Connection](#connection)
  - [Peer Discovery - `ws.discovery`](#peer-discovery---wsdiscovery)

## Description

`libp2p-webrtc-star` is one of the WebRTC transports available for libp2p.

## Install

```bash
> npm install libp2p-webrtc-star
```

## Usage

### Using this module in Node.js (read: not in the browser)

To use this module in Node.js, you have to BYOI of WebRTC, there are multiple options out there, unfortunately, none of them are 100% solid. The ones we recommend are: [wrtc](http://npmjs.org/wrtc) and [electron-webrtc](https://www.npmjs.com/package/electron-webrtc).

Instead of just creating the WebRTCStar instance without arguments, you need to pass an options object with the WebRTC implementation:

```JavaScript
import wrtc from 'wrtc'
import electronWebRTC from 'electron-webrtc'
import { WebRTCStar } from '@libp2p/webrtc-star'

// Using wrtc
const ws1 = new WebRTCStar({ wrtc: wrtc })

// Using electron-webrtc
const ws2 = new WebRTCStar({ wrtc: electronWebRTC() })
```

### Using this module in the Browser

```JavaScript
import { WebRTCStar } from '@libp2p/webrtc-star'
import { Multiaddr } from '@multiformats/multiaddr'
import all from 'it-all'

const addr = multiaddr('/ip4/188.166.203.82/tcp/20000/wss/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2a')

const ws = new WebRTCStar({ upgrader })

const listener = ws.createListener((socket) => {
  console.log('new connection opened')
  pipe(
    ['hello'],
    socket
  )
})

await listener.listen(addr)
console.log('listening')

const socket = await ws.dial(addr)
const values = await all(socket)

console.log(`Value: ${values.toString()}`)

// Close connection after reading
await listener.close()
```

## Signalling server

This module has an accompanying signalling server which is used to discover other peers running the libp2p-webrtc-star transport.

Please see the [libp2p-webrtc-star-signalling-server](https://npmjs.com/package/libp2p-webrtc-star-signalling-server) module for more information.

## API

### Transport

[![](https://raw.githubusercontent.com/libp2p/interface-transport/master/img/badge.png)](https://github.com/libp2p/js-libp2p-interfaces/blob/master/packages/libp2p-interfaces/src/transport/README.md)

### Connection

[![](https://raw.githubusercontent.com/libp2p/interface-connection/master/img/badge.png)](https://github.com/libp2p/js-libp2p-interfaces/blob/master/packages/libp2p-interfaces/src/connection/README.md)

### Peer Discovery - `ws.discovery`

[![](https://raw.githubusercontent.com/libp2p/interface-peer-discovery/master/img/badge.png)](https://github.com/libp2p/js-libp2p-interfaces/blob/master/packages/libp2p-interfaces/src/peer-discovery/README.md)
