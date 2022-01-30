# js-libp2p-webrtc-star-protocol <!-- omit in toc -->

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://protocol.ai) [![](https://img.shields.io/badge/project-libp2p-yellow.svg?style=flat-square)](http://libp2p.io/) [![](https://img.shields.io/badge/freenode-%23libp2p-yellow.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23libp2p) [![Discourse posts](https://img.shields.io/discourse/https/discuss.libp2p.io/posts.svg)](https://discuss.libp2p.io) [![](https://img.shields.io/codecov/c/github/libp2p/js-libp2p-webrtc-star.svg?style=flat-square)](https://codecov.io/gh/libp2p/js-libp2p-webrtc-star) [![Build Status](https://github.com/libp2p/js-libp2p-webrtc-star/actions/workflows/js-test-and-release.yml/badge.svg?branch=master)](https://github.com/libp2p/js-libp2p-webrtc-star/actions/workflows/js-test-and-release.yml) [![Dependency Status](https://david-dm.org/libp2p/js-libp2p-webrtc-star.svg?style=flat-square)](https://david-dm.org/libp2p/js-libp2p-webrtc-star) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)

> The protocol that allows WebRTC peers to find each other via a signalling server

## Table of Contents <!-- omit in toc -->

- [Description](#description)
- [Install](#install)
- [Protocol](#protocol)

## Description

This module contains type definitions for the websocket events that are exchanged between peers during the handshake process.

## Install

```bash
> npm install -g @libp2p/webrtc-star-protocol
```

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
