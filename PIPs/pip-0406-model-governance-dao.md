---
pip: 406
title: "Model Governance DAO"
description: "DAO governance for AI model deployment, safety review, and delisting decisions on Pars Network"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: AI
created: 2026-01-23
tags: [ai, governance, dao, model-safety, review]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines the Model Governance DAO, a specialized sub-DAO within the Pars governance framework (PIP-7000) responsible for overseeing AI model deployment on the network. The DAO reviews models for safety, approves deployment to the marketplace (PIP-0401), handles delisting of harmful models, and governs updates to detection systems (PIP-0405). Voting uses veASHA with quadratic weighting to prevent plutocratic capture.

## Motivation

### Responsible AI Without Centralization

AI models can cause harm: biased outputs, privacy violations, weaponized deepfakes. Centralized platforms address this with content policies enforced by corporate teams. Pars cannot rely on centralized governance without reintroducing the censorship risk the network exists to prevent.

The Model Governance DAO provides community-driven oversight that:
1. Prevents harmful models without enabling censorship
2. Responds to evolving threats through democratic process
3. Maintains transparency in all decisions
4. Protects minority viewpoints through quadratic voting

### Anti-Censorship Safeguard

The DAO explicitly prohibits delisting models based on political content, cultural expression, or criticism of any government. Only models that cause direct harm (weaponized deepfakes, privacy-violating surveillance tools, exploit generators) qualify for delisting.

## Specification

### DAO Structure

```go
type ModelGovernanceDAO struct {
    DAOID         [32]byte
    ParentDAO     [32]byte      // Reference to PIP-7000 root DAO
    Members       []DAOMember
    Committees    []ReviewCommittee
    Proposals     []ModelProposal
    Constitution  [32]byte      // Hash of governance constitution
}

type ReviewCommittee struct {
    CommitteeID   [32]byte
    Name          string        // e.g., "Safety Review", "Persian NLP Quality"
    Members       [][32]byte    // Anonymous member commitments
    Quorum        uint32        // Minimum votes for decisions
    Specialty     string        // Area of expertise
}
```

### Proposal Types

```go
type ModelProposal struct {
    ProposalID   [32]byte
    Type         ProposalType
    ModelID      [32]byte      // Target model (if applicable)
    Description  string
    Evidence     []byte        // Supporting evidence
    Proposer     [32]byte      // Anonymous commitment
    VotingStart  uint64
    VotingEnd    uint64
    Status       ProposalStatus
}

type ProposalType uint8

const (
    ProposalDelist       ProposalType = iota // Remove model from marketplace
    ProposalApprove                          // Approve model for marketplace
    ProposalUpdatePolicy                     // Change governance policy
    ProposalUpdateDetector                   // Update AI detection models
    ProposalGrantFunding                     // Fund model development
    ProposalAppeal                           // Appeal a previous decision
)
```

### Voting Mechanism

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

interface IModelGovernance {
    function submitProposal(
        uint8 proposalType,
        bytes32 modelId,
        string calldata description,
        bytes calldata evidence
    ) external returns (bytes32 proposalId);

    function vote(
        bytes32 proposalId,
        bool support,
        uint256 veASHAAmount
    ) external;

    function executeProposal(bytes32 proposalId) external;

    function appeal(
        bytes32 proposalId,
        bytes calldata newEvidence
    ) external returns (bytes32 appealId);

    event ProposalCreated(bytes32 indexed proposalId, uint8 proposalType);
    event ProposalExecuted(bytes32 indexed proposalId, bool passed);
    event ModelDelisted(bytes32 indexed modelId, bytes32 indexed proposalId);
}
```

### Delisting Criteria

Models may only be delisted for:
1. **Weaponized deepfakes** -- models specifically designed to create non-consensual synthetic media of real people
2. **Surveillance tools** -- models designed to identify or track individuals without consent
3. **Exploit generators** -- models that generate malware, zero-day exploits, or attack tools
4. **Training data violations** -- models trained on data obtained through coercion or without consent
5. **Fraud enablement** -- models designed for identity theft or financial fraud

Models may NOT be delisted for:
- Political content or criticism of any government
- Cultural or religious expression
- Satire, parody, or artistic expression
- General-purpose capabilities that could theoretically be misused

### Appeal Process

Any delisting decision can be appealed:
1. Appeal submitted with new evidence or arguments
2. Full DAO vote (not just committee) with higher quorum requirement
3. Supermajority (67%) required to uphold delisting on appeal
4. Maximum one appeal per delisting decision

## Rationale

### Why Quadratic Voting?

Standard token-weighted voting allows wealthy actors to dominate. Quadratic voting (cost = votes^2) gives meaningful voice to smaller stakeholders, critical for a community governance model where diverse perspectives matter.

### Why Explicit Anti-Censorship Rules?

Without explicit protections, governance capture could turn the DAO into a censorship tool. Constitutional anti-censorship rules require supermajority amendment (PIP-7015) and are designed to be extremely difficult to change.

### Why Committee Structure?

Different model types require different expertise. A vision model safety review needs different skills than a Persian NLP quality review. Committees enable specialized evaluation while the full DAO retains final authority.

## Security Considerations

- **Governance capture**: Quadratic voting and quorum requirements prevent minority capture
- **Censorship creep**: Constitutional protections with supermajority amendment requirements
- **Voter apathy**: Delegation marketplace (PIP-7012) enables passive participation
- **Bribery**: Anonymous voting through PIP-0012 encrypted ballots prevents targeted bribery

## References

- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)
- [PIP-0401: Model Marketplace](./pip-0401-model-marketplace.md)
- [PIP-0405: AI Content Detection](./pip-0405-ai-content-detection.md)
- [PIP-0012: Encrypted Voting](./pip-0012-encrypted-voting.md)
- [PIP-7015: Constitutional Amendment Process](./pip-7015-constitutional-amendment-process.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
