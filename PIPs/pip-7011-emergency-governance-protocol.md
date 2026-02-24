---
pip: 7011
title: "Emergency Governance Protocol"
description: "Fast-track governance mechanism for urgent network threats with timelocked execution"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Governance
created: 2026-01-23
tags: [governance, emergency, security, fast-track, incident-response]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines an emergency governance protocol for the Pars Network that enables rapid response to critical threats while maintaining democratic oversight. Standard governance (PIP-7000) has multi-day voting periods unsuitable for emergencies such as active exploits, network attacks, or coordinated censorship attempts. The emergency protocol allows a qualified Guardian Council to enact temporary protective measures within hours, subject to mandatory retrospective DAO ratification within 72 hours. Unratified emergency actions are automatically reversed.

## Motivation

### The Speed Problem

Standard governance is deliberately slow to prevent hasty decisions. But some threats demand immediate response:
- Active exploit draining user funds
- State-level network attack targeting mesh nodes
- Critical vulnerability discovered in deployed contracts
- Coordinated Sybil attack on governance itself
- Key compromise of network infrastructure

Without emergency governance, the community faces a choice between slow democratic process (potentially catastrophic delay) and unilateral action by core developers (centralization risk). This PIP provides a structured middle path.

### Abuse Prevention

Emergency powers are the most dangerous governance tool. History shows they are routinely abused to concentrate power. Every design decision in this PIP prioritizes preventing abuse over enabling speed.

## Specification

### Guardian Council

```go
type GuardianCouncil struct {
    Members       [][32]byte    // Anonymous guardian commitments
    Threshold     uint32        // Signatures required (t-of-n)
    TotalMembers  uint32
    TermEpoch     uint64        // Current term expires
    TermLength    uint64        // Epochs per term
    PowersBudget  uint32        // Remaining emergency actions this term
}
```

Guardian Council properties:
- Elected by full DAO vote each term (90 epochs)
- 7 members, 5-of-7 threshold for emergency action
- Maximum 3 emergency actions per term (prevents abuse)
- Members cannot serve consecutive terms
- Any member can be recalled by DAO vote at any time

### Emergency Categories

```go
type EmergencyCategory uint8

const (
    EmergencyExploit        EmergencyCategory = iota // Active financial exploit
    EmergencyNetworkAttack                             // Infrastructure attack
    EmergencyVulnerability                             // Critical unpatched vulnerability
    EmergencyGovernanceAttack                          // Attack on governance system
    EmergencyKeyCompromise                             // Key infrastructure compromised
)
```

### Emergency Action

```go
type EmergencyAction struct {
    ActionID     [32]byte
    Category     EmergencyCategory
    Description  string
    Justification string
    Measures     []EmergencyMeasure
    Proposer     [32]byte           // Guardian who proposed
    Signers      [][32]byte         // Guardians who signed
    EnactedAt    uint64
    ExpiresAt    uint64             // Auto-expire (max 72 hours)
    RatificationDeadline uint64     // Must be ratified by this epoch
    Status       ActionStatus
}

type EmergencyMeasure uint8

const (
    MeasurePauseContract   EmergencyMeasure = iota // Pause a specific contract
    MeasureBlockAddress                              // Block a specific address
    MeasureUpgradeContract                           // Emergency contract upgrade
    MeasureAdjustParameter                           // Adjust network parameter
    MeasureDisableFeature                            // Temporarily disable a feature
)

type ActionStatus uint8

const (
    StatusProposed   ActionStatus = iota
    StatusEnacted                          // Guardian threshold met
    StatusRatified                         // DAO ratified
    StatusReversed                         // DAO rejected or expired
    StatusExpired                          // Auto-expired without ratification
)
```

### Execution Flow

```
1. Guardian detects emergency
2. Guardian proposes EmergencyAction with justification
3. 5-of-7 Guardians sign within 4 hours
4. Action enacted immediately (timelocked for 1 hour for non-exploit categories)
5. DAO notified; 72-hour ratification vote begins
6. If ratified: action becomes permanent (or extends as specified)
7. If not ratified: action auto-reversed; Guardians' stake slashed 10%
```

### Smart Contract

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

interface IEmergencyGovernance {
    function proposeEmergency(
        uint8 category,
        bytes calldata measures,
        string calldata justification
    ) external returns (bytes32 actionId);

    function signEmergency(
        bytes32 actionId
    ) external;

    function enactEmergency(
        bytes32 actionId
    ) external;

    function ratifyEmergency(
        bytes32 actionId,
        bool approve
    ) external;

    function reverseEmergency(
        bytes32 actionId
    ) external;

    event EmergencyProposed(bytes32 indexed actionId, uint8 category);
    event EmergencyEnacted(bytes32 indexed actionId);
    event EmergencyRatified(bytes32 indexed actionId, bool approved);
    event EmergencyReversed(bytes32 indexed actionId);
}
```

### Constraints

| Constraint | Value | Rationale |
|:-----------|:------|:----------|
| Guardian count | 7 | Large enough for security, small enough for speed |
| Signing threshold | 5-of-7 | Prevents minority action |
| Max duration | 72 hours | Forces DAO ratification |
| Actions per term | 3 | Prevents normalization of emergency powers |
| Ratification quorum | 20% veASHA | Higher than standard proposals |
| Ratification threshold | 60% approval | Simple majority with margin |
| Timelock (non-exploit) | 1 hour | Allows community observation |

## Rationale

### Why Not Just Faster Standard Governance?

Reducing standard governance voting periods to hours would make all governance vulnerable to low-participation manipulation. Emergency governance is a separate, heavily constrained path that does not weaken normal governance.

### Why Mandatory Ratification?

Mandatory ratification ensures the Guardian Council cannot rule by emergency decree. Every emergency action faces democratic review, and unratified actions are reversed with stake slashing. This creates strong incentives against frivolous emergency declarations.

### Why Term Limits and Action Budgets?

Term limits prevent Guardian entrenchment. Action budgets prevent the normalization of emergency governance. Together, they ensure emergency powers remain exceptional.

## Security Considerations

- **Guardian capture**: 5-of-7 threshold prevents minority capture; term limits and recall prevent entrenchment
- **False emergencies**: Action budget limits abuse; stake slashing for unratified actions deters frivolous use
- **Delayed ratification attack**: 72-hour mandatory deadline; if quorum not met, action expires automatically
- **Guardian deanonymization**: Guardians use anonymous commitments; signing is done via threshold signatures

## References

- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)
- [PIP-0012: Encrypted Voting](./pip-0012-encrypted-voting.md)
- [PIP-0003: Coercion Resistance](./pip-0003-coercion-resistance.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
