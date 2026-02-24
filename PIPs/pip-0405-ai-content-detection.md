---
pip: 405
title: "AI Content Detection"
description: "On-chain attestation framework for distinguishing AI-generated from human-created content"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: AI
created: 2026-01-23
tags: [ai, detection, attestation, deepfake, content-authenticity]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines an on-chain attestation framework for AI-generated content detection on the Pars Network. Content creators and publishers can submit media for AI detection analysis, and the results are anchored on-chain as verifiable attestations. The framework supports text, image, audio, and video content, with specialized detectors for Persian-language content. Attestations are non-binary probability scores with confidence intervals, acknowledging the inherent uncertainty in detection.

## Motivation

### The Disinformation Threat to the Diaspora

State actors use AI-generated content to:
- Fabricate confessions and incriminating evidence
- Create deepfakes of diaspora leaders to discredit movements
- Generate fake news articles in Persian to sow confusion
- Produce synthetic audio of activists saying things they never said

Conversely, authentic evidence is dismissed as "AI-generated" to deny atrocities. The diaspora needs tools to verify content authenticity and anchor detection results in an immutable, censorship-resistant record.

### Extends PIP-0011

PIP-0011 (Content Provenance) provides capture-time authentication. This PIP complements it by providing post-hoc detection for content that lacks provenance records -- images shared on social media, leaked documents, or legacy content.

## Specification

### Detection Request

```go
type DetectionRequest struct {
    RequestID    [32]byte
    ContentHash  [32]byte     // Hash of content to analyze
    ContentType  ContentType  // text, image, audio, video
    ContentRef   []byte       // Encrypted reference to content location
    Requester    [32]byte     // Anonymous commitment
    Timestamp    uint64
}

type ContentType uint8

const (
    ContentText  ContentType = iota
    ContentImage
    ContentAudio
    ContentVideo
)
```

### Attestation Record

```go
type AIAttestation struct {
    AttestationID  [32]byte
    ContentHash    [32]byte
    Scores         []DetectorScore
    AggregateScore float64      // Weighted ensemble [0.0 = human, 1.0 = AI]
    Confidence     float64      // Confidence in aggregate score
    DetectorSet    string       // Version of detector ensemble
    Timestamp      uint64
    AnalystNodes   [][32]byte   // Nodes that performed analysis
    Signatures     [][]byte     // ML-DSA signatures from analyst nodes
}

type DetectorScore struct {
    Method     string   // e.g., "spectral", "linguistic", "noise-pattern"
    Score      float64  // Individual detector score [0.0, 1.0]
    Confidence float64  // Detector confidence
    Details    []byte   // Method-specific analysis details
}
```

### Persian-Specific Detectors

```go
type PersianTextDetector struct {
    // Perplexity analysis tuned for Persian text
    PerplexityAnalysis  func(text []byte) DetectorScore
    // Persian stylometric analysis (sentence structure, word choice)
    StylometricAnalysis func(text []byte) DetectorScore
    // ZWNJ pattern analysis (AI often mishandles ZWNJ)
    ZWNJAnalysis        func(text []byte) DetectorScore
    // Ezafe construction correctness
    EzafeAnalysis       func(text []byte) DetectorScore
    // Cultural reference verification
    CulturalRefCheck    func(text []byte) DetectorScore
}
```

### On-Chain Attestation

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

interface IAIDetection {
    function submitAttestation(
        bytes32 contentHash,
        uint256 aggregateScore,
        uint256 confidence,
        bytes calldata detectorSignatures
    ) external returns (bytes32 attestationId);

    function getAttestation(
        bytes32 contentHash
    ) external view returns (
        uint256 score,
        uint256 confidence,
        uint64 timestamp,
        uint32 analystCount
    );

    function challengeAttestation(
        bytes32 attestationId,
        bytes calldata counterEvidence
    ) external returns (bytes32 challengeId);

    event AttestationCreated(bytes32 indexed contentHash, uint256 score);
    event AttestationChallenged(bytes32 indexed attestationId);
}
```

### Multi-Node Consensus

Detection is performed by multiple independent nodes to prevent single-node manipulation:

1. Request is broadcast to N detection nodes (minimum 3)
2. Each node runs its detector suite independently
3. Results are submitted as encrypted commitments
4. After all submissions, commitments are revealed
5. Outlier detection removes potentially compromised nodes
6. Remaining scores are aggregated with confidence-weighted averaging

## Rationale

### Why Probabilistic Scores?

Binary "AI" / "not AI" classifications are unreliable. Detection is an arms race -- as generators improve, detectors lag. Probabilistic scores with confidence intervals accurately represent the state of knowledge and prevent false certainty.

### Why Multi-Node Consensus?

A single detection node could be bribed or compromised to produce false attestations. Multi-node consensus with outlier detection ensures no single node can determine the outcome.

### Why Persian-Specific Detectors?

Persian text has unique characteristics (ZWNJ, ezafe, right-to-left) that general-purpose detectors miss. AI text generators commonly produce subtle errors in these features that Persian-specific detectors can identify.

## Security Considerations

- **Adversarial evasion**: Attackers may craft content to fool detectors; multi-method ensemble reduces evasion surface
- **False positives**: Human content misclassified as AI can damage reputations; challenge mechanism allows disputes
- **Detector poisoning**: Detection model updates require DAO approval (PIP-0406)
- **Privacy of analyzed content**: Content is referenced by hash; actual content is not stored on-chain

## References

- [PIP-0011: Content Provenance](./pip-0011-content-provenance.md)
- [PIP-0400: Decentralized Inference Protocol](./pip-0400-decentralized-inference-protocol.md)
- [PIP-0406: Model Governance DAO](./pip-0406-model-governance-dao.md)
- [C2PA Specification](https://c2pa.org/specifications/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
