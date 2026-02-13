---
pip: 10
title: Verifiable Data Integrity Seal Protocol
tags: [data-integrity, seal, privacy, fhe, zk]
description: Privacy-preserving document sealing for evidence preservation and whistleblower protection
author: Pars Network Team (@pars-network)
status: Draft
type: Standards Track
category: Core
created: 2026-02-13
discussions-to: https://github.com/pars-network/pips/discussions/10
order: 10
tier: core
requires: [2]
---

## Abstract

This PIP defines a Verifiable Data Integrity Seal (VDIS) protocol for the Pars Network. A seal is a cryptographic fingerprint of any document, media file, or data payload that proves the data existed at a specific time without revealing its content. Seals are privacy-preserving by default: they use Fully Homomorphic Encryption (FHE) for private seals and Zero-Knowledge proofs for selective disclosure. The protocol is designed for whistleblower protection, evidence preservation, and court-admissible proof generation in authoritarian environments.

Adapted from Lux Network LP-0535 (Receipt Registry) for the Pars threat model.

## Motivation

### Evidence Disappears

In authoritarian regimes, evidence of human rights abuses is systematically destroyed:

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVIDENCE DESTRUCTION TIMELINE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  T+0h: Incident occurs                                          │
│        ┌───────────────────────────────────────────────────┐    │
│        │ Witness records evidence on mobile device          │    │
│        └───────────────────────────────────────────────────┘    │
│                                                                  │
│  T+1h: State response                                           │
│        ┌───────────────────────────────────────────────────┐    │
│        │ Devices confiscated, evidence deleted              │    │
│        │ Witnesses intimidated, detained                    │    │
│        │ Internet cut to prevent uploads                    │    │
│        └───────────────────────────────────────────────────┘    │
│                                                                  │
│  T+24h: Cover-up                                                │
│        ┌───────────────────────────────────────────────────┐    │
│        │ Official narrative replaces reality                │    │
│        │ No verifiable evidence remains                     │    │
│        │ Witnesses silenced or discredited                  │    │
│        └───────────────────────────────────────────────────┘    │
│                                                                  │
│  WITH PARS DATA INTEGRITY SEAL:                                 │
│  Evidence is sealed at T+0h on the mesh network                 │
│  Seal propagates to multiple nodes before confiscation          │
│  Content remains encrypted, but existence is proven             │
│  Seal is exportable to Lux Z-Chain for permanent record        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why Seals, Not Uploads?

1. **Bandwidth** - Uploading full files during a blackout is impossible. A seal is ~256 bytes.
2. **Privacy** - The content is never revealed to the network. Only the cryptographic fingerprint exists on-chain.
3. **Deniability** - A seal on your device proves nothing about what it contains (FHE-encrypted).
4. **Persistence** - Once a seal propagates to even one other node, it cannot be erased.
5. **Legal value** - A timestamped, cryptographically signed seal is court-admissible evidence.

### Whistleblower Protection

A whistleblower can:
1. Seal evidence on their device (offline)
2. Sync the seal to the mesh (anonymous)
3. Delete the original from their device
4. Later prove the evidence existed at a specific time
5. Selectively disclose content to trusted parties via ZK proofs

At no point is the whistleblower's identity linked to the seal.

## Specification

### Seal Structure

