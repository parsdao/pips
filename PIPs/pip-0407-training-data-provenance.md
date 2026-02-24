---
pip: 407
title: "Training Data Provenance"
description: "Verifiable provenance chain for AI training datasets with consent tracking and attribution"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: AI
created: 2026-01-23
tags: [ai, provenance, training-data, consent, attribution]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a verifiable provenance system for AI training datasets on the Pars Network. Every dataset used to train models registered on the marketplace (PIP-0401) must have a provenance record that tracks data sources, consent status, preprocessing steps, and contributor attribution. Provenance records are anchored on-chain using PIP-0010 data integrity seals and support privacy-preserving consent verification through zero-knowledge proofs.

## Motivation

### Ethical Data Sourcing

AI models are only as trustworthy as their training data. The Persian diaspora must be able to verify:

1. **Consent** -- was the data contributed voluntarily or scraped without permission?
2. **Source** -- does the data come from authentic Persian sources or machine-translated content?
3. **Processing** -- was the data filtered, cleaned, or modified, and how?
4. **Bias** -- does the dataset represent diverse Persian-speaking communities fairly?

### Accountability Without Surveillance

Traditional data provenance requires centralized registries that track who contributed what. In the Pars context, this would create a surveillance tool. PIP-0407 provides provenance verification without revealing individual contributor identities.

## Specification

### Dataset Provenance Record

```go
type DatasetProvenance struct {
    DatasetID       [32]byte      // Poseidon2(data_hash || creator_commitment)
    DataHash        [32]byte      // Hash of complete dataset
    Version         uint32        // Dataset version
    ParentID        [32]byte      // Previous version (zero for originals)
    Sources         []DataSource
    Processing      []ProcessingStep
    ConsentProof    []byte        // ZK proof that all data has valid consent
    Statistics      DatasetStats
    SealID          [32]byte      // PIP-0010 data integrity seal
    CreatorCommit   [32]byte      // Anonymous creator commitment
    CreatedAt       uint64
    Signature       []byte
}

type DataSource struct {
    SourceID     [32]byte
    Type         SourceType
    Description  string
    ConsentType  ConsentType
    SampleCount  uint64
    Language     string     // ISO 639-1 code
    Dialect      string     // e.g., "tehrani", "isfahani", "dari"
}

type SourceType uint8

const (
    SourcePublicDomain  SourceType = iota // Out of copyright
    SourceOpenLicense                      // CC, MIT, etc.
    SourceContributed                      // Voluntarily contributed
    SourceFederated                        // Federated learning (PIP-0404)
    SourceSynthetic                        // AI-generated training data
)

type ConsentType uint8

const (
    ConsentExplicit    ConsentType = iota // Individual opt-in
    ConsentLicense                         // Published under open license
    ConsentPublicDomain                    // No consent needed
    ConsentFederated                       // Implicit via FL participation
)
```

### Processing Chain

```go
type ProcessingStep struct {
    StepID      [32]byte
    Operation   string      // e.g., "deduplication", "filtering", "tokenization"
    InputHash   [32]byte    // Hash of data before this step
    OutputHash  [32]byte    // Hash of data after this step
    Parameters  []byte      // Processing parameters
    ToolVersion string      // Version of processing tool
    Timestamp   uint64
}
```

### Consent Verification

```go
// VerifyConsent generates a ZK proof that all data sources have valid consent
func VerifyConsent(sources []DataSource) ([]byte, error) {
    for _, source := range sources {
        switch source.ConsentType {
        case ConsentExplicit:
            // Verify individual consent records exist (without revealing identities)
            if err := verifyExplicitConsent(source); err != nil {
                return nil, fmt.Errorf("source %x: %w", source.SourceID[:4], err)
            }
        case ConsentLicense:
            // Verify license is valid and covers AI training
            if err := verifyLicense(source); err != nil {
                return nil, fmt.Errorf("source %x: %w", source.SourceID[:4], err)
            }
        case ConsentPublicDomain:
            // Verify public domain status
            if err := verifyPublicDomain(source); err != nil {
                return nil, fmt.Errorf("source %x: %w", source.SourceID[:4], err)
            }
        }
    }

    // Generate aggregate ZK proof
    return zk.ProveAllConsent(sources)
}
```

### On-Chain Registration

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

interface IDataProvenance {
    function registerDataset(
        bytes32 dataHash,
        bytes32 parentId,
        bytes calldata consentProof,
        bytes32 sealId
    ) external returns (bytes32 datasetId);

    function verifyProvenance(
        bytes32 datasetId
    ) external view returns (bool valid, uint32 version, uint64 timestamp);

    function reportViolation(
        bytes32 datasetId,
        bytes calldata evidence
    ) external returns (bytes32 reportId);

    event DatasetRegistered(bytes32 indexed datasetId, bytes32 indexed sealId);
    event ViolationReported(bytes32 indexed datasetId, bytes32 indexed reportId);
}
```

### Dataset Statistics

```go
type DatasetStats struct {
    TotalSamples   uint64
    Languages      map[string]uint64  // Language distribution
    Dialects       map[string]uint64  // Dialect distribution
    SourceTypes    map[SourceType]uint64
    DateRange      [2]uint64          // Earliest and latest timestamps
    DuplicateRate  float64            // Deduplication metric
    BiasMetrics    BiasReport
}

type BiasReport struct {
    GenderBalance    float64  // 0.0 = extreme bias, 1.0 = perfectly balanced
    DialectCoverage  float64  // Coverage of Persian dialects
    TopicDiversity   float64  // Diversity of topics represented
    TemporalBalance  float64  // Balance across time periods
}
```

## Rationale

### Why On-Chain Provenance?

Off-chain provenance can be forged, deleted, or altered. On-chain records with data integrity seals (PIP-0010) provide immutable, verifiable provenance that persists regardless of any single party's actions.

### Why Zero-Knowledge Consent?

Individual consent records could be used to identify contributors. ZK proofs verify that consent exists without revealing who consented, protecting contributor privacy.

### Why Bias Metrics?

Persian language data is not monolithic. Training data that over-represents Tehrani dialect, modern text, or male authors produces biased models. Mandatory bias metrics make these imbalances visible.

## Security Considerations

- **Consent forgery**: ZK proofs require valid consent witnesses; forging requires breaking the proof system
- **Data poisoning**: Provenance does not prevent poisoned data but enables tracing the source
- **Privacy of contributors**: Contributor identities are never on-chain; only aggregate consent proofs
- **Retroactive consent withdrawal**: Supported via revocation proofs; triggers re-evaluation of affected datasets

## References

- [PIP-0010: Data Integrity Seal](./pip-0010-data-integrity-seal.md)
- [PIP-0401: Model Marketplace](./pip-0401-model-marketplace.md)
- [PIP-0403: Persian NLP Model Standard](./pip-0403-persian-nlp-model-standard.md)
- [PIP-0404: Federated Learning Framework](./pip-0404-federated-learning-framework.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
