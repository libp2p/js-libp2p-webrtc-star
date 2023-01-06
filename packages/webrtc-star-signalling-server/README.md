# @libp2p/webrtc-star-signalling-server <!-- omit in toc -->

[![libp2p.io](https://img.shields.io/badge/project-libp2p-yellow.svg?style=flat-square)](http://libp2p.io/)
[![Discuss](https://img.shields.io/discourse/https/discuss.libp2p.io/posts.svg?style=flat-square)](https://discuss.libp2p.io)
[![codecov](https://img.shields.io/codecov/c/github/libp2p/js-libp2p-webrtc-star.svg?style=flat-square)](https://codecov.io/gh/libp2p/js-libp2p-webrtc-star)
[![CI](https://img.shields.io/github/actions/workflow/status/libp2p/js-libp2p-webrtc-star/js-test-and-release.yml?branch=master\&style=flat-square)](https://github.com/libp2p/js-libp2p-webrtc-star/actions/workflows/js-test-and-release.yml?query=branch%3Amaster)

> signalling server to use with the libp2p WebRTC transport

## Table of contents <!-- omit in toc -->

- [Install](#install)
- [Description](#description)
- [Usage](#usage)
- [Hosted Rendezvous Server](#hosted-rendezvous-server)
- [License](#license)
- [Contribution](#contribution)

## Install

```console
$ npm i @libp2p/webrtc-star-signalling-server
```

## Description

Nodes using the `libp2p-webrtc-star` transport will connect to a known point in the network, a rendezvous point where they can learn about other nodes (Discovery) and exchange their [SDP offers (signalling data)](https://www.html5rocks.com/en/tutorials/webrtc/infrastructure/).

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
import { sigServer } from '@libp2p/webrtc-star-signalling-server'

const server = await sigServer({
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

## License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

## Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