```go
// DataIntegritySeal represents a cryptographic seal over arbitrary data
type DataIntegritySeal struct {
    // Header
    Version     uint8       // Protocol version (1)
    SealID      [32]byte    // Unique seal identifier = Hash(ContentHash || Timestamp || Salt)
    SealType    SealType    // Public, Private (FHE), or Redactable

    // Content fingerprint
    ContentHash [32]byte    // Poseidon2 hash of original content
    ContentSize uint64      // Size of original content in bytes
    ContentType string      // MIME type (optional, can be empty for privacy)

    // Temporal proof
    Timestamp   uint64      // Unix timestamp (milliseconds)
    MeshEpoch   uint64      // Mesh DAG epoch at seal creation
    MerkleRoot  [32]byte    // Mesh DAG root at seal time

    // Privacy layer
    FHECiphertext []byte    // FHE-encrypted metadata (optional)
    ZKProof       []byte    // ZK proof of seal validity (optional)

    // Authentication
    Signature   []byte      // ML-DSA-87 signature over seal
    PublicKey   []byte      // Signer's public key (or anonymous commitment)

    // Cross-chain
    LuxReceipt  []byte      // Lux Z-Chain receipt ID (after export)
}

// Seal types
type SealType uint8

const (
    SealPublic     SealType = iota // Content hash is visible
    SealPrivate                     // Content hash is FHE-encrypted
    SealRedactable                  // Selective disclosure via ZK
)
```

### Seal Creation

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEAL CREATION FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. HASH: Compute Poseidon2 hash of content                    │
│     contentHash = Poseidon2(content)                            │
│                                                                  │
│  2. TIMESTAMP: Record current time and mesh epoch               │
│     timestamp = now()                                           │
│     meshEpoch = dag.CurrentEpoch()                              │
│     merkleRoot = dag.CurrentRoot()                              │
│                                                                  │
│  3. ENCRYPT (if private seal):                                  │
│     fheCiphertext = FHE.Encrypt(contentHash || metadata)        │
│                                                                  │
│  4. GENERATE SEAL ID:                                           │
│     salt = random(32)                                           │
│     sealID = Poseidon2(contentHash || timestamp || salt)        │
│                                                                  │
│  5. SIGN:                                                       │
│     signature = ML-DSA.Sign(sk, sealID || timestamp || ...)     │
│                                                                  │
│  6. PROPAGATE: Submit seal to mesh DAG                          │
│     dag.AddVertex(seal)                                         │
│                                                                  │
│  7. (OPTIONAL) EXPORT: Anchor to Lux Z-Chain                   │
│     receipt = luxBridge.SubmitSeal(seal)                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Seal Verification

```go
// VerifySeal checks the integrity and authenticity of a seal
func VerifySeal(seal *DataIntegritySeal) (*VerificationResult, error) {
    // 1. Verify signature
    valid, err := mldsa.Verify(seal.PublicKey, sealPayload(seal), seal.Signature)
    if err != nil || !valid {
        return nil, ErrInvalidSignature
    }

    // 2. Verify seal ID derivation
    expectedID := poseidon2.Hash(seal.ContentHash, seal.Timestamp, seal.Salt)
    if expectedID != seal.SealID {
        return nil, ErrInvalidSealID
    }

    // 3. Verify temporal proof (mesh epoch was valid)
    if !dag.VerifyEpoch(seal.MeshEpoch, seal.MerkleRoot) {
        return nil, ErrInvalidEpoch
    }

    // 4. Verify ZK proof (if redactable seal)
    if seal.SealType == SealRedactable && seal.ZKProof != nil {
        if !zk.VerifyProof(seal.ZKProof) {
            return nil, ErrInvalidZKProof
        }
    }

    return &VerificationResult{
        Valid:     true,
        Timestamp: seal.Timestamp,
        Epoch:     seal.MeshEpoch,
        SealType:  seal.SealType,
    }, nil
}
```

### Private Seals (FHE)

