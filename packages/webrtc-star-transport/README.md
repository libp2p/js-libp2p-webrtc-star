# @libp2p/webrtc-star <!-- omit in toc -->

[![libp2p.io](https://img.shields.io/badge/project-libp2p-yellow.svg?style=flat-square)](http://libp2p.io/)
[![Discuss](https://img.shields.io/discourse/https/discuss.libp2p.io/posts.svg?style=flat-square)](https://discuss.libp2p.io)
[![codecov](https://img.shields.io/codecov/c/github/libp2p/js-libp2p-webrtc-star.svg?style=flat-square)](https://codecov.io/gh/libp2p/js-libp2p-webrtc-star)
[![CI](https://img.shields.io/github/actions/workflow/status/libp2p/js-libp2p-webrtc-star/js-test-and-release.yml?branch=master\&style=flat-square)](https://github.com/libp2p/js-libp2p-webrtc-star/actions/workflows/js-test-and-release.yml?query=branch%3Amaster)

> libp2p WebRTC transport that includes a discovery mechanism provided by the signalling-star

## Table of contents <!-- omit in toc -->

- [Install](#install)
  - [Browser `<script>` tag](#browser-script-tag)
- [Description](#description)
- [Usage](#usage)
  - [Using this module in Node.js (read: not in the browser)](#using-this-module-in-nodejs-read-not-in-the-browser)
  - [Using this module in the Browser](#using-this-module-in-the-browser)
- [Signalling server](#signalling-server)
- [API](#api)
  - [Transport](#transport)
  - [Connection](#connection)
  - [Peer Discovery - `ws.discovery`](#peer-discovery---wsdiscovery)
- [License](#license)
- [Contribution](#contribution)

## Install

```console
$ npm i @libp2p/webrtc-star
```

### Browser `<script>` tag

Loading this module through a script tag will make it's exports available as `Libp2pWebrtcStar` in the global namespace.

```html
<script src="https://unpkg.com/@libp2p/webrtc-star/dist/index.min.js"></script>
```

[![](https://raw.githubusercontent.com/libp2p/interface-transport/master/img/badge.png)](https://github.com/libp2p/js-libp2p-interfaces/blob/master/packages/libp2p-interfaces/src/transport/README.md)
[![](https://raw.githubusercontent.com/libp2p/interface-connection/master/img/badge.png)](https://github.com/libp2p/js-libp2p-interfaces/blob/master/packages/libp2p-interfaces/src/connection/README.md)
[![](https://raw.githubusercontent.com/libp2p/interface-peer-discovery/master/img/badge.png)](https://github.com/libp2p/js-libp2p-interfaces/blob/master/packages/libp2p-interfaces/src/peer-discovery/README.md)

## Description

`libp2p-webrtc-star` is one of the WebRTC transports available for libp2p.

## Usage

### Using this module in Node.js (read: not in the browser)

To use this module in Node.js, you have to BYOI of WebRTC, there are multiple options out there, unfortunately, none of them are 100% solid. The ones we recommend are: [wrtc](http://npmjs.org/wrtc) and [electron-webrtc](https://www.npmjs.com/package/electron-webrtc).

Instead of just creating the WebRTCStar instance without arguments, you need to pass an options object with the WebRTC implementation:

```JavaScript
import { createLibp2pNode } from 'libp2p'
import { webRTCStar } from '@libp2p/webrtc-star'
import wrtc from 'wrtc'
import electronWebRTC from 'electron-webrtc'

// Using wrtc in node
const star = webRTCStar({ wrtc })

// Using electron-webrtc in electron
const star = webRTCStar({ wrtc: electronWebRTC() })

const node = await createLibp2pNode({
  addresses: {
    listen: [
      '/ip4/188.166.203.82/tcp/20000/wss/p2p-webrtc-star'
    ]
  },
  transports: [
    star.transport
  ],
  peerDiscovery: [
    star.discovery
  ]
})
await node.start()

await node.dial('/ip4/188.166.203.82/tcp/20000/wss/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2a')
```

### Using this module in the Browser

```JavaScript
import { createLibp2pNode } from 'libp2p'
import { webRTCStar } from '@libp2p/webrtc-star'

const star = webRTCStar()

const node = await createLibp2pNode({
  addresses: {
    listen: [
      '/ip4/188.166.203.82/tcp/20000/wss/p2p-webrtc-star'
    ]
  },
  transports: [
    star.transport
  ],
  peerDiscovery: [
    star.discovery
  ]
})
await node.start()

await node.dial('/ip4/188.166.203.82/tcp/20000/wss/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2a')
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

## License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

## Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
