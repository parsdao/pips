---
pip: 7015
title: "Constitutional Amendment Process"
description: "Formal process for amending the Pars Network core constitution with supermajority requirements"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Governance
created: 2026-01-23
tags: [governance, constitution, amendment, supermajority, core-rules]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines the formal process for amending the Pars Network constitution -- the set of immutable core principles that govern the network. Constitutional provisions include censorship resistance guarantees, privacy protections, token economics fundamentals, and governance structure itself. Amendments require supermajority approval (75%), high quorum (33% of veASHA), extended deliberation periods, and a cooling-off delay before execution. The process is deliberately difficult to prevent erosion of core protections through casual governance.

## Motivation

### Protecting Core Principles

The Pars Network exists to provide censorship resistance, privacy, and self-sovereignty for the Persian diaspora. These principles must be exceptionally difficult to change, because:

1. **Capture resistance** -- well-funded adversaries could attempt governance capture to weaken privacy protections
2. **Temporal consistency** -- users and developers need confidence that core guarantees will persist
3. **Minority protection** -- core rights should not be removable by simple majority
4. **Deliberation** -- fundamental changes deserve extended community discussion

### A Living Document

At the same time, the constitution must be amendable. Circumstances change, technology evolves, and the community's understanding deepens. An unamendable constitution becomes a liability. The amendment process balances durability with adaptability.

## Specification

### Constitutional Articles

```go
type Constitution struct {
    Articles     []Article
    Amendments   []Amendment
    RatifiedAt   uint64
    LastAmended  uint64
}

type Article struct {
    ArticleID    uint32
    Title        string
    Text         string        // Full article text
    Category     ArticleCategory
    Immutable    bool          // Some articles cannot be amended at all
    Hash         [32]byte      // Content hash for integrity
}

type ArticleCategory uint8

const (
    CatFundamentalRights ArticleCategory = iota // Privacy, censorship resistance
    CatGovernanceStructure                        // DAO rules, voting mechanisms
    CatTokenEconomics                             // ASHA supply, inflation, distribution
    CatNetworkArchitecture                        // Core protocol requirements
    CatAmendmentProcess                           // This amendment process itself
)
```

### Immutable Articles

Certain articles are designated as immutable and cannot be amended under any circumstances:

1. **Right to Privacy**: The network shall never implement surveillance, mandatory identity disclosure, or backdoors
2. **Censorship Resistance**: Content published to the mesh shall never be subject to protocol-level removal
3. **Open Participation**: No identity, nationality, ethnicity, or political affiliation shall be required for network participation
4. **Post-Quantum Commitment**: All cryptographic protocols shall maintain post-quantum security

### Amendment Proposal

```go
type AmendmentProposal struct {
    ProposalID      [32]byte
    TargetArticle   uint32       // Article to amend
    CurrentText     string       // Existing article text
    ProposedText    string       // Proposed new text
    Justification   string       // Detailed rationale
    Proposer        [32]byte     // Anonymous commitment
    Sponsors        [][32]byte   // Minimum 5 sponsors required
    Phase           AmendmentPhase
    Timestamps      AmendmentTimeline
}

type AmendmentPhase uint8

const (
    PhaseDiscussion  AmendmentPhase = iota // Community discussion
    PhaseFormalReview                        // Formal review period
    PhaseVoting                              // Voting period
    PhaseCoolingOff                          // Cooling-off before execution
    PhaseRatified                            // Approved and executed
    PhaseRejected                            // Failed to pass
)

type AmendmentTimeline struct {
    DiscussionStart uint64  // When discussion began
    ReviewStart     uint64  // When formal review began
    VotingStart     uint64  // When voting opened
    VotingEnd       uint64  // When voting closed
    ExecutionDate   uint64  // When amendment takes effect
}
```

### Amendment Process

```
Phase 1: Discussion (minimum 30 epochs / ~30 days)
  - Proposal published for community discussion
  - Town hall debates (PIP-7001) scheduled
  - AI-powered impact analysis generated
  - Community feedback collected

Phase 2: Formal Review (minimum 14 epochs)
  - Legal and technical review by qualified reviewers
  - Final text locked (no further changes)
  - Impact assessment published
  - Endorsements and objections recorded

Phase 3: Voting (21 epochs)
  - Encrypted voting (PIP-0012)
  - Quorum: 33% of total veASHA must participate
  - Threshold: 75% supermajority required
  - Delegation counts toward quorum and threshold

Phase 4: Cooling-Off (14 epochs)
  - Amendment passed but not yet executed
  - Community can organize opposition or emergency action
  - If > 25% of veASHA signals objection during cooling-off,
    amendment returns to Phase 1

Phase 5: Ratification
  - Amendment executed on-chain
  - Constitution hash updated
  - Historical record preserved
```

### Smart Contract

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

interface IConstitutionalAmendment {
    function proposeAmendment(
        uint32 articleId,
        string calldata proposedText,
        string calldata justification,
        bytes32[] calldata sponsors
    ) external returns (bytes32 proposalId);

    function advancePhase(
        bytes32 proposalId
    ) external;

    function voteOnAmendment(
        bytes32 proposalId,
        bool support,
        uint256 veASHAWeight
    ) external;

    function objectDuringCooling(
        bytes32 proposalId
    ) external;

    function ratifyAmendment(
        bytes32 proposalId
    ) external;

    function getConstitutionHash() external view returns (bytes32);

    event AmendmentProposed(bytes32 indexed proposalId, uint32 articleId);
    event AmendmentAdvanced(bytes32 indexed proposalId, uint8 newPhase);
    event AmendmentRatified(bytes32 indexed proposalId, uint32 articleId);
    event AmendmentRejected(bytes32 indexed proposalId);
}
```

### Requirements Summary

| Requirement | Value | Rationale |
|:-----------|:------|:----------|
| Minimum sponsors | 5 unique veASHA holders | Prevents frivolous proposals |
| Discussion period | 30 epochs minimum | Ensures community awareness |
| Review period | 14 epochs | Technical and legal analysis |
| Voting period | 21 epochs | Extended deliberation |
| Quorum | 33% veASHA | High participation requirement |
| Approval threshold | 75% supermajority | Prevents slim-majority changes |
| Cooling-off | 14 epochs | Emergency brake opportunity |
| Objection threshold | 25% veASHA | Sends back to discussion |

## Rationale

### Why 75% Supermajority?

Simple majority (50%+1) is too easy to achieve through temporary coalition or low turnout. 75% ensures broad community consensus, making it very difficult for a well-funded minority to push through unwanted changes.

### Why a Cooling-Off Period?

The cooling-off period is an emergency brake. If the community realizes post-vote that an amendment has unintended consequences, the 25% objection mechanism provides a last chance to halt it without requiring a full re-vote.

### Why Immutable Articles?

Some protections are so fundamental that no governance process should be able to remove them. If the network can be compelled to add surveillance or remove censorship resistance, it fails its core mission. Immutable articles make this technically impossible.

## Security Considerations

- **Governance capture for amendment**: 75% threshold + 33% quorum makes capture extremely expensive
- **Rushing amendments**: Multi-phase process with minimum durations prevents rushed changes
- **Coerced voting**: Encrypted voting (PIP-0012) + coercion resistance (PIP-0003) protect voter freedom
- **Amendment of the amendment process**: Amending this PIP itself requires the same 75%/33% process, preventing meta-capture

## References

- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)
- [PIP-7001: Town Hall Protocol](./pip-7001-town-hall-protocol.md)
- [PIP-0003: Coercion Resistance](./pip-0003-coercion-resistance.md)
- [PIP-0012: Encrypted Voting](./pip-0012-encrypted-voting.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
