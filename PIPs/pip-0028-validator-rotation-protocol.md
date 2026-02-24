---
pip: 28
title: "Validator Rotation Protocol"
description: "Periodic validator set rotation for censorship resistance and decentralization"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Core
created: 2026-01-23
tags: [validators, rotation, censorship-resistance, decentralization, consensus]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a validator rotation protocol that periodically shuffles the active validator set on the Pars Network. Rotation ensures that no fixed set of validators can be targeted for coercion, censorship, or seizure by state-level adversaries. The protocol uses a verifiable random function (VRF) seeded by on-chain randomness to select the next validator committee from the pool of staked candidates. Rotation occurs every 24 hours (1 epoch), with a smooth transition period to avoid consensus disruption.

## Motivation

Static validator sets are vulnerable to targeted attacks. If an adversary identifies the validators responsible for block production, they can coerce, bribe, or legally compel those specific entities to censor transactions or halt the network. For the Pars Network, this threat is concrete: authoritarian governments could identify validators and threaten them or their families. Frequent rotation makes targeting impractical because the attacker must compromise a new set of validators every 24 hours.

Rotation also promotes decentralization by giving all staked candidates a fair chance to participate in consensus, preventing entrenchment of a permanent validator oligarchy.

## Specification

### Validator Pool

Any account that stakes a minimum of 10,000 ASHA and meets the hardware requirements (PIP-0007) can register as a validator candidate. The pool of registered candidates forms the selection universe.

### Selection Algorithm

At each epoch boundary, the next validator committee is selected:

1. Compute the epoch randomness: `seed = VRF(beacon_chain_randomness || epoch_number)`.
2. Sort all eligible candidates by `SHA-256(seed || candidate_address)`.
3. Select the top `committee_size` candidates (default: 100).
4. Assign each selected validator a proportional weight based on their stake.

The VRF ensures that the selection is unpredictable before the epoch boundary but verifiable after.

### Transition Period

To avoid a hard cutover that could disrupt consensus:

1. At epoch boundary E, the new committee is announced.
2. For blocks E to E+10, both the old and new committees are valid block producers.
3. From block E+11 onward, only the new committee produces blocks.
4. The 10-block overlap allows the new committee members to come online and sync.

### Minimum Diversity Requirements

The selection algorithm enforces:

- No single entity may control more than 10% of the committee (verified via on-chain identity declarations).
- At least 5 distinct geographic regions must be represented (based on self-declared and network-inferred location).
- At least 20% of the committee must be new members (not in the previous committee).

### Slashing for Non-Participation

Selected validators who fail to produce blocks during their assigned slots are penalized:

- 1 missed slot: no penalty (network jitter tolerance).
- 3 consecutive missed slots: 0.1% stake slashed.
- Full epoch non-participation: 1% stake slashed and removed from candidate pool for 7 epochs.

### Emergency Rotation

If a supermajority (>2/3) of the current committee is detected as offline or malicious (e.g., producing conflicting blocks), an emergency rotation is triggered immediately using the next epoch's seed. This prevents extended downtime from a coordinated attack on the current committee.

## Rationale

The 24-hour rotation period balances security (frequent enough to prevent sustained targeting) with stability (long enough for committee members to set up and perform their duties). The VRF-based selection provides unpredictability before the epoch while enabling post-hoc verification, preventing adversaries from pre-positioning attacks. The 10-block transition period avoids consensus disruption during handover. Minimum diversity requirements prevent centralization, which would undermine the anti-censorship goals.

## Security Considerations

- **VRF bias**: The last revealer of beacon randomness could bias the selection. Mitigation: the VRF uses commit-reveal with slashing for non-revelation.
- **Stake centralization**: A wealthy entity could stake many candidates to increase selection probability. Mitigation: the 10% cap per entity limits concentration.
- **Geographic spoofing**: Validators could lie about their location. Mitigation: network latency measurements provide probabilistic location verification.
- **Flash stake attacks**: An attacker could briefly stake to get selected, then unstake. Mitigation: a 7-epoch (7-day) unstaking delay prevents this.
- **Committee prediction**: Predicting the next committee requires knowing the VRF seed, which depends on future beacon randomness. This is computationally infeasible.

## References

- [PIP-0007: parsd Architecture](./pip-0007-parsd-architecture.md)
- [PIP-0008: Pars Economics](./pip-0008-pars-economics.md)
- [PIP-0018: Network Upgrade Protocol](./pip-0018-network-upgrade-protocol.md)
- [Verifiable Random Functions (VRF)](https://tools.ietf.org/html/draft-irtf-cfrg-vrf-15)
- [Ethereum Validator Shuffling](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/attestations/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
