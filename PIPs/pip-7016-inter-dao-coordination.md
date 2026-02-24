---
pip: 7016
title: "Inter-DAO Coordination"
description: "Protocol for coordination between Pars sub-DAOs with shared resource management and conflict resolution"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Governance
created: 2026-01-23
tags: [governance, dao, coordination, inter-dao, federation]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a protocol for coordination between Pars sub-DAOs. The Pars governance ecosystem includes multiple specialized DAOs: the root DAO (PIP-7000), Model Governance DAO (PIP-0406), Shadow Government (PIP-7010), and community-created sub-DAOs for specific projects or regions. This protocol establishes how sub-DAOs communicate, share resources, resolve conflicts, and coordinate on cross-cutting proposals. It provides a federated governance structure where sub-DAOs maintain autonomy while cooperating on shared infrastructure.

## Motivation

### The Coordination Problem

As the Pars ecosystem grows, governance naturally fragments into specialized sub-DAOs:
- AI & Compute governance has different expertise than cultural preservation
- Regional diaspora communities have distinct needs and priorities
- Technical infrastructure decisions require different stakeholders than community programs

Without coordination, sub-DAOs risk:
1. **Resource conflicts** -- competing for the same treasury funds
2. **Policy contradictions** -- sub-DAO decisions that conflict with each other
3. **Duplication** -- multiple DAOs working on the same problem
4. **Governance gaps** -- issues that fall between sub-DAO jurisdictions

### Federated Autonomy

The inter-DAO protocol preserves sub-DAO autonomy while providing coordination mechanisms. Sub-DAOs govern their own domains independently but coordinate through structured protocols when their decisions affect each other.

## Specification

### Sub-DAO Registry

```go
type SubDAO struct {
    DAOID         [32]byte
    Name          string
    Description   string
    ParentDAO     [32]byte     // Root DAO or parent sub-DAO
    Domain        string       // Area of jurisdiction
    Members       uint64       // Member count
    TreasuryAlloc uint64       // ASHA allocated from parent treasury
    Autonomy      AutonomyLevel
    Contacts      [][32]byte   // Cross-DAO liaison commitments
    CreatedAt     uint64
}

type AutonomyLevel uint8

const (
    AutonomyFull     AutonomyLevel = iota // Independent decisions, own treasury
    AutonomyPartial                        // Independent within delegated scope
    AutonomyAdvisory                       // Advisory only, root DAO decides
)
```

### Cross-DAO Proposal

When a proposal affects multiple sub-DAOs:

```go
type CrossDAOProposal struct {
    ProposalID     [32]byte
    Title          string
    Description    string
    AffectedDAOs   [][32]byte    // Sub-DAOs that must approve
    Proposer       [32]byte
    ProposerDAO    [32]byte      // Originating sub-DAO
    RequiredApproval ApprovalType
    Votes          map[[32]byte]DAOVote
    Status         ProposalStatus
    Deadline       uint64
}

type ApprovalType uint8

const (
    ApprovalUnanimous  ApprovalType = iota // All affected DAOs must approve
    ApprovalMajority                        // Majority of affected DAOs
    ApprovalWeighted                        // Weighted by DAO size/stake
)

type DAOVote struct {
    DAOID      [32]byte
    Decision   bool
    VoteEpoch  uint64
    Conditions []string   // Conditional approval terms
}
```

### Resource Sharing

```go
type ResourceSharingAgreement struct {
    AgreementID  [32]byte
    DAOs         [][32]byte     // Participating sub-DAOs
    ResourceType ResourceType
    Terms        SharingTerms
    Duration     uint64         // Epochs
    Status       AgreementStatus
}

type ResourceType uint8

const (
    ResourceTreasury   ResourceType = iota // Shared funding
    ResourceCompute                         // Shared compute resources
    ResourceData                            // Shared datasets
    ResourceInfra                           // Shared infrastructure
    ResourceExpertise                       // Shared human resources
)

type SharingTerms struct {
    Contributions map[[32]byte]uint64 // DAO -> amount contributed
    AccessRights  map[[32]byte]uint8  // DAO -> access level (1-3)
    GovernanceRights map[[32]byte]uint16 // DAO -> voting weight (BPS)
    DisputeResolution [32]byte         // Conflict resolution protocol
}
```

### Conflict Resolution

