---
pip: 214
title: "Identity Recovery DAO"
description: "Community-governed identity recovery dispute resolution for Pars Network"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Identity
created: 2026-01-23
tags: [identity, recovery, dao, governance, disputes]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines the Identity Recovery DAO, a community-governed dispute resolution mechanism for contested identity recovery claims on Pars Network. When standard social recovery (PIP-0202) fails or is disputed -- guardians are unreachable, compromised, or disagree -- the Recovery DAO provides a court of last resort with staked jurors, evidence submission, and time-locked verdicts.

## Motivation

Social recovery works well in normal circumstances, but edge cases require escalation:

1. **Guardian unavailability** -- all guardians may be unreachable simultaneously (natural disaster, mass detention)
2. **Guardian dispute** -- guardians may disagree on whether a recovery request is legitimate
3. **Hostile recovery** -- an adversary may attempt recovery by coercing a subset of guardians
4. **Identity theft** -- an impersonator may obtain guardian cooperation through deception
5. **Long-term inactivity** -- a user missing for years may need recovery beyond the guardian expiry window

## Specification

### Recovery DAO Structure

```solidity
interface IRecoveryDAO {
    function submitClaim(
        bytes32 identityHash,
        bytes memory evidence,
        uint256 stakeBond
    ) external returns (bytes32 claimId);

    function challengeClaim(bytes32 claimId, bytes memory counterEvidence) external;
    function submitJurorVote(bytes32 claimId, bool approve, bytes memory rationale) external;
    function finalizeClaim(bytes32 claimId) external;
    function appealVerdict(bytes32 claimId, bytes memory newEvidence) external;
    function getClaimStatus(bytes32 claimId) external view returns (ClaimStatus memory);
}
```

### Claim Lifecycle

```
1. Claimant submits recovery claim + ASHA stake bond
2. 7-day evidence submission window opens
3. Juror panel selected (random from staked juror pool)
4. Jurors review evidence, vote approve/reject
5. Verdict announced with 48-hour appeal window
6. If no appeal, verdict executed
7. If appealed, larger juror panel reconvenes
```

### Juror Selection

Jurors are selected from a pool of staked community members:

| Requirement | Value |
|:-----------|:------|
| Minimum stake | 1000 ASHA |
| Minimum reputation | 400/1000 aggregate score |
| Minimum account age | 180 days |
| Panel size (initial) | 7 jurors |
| Panel size (appeal) | 13 jurors |
| Supermajority | 5/7 or 9/13 |

Selection is pseudo-random using block hash and stake-weighted probability, with conflict-of-interest exclusions (jurors cannot be guardians or known contacts of either party).

### Evidence Types

| Type | Description | Weight |
|:-----|:-----------|:-------|
| Cryptographic | Signed messages from old keys | High |
| Social | Attestations from known contacts | Medium |
| Historical | Transaction pattern matching | Medium |
| Biometric | FIDO2 device attestation | High |
| Community | Community leader vouching | Medium |
| External | Legal documents, notarized statements | Low (unverifiable on-chain) |

### Stake and Incentives

- **Claimant bond**: 500 ASHA (returned on approval, forfeited on rejection)
- **Challenger bond**: 500 ASHA (returned if claim rejected, forfeited if claim approved)
- **Juror reward**: 50 ASHA per case from losing party's forfeited bond
- **Juror slash**: Jurors who vote against the supermajority lose 10% of their stake (discourages lazy or colluded voting)

### Time Limits

| Phase | Duration |
|:------|:---------|
| Evidence submission | 7 days |
| Juror deliberation | 5 days |
| Appeal window | 48 hours |
| Appeal deliberation | 7 days |
| Execution delay | 24 hours |
| Maximum total | 21 days |

## Rationale

- **Stake bonds** deter frivolous claims and ensure skin in the game
- **Random juror selection** prevents capture by any single interest group
- **Supermajority requirement** ensures strong consensus before altering identity ownership
- **Appeal mechanism** provides recourse for incorrect initial verdicts
- **Time limits** prevent indefinite identity limbo
- **Multiple evidence types** accommodate the diverse circumstances of diaspora members

## Security Considerations

- **Juror bribery**: Juror identities are hidden until after voting; stake slashing for minority-voting jurors increases the cost of coordinated bribery
- **Sybil juror pool**: Minimum stake, reputation, and account age requirements make juror pool infiltration expensive
- **Evidence fabrication**: Cryptographic evidence is prioritized; social evidence requires multiple independent attestations
- **Grief attacks**: The 500 ASHA bond makes it costly to repeatedly submit false claims; escalating bonds for repeat claimants provide additional protection
- **Collusion between claimant and jurors**: Conflict-of-interest exclusions and random selection minimize this risk; the appeal mechanism provides a second check

## References

- [Kleros Dispute Resolution Protocol](https://kleros.io/)
- [PIP-0200: Decentralized Identity Standard](./pip-0200-decentralized-identity-standard.md)
- [PIP-0202: Social Recovery Wallets](./pip-0202-social-recovery-wallets.md)
- [PIP-0203: Reputation System](./pip-0203-reputation-system.md)
- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
