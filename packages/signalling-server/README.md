# js-libp2p-webrtc-star-signalling-server <!-- omit in toc -->

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://protocol.ai) [![](https://img.shields.io/badge/project-libp2p-yellow.svg?style=flat-square)](http://libp2p.io/) [![](https://img.shields.io/badge/freenode-%23libp2p-yellow.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23libp2p) [![Discourse posts](https://img.shields.io/discourse/https/discuss.libp2p.io/posts.svg)](https://discuss.libp2p.io) [![](https://img.shields.io/codecov/c/github/libp2p/js-libp2p-webrtc-star.svg?style=flat-square)](https://codecov.io/gh/libp2p/js-libp2p-webrtc-star) [![](https://img.shields.io/travis/libp2p/js-libp2p-webrtc-star.svg?style=flat-square)](https://travis-ci.com/libp2p/js-libp2p-webrtc-star) [![Dependency Status](https://david-dm.org/libp2p/js-libp2p-webrtc-star.svg?style=flat-square)](https://david-dm.org/libp2p/js-libp2p-webrtc-star) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)

[![](https://github.com/libp2p/js-libp2p-interfaces/raw/master/src/transport/img/badge.png)](https://github.com/libp2p/js-libp2p-interfaces/tree/master/src/transport) [![](https://github.com/libp2p/js-libp2p-interfaces/raw/master/src/connection/img/badge.png)](https://github.com/libp2p/js-libp2p-interfaces/tree/master/src/connection) [![](https://github.com/libp2p/js-libp2p-interfaces/raw/master/src/peer-discovery/img/badge.png)](https://github.com/libp2p/js-libp2p-interfaces/tree/master/src/peer-discovery)

> A webrtc-star signalling server that allows peer discovery between browsers

## Table of Contents <!-- omit in toc -->

- [Description](#description)
- [Install](#install)
- [Usage](#usage)
- [Hosted Rendezvous Server](#hosted-rendezvous-server)

## Description

Nodes using the `libp2p-webrtc-star` transport will connect to a known point in the network, a rendezvous point where they can learn about other nodes (Discovery) and exchange their [SDP offers (signalling data)](https://www.html5rocks.com/en/tutorials/webrtc/infrastructure/).

## Install

```bash
> npm install -g libp2p-webrtc-star-signalling-server
```

## Usage

To start a server run:

```console
$ webrtc-star --port=13579 --host=127.0.0.1
```

Defaults:

- `port` - 9090
- `host` - '0.0.0.0'

Or in JavaScript:

```js
import { start } from 'libp2p-webrtc-star-signalling-server'

const server = await start({
  port: 24642,
  host: '0.0.0.0',
  metrics: false
})

// some time later
await server.stop()
```

## Hosted Rendezvous Server

We host signaling servers at `wrtc-star1.par.dwebops.pub` and `wrtc-star2.sjc.dwebops.pub`, that can be used for practical demos and experimentation, it **should not be used for apps in production**. Check [Deployment.md](./DEPLOYMENT.md) for how to deploy your own server.

A libp2p-webrtc-star address, using the signalling server we provide, looks like:

`/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star/p2p/<your-peer-id>`

Note: The address above indicates WebSockets Secure, which can be accessed from both http and https.