```go
type Conflict struct {
    ConflictID    [32]byte
    Parties       [][32]byte     // Conflicting sub-DAOs
    Description   string
    Category      ConflictCategory
    Resolution    *Resolution
    Mediator      [32]byte       // Assigned mediator (if applicable)
    EscalatedTo   [32]byte       // Parent DAO (if escalated)
}

type ConflictCategory uint8

const (
    ConflictJurisdiction ConflictCategory = iota // Overlapping authority
    ConflictResource                               // Resource allocation dispute
    ConflictPolicy                                 // Contradictory policies
    ConflictMembership                             // Member loyalty conflicts
)
```

Resolution process:
1. **Direct negotiation**: Affected sub-DAOs attempt bilateral resolution (7 epochs)
2. **Mediation**: Neutral mediator from another sub-DAO facilitates agreement (14 epochs)
3. **Arbitration**: Root DAO arbitration panel makes binding decision (21 epochs)
4. **Root DAO vote**: Full DAO vote as final appeal (standard governance timeline)

### Smart Contract

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

interface IInterDAOCoordination {
    function registerSubDAO(
        string calldata name,
        string calldata domain,
        bytes32 parentDAO,
        uint8 autonomyLevel
    ) external returns (bytes32 daoId);

    function submitCrossDAOProposal(
        bytes32[] calldata affectedDAOs,
        string calldata description,
        uint8 approvalType
    ) external returns (bytes32 proposalId);

    function submitDAOVote(
        bytes32 proposalId,
        bytes32 daoId,
        bool approve,
        string calldata conditions
    ) external;

    function createResourceAgreement(
        bytes32[] calldata daos,
        uint8 resourceType,
        bytes calldata terms
    ) external returns (bytes32 agreementId);

    function fileConflict(
        bytes32[] calldata parties,
        uint8 category,
        string calldata description
    ) external returns (bytes32 conflictId);

    function resolveConflict(
        bytes32 conflictId,
        bytes calldata resolution
    ) external;

    event SubDAORegistered(bytes32 indexed daoId, bytes32 indexed parentDAO);
    event CrossDAOProposalCreated(bytes32 indexed proposalId);
    event ConflictFiled(bytes32 indexed conflictId, uint8 category);
    event ConflictResolved(bytes32 indexed conflictId);
}
```

### Communication Protocol

Sub-DAOs communicate through:
- **Liaison delegates**: Each sub-DAO appoints liaisons to neighboring DAOs
- **Shared channels**: Encrypted group channels (PIP-0005) for inter-DAO discussion
- **Cross-DAO town halls**: Joint meetings for major cross-cutting issues (PIP-7001)
- **Event subscriptions**: Sub-DAOs subscribe to relevant events from other DAOs

### Hierarchy

```
Root DAO (PIP-7000)
├── Model Governance DAO (PIP-0406)
├── Shadow Government (PIP-7010)
├── Treasury Committee (PIP-7002)
├── AI & Compute Council (proposed)
├── Cultural Preservation DAO (proposed)
├── Regional DAOs
│   ├── North America
│   ├── Europe
│   ├── Middle East
│   └── Asia-Pacific
└── Project DAOs (community-created)
```

## Rationale

### Why Federated Over Hierarchical?

Pure hierarchy concentrates power at the root and creates bottlenecks. Federation allows sub-DAOs to operate independently in their domains while coordinating only when necessary. This mirrors how successful distributed systems work.

### Why Structured Conflict Resolution?

Without formal conflict resolution, inter-DAO disputes escalate to political battles that damage the community. A structured process with escalation paths resolves conflicts efficiently and fairly.

### Why Liaison Delegates?

Sub-DAOs need human bridges. Liaison delegates who participate in multiple DAOs understand the perspectives and constraints of each, enabling better coordination than purely mechanical protocols.

## Security Considerations

- **Sub-DAO capture**: Captured sub-DAOs are limited by their autonomy level and domain scope; root DAO retains override authority
- **Resource hoarding**: Sharing agreements with transparent terms prevent unilateral resource capture
- **Governance deadlock**: Escalation paths with time limits prevent permanent deadlock
- **Sybil sub-DAOs**: Sub-DAO registration requires root DAO approval; minimum stake prevents proliferation

## References

- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)
- [PIP-7001: Town Hall Protocol](./pip-7001-town-hall-protocol.md)
- [PIP-7002: Treasury Management](./pip-7002-treasury-management.md)
- [PIP-0406: Model Governance DAO](./pip-0406-model-governance-dao.md)
- [PIP-7010: Shadow Government Protocol](./pip-7010-shadow-governance.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