Private seals encrypt the content hash so that even the seal itself reveals nothing:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRIVATE SEAL (FHE)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PUBLIC INFORMATION:                                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Seal ID (random-looking)                                │  │
│  │ • Timestamp                                                │  │
│  │ • FHE ciphertext (opaque blob)                            │  │
│  │ • Signature (proves someone sealed something)              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  HIDDEN INFORMATION:                                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Content hash (encrypted under FHE)                      │  │
│  │ • Content type (encrypted)                                 │  │
│  │ • Content size (encrypted)                                 │  │
│  │ • Sealer identity (anonymous commitment)                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  VERIFICATION: ZK proof that the ciphertext is well-formed     │
│  without revealing the plaintext                                │
│                                                                  │
│  DISCLOSURE: Sealer can later reveal content hash to prove     │
│  a specific document was sealed at a specific time              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```go
// CreatePrivateSeal creates an FHE-encrypted seal
func CreatePrivateSeal(content []byte, fheKey *FHEPublicKey) (*DataIntegritySeal, error) {
    contentHash := poseidon2.Hash(content)

    // Encrypt the content hash under FHE
    metadata := &SealMetadata{
        ContentHash: contentHash,
        ContentSize: uint64(len(content)),
        ContentType: detectMIME(content),
    }
    ciphertext, err := fhe.Encrypt(fheKey, metadata.Marshal())
    if err != nil {
        return nil, fmt.Errorf("fhe encrypt: %w", err)
    }

    // Generate ZK proof that ciphertext is well-formed
    zkProof, err := zk.ProveWellFormed(contentHash, ciphertext, fheKey)
    if err != nil {
        return nil, fmt.Errorf("zk prove: %w", err)
    }

    return &DataIntegritySeal{
        Version:       1,
        SealType:      SealPrivate,
        FHECiphertext: ciphertext,
        ZKProof:       zkProof,
        Timestamp:     uint64(time.Now().UnixMilli()),
        // ... remaining fields
    }, nil
}
```

### Selective Disclosure (ZK Proofs)

Redactable seals allow the sealer to prove specific properties without revealing the full content:

```go
// SelectiveDisclosure proves a property about a sealed document
type SelectiveDisclosure struct {
    SealID    [32]byte    // Reference to the original seal
    Claim     string      // What is being disclosed
    Proof     []byte      // ZK proof of the claim
}

// Supported disclosure types
const (
    // "This seal covers a JPEG image"
    DiscloseContentType = "content_type"

    // "This seal covers a file larger than 1MB"
    DiscloseSizeRange = "size_range"

    // "This seal was created before timestamp T"
    DiscloseTimeBound = "time_bound"

    // "This seal covers the same content as seal X"
    DiscloseEquality = "content_equality"

    // "This seal's content hash matches H"
    DiscloseContentHash = "content_hash"
)

// ProveContentType generates a ZK proof that the sealed content is a specific type
func ProveContentType(seal *DataIntegritySeal, fheSK *FHESecretKey, claimedType string) (*SelectiveDisclosure, error) {
    // Decrypt metadata
    metadata, err := fhe.Decrypt(fheSK, seal.FHECiphertext)
    if err != nil {
        return nil, err
    }

    // Generate ZK proof: metadata.ContentType == claimedType
    proof, err := zk.ProveEquality(metadata.ContentType, claimedType, seal.FHECiphertext)
    if err != nil {
        return nil, err
    }

    return &SelectiveDisclosure{
        SealID: seal.SealID,
        Claim:  DiscloseContentType,
        Proof:  proof,
    }, nil
}
```

### Offline Seal Creation

Seals can be created entirely offline and synced later:

