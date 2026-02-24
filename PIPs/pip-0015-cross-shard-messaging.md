---
pip: 15
title: "Cross-Shard Messaging Protocol"
description: "Asynchronous message passing between network shards with guaranteed delivery"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Core
created: 2026-01-23
tags: [sharding, messaging, cross-shard, scalability]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a cross-shard messaging protocol for the Pars Network. As the network scales horizontally through sharding, contracts and accounts on different shards must communicate reliably. The protocol provides asynchronous message passing with guaranteed delivery, ordering within a sender-receiver pair, and cryptographic proof of message inclusion. Messages are routed through a beacon shard that maintains a global receipt trie, enabling any shard to verify cross-shard message authenticity without trusting the source shard's validators directly.

## Motivation

Pars Network's dual-layer architecture (EVM L2 + Session daemon) will eventually require horizontal scaling to serve the global Persian diaspora. Sharding partitions state across multiple parallel chains, each processing transactions independently. However, useful applications frequently span shard boundaries: a user on shard A sending ASHA to a recipient on shard B, or a DeFi contract on shard A interacting with a token contract on shard B. Without a robust cross-shard messaging protocol, sharding fragments the network into isolated silos.

The protocol must handle the adversarial conditions of the Pars threat model, where state-level actors may control validators on specific shards. Message integrity must be provable even if the source shard is partially compromised.

## Specification

### Message Format

```solidity
struct CrossShardMessage {
    uint32 sourceShard;
    uint32 destShard;
    address sender;
    address recipient;
    uint256 nonce;        // Per sender-recipient pair, monotonic
    uint256 value;        // ASHA transfer amount (may be zero)
    bytes payload;        // Calldata for the recipient contract
    bytes32 receiptRoot;  // Source shard receipt trie root at inclusion
}
```

### Routing via Beacon Shard

1. A transaction on the source shard emits a `CrossShardMessageSent` event.
2. The source shard's block header includes the message in its outbound receipt trie.
3. The beacon shard aggregates receipt trie roots from all shards into a global receipt root.
4. Relayers submit Merkle proofs against the beacon's global receipt root to the destination shard.
5. The destination shard verifies the proof and executes the message as a system transaction.

### Delivery Guarantees

- **At-least-once delivery**: Relayers may submit the same proof multiple times. The destination shard tracks processed nonces per sender-recipient pair and ignores duplicates.
- **Ordering**: Messages from a given sender to a given recipient are processed in nonce order. Out-of-order messages are queued until predecessors arrive.
- **Timeout**: Messages not delivered within 256 beacon epochs are considered expired. The source shard refunds any attached ASHA value.

### Proof Verification

The destination shard verifies cross-shard messages by checking a Merkle proof path: message leaf -> source shard receipt root -> beacon global receipt root. The beacon root is available to all shards via the beacon block header sync protocol.

### Gas Accounting

Cross-shard messages consume gas on both the source shard (for emission) and the destination shard (for execution). The sender pays source-shard gas at submission time. Destination-shard gas is prepaid by attaching a gas stipend to the message. Unused gas is not refunded to prevent spam.

## Rationale

Asynchronous messaging is chosen over synchronous cross-shard calls because synchronous calls require locking state across shards, introducing deadlock risk and reducing throughput. The beacon shard aggregation pattern provides a single trust root for all cross-shard communication, simplifying verification. The nonce-based ordering ensures causal consistency for contract interactions that depend on message sequence.

## Security Considerations

- **Beacon shard compromise**: If the beacon shard is compromised, forged receipt roots could enable invalid cross-shard messages. Mitigation: beacon shard uses a supermajority validator set and receipt roots are additionally signed by a rotating committee.
- **Relayer censorship**: Relayers are permissionless; anyone may submit proofs. If all relayers are censored, users can self-relay by submitting proofs directly.
- **Replay protection**: Nonce tracking on the destination shard prevents message replay. Expired messages are cleaned from the nonce map after 256 epochs.
- **State bloat**: The outbound receipt trie grows with message volume. Pruning is performed after beacon confirmation, per PIP-0027.

## References

- [PIP-0000: Network Architecture](./pip-0000-network-architecture.md)
- [PIP-0027: Chain State Pruning](./pip-0027-chain-state-pruning.md)
- [Ethereum Sharding Research](https://ethereum.org/en/roadmap/danksharding/)
- [Cross-Shard Communication in Polkadot](https://wiki.polkadot.network/docs/learn-xcm)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
