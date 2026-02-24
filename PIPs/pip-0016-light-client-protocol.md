---
pip: 16
title: "Light Client Protocol"
description: "Lightweight verification protocol for resource-constrained and mobile devices"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Core
created: 2026-01-23
tags: [light-client, mobile, verification, spv]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a light client protocol for the Pars Network that enables resource-constrained devices (mobile phones, IoT devices, embedded nodes) to verify chain state without downloading or storing the full blockchain. Light clients sync block headers, verify Merkle proofs against state roots, and validate consensus signatures. The protocol supports both the EVM L2 layer and the Session daemon layer, allowing mobile users to verify transactions, account balances, and Session messages with minimal bandwidth and storage.

## Motivation

The Pars Network targets the Persian diaspora, many of whom access the network primarily through mobile devices in bandwidth-constrained or censored environments. Running a full node on a mobile phone is impractical: the full chain state may exceed tens of gigabytes, and syncing requires sustained high-bandwidth connections. A light client protocol enables meaningful participation (transaction verification, balance checking, governance voting) on devices with as little as 50 MB of storage and intermittent connectivity.

Light clients are also critical for the mesh networking use case (PIP-0001), where nodes relay data over Bluetooth or local WiFi. Mesh relay nodes need to verify message authenticity without storing the full chain.

## Specification

### Header Sync

Light clients maintain a chain of block headers rather than full blocks. Each header contains:

- `parentHash`: Hash of the previous block header.
- `stateRoot`: Merkle-Patricia trie root of the world state.
- `transactionsRoot`: Root of the transactions trie.
- `receiptsRoot`: Root of the receipts trie.
- `validatorSetHash`: Hash of the current validator set.
- `signature`: Aggregate BLS signature from the validator committee.

Light clients verify the `signature` against the `validatorSetHash` to confirm block authenticity. Validator set changes are tracked by following `validatorSetHash` transitions.

### State Proof Verification

To verify a specific piece of state (account balance, storage slot, contract data), a light client:

1. Requests the latest verified header from a full node or peer.
2. Requests a Merkle proof for the target state key against the header's `stateRoot`.
3. Verifies the Merkle proof locally, confirming the state value is included in the committed state root.

### Checkpoint Sync

For initial sync, light clients download a recent checkpoint (header + validator set) signed by a supermajority of validators. This avoids replaying the entire header chain from genesis. Checkpoints are published every 1024 blocks and signed by at least 2/3 of the active validator set.

### Session Layer Verification

Light clients verify Session daemon messages (PIP-0005) by checking:

1. The message sender's Session identity is registered on-chain (Merkle proof against stateRoot).
2. The message signature is valid under the sender's registered public key.
3. The message sequence number is consistent with the sender's last known state.

### Bandwidth Optimization

- **Header compression**: Adjacent headers share most fields; delta encoding reduces header size by approximately 60%.
- **Proof batching**: Multiple state proofs sharing common trie paths are batched into a single response.
- **Bloom filters**: Transaction inclusion can be probabilistically checked via block-level Bloom filters before requesting full proofs.

## Rationale

The design prioritizes minimal bandwidth and storage while maintaining trustless verification. Checkpoint sync avoids the impractical requirement of syncing from genesis on mobile. BLS aggregate signatures allow compact validator authentication. The protocol is intentionally transport-agnostic: light clients may sync over TCP, QUIC, Bluetooth (PIP-0001), or even SMS in extreme censorship scenarios.

## Security Considerations

- **Eclipse attacks**: A light client connected only to malicious peers may receive a forged header chain. Mitigation: light clients should connect to multiple independent peers and cross-validate headers.
- **Checkpoint trust**: Initial checkpoint sync requires trusting the checkpoint source. Mitigation: checkpoints are signed by a supermajority and can be verified against known validator public keys distributed out-of-band.
- **Stale state**: Light clients see state as of the latest synced header, which may lag behind the chain tip. Applications should display the header timestamp to users.
- **Privacy**: State proof requests reveal which accounts the light client is interested in. Mitigation: batch proof requests and use PIP-0105 metadata protection.

## References

- [PIP-0001: Mesh Network](./pip-0001-mesh-network.md)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [PIP-0105: Metadata Protection](./pip-0105-metadata-protection.md)
- [Ethereum Light Client Specification](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/sync-protocol.md)
- [FlyClient: Super-Light Clients for Cryptocurrencies](https://eprint.iacr.org/2019/226)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
