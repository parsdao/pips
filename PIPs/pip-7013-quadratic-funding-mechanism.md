---
pip: 7013
title: "Quadratic Funding Mechanism"
description: "Quadratic funding for community public goods with matching pool from Pars treasury"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Governance
created: 2026-01-23
tags: [governance, quadratic-funding, public-goods, treasury, grants]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a quadratic funding mechanism for community public goods on the Pars Network. Community members contribute ASHA to projects they value, and a matching pool from the Pars treasury (PIP-7002) amplifies contributions using quadratic matching -- many small contributions receive proportionally more matching than few large contributions. This ensures democratic allocation of public goods funding where community breadth of support matters more than wealth concentration.

## Motivation

### Funding Public Goods

The Pars ecosystem depends on public goods that benefit everyone but are difficult to fund through market mechanisms:
- Persian NLP model development (PIP-0403)
- Cultural preservation projects (PIP-0501)
- Translation bounties (PIP-0505)
- Educational content (PIP-0507)
- News verification (PIP-0508)
- Digital library expansion (PIP-0509)
- Developer tools and infrastructure

### Democratic Allocation

Standard grant programs rely on committees that may not reflect community preferences. Quadratic funding lets the community itself signal what matters, with the treasury amplifying those signals democratically.

## Specification

### Funding Round

```go
type FundingRound struct {
    RoundID       [32]byte
    MatchingPool  uint64         // ASHA from treasury
    StartEpoch    uint64
    EndEpoch      uint64
    Projects      []FundedProject
    Contributors  map[[32]byte][]Contribution
    Status        RoundStatus
    FinalResults  []FundingResult
}

type FundedProject struct {
    ProjectID    [32]byte
    Title        string         // Project name (Farsi/English)
    Description  string
    Team         [32]byte       // Team commitment
    RequestedASHA uint64        // Requested funding amount
    Category     ProjectCategory
    Milestones   []Milestone
    DirectFunds  uint64         // Direct contributions received
    MatchedFunds uint64         // Calculated matching amount
}

type ProjectCategory uint8

const (
    CatInfrastructure ProjectCategory = iota
    CatAIModels
    CatCulturalPreservation
    CatEducation
    CatTranslation
    CatDeveloperTools
    CatCommunity
    CatResearch
)

type Contribution struct {
    Contributor [32]byte
    Project     [32]byte
    Amount      uint64       // ASHA contributed
    Timestamp   uint64
}
```

### Quadratic Matching Formula

```
For each project p:
  matched_p = ( sum_i( sqrt(contribution_i) ) )^2 - sum_i( contribution_i )

Total matched = sum_p( matched_p )

If total matched > matching pool:
  Each project's match is scaled: match_p * (matching_pool / total_matched)
```

Example:
- Project A: 100 people contribute 1 ASHA each
  - Direct: 100 ASHA
  - Matched: (100 * sqrt(1))^2 - 100 = 10000 - 100 = 9900 ASHA
- Project B: 1 person contributes 100 ASHA
  - Direct: 100 ASHA
  - Matched: (1 * sqrt(100))^2 - 100 = 100 - 100 = 0 ASHA

Project A receives far more matching because it has broader community support.

### Sybil Resistance

Quadratic funding is vulnerable to Sybil attacks (splitting one large contribution across fake identities). Defenses:

```go
type SybilDefense struct {
    // Minimum veASHA stake to contribute
    MinStake         uint64
    // Pairwise coordination penalty
    CoordinationPenalty float64
    // Identity verification level
    MinIdentityLevel IdentityLevel
    // Contribution cap per identity
    MaxContribution  uint64
}

type IdentityLevel uint8

const (
    LevelBasic    IdentityLevel = iota // veASHA stake only
    LevelVerified                       // Peer-verified identity
    LevelCredential                     // PIP-0507 credential holder
)
```

Pairwise coordination penalty: if two contributors frequently co-contribute to the same projects, their matching weight is reduced, discouraging coordinated splitting.

### Smart Contract

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

interface IQuadraticFunding {
    function createRound(
        uint256 matchingPool,
        uint64 startEpoch,
        uint64 endEpoch
    ) external returns (bytes32 roundId);

    function submitProject(
        bytes32 roundId,
        string calldata metadata,
        bytes calldata milestones
    ) external returns (bytes32 projectId);

    function contribute(
        bytes32 roundId,
        bytes32 projectId
    ) external payable;

    function finalizeRound(
        bytes32 roundId
    ) external;

    function claimFunding(
        bytes32 projectId
    ) external returns (uint256 directAmount, uint256 matchedAmount);

    event RoundCreated(bytes32 indexed roundId, uint256 matchingPool);
    event ProjectSubmitted(bytes32 indexed roundId, bytes32 indexed projectId);
    event ContributionMade(bytes32 indexed projectId, uint256 amount);
    event RoundFinalized(bytes32 indexed roundId);
    event FundingClaimed(bytes32 indexed projectId, uint256 total);
}
```

### Milestone-Based Disbursement

Matched funds are released in tranches tied to milestones:

```go
type Milestone struct {
    Description  string
    Deliverables []string
    FundingPct   uint16    // % of total funding released at this milestone
    Deadline     uint64
    Status       MilestoneStatus
    ReviewerVote [32]byte  // DAO review vote reference
}
```

- 30% released on project start
- Remaining released upon milestone completion verified by community review
- Undelivered milestones return funds to the matching pool

### Round Schedule

Funding rounds run quarterly:
- Weeks 1-2: Project submission
- Weeks 3-10: Contribution period
- Week 11: Finalization and matching calculation
- Week 12: Results announcement and initial disbursement

## Rationale

### Why Quadratic Funding Over Grants Committee?

Grants committees are subject to capture, bias, and limited knowledge. Quadratic funding makes the entire community the grants committee, weighted by breadth of support rather than wealth.

### Why Pairwise Coordination Penalty?

Without Sybil resistance, quadratic funding collapses to linear funding. The pairwise penalty is a practical defense that does not require perfect identity verification -- it penalizes suspicious patterns statistically.

### Why Milestone-Based Disbursement?

Upfront funding creates moral hazard. Milestone-based disbursement ensures projects deliver on their promises, and undelivered funds return to the community.

## Security Considerations

- **Sybil attacks**: veASHA stake requirement + pairwise coordination penalty + contribution caps
- **Collusion rings**: Statistical detection of coordinated contribution patterns; flagged for DAO review
- **Matching pool manipulation**: Pool size set by DAO vote; cannot be unilaterally changed
- **Project fraud**: Milestone verification by community reviewers; fund clawback for non-delivery

## References

- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)
- [PIP-7002: Treasury Management](./pip-7002-treasury-management.md)
- [Buterin, Hitzig, Weyl, "Liberal Radicalism: A Flexible Design For Philanthropic Matching Funds"](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3243656)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