```
┌─────────────────────────────────────────────────────────────────┐
│                    OFFLINE SEAL WORKFLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  OFFLINE (no network):                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. User captures evidence (photo, video, document)        │  │
│  │ 2. Pars app computes seal locally                         │  │
│  │ 3. Seal stored in local DAG with device clock timestamp   │  │
│  │ 4. Original content optionally deleted for safety         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                │                                 │
│                       Later... │                                 │
│                                ▼                                 │
│  SYNC (any transport):                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 5. Device connects to mesh (BLE, WiFi, USB, Internet)     │  │
│  │ 6. Seal propagates via gossip protocol                    │  │
│  │ 7. Mesh nodes timestamp the seal's arrival                │  │
│  │ 8. Seal becomes part of DAG consensus                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                │                                 │
│                       Later... │                                 │
│                                ▼                                 │
│  ANCHOR (cross-chain):                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 9. Bridge node exports seal to Lux Z-Chain               │  │
│  │ 10. Z-Chain receipt provides permanent, global proof      │  │
│  │ 11. Receipt hash stored back in mesh DAG                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Cross-Chain Export (Lux Z-Chain)

```go
// ExportToLux anchors a seal on Lux Z-Chain via LP-0530 Receipt Registry
func ExportToLux(seal *DataIntegritySeal, bridge *LuxBridge) (*LuxReceipt, error) {
    // 1. Prepare receipt data
    receiptData := &ReceiptSubmission{
        ProgramID:    ParsDataSealProgramID,
        Proof:        seal.ZKProof,
        PublicInputs: []byte{seal.SealID[:]...},
        ClaimHash:    poseidon2.Hash(seal.SealID[:], seal.Timestamp),
    }

    // 2. Submit to Z-Chain receipt registry (LP-0530)
    receiptID, err := bridge.SubmitProof(receiptData)
    if err != nil {
        return nil, fmt.Errorf("lux submit: %w", err)
    }

    // 3. Get inclusion proof
    inclusionProof, err := bridge.GetInclusionProof(receiptID)
    if err != nil {
        return nil, fmt.Errorf("lux inclusion: %w", err)
    }

    return &LuxReceipt{
        ReceiptID:      receiptID,
        MerkleRoot:     inclusionProof.Root,
        InclusionProof: inclusionProof,
        ZChainBlock:    inclusionProof.BlockNumber,
    }, nil
}
```

### Pars Session Integration

Sealed documents can be shared through Pars Session with end-to-end encryption:

```go
// ShareSealedDocument shares a seal and its content via Pars Session
func ShareSealedDocument(
    session *Session,
    seal *DataIntegritySeal,
    content []byte,
    recipient *HybridPublicKey,
) error {
    // 1. Verify seal matches content
    if poseidon2.Hash(content) != seal.ContentHash {
        return ErrContentMismatch
    }

    // 2. Encrypt content for recipient (PIP-0002 PQ encryption)
    encContent, err := EncryptMessage(recipient, content)
    if err != nil {
        return err
    }

    // 3. Send seal + encrypted content via session
    msg := &SessionMessage{
        Type:      MessageTypeSealedDocument,
        Seal:      seal,
        Encrypted: encContent,
    }
    return session.Send(msg)
}
```

### Precompile Interface

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

/// @title IDataIntegritySeal - Pars Data Integrity Seal Precompile
/// @notice Precompile at address 0x0701 on Pars EVM
interface IDataIntegritySeal {
    /// @notice Create a public seal
    /// @param contentHash Poseidon2 hash of the content
    /// @param contentSize Size of original content in bytes
    /// @return sealId The unique seal identifier
    function createSeal(
        bytes32 contentHash,
        uint64 contentSize
    ) external returns (bytes32 sealId);

    /// @notice Create a private (FHE-encrypted) seal
    /// @param fheCiphertext FHE-encrypted metadata
    /// @param zkProof ZK proof of ciphertext well-formedness
    /// @return sealId The unique seal identifier
    function createPrivateSeal(
        bytes calldata fheCiphertext,
        bytes calldata zkProof
    ) external returns (bytes32 sealId);

    /// @notice Verify a seal's authenticity
    /// @param sealId The seal to verify
    /// @return valid Whether the seal is valid
    /// @return timestamp When the seal was created
    function verifySeal(
        bytes32 sealId
    ) external view returns (bool valid, uint64 timestamp);

    /// @notice Verify selective disclosure proof
    /// @param sealId The seal being disclosed
    /// @param claim The claim type
    /// @param proof The ZK proof
    /// @return valid Whether the disclosure is valid
    function verifyDisclosure(
        bytes32 sealId,
        string calldata claim,
        bytes calldata proof
    ) external view returns (bool valid);

    /// @notice Export seal to Lux Z-Chain
    /// @param sealId The seal to export
    /// @return receiptId The Lux Z-Chain receipt ID
    function exportToLux(
        bytes32 sealId
    ) external returns (bytes32 receiptId);

    /// @notice Emitted when a seal is created
    event SealCreated(bytes32 indexed sealId, uint64 timestamp, SealType sealType);

    /// @notice Emitted when a seal is exported to Lux
    event SealExported(bytes32 indexed sealId, bytes32 indexed receiptId);
}
```

