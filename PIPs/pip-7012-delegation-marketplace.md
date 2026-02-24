---
pip: 7012
title: "Delegation Marketplace"
description: "Market for vote delegation with reputation tracking and incentive alignment"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Governance
created: 2026-01-23
tags: [governance, delegation, marketplace, reputation, voting]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a delegation marketplace for the Pars Network where veASHA holders can delegate their voting power to specialized delegates who actively participate in governance. Delegates build public reputations based on voting history, proposal outcomes, and community ratings. Delegators earn a share of governance participation rewards while delegates earn compensation for their governance labor. Delegation is revocable at any time and supports partial delegation across multiple delegates by topic.

## Motivation

### The Participation Problem

Effective governance requires informed voting on complex technical and economic proposals. Most veASHA holders lack time or expertise to evaluate every proposal. Without delegation:
- Voter turnout is low, weakening governance legitimacy
- Whales dominate by default
- Informed minorities are drowned out by uninformed majorities
- Governance fatigue leads to disengagement

### Liquid Democracy

Delegation enables liquid democracy: those who want to participate directly can, while those who prefer to delegate can choose representatives aligned with their values. The marketplace ensures delegates are accountable through transparent reputation.

## Specification

### Delegate Profile

```go
type DelegateProfile struct {
    DelegateID    [32]byte
    DisplayName   string       // Pseudonym (supports Farsi)
    Platform      string       // Governance philosophy statement
    Specialties   []string     // e.g., "AI policy", "economics", "security"
    VotingHistory []VoteRecord
    Reputation    DelegateReputation
    Fee           DelegateFee
    TotalPower    uint64       // Total delegated veASHA
    DelegatorCount uint64
    ActiveSince   uint64
}

type DelegateReputation struct {
    OverallScore     float64  // Aggregate reputation [0.0, 5.0]
    ParticipationRate float64 // % of proposals voted on
    AccuracyScore    float64  // % of votes aligned with winning side
    ConsistencyScore float64  // Alignment between platform and votes
    CommunityRating  float64  // Community satisfaction rating
    ProposalsMade    uint64   // Proposals authored
    ProposalsPassed  uint64   // Authored proposals that passed
}

type DelegateFee struct {
    Type        FeeType
    Amount      uint64    // ASHA or basis points
    PaymentFreq uint64    // Epochs between payments
}

type FeeType uint8

const (
    FeeNone        FeeType = iota // Volunteer delegate
    FeeFixed                       // Fixed ASHA per epoch
    FeePercentage                  // % of delegator's governance rewards
    FeeTip                         // Voluntary tips only
)
```

### Delegation

```go
type Delegation struct {
    DelegationID  [32]byte
    Delegator     [32]byte     // veASHA holder commitment
    Delegate      [32]byte     // Delegate commitment
    Power         uint64       // veASHA delegated
    Topics        []string     // Topic restrictions (empty = all topics)
    CreatedAt     uint64
    RevokedAt     uint64       // 0 = active
    AutoRevoke    []RevokeCondition
}

type RevokeCondition struct {
    Type      RevokeType
    Threshold float64
}

type RevokeType uint8

const (
    RevokeOnParticipationDrop  RevokeType = iota // Delegate stops voting
    RevokeOnReputationDrop                         // Reputation falls below threshold
    RevokeOnMismatch                               // Delegate votes against delegator preference
)
```

### Topic-Based Delegation

Delegators can split their voting power by topic:

```
Example:
  - 40% to Delegate-A (specialty: AI & Compute)
  - 30% to Delegate-B (specialty: Treasury & Economics)
  - 20% to Delegate-C (specialty: Security)
  - 10% retained for direct voting
```

If a proposal spans multiple topics, the delegate with the most relevant specialty votes. Conflicts default to the delegator's direct vote if cast.

### Smart Contract

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

interface IDelegationMarketplace {
    function registerDelegate(
        string calldata platform,
        string[] calldata specialties,
        uint8 feeType,
        uint256 feeAmount
    ) external returns (bytes32 delegateId);

    function delegate(
        bytes32 delegateId,
        uint256 veASHAAmount,
        string[] calldata topics
    ) external returns (bytes32 delegationId);

    function revokeDelegation(
        bytes32 delegationId
    ) external;

    function rateDelegate(
        bytes32 delegateId,
        uint8 score,
        bytes calldata feedback
    ) external;

    function claimDelegateRewards(
        bytes32 delegateId
    ) external returns (uint256 amount);

    event DelegateRegistered(bytes32 indexed delegateId);
    event Delegated(bytes32 indexed delegationId, bytes32 indexed delegateId);
    event DelegationRevoked(bytes32 indexed delegationId);
    event DelegateRated(bytes32 indexed delegateId, uint8 score);
}
```

### Reputation Calculation

```
reputation = (participation * 0.3) + (accuracy * 0.2) + (consistency * 0.2)
           + (community_rating * 0.2) + (proposal_success * 0.1)

Where:
  participation = votes_cast / total_proposals
  accuracy = winning_votes / total_votes
  consistency = platform_aligned_votes / total_votes
  community_rating = average_community_score / 5.0
  proposal_success = passed_proposals / total_proposals_authored
```

### Discovery

Delegates are discoverable through:
- Topic-based search
- Reputation ranking
- Voting history analysis
- Platform keyword matching
- Community recommendation

## Rationale

### Why Topic-Based Delegation?

No single delegate is expert in everything. Topic-based delegation lets delegators compose a "governance portfolio" of specialists, improving decision quality across all proposal types.

### Why Automatic Revocation Conditions?

Delegators may not actively monitor their delegates. Automatic revocation conditions (participation drop, reputation decline) protect delegators from inactive or compromised delegates without requiring manual intervention.

### Why Transparent Voting History?

Delegates' votes are public to enable accountability. Delegators can verify that their delegate voted consistently with their stated platform. This transparency is the foundation of delegation trust.

## Security Considerations

- **Vote buying**: Delegation fees are public and transparent; excessive fees flag potential vote buying
- **Delegate collusion**: Reputation system and community rating detect coordinated voting patterns
- **Sybil delegates**: Minimum stake requirement for delegate registration
- **Governance capture**: Topic-based delegation distributes power; no single delegate dominates all topics

## References

- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)
- [PIP-0012: Encrypted Voting](./pip-0012-encrypted-voting.md)
- [PIP-7008: Liquid Staking](./pip-7008-liquid-staking.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
