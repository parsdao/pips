---
pip: 401
title: "Model Marketplace"
description: "On-chain marketplace for AI model trading, licensing, and discovery on Pars Network"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: AI
created: 2026-01-23
tags: [ai, marketplace, models, licensing, nft]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines an on-chain marketplace for AI models on the Pars Network. Model creators register models as on-chain assets with verifiable metadata, licensing terms, and performance benchmarks. Consumers discover, license, and deploy models through smart contracts, paying in ASHA. The marketplace supports perpetual licenses, per-inference pricing, and revenue sharing for derivative models. All transactions preserve creator privacy through anonymous commitments.

## Motivation

### Accessible AI for the Diaspora

The Persian diaspora lacks access to AI models tailored to their language and culture. Commercial providers offer limited Farsi support, and open-source models are scattered across platforms that can be blocked. A decentralized marketplace ensures:

1. **Permanent availability** -- models stored on the mesh cannot be taken down
2. **Fair compensation** -- creators earn ASHA for their work
3. **Quality signals** -- on-chain benchmarks and user ratings guide selection
4. **Cultural relevance** -- incentivizes development of Persian-first models

### Provenance and Trust

Users must trust that models are what they claim. On-chain registration with verifiable hashes, benchmark attestations, and training data provenance (PIP-0407) provides this trust without centralized authority.

## Specification

### Model Registration

```go
type ModelListing struct {
    ModelID         [32]byte   // Poseidon2(weights_hash || creator_commitment)
    WeightsHash     [32]byte   // Hash of model weights
    ConfigHash      [32]byte   // Hash of model configuration
    Name            string     // Human-readable name
    Description     string     // Model description (supports Farsi)
    Category        ModelCategory
    License         LicenseTerms
    Benchmarks      []Benchmark
    ProvenanceID    [32]byte   // PIP-0407 training data provenance
    CreatorCommit   [32]byte   // Anonymous creator identity
    Price           PriceConfig
    CreatedAt       uint64
    Signature       []byte     // ML-DSA signature
}

type ModelCategory uint8

const (
    CategoryNLP       ModelCategory = iota // Natural language processing
    CategoryVision                         // Computer vision
    CategoryAudio                          // Speech and audio
    CategoryMultimodal                     // Multi-modal models
    CategorySpecialized                    // Domain-specific
)
```

### Licensing

```go
type LicenseTerms struct {
    Type           LicenseType
    CommercialUse  bool       // Allow commercial deployment
    DerivativeWork bool       // Allow fine-tuning and derivatives
    Attribution    bool       // Require attribution
    RevenueShare   uint16     // Basis points (0-10000) for derivative revenue
    ExpiryEpoch    uint64     // License expiry (0 = perpetual)
    Restrictions   []string   // Additional restrictions in plain text
}

type LicenseType uint8

const (
    LicenseOpenSource  LicenseType = iota // Free, open weights
    LicensePerpetual                       // One-time payment
    LicensePerInference                    // Pay per use
    LicenseSubscription                    // Time-based access
)
```

### Price Configuration

```go
type PriceConfig struct {
    BasePrice       uint64  // ASHA for license acquisition
    PerTokenPrice   uint64  // ASHA per inference token (for per-inference)
    BulkDiscounts   []BulkTier
    StakingDiscount uint16  // Basis points discount for veASHA stakers
}

type BulkTier struct {
    MinTokens uint64
    Discount  uint16 // Basis points
}
```

### Marketplace Contract

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

interface IModelMarketplace {
    function listModel(
        bytes32 weightsHash,
        bytes32 configHash,
        string calldata metadata,
        bytes calldata licenseTerms,
        uint256 basePrice
    ) external returns (bytes32 modelId);

    function purchaseLicense(
        bytes32 modelId,
        uint8 licenseType
    ) external payable returns (bytes32 licenseId);

    function rateModel(
        bytes32 modelId,
        uint8 score,
        bytes calldata review
    ) external;

    function claimRevenue(bytes32 modelId) external returns (uint256 amount);

    event ModelListed(bytes32 indexed modelId, bytes32 indexed creator);
    event LicensePurchased(bytes32 indexed modelId, bytes32 indexed licenseId);
    event RevenueDistributed(bytes32 indexed modelId, uint256 amount);
}
```

### Discovery and Search

Models are indexed on the mesh DAG with searchable metadata:
- Full-text search in Farsi and English
- Category and capability filters
- Benchmark score ranking
- Community rating aggregation
- Compatibility tags (PIP-0403 compliance, hardware requirements)

## Rationale

### Why On-Chain Licensing?

On-chain licenses are enforceable, transparent, and survive platform changes. Creators retain control without depending on centralized marketplaces that can freeze accounts or change terms unilaterally.

### Why Revenue Sharing for Derivatives?

Fine-tuned models build on original work. Automatic revenue sharing through smart contracts ensures original creators benefit from derivative success without requiring trust or legal enforcement.

### Why Anonymous Creators?

Model creators in the Persian diaspora may face risks from publishing AI tools that could be used for circumvention. Anonymous commitments protect creators while maintaining accountability through on-chain reputation.

## Security Considerations

- **Model poisoning**: Benchmark verification and community reviews provide defense; flagged models are delisted by DAO vote (PIP-0406)
- **License circumvention**: On-chain licenses do not prevent off-chain redistribution; social and economic incentives align behavior
- **Price manipulation**: Oracle-free pricing; market dynamics determine fair value
- **Sybil ratings**: Rating requires veASHA stake; quadratic weighting reduces impact of fake reviews

## References

- [PIP-0400: Decentralized Inference Protocol](./pip-0400-decentralized-inference-protocol.md)
- [PIP-0402: Compute Credit System](./pip-0402-compute-credit-system.md)
- [PIP-0406: Model Governance DAO](./pip-0406-model-governance-dao.md)
- [PIP-0407: Training Data Provenance](./pip-0407-training-data-provenance.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
