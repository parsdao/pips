---
pip: 500
title: "Decentralized Publishing Platform"
description: "Censorship-resistant publishing platform for Persian content with mesh-native distribution"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Content
created: 2026-01-23
tags: [content, publishing, censorship-resistance, persian, mesh]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a decentralized publishing platform for Persian content on the Pars Network. Authors publish articles, essays, poetry, and long-form content to the mesh DAG where it is replicated across nodes and cannot be censored or removed by any single authority. Content is addressed by hash, versioned through CRDTs (PIP-0013), and monetized through the creator protocol (PIP-0502). The platform supports both public and encrypted publishing, with the author controlling access.

## Motivation

### Censorship of Persian Expression

Persian-language publishing faces systematic censorship:
- Domestic platforms are government-controlled and routinely remove content
- International platforms comply with sanctions or are blocked entirely
- Physical publishing is subject to pre-publication censorship
- Authors face imprisonment for published work

The diaspora needs a publishing platform that is technically impossible to censor.

### Preserving Persian Literary Culture

Persian has one of the world's richest literary traditions spanning 1,200+ years. Contemporary authors continue this tradition but face unprecedented barriers to publication. A decentralized platform ensures that Persian literature, journalism, and scholarship persists regardless of political conditions.

## Specification

### Publication Structure

```go
type Publication struct {
    PubID        [32]byte      // Content-addressed ID
    Title        string        // Supports full Unicode/Farsi
    Content      []byte        // Markdown with RTL support
    ContentHash  [32]byte      // Poseidon2 hash of content
    Author       [32]byte      // Anonymous commitment
    Category     PubCategory
    Language     string        // ISO 639-1 (fa, fa-AF, tg)
    Tags         []string
    Version      uint32
    ParentID     [32]byte      // Previous version (zero for first)
    AccessPolicy AccessPolicy
    SealID       [32]byte      // PIP-0010 data integrity seal
    CreatedAt    uint64
    Signature    []byte        // ML-DSA signature
}

type PubCategory uint8

const (
    CatArticle    PubCategory = iota
    CatEssay
    CatPoetry
    CatFiction
    CatJournalism
    CatAcademic
    CatEditorial
    CatTranslation
)

type AccessPolicy struct {
    Type       AccessType
    EncKey     []byte     // Encrypted content key (for restricted access)
    PriceASHA  uint64     // Price in ASHA (for paid content)
    FreeAfter  uint64     // Epoch after which content becomes free
}

type AccessType uint8

const (
    AccessPublic     AccessType = iota // Free and open
    AccessPaid                          // Requires ASHA payment
    AccessSubscriber                    // Requires subscription NFT
    AccessEncrypted                     // Private, key-holder only
)
```

### Mesh Distribution

Publications are stored on the mesh DAG (PIP-0001):
1. Content is chunked and content-addressed
2. Each chunk is replicated to minimum 5 mesh nodes
3. Popular content is replicated more widely (demand-based)
4. Content is retrievable even if the original publisher goes offline
5. RTL text rendering is handled client-side; storage is raw UTF-8

### Publishing Contract

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

interface IPublishing {
    function publish(
        bytes32 contentHash,
        string calldata metadata,
        uint8 accessType,
        uint256 priceASHA
    ) external returns (bytes32 pubId);

    function updatePublication(
        bytes32 pubId,
        bytes32 newContentHash,
        string calldata metadata
    ) external returns (bytes32 newPubId);

    function purchaseAccess(
        bytes32 pubId
    ) external payable returns (bool);

    function tipAuthor(
        bytes32 pubId
    ) external payable;

    event Published(bytes32 indexed pubId, bytes32 indexed author);
    event AccessPurchased(bytes32 indexed pubId, address indexed reader);
    event AuthorTipped(bytes32 indexed pubId, uint256 amount);
}
```

### Content Discovery

Content is discoverable through:
- Full-text search in Farsi and English across the mesh
- Category and tag-based browsing
- Author subscription feeds
- Community curation through staked recommendations
- AI-powered recommendations (PIP-0400) respecting user privacy

### Author Reputation

Authors build pseudonymous reputation through:
- Publication count and consistency
- Reader engagement (tips, purchases, shares)
- Community curation votes
- Cross-references from other authors
- PIP-0403 quality scores for writing quality

## Rationale

### Why Content-Addressed Storage?

Content-addressed storage makes censorship technically impossible. To remove content, an adversary would need to identify and compromise every node storing that content hash. With mesh replication, this is infeasible.

### Why Support Both Public and Encrypted?

Some content (journalism, political commentary) must be public. Other content (personal writing, draft manuscripts, sensitive reports) requires privacy. A single platform supporting both avoids fragmenting the community across tools.

### Why Anonymous Authorship?

Authors inside Iran face imprisonment for published work. Anonymous commitments allow authors to build reputation and earn revenue without revealing identity. Pseudonymous identities can be voluntarily de-anonymized later if conditions change.

## Security Considerations

- **Content removal**: Technically infeasible once content is replicated across mesh; this is by design
- **Author deanonymization**: Anonymous commitments with mesh routing (PIP-0001) prevent traffic analysis
- **Spam flooding**: Publishing requires veASHA stake; spam is economically deterred
- **Illegal content**: DAO governance (PIP-7000) can flag content but cannot remove it from the mesh; social consensus determines community norms

## References

- [PIP-0001: Mesh Network](./pip-0001-mesh-network.md)
- [PIP-0010: Data Integrity Seal](./pip-0010-data-integrity-seal.md)
- [PIP-0013: Encrypted CRDT](./pip-0013-encrypted-crdt.md)
- [PIP-0502: Creator Monetization Protocol](./pip-0502-creator-monetization-protocol.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
