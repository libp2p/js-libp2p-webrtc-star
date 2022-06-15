# @libp2p/webrtc-star-protocol <!-- omit in toc -->

[![libp2p.io](https://img.shields.io/badge/project-libp2p-yellow.svg?style=flat-square)](http://libp2p.io/)
[![IRC](https://img.shields.io/badge/freenode-%23libp2p-yellow.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23libp2p)
[![Discuss](https://img.shields.io/discourse/https/discuss.libp2p.io/posts.svg?style=flat-square)](https://discuss.libp2p.io)
[![codecov](https://img.shields.io/codecov/c/github/libp2p/js-libp2p-webrtc-star.svg?style=flat-square)](https://codecov.io/gh/libp2p/js-libp2p-webrtc-star)
[![CI](https://img.shields.io/github/workflow/status/libp2p/js-libp2p-interfaces/test%20&%20maybe%20release/master?style=flat-square)](https://github.com/libp2p/js-libp2p-webrtc-star/actions/workflows/js-test-and-release.yml)

> shared types used by the libp2p webrtc transport and signalling server

## Table of contents <!-- omit in toc -->

- [Install](#install)
- [Description](#description)
- [Protocol](#protocol)
- [License](#license)
- [Contribution](#contribution)

## Install

```console
$ npm i @libp2p/webrtc-star-protocol
```

## Description

This module contains type definitions for the websocket events that are exchanged between peers during the handshake process.

## Protocol

1. Peers connect to the same signal server and send an `ss-join` event with their multiaddr as a string
2. Peers send one or more `ss-handshake` events with candidate signals
3. Peers receive one or more `ws-handshake` events with candidate signals
4. Peers send one `ss-handshake` event with an offer signal
5. Peers receive one `ws-handshake` events with an offer signal
6. Peers are now connected
7. Peers receive one or more `ws-peer` events with a multiaddr as a string for peer discovery
8. Peers send an `ss-leave` event or disconnect when hanging up

See [./src/index.ts](src/index.ts) for definitions of `ss-handshake` and `ws-handshake` payloads.

## License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

## Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