### Gas Schedule

| Operation | Gas Cost | Notes |
|:----------|:---------|:------|
| createSeal | 50,000 | Public seal, includes Poseidon2 hash |
| createPrivateSeal | 200,000 | Includes FHE ciphertext verification |
| verifySeal | 10,000 | Read-only verification |
| verifyDisclosure | 150,000 | ZK proof verification |
| exportToLux | 500,000 | Cross-chain bridge operation |

## Rationale

### Why Poseidon2?

Poseidon2 is chosen over SHA-256 or Keccak because:
1. **ZK-friendly**: Efficient inside ZK circuits for selective disclosure proofs
2. **Post-quantum safe**: No discrete log dependency (aligned with PIP-0002)
3. **Performance**: ~2,000,000 hashes/sec vs ~1,000 for Pedersen (from Lux LP-3658 benchmarks)
4. **Lux compatibility**: Same hash function used by Z-Chain receipt registry

### Why FHE for Private Seals?

FHE provides stronger guarantees than simple encryption:
1. **Computation on ciphertext**: Network can verify seal properties without decryption
2. **No decryption key exposure**: Unlike threshold encryption, no key ceremony needed for verification
3. **Composable privacy**: Private seals can participate in aggregations without revealing content

### Why Not Just Hash and Sign?

A simple hash-and-sign approach fails the Pars threat model:
1. **No privacy**: The hash reveals content identity (rainbow table attacks)
2. **No selective disclosure**: Cannot prove properties without revealing the hash
3. **No deniability**: A signed hash on your device is incriminating evidence
4. **No offline temporal proof**: No way to prove when the seal was created without a trusted clock

## Security Considerations

### Threat Model

| Threat | Mitigation |
|:-------|:-----------|
| Device confiscation | Seals propagate to mesh before confiscation; original deletable |
| Content identification via hash | Private seals encrypt the hash under FHE |
| Timestamp forgery | Mesh DAG epoch provides consensus timestamp |
| Seal attribution | Anonymous commitments; no identity linkage |
| Quantum attacks on seals | Poseidon2 + ML-DSA are post-quantum (PIP-0002) |
| Forced disclosure | Coercion-resistant key management (PIP-0003) |

### Deniability

A private seal on a confiscated device reveals:
- That *something* was sealed (existence)
- When it was sealed (timestamp)
- Nothing about *what* was sealed (FHE-encrypted)
- Nothing about *who* sealed it (anonymous commitment)

This provides plausible deniability: "I sealed a grocery list."

### Seal Permanence

Once a seal enters the mesh DAG and propagates to at least one other node:
- It cannot be deleted (DAG is append-only)
- It cannot be modified (cryptographically signed)
- It can be independently verified by any node
- It can be anchored to Lux Z-Chain for permanent global record

### Side-Channel Considerations

Seal creation must be constant-time to prevent:
- Timing analysis revealing content type or size
- Power analysis during FHE encryption
- Cache-timing attacks during Poseidon2 hashing

All implementations must use constant-time primitives from PIP-0002.

## References

- [PIP-0001: Mesh Network](./pip-0001-mesh-network.md)
- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)
- [PIP-0003: Coercion Resistance](./pip-0003-coercion-resistance.md)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [Lux LP-0530: Receipt Registry](https://github.com/luxfi/lps/blob/main/LPs/lp-0530-receipt-registry.md)
- [Lux LP-3658: Poseidon2 Precompile](https://github.com/luxfi/lps/blob/main/LPs/lp-3658-poseidon2-precompile.md)
- [Lux LP-0510: STARK Verification](https://github.com/luxfi/lps/blob/main/LPs/lp-0510-stark-verifier-precompile.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
