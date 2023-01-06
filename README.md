# ⚠️⚠️⚠️⚠️⚠️⚠️ <!-- omit in toc -->

**Status:**

[Archived](https://github.com/libp2p/github-mgmt/pull/80) and not maintained

**Alternatives:**

WebRTC Browser-to-Server is being implemented in js-libp2p and tracked here <https://github.com/libp2p/js-libp2p/issues/1478> per the specification: <https://github.com/libp2p/specs/pull/412>

WebRTC Browser-to-Browser is being tracked here: <https://github.com/libp2p/js-libp2p/issues/1462>

**Questions:**

Please direct any questions about the specification to: <https://github.com/libp2p/specs/issues>

Please direct any questions about the js-libp2p WebRTC implementations to:
<https://github.com/libp2p/js-libp2p/issues/1478> or
<https://github.com/libp2p/js-libp2p/issues/1462>

# ⚠️⚠️⚠️⚠️⚠️⚠️ <!-- omit in toc -->

# libp2p-webrtc-star <!-- omit in toc -->

[![libp2p.io](https://img.shields.io/badge/project-libp2p-yellow.svg?style=flat-square)](http://libp2p.io/)
[![Discuss](https://img.shields.io/discourse/https/discuss.libp2p.io/posts.svg?style=flat-square)](https://discuss.libp2p.io)
[![codecov](https://img.shields.io/codecov/c/github/libp2p/js-libp2p-webrtc-star.svg?style=flat-square)](https://codecov.io/gh/libp2p/js-libp2p-webrtc-star)
[![CI](https://img.shields.io/github/actions/workflow/status/libp2p/js-libp2p-webrtc-star/js-test-and-release.yml?branch=master\&style=flat-square)](https://github.com/libp2p/js-libp2p-webrtc-star/actions/workflows/js-test-and-release.yml?query=branch%3Amaster)

> The webrtc-star libp2p transport and signalling server

## Table of contents <!-- omit in toc -->

- [Structure](#structure)
- [Contribute](#contribute)
- [License](#license)
- [Contribution](#contribution)

## Structure

- [`/packages/webrtc-star-protocol`](./packages/webrtc-star-protocol) shared types used by the libp2p webrtc transport and signalling server
- [`/packages/webrtc-star-signalling-server`](./packages/webrtc-star-signalling-server) signalling server to use with the libp2p WebRTC transport
- [`/packages/webrtc-star-transport`](./packages/webrtc-star-transport) libp2p WebRTC transport that includes a discovery mechanism provided by the signalling-star

## Contribute

Feel free to join in. All welcome. Open an [issue](https://github.com/libp2p/js-interfaces/issues)!

This repository falls under the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/contributing.md)

## License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

## Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
