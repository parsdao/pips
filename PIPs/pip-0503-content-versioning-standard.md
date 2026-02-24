---
pip: 503
title: "Content Versioning Standard"
description: "CRDT-based content versioning for collaborative editing with conflict-free merging"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Content
created: 2026-01-23
tags: [content, versioning, crdt, collaboration, editing]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a content versioning standard for the Pars Network based on Conflict-free Replicated Data Types (CRDTs). Authors and collaborators can edit documents concurrently without coordination, and all changes merge deterministically without conflicts. The standard extends PIP-0013 (Encrypted CRDT) with a versioning layer that tracks edit history, supports branching and merging, and provides attribution without revealing editor identities. It is the foundation for collaborative publishing (PIP-0500) and wiki-style community knowledge bases.

## Motivation

### Offline-First Collaboration

The Pars mesh network (PIP-0001) is designed for intermittent connectivity. Traditional version control (Git, Google Docs) requires a central server or frequent synchronization. CRDTs enable true offline-first collaboration where:

1. Editors work independently without connectivity
2. Changes merge automatically when connectivity is restored
3. No conflicts -- ever -- regardless of edit ordering
4. Full history preserved for every character

### Censorship-Resistant Knowledge

Collaborative documents on the mesh cannot be taken down. A community wiki about human rights, a collaboratively edited history textbook, or a crowdsourced legal guide persists as long as any participating node is online.

## Specification

### Document Structure

```go
type VersionedDocument struct {
    DocID        [32]byte
    RootVersion  [32]byte          // First version hash
    CurrentHead  [32]byte          // Latest version hash
    Content      *RGADocument      // PIP-0013 RGA CRDT
    Branches     map[string][32]byte // Named branches
    Metadata     DocMetadata
    ACL          AccessControlList
}

type DocMetadata struct {
    Title       string
    Language    string   // ISO 639-1
    Category    string
    Tags        []string
    CreatedAt   uint64
    UpdatedAt   uint64
}
```

### Version Graph

```go
type Version struct {
    VersionID   [32]byte     // Poseidon2(parent_ids || operations_hash)
    ParentIDs   [][32]byte   // One parent = linear; two = merge
    Operations  []CRDTOp     // CRDT operations in this version
    Author      [32]byte     // Anonymous editor commitment
    Timestamp   uint64
    Message     string       // Version message (like commit message)
    Signature   []byte       // ML-DSA signature
}

type CRDTOp struct {
    OpType    OpType
    Position  RGAPosition    // Position in RGA sequence
    Content   []byte         // Inserted content (for insert ops)
    Tombstone bool           // Deletion marker
}

type OpType uint8

const (
    OpInsert  OpType = iota
    OpDelete
    OpFormat               // Bold, italic, heading, etc.
    OpAnnotate             // Comment or annotation
)
```

### Branching and Merging

```go
// CreateBranch creates a named branch at a specific version
func (doc *VersionedDocument) CreateBranch(name string, versionID [32]byte) error {
    doc.Branches[name] = versionID
    return nil
}

// MergeBranches merges two branches; CRDT guarantees conflict-free merge
func (doc *VersionedDocument) MergeBranches(branchA, branchB string) (*Version, error) {
    versionA := doc.Branches[branchA]
    versionB := doc.Branches[branchB]

    // Collect all operations from both branches since common ancestor
    ancestor := findCommonAncestor(versionA, versionB)
    opsA := collectOps(ancestor, versionA)
    opsB := collectOps(ancestor, versionB)

    // CRDT merge: apply all operations; ordering is deterministic
    mergedOps := mergeOps(opsA, opsB)

    return &Version{
        VersionID: computeVersionID([][]byte{versionA[:], versionB[:]}, mergedOps),
        ParentIDs: [][32]byte{versionA, versionB},
        Operations: mergedOps,
        Timestamp:  uint64(time.Now().UnixMilli()),
    }, nil
}
```

### RTL Text Handling

Persian text requires special CRDT handling:
- Right-to-left insertion direction is the default
- ZWNJ (Zero-Width Non-Joiner) is treated as a first-class character
- Bidirectional text (mixed Farsi/English) preserves correct ordering
- Ezafe markers are preserved through edits

### On-Chain Version Anchoring

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

interface IContentVersioning {
    function createDocument(
        bytes32 contentHash,
        string calldata metadata
    ) external returns (bytes32 docId);

    function anchorVersion(
        bytes32 docId,
        bytes32 versionHash,
        bytes32[] calldata parentHashes
    ) external returns (bytes32 versionId);

    function getDocumentHistory(
        bytes32 docId
    ) external view returns (bytes32[] memory versions);

    event DocumentCreated(bytes32 indexed docId);
    event VersionAnchored(bytes32 indexed docId, bytes32 indexed versionId);
}
```

## Rationale

### Why CRDTs Over OT?

Operational Transformation (OT) requires a central server to order operations. CRDTs are inherently decentralized -- operations commute regardless of order. This aligns perfectly with the Pars mesh architecture.

### Why Version Anchoring On-Chain?

On-chain anchoring provides immutable proof that a document version existed at a specific time. This is critical for journalism (proving when a report was filed), legal documents, and academic priority claims.

### Why Named Branches?

Branches enable parallel editorial workflows: a "draft" branch for work-in-progress, a "published" branch for public content, and "review" branches for editorial feedback -- all without disturbing the live version.

## Security Considerations

- **Edit attribution**: Editors are identified by anonymous commitments; edits are signed with ML-DSA
- **Vandalism**: Version history is immutable; vandalized versions are simply superseded by reverts
- **History tampering**: On-chain anchoring prevents retroactive history modification
- **Spam edits**: Editing requires veASHA stake proportional to document importance

## References

- [PIP-0013: Encrypted CRDT](./pip-0013-encrypted-crdt.md)
- [PIP-0500: Decentralized Publishing Platform](./pip-0500-decentralized-publishing-platform.md)
- [PIP-0010: Data Integrity Seal](./pip-0010-data-integrity-seal.md)
- [Shapiro et al., "A comprehensive study of CRDTs"](https://hal.inria.fr/inria-00555588)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
