---
pip: 203
title: "Reputation System"
description: "Privacy-preserving on-chain reputation scoring for Pars Network participants"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Identity
created: 2026-01-23
tags: [identity, reputation, privacy, zero-knowledge, trust]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a privacy-preserving reputation system for Pars Network. Reputation scores are computed from on-chain activity, community attestations, and governance participation. Users can prove they meet reputation thresholds via zero-knowledge proofs without revealing their exact score or the actions that contributed to it.

## Motivation

Decentralized networks need trust signals that do not rely on centralized authorities:

1. **Sybil deterrence** -- reputation makes it costly to create disposable identities for spam or manipulation
2. **Community trust** -- diaspora members need to evaluate counterparties for commerce, governance, and collaboration
3. **Privacy** -- revealing a full reputation history enables profiling and surveillance; only threshold proofs should be necessary
4. **Permissionless participation** -- reputation should be earnable by anyone, not gatekept by institutions

## Specification

### Reputation Domains

| Domain | Sources | Weight |
|:-------|:--------|:-------|
| Governance | Voting participation, proposal authorship | 25% |
| Economic | Transaction history, staking duration | 20% |
| Social | Attestations received, group membership | 25% |
| Contribution | Code commits, content creation, translations | 20% |
| Reliability | Uptime (validators/relays), message relay success | 10% |

### Score Computation

```solidity
interface IReputationOracle {
    function getScore(address user, uint8 domain) external view returns (uint256);
    function getAggregateScore(address user) external view returns (uint256);
    function submitAttestation(address subject, uint8 domain, uint8 score, bytes memory proof) external;
    function verifyThreshold(bytes memory zkProof, uint256 threshold) external view returns (bool);
}
```

Scores are computed on a 0--1000 scale per domain. The aggregate score is a weighted sum normalized to 0--1000.

### Zero-Knowledge Threshold Proofs

Users generate ZK proofs demonstrating their score exceeds a threshold without revealing the exact value:

```
Public inputs:  threshold, domain, block_number
Private inputs: actual_score, attestation_merkle_path
Proof:          SNARK proving actual_score >= threshold
```

### Attestation Structure

```json
{
  "subject": "did:pars:mainnet:0xSUBJECT",
  "attester": "did:pars:mainnet:0xATTESTER",
  "domain": "social",
  "score": 8,
  "reason": "Organized community event in Los Angeles",
  "timestamp": 1706000000,
  "signature": "0xMLDSA..."
}
```

Attestations are stored in a Merkle tree anchored on-chain. The tree root is updated periodically by the reputation oracle.

### Decay Function

Reputation decays over time to encourage ongoing participation:

```
effective_score = base_score * decay_factor(time_since_last_activity)
decay_factor(t) = max(0.3, 1.0 - 0.01 * t_weeks)
```

Scores decay to a floor of 30% of their peak after ~70 weeks of inactivity.

## Rationale

- **Domain-specific scoring** prevents gaming in one area from inflating overall reputation
- **ZK threshold proofs** allow reputation-gated access without privacy sacrifice
- **Attestation-based input** supplements on-chain activity with human judgment
- **Decay function** ensures reputation reflects current engagement, not historical privilege
- **Permissionless attestation** means any community member can vouch for another

## Security Considerations

- **Reputation farming**: Minimum attestation weight requires the attester to have non-trivial reputation themselves, creating a natural barrier
- **Sybil attestation rings**: Graph analysis on the attestation network can detect and discount circular attestation patterns
- **Score manipulation**: On-chain activity components are computed from immutable transaction history; only attestation components are subjective
- **Privacy leakage**: Users MUST use ZK proofs for reputation checks; direct score queries are restricted to the identity owner
- **Oracle trust**: The reputation oracle is a committee of staked validators; a dishonest majority can be slashed

## References

- [EIP-4974: Ratings](https://eips.ethereum.org/EIPS/eip-4974)
- [PIP-0200: Decentralized Identity Standard](./pip-0200-decentralized-identity-standard.md)
- [PIP-0209: Age Verification ZK](./pip-0209-age-verification-zk.md)
- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
