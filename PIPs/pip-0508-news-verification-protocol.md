---
pip: 508
title: "News Verification Protocol"
description: "Decentralized fact-checking and news verification with community consensus scoring"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Content
created: 2026-01-23
tags: [content, news, verification, fact-checking, disinformation]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a decentralized news verification protocol for the Pars Network. News articles, social media claims, and media content can be submitted for community fact-checking, where verified journalists, subject experts, and trained community members evaluate claims and publish structured verdicts. Verification results are anchored on-chain with supporting evidence, creating an immutable record of fact-checking that cannot be censored or altered. The protocol integrates with content provenance (PIP-0011) and AI detection (PIP-0405).

## Motivation

### Information Warfare Against the Diaspora

The Persian diaspora faces sophisticated disinformation:
- State media fabricates narratives and presents them as fact
- Social media is flooded with bot-generated content
- Real events are denied or reframed through coordinated campaigns
- AI-generated text and images make fabrication easier than ever
- Legitimate news sources are blocked, creating information vacuums

### Community-Powered Truth

No single fact-checker can cover the breadth of Persian-language information. A decentralized protocol leverages the collective knowledge of journalists, academics, diaspora professionals, and community members to verify claims at scale.

## Specification

### Verification Request

```go
type VerificationRequest struct {
    RequestID    [32]byte
    ClaimHash    [32]byte      // Hash of the claim to verify
    ClaimText    string        // The claim (Farsi/English)
    SourceURL    string        // Where the claim appeared
    Category     ClaimCategory
    Priority     uint8         // 1-5, set by community voting
    Requester    [32]byte      // Anonymous commitment
    Bounty       uint64        // ASHA bounty for verification
    Deadline     uint64
    Status       RequestStatus
}

type ClaimCategory uint8

const (
    CatPolitical   ClaimCategory = iota
    CatHealth
    CatScience
    CatEconomic
    CatHistorical
    CatSocial
    CatEmergency
)
```

### Verification Verdict

```go
type Verdict struct {
    VerdictID    [32]byte
    RequestID    [32]byte
    Rating       VerdictRating
    Summary      string          // Plain language summary
    Evidence     []Evidence
    Methodology  string          // How the claim was verified
    Verifier     [32]byte        // Anonymous verifier commitment
    PeerReviews  []PeerReview
    Timestamp    uint64
    SealID       [32]byte        // PIP-0010 seal
    Signature    []byte
}

type VerdictRating uint8

const (
    RatingTrue          VerdictRating = iota // Claim is accurate
    RatingMostlyTrue                          // Accurate with minor caveats
    RatingMixed                               // Partially true, partially false
    RatingMostlyFalse                         // Mostly inaccurate
    RatingFalse                               // Demonstrably false
    RatingUnverifiable                        // Cannot be verified with available evidence
    RatingManipulated                         // Real content taken out of context
)

type Evidence struct {
    Type         EvidenceType
    Description  string
    Reference    string        // URL, document hash, or citation
    ContentHash  [32]byte      // Hash if digital evidence
    ProvenanceID [32]byte      // PIP-0011 provenance (if applicable)
}

type EvidenceType uint8

const (
    EvidenceDocument    EvidenceType = iota
    EvidenceMedia
    EvidenceExpertOpinion
    EvidenceStatistical
    EvidenceFirsthand
    EvidenceAIAnalysis
)
```

### Verifier Qualification

```go
type Verifier struct {
    VerifierID   [32]byte
    Expertise    []ClaimCategory
    Reputation   uint64
    Accuracy     float64        // Historical verdict accuracy
    StakeAmount  uint64         // veASHA staked
    VerdictCount uint64
    Credentials  [][32]byte     // PIP-0507 educational credentials
}
```

Verifier tiers:
- **Expert**: Domain credential (PIP-0507) + 90% accuracy + 50 verdicts
- **Journalist**: Press credential + 85% accuracy + 25 verdicts
- **Community**: veASHA stake + 80% accuracy + 10 verdicts
- **Trainee**: veASHA stake + supervised verification

### Consensus Mechanism

Verdicts require multi-verifier consensus:

1. Minimum 3 independent verifiers per claim
2. At least 1 Expert or Journalist tier verifier
3. Weighted vote: Expert (3x), Journalist (2x), Community (1x)
4. Supermajority (67% weighted) required for final verdict
5. Dissenting opinions recorded and displayed alongside verdict

### On-Chain Registry

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

interface INewsVerification {
    function submitClaim(
        bytes32 claimHash,
        string calldata claimText,
        uint8 category
    ) external payable returns (bytes32 requestId);

    function submitVerdict(
        bytes32 requestId,
        uint8 rating,
        bytes calldata evidence,
        bytes32 sealId
    ) external returns (bytes32 verdictId);

    function finalizeVerdict(
        bytes32 requestId
    ) external returns (uint8 finalRating);

    function appealVerdict(
        bytes32 requestId,
        bytes calldata newEvidence
    ) external payable returns (bytes32 appealId);

    event ClaimSubmitted(bytes32 indexed requestId, uint8 category);
    event VerdictFinalized(bytes32 indexed requestId, uint8 rating);
}
```

## Rationale

### Why Multi-Tier Verifiers?

Not all verifiers are equal. A medical doctor's verdict on a health claim carries more weight than a general community member's. The tier system reflects expertise while still allowing broad participation.

### Why Record Dissent?

Truth is not always binary. Recording dissenting opinions acknowledges uncertainty and allows readers to form nuanced views rather than accepting a single verdict.

### Why On-Chain Verdicts?

On-chain verdicts cannot be retroactively altered. This prevents post-hoc rewriting of fact-check results under political pressure -- a real risk for centralized fact-checking organizations.

## Security Considerations

- **Coordinated manipulation**: Weighted consensus with expertise requirements prevents mob verdicts
- **Verifier bribery**: Anonymous commitments prevent targeted bribery; staking creates economic cost for dishonesty
- **Political bias**: Dissent recording and appeal mechanism; governance review for systematic bias
- **Claim flooding**: Bounty requirement deters spam; community priority voting surfaces important claims

## References

- [PIP-0011: Content Provenance](./pip-0011-content-provenance.md)
- [PIP-0405: AI Content Detection](./pip-0405-ai-content-detection.md)
- [PIP-0500: Decentralized Publishing Platform](./pip-0500-decentralized-publishing-platform.md)
- [PIP-0507: Educational Content Credentials](./pip-0507-educational-content-credentials.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
