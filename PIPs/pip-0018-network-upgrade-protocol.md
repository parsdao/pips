---
pip: 18
title: "Network Upgrade Protocol"
description: "Hard fork coordination and upgrade signaling for Pars Network evolution"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Core
created: 2026-01-23
tags: [upgrade, hard-fork, governance, signaling, coordination]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines the protocol for coordinating network upgrades (hard forks) on the Pars Network. It establishes a signaling mechanism through which validators indicate readiness for proposed upgrades, defines activation thresholds and timelines, and specifies the on-chain governance integration with the Pars DAO (PIP-7000). The protocol ensures that upgrades are adopted smoothly without chain splits, while preserving the censorship-resistant properties of the network by preventing any single entity from blocking necessary upgrades.

## Motivation

Blockchain networks must evolve to fix bugs, improve performance, and add features. However, uncoordinated upgrades risk chain splits that fragment the community and dilute security. For the Pars Network, chain splits are particularly dangerous: a fragmented network is easier for state-level adversaries to attack or censor. The upgrade protocol must balance the need for rapid evolution with the requirement for broad consensus, ensuring the diaspora community remains unified on a single canonical chain.

## Specification

### Upgrade Proposal

An upgrade is proposed by submitting a PIP through the DAO governance process (PIP-7000). The proposal includes:

- `upgradeId`: Unique identifier for the upgrade.
- `activationEpoch`: Earliest epoch at which the upgrade can activate.
- `description`: Human-readable summary and link to the full PIP.
- `codeHash`: Hash of the reference implementation binary.
- `requiredVersion`: Minimum node software version that supports the upgrade.

### Signaling Phase

Once a PIP is approved by DAO governance, validators signal readiness by including an `upgradeReady` flag in their block headers. The signaling window is 30 days (approximately 4,320 epochs at 10-minute epochs).

### Activation Threshold

An upgrade activates when:

1. At least 80% of validators (by stake weight) have signaled readiness.
2. The current epoch is at or past the `activationEpoch`.
3. At least 14 days have elapsed since the signaling threshold was first reached (grace period for lagging nodes).

### Emergency Upgrades

Critical security patches may bypass the standard 30-day signaling window. Emergency upgrades require:

1. A 90% validator supermajority signal.
2. Approval by the DAO security council (multisig of 7 elected members, 5-of-7 threshold).
3. Minimum 48-hour grace period.

### Upgrade Execution

At the activation epoch:

1. All nodes running the upgraded software apply the new consensus rules.
2. Nodes running old software reject blocks produced under new rules and halt.
3. Halted nodes display a clear upgrade message with download instructions.

### Version Deprecation

Two major versions are supported concurrently. When version N+2 activates, version N nodes are permanently unable to sync. This ensures the network does not carry legacy compatibility debt indefinitely.

## Rationale

The 80% threshold balances inclusivity (not requiring unanimity) with safety (preventing a small minority from forcing an upgrade). The 14-day grace period after threshold accounts for node operators in censored regions who may have delayed access to software updates. Emergency upgrades have a higher threshold and security council approval to prevent abuse while enabling rapid response to critical vulnerabilities.

## Security Considerations

- **Upgrade censorship**: A state-level adversary controlling >20% of stake could block non-emergency upgrades. Mitigation: the DAO can lower the threshold via governance vote if blocking is detected.
- **Malicious upgrades**: An attacker who compromises the DAO governance process could push a malicious upgrade. Mitigation: the `codeHash` field allows node operators to independently verify the binary against the audited source code.
- **Split risk**: If signaling is ambiguous, some nodes may activate early. The grace period and deterministic activation epoch eliminate ambiguity.
- **Coercion**: Validators in hostile jurisdictions may be coerced to not signal. The 80% threshold (not 100%) accommodates some non-participation.

## References

- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)
- [PIP-0028: Validator Rotation Protocol](./pip-0028-validator-rotation-protocol.md)
- [Bitcoin BIP-9: Version Bits](https://github.com/bitcoin/bips/blob/master/bip-0009.mediawiki)
- [Ethereum EIP-2982: Serenity Phase 0](https://eips.ethereum.org/EIPS/eip-2982)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
