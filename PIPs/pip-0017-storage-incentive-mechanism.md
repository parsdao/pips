---
pip: 17
title: "Storage Incentive Mechanism"
description: "Token incentives for distributed storage providers on the Pars Network"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Core
created: 2026-01-23
tags: [storage, incentives, asha, distributed-storage, cultural-preservation]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a storage incentive mechanism that rewards nodes for storing and serving data on the Pars Network. Storage providers stake ASHA as collateral, commit to storing data for a specified duration, and receive ASHA rewards proportional to the storage volume and retrieval performance they provide. The mechanism uses cryptographic proofs-of-storage to verify that providers actually retain the data they claim to store, without requiring the verifier to hold the data themselves. This is essential for the cultural archive use case (PIP-0025) where Persian cultural artifacts must be preserved in a censorship-resistant manner.

## Motivation

Decentralized storage is critical for the Pars Network's mission of cultural preservation. Persian literature, music, historical documents, and educational materials must be stored redundantly across the globe so that no single government or entity can destroy or censor them. However, storage has real costs (hardware, bandwidth, electricity), and without incentives, rational node operators will not dedicate resources to storing others' data. The storage incentive mechanism aligns economic incentives with the network's preservation goals.

## Specification

### Storage Provider Registration

Providers register by staking a minimum of 1,000 ASHA and declaring their available storage capacity. The stake serves as collateral against data loss or unavailability.

### Storage Deals

A storage deal is an on-chain agreement between a client and a provider:

- `dataHash`: Content-addressed hash (SHA-256) of the stored data.
- `size`: Data size in bytes.
- `duration`: Storage duration in epochs (1 epoch = 1 day).
- `reward`: Total ASHA reward for the full duration.
- `redundancy`: Required number of independent storage providers.

Clients pay the reward upfront, which is locked in escrow. Providers receive linear payouts per epoch upon submitting valid storage proofs.

### Proof of Storage

Providers must submit a proof-of-storage once per epoch for each active deal. The proof uses a compact proof-of-retrievability scheme:

1. The verifier (on-chain contract) issues a random challenge consisting of indices into the stored data.
2. The provider computes a response by hashing the challenged data segments along with the challenge nonce.
3. The contract verifies the response against precomputed verification tags stored at deal creation time.

### Slashing

Providers who fail to submit a valid proof-of-storage within the epoch window are slashed. The slashing schedule is:

- 1 missed proof: warning, no penalty.
- 2 consecutive misses: 1% stake slashed.
- 5 consecutive misses: 10% stake slashed, deal terminated, data re-assigned to other providers.

### Reward Distribution

Rewards are distributed linearly over the deal duration. A provider storing 1 GB for 365 epochs at a total reward of 100 ASHA receives approximately 0.274 ASHA per epoch. Bonus multipliers apply for:

- Long-term storage (>1 year): 1.5x multiplier.
- High-availability (>99.9% uptime): 1.2x multiplier.
- Geographic diversity (provider in under-represented region): 1.3x multiplier.

## Rationale

The proof-of-storage approach is chosen over proof-of-replication because it requires less computational overhead while still providing strong guarantees that data is actually retained. Linear reward distribution (rather than lump-sum) incentivizes continuous availability. The geographic diversity bonus ensures cultural archives are not concentrated in a single jurisdiction where they could be seized or censored. The slashing mechanism provides credible deterrence against providers who accept deals but discard data.

## Security Considerations

- **Sybil storage**: A provider could register multiple identities claiming to store the same data while only storing one copy. Mitigation: storage deals require providers to prove storage of uniquely encoded replicas, not the raw data.
- **Challenge predictability**: If providers can predict challenges, they could discard data and only store the challenged segments. Mitigation: challenges are derived from the block hash of the challenge epoch, which is unpredictable.
- **Stake grinding**: Providers with insufficient stake may attempt to borrow ASHA for registration. The 1,000 ASHA minimum and lock-up period make this expensive.
- **Data availability**: Even with proofs-of-storage, retrieval speed is not guaranteed. The high-availability bonus incentivizes fast retrieval.

## References

- [PIP-0008: Pars Economics](./pip-0008-pars-economics.md)
- [PIP-0025: Blob Storage Protocol](./pip-0025-blob-storage-protocol.md)
- [Filecoin Proof of Replication](https://spec.filecoin.io/algorithms/pos/porep/)
- [Compact Proofs of Retrievability](https://eprint.iacr.org/2008/073)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
