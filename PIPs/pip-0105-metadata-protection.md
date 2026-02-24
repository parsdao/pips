---
pip: 105
title: "Metadata Protection"
description: "Network-level metadata protection against traffic analysis and surveillance"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Privacy
created: 2026-01-23
tags: [metadata, traffic-analysis, privacy, networking, censorship-resistance]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines network-level metadata protection mechanisms for the Pars Network. While PIPs 0019, 0101, and 0102 protect transaction content (amounts, sender, recipient), they do not protect network metadata: who is communicating, when, how much data is exchanged, and from which IP address. Metadata analysis is a primary tool of authoritarian surveillance. This PIP specifies constant-rate traffic padding, mix-network routing for transaction submission, timing obfuscation, and decoy traffic generation to make the Pars Network resistant to traffic analysis by network-level observers.

## Motivation

The intelligence community's maxim "we kill people based on metadata" reflects the reality that metadata is often more valuable than content for surveillance. For the Pars Network, even perfect transaction privacy is undermined if a network observer can determine that a specific IP address submitted a transaction at a specific time. An authoritarian government monitoring ISP traffic can correlate transaction timing with IP addresses to identify network participants, even if the transactions themselves are fully encrypted and anonymized. Metadata protection closes this critical gap.

## Specification

### Constant-Rate Traffic Padding

Pars nodes maintain constant-rate communication with their peers regardless of actual transaction volume:

- **Padding rate**: Each peer connection sends 1 KB/s of traffic at all times.
- **Real traffic**: Actual transactions and messages are embedded within the padding stream.
- **Indistinguishability**: Padding packets are encrypted and indistinguishable from real traffic to any observer without the session key.

When actual traffic exceeds the padding rate, the rate increases and does not decrease until a randomized cool-down period (1-5 minutes), preventing burst analysis.

### Mix-Network Transaction Submission

Instead of broadcasting transactions directly, users route them through a mix network:

1. The user selects a path of 3 mix nodes from the Pars node set.
2. The transaction is encrypted in layers (onion encryption): `Enc(node3, Enc(node2, Enc(node1, tx)))`.
3. Each mix node decrypts one layer and forwards to the next node.
4. The final node broadcasts the transaction to the mempool.

Mix nodes batch and reorder messages, breaking timing correlation between input and output.

### Timing Obfuscation

Transactions are not broadcast immediately upon creation. Instead:

1. The wallet generates a random delay from an exponential distribution (mean: 5 seconds, max: 30 seconds).
2. The transaction is held locally for the delay period.
3. After the delay, the transaction enters the mix network.

This prevents an observer from correlating user actions (e.g., pressing "send" in a wallet) with network traffic.

### Decoy Traffic

Nodes periodically generate decoy transactions that are indistinguishable from real transactions at the network level:

- Decoy transactions are fully formed but marked with a hidden flag that causes validators to silently discard them during block production.
- The flag is encrypted under the validators' shared key, so network observers cannot distinguish decoys from real transactions.
- Decoy rate: each node generates 1-3 decoy transactions per block period.

### Connection Obfuscation

Pars node connections use pluggable transports to disguise the protocol:

- **Default**: QUIC over TLS 1.3 (appears as standard HTTPS traffic).
- **Obfs4**: Mimics random data, resistant to DPI (deep packet inspection).
- **Meek**: Tunnels traffic through CDN frontends (e.g., Cloudflare), appearing as regular web browsing.
- **Mesh**: Bluetooth/WiFi Direct (PIP-0001) when Internet is unavailable.

## Rationale

Constant-rate padding is the strongest defense against traffic volume analysis but consumes bandwidth. The 1 KB/s rate is a pragmatic compromise: low enough for mobile connections in bandwidth-constrained environments, high enough to mask typical transaction submission patterns. Mix-network routing provides sender anonymity at the network level, complementing on-chain sender privacy (PIP-0102). The three-hop mix path provides security against an adversary who controls up to two of the three mix nodes. Pluggable transports ensure the Pars Network is accessible even in countries that deploy DPI to block blockchain protocols.

## Security Considerations

- **Global adversary**: A nation-state observing all network traffic may correlate padding patterns across nodes. Mitigation: padding rates include per-connection randomization.
- **Mix node compromise**: An adversary controlling all 3 mix nodes on a path can deanonymize the sender. Mitigation: mix node selection uses reputation scoring and geographic diversity.
- **Bandwidth cost**: Constant-rate padding increases bandwidth usage by approximately 86 MB/day per peer connection. This is acceptable for broadband but may strain metered mobile connections. Mobile nodes can opt for reduced padding (0.25 KB/s) with reduced privacy guarantees.
- **Decoy detection**: If validators are compromised, they could reveal the decoy flag to network observers. Mitigation: the decoy flag is encrypted under a threshold key requiring multiple validators to decrypt.
- **Latency**: Mix-network routing and timing obfuscation add 5-35 seconds of latency to transaction submission. This is acceptable for financial transactions but may be too slow for interactive applications.

## References

- [PIP-0001: Mesh Network](./pip-0001-mesh-network.md)
- [PIP-0019: Transaction Privacy Layer](./pip-0019-transaction-privacy-layer.md)
- [PIP-0102: Ring Signatures](./pip-0102-ring-signatures.md)
- [Loopix: An Anonymous Communication System](https://arxiv.org/abs/1703.00536)
- [Tor: The Design and Implementation of Tor](https://svn-archive.torproject.org/svn/projects/design-paper/tor-design.pdf)
- [Obfs4 Specification](https://gitlab.torproject.org/tpo/anti-censorship/pluggable-transports/obfs4)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
