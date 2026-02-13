---
pip: 11
title: Content Provenance & Media Authentication
tags: [media, provenance, journalism, deepfake, content-authenticity]
description: Protect journalists and citizen reporters with mobile-first media authentication and AI-generated content detection
author: Pars Network Team (@pars-network)
status: Draft
type: Standards Track
category: Core
created: 2026-02-13
discussions-to: https://github.com/pars-network/pips/discussions/11
order: 11
tier: core
requires: [2, 10]
---

## Abstract

This PIP defines a Content Provenance and Media Authentication protocol for the Pars Network. It provides cryptographic proof of media authenticity at the point of capture, tracks content through edits and republication, and detects AI-generated content. The protocol is designed to protect journalists and citizen reporters in authoritarian environments where media manipulation is a state tool. Source identities are protected via FHE-encrypted provenance seals, allowing verification of authenticity without exposing the creator.

Adapted from Lux Network LP-7110 (Content Provenance) for the Pars threat model, with C2PA interoperability for international verification.

## Motivation

### The Disinformation Threat

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEDIA MANIPULATION ATTACKS                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ATTACK 1: FABRICATION                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ State media creates fake evidence                         │  │
│  │ Deepfakes of dissidents "confessing"                      │  │
│  │ AI-generated protest violence footage                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ATTACK 2: DENIAL                                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Real evidence dismissed as "fake"                          │  │
│  │ Authentic footage claimed to be AI-generated              │  │
│  │ "Liar's dividend": all evidence becomes questionable      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ATTACK 3: MANIPULATION                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Real footage edited to change narrative                   │  │
│  │ Metadata stripped to remove time/location                 │  │
│  │ Context removed to misrepresent events                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ATTACK 4: ATTRIBUTION                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Journalists identified and targeted via metadata          │  │
│  │ Source of leaks traced through embedded identifiers       │  │
│  │ Citizen reporters arrested based on image EXIF data       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### The Pars Solution

Pars Content Provenance provides:
1. **Authenticity** - Prove media was captured by a real device at a real time
2. **Integrity** - Detect any modification after capture
3. **Source protection** - Creator identity is FHE-encrypted; never exposed to the network
4. **Edit tracking** - Every modification creates a new provenance record linked to the original
5. **AI detection** - Anchor AI-generated content detection scores on-chain
6. **International verification** - C2PA-compatible exports for global media organizations

## Specification

### Provenance Record

```go
// ProvenanceRecord captures the full provenance chain of a media asset
type ProvenanceRecord struct {
    // Identity
    RecordID    [32]byte          // Poseidon2(ContentHash || CreatorCommitment || Timestamp)
    ParentID    [32]byte          // Previous record in edit chain (zero for originals)
    ChainDepth  uint32            // 0 = original capture, N = Nth edit

    // Content
    ContentHash [32]byte          // Poseidon2 hash of media content
    ContentType string            // MIME type: image/jpeg, video/mp4, etc.
    ContentSize uint64            // Bytes

    // Capture metadata (encrypted)
    CaptureData *EncryptedCapture // FHE-encrypted capture context

    // Temporal proof
    Timestamp   uint64            // Capture time (device clock)
    MeshEpoch   uint64            // Mesh DAG epoch
    SealID      [32]byte          // Reference to PIP-0010 data integrity seal

    // AI detection
    AIScore     *AIDetectionScore // AI-generated content analysis

    // Authentication
    Signature   []byte            // ML-DSA-87 signature
    CreatorCommitment [32]byte    // Anonymous commitment to creator identity

    // C2PA compatibility
    C2PAManifest []byte           // C2PA manifest for international export (optional)
}

// EncryptedCapture contains FHE-encrypted capture metadata
type EncryptedCapture struct {
    DeviceHash  []byte   // FHE(hash of device identifier)
    Location    []byte   // FHE(GPS coordinates) - optional, user-controlled
    Orientation []byte   // FHE(device orientation at capture)
    SensorData  []byte   // FHE(accelerometer, gyroscope readings)
}
```

### Capture-Time Authentication

Media is authenticated at the moment of capture on the device:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAPTURE-TIME AUTHENTICATION                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MOBILE DEVICE                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                             │  │
│  │  Camera Sensor ──► Raw Pixels                              │  │
│  │       │                │                                    │  │
│  │       ▼                ▼                                    │  │
│  │  Sensor Data    Image Pipeline                              │  │
│  │  (accel, gyro)      │                                       │  │
│  │       │              ▼                                       │  │
│  │       │         Encoded File (JPEG/MP4)                     │  │
│  │       │              │                                       │  │
│  │       ▼              ▼                                       │  │
│  │  ┌──────────────────────────────┐                           │  │
│  │  │   PARS PROVENANCE ENGINE     │                           │  │
│  │  │                              │                           │  │
│  │  │  1. Hash content (Poseidon2) │                           │  │
│  │  │  2. Encrypt metadata (FHE)   │                           │  │
│  │  │  3. Record timestamp         │                           │  │
│  │  │  4. Create commitment        │                           │  │
│  │  │  5. Sign record (ML-DSA)     │                           │  │
│  │  │  6. Create data seal (PIP-10)│                           │  │
│  │  │  7. Generate C2PA manifest   │                           │  │
│  │  └──────────────────────────────┘                           │  │
│  │       │                                                      │  │
│  │       ▼                                                      │  │
│  │  Provenance Record embedded in file metadata               │  │
│  │                                                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```go
// CaptureMedia creates a provenance record at the moment of media capture
func CaptureMedia(
    content []byte,
    sensorData *SensorReading,
    identity *Identity,
    fheKey *FHEPublicKey,
) (*ProvenanceRecord, error) {
    // 1. Hash content
    contentHash := poseidon2.Hash(content)

    // 2. Encrypt capture metadata under FHE
    captureData := &EncryptedCapture{
        DeviceHash:  fhe.Encrypt(fheKey, identity.DeviceID[:]),
        Location:    fhe.Encrypt(fheKey, sensorData.GPS),
        Orientation: fhe.Encrypt(fheKey, sensorData.Orientation),
        SensorData:  fhe.Encrypt(fheKey, sensorData.Marshal()),
    }

    // 3. Create anonymous commitment
    commitment := poseidon2.Hash(identity.PublicKey, randomSalt())

    // 4. Create data integrity seal (PIP-0010)
    seal, err := CreatePrivateSeal(content, fheKey)
    if err != nil {
        return nil, fmt.Errorf("create seal: %w", err)
    }

    // 5. Run AI detection
    aiScore := DetectAIContent(content)

    // 6. Build record
    record := &ProvenanceRecord{
        ContentHash:       contentHash,
        ContentType:       detectMIME(content),
        ContentSize:       uint64(len(content)),
        CaptureData:       captureData,
        Timestamp:         uint64(time.Now().UnixMilli()),
        MeshEpoch:         dag.CurrentEpoch(),
        SealID:            seal.SealID,
        AIScore:           aiScore,
        CreatorCommitment: commitment,
        ChainDepth:        0, // Original capture
    }

    // 7. Compute record ID
    record.RecordID = poseidon2.Hash(
        record.ContentHash[:],
        record.CreatorCommitment[:],
        record.Timestamp,
    )

    // 8. Sign with ML-DSA
    record.Signature = mldsa.Sign(identity.SigningKey, record.Marshal())

    return record, nil
}
```

### Edit Tracking

When media is edited, a new provenance record is created that references the parent:

```go
// RecordEdit creates a provenance record for an edited version of media
func RecordEdit(
    editedContent []byte,
    parentRecord *ProvenanceRecord,
    editDescription string,
    identity *Identity,
    fheKey *FHEPublicKey,
) (*ProvenanceRecord, error) {
    // New record references the parent
    record := &ProvenanceRecord{
        ParentID:    parentRecord.RecordID,
        ChainDepth:  parentRecord.ChainDepth + 1,
        ContentHash: poseidon2.Hash(editedContent),
        ContentType: detectMIME(editedContent),
        ContentSize: uint64(len(editedContent)),
        Timestamp:   uint64(time.Now().UnixMilli()),
        MeshEpoch:   dag.CurrentEpoch(),
    }

    // Create seal for edited version
    seal, err := CreatePrivateSeal(editedContent, fheKey)
    if err != nil {
        return nil, err
    }
    record.SealID = seal.SealID

    // Re-run AI detection on edited version
    record.AIScore = DetectAIContent(editedContent)

    // Sign and return
    record.Signature = mldsa.Sign(identity.SigningKey, record.Marshal())
    return record, nil
}
```

### AI-Generated Content Detection

```go
// AIDetectionScore contains the results of AI content analysis
type AIDetectionScore struct {
    // Overall probability that content is AI-generated [0.0, 1.0]
    AIGeneratedProb float64

    // Detection method results
    Methods []DetectionMethod

    // Anchor hash (for on-chain recording)
    AnchorHash [32]byte

    // Model version used for detection
    DetectorVersion string
}

type DetectionMethod struct {
    Name       string   // "spectral_analysis", "noise_pattern", "gan_fingerprint", etc.
    Score      float64  // Individual method score [0.0, 1.0]
    Confidence float64  // Confidence in this method's result
}

// DetectAIContent runs multiple AI detection methods
func DetectAIContent(content []byte) *AIDetectionScore {
    methods := []DetectionMethod{
        runSpectralAnalysis(content),      // Frequency domain anomalies
        runNoisePatternAnalysis(content),  // Noise distribution patterns
        runGANFingerprint(content),        // GAN-specific artifacts
        runCompressionAnalysis(content),   // Double compression detection
        runFacialAnalysis(content),        // Facial landmark consistency
        runPersianTextAnalysis(content),   // Persian-language text detection
    }

    // Weighted ensemble score
    totalScore := 0.0
    totalWeight := 0.0
    for _, m := range methods {
        totalScore += m.Score * m.Confidence
        totalWeight += m.Confidence
    }

    score := &AIDetectionScore{
        AIGeneratedProb: totalScore / totalWeight,
        Methods:         methods,
        DetectorVersion: "pars-detect-v1",
    }
    score.AnchorHash = poseidon2.Hash(score.Marshal())
    return score
}
```

### C2PA Interoperability

```
┌─────────────────────────────────────────────────────────────────┐
│                    C2PA EXPORT FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PARS NETWORK                          INTERNATIONAL MEDIA       │
│                                                                  │
│  ProvenanceRecord                      C2PA Manifest             │
│  ┌─────────────────┐                   ┌─────────────────┐      │
│  │ ContentHash     │──── maps to ────►│ Asset Hash      │      │
│  │ Timestamp       │──── maps to ────►│ Claim Generator │      │
│  │ ChainDepth      │──── maps to ────►│ Action Chain    │      │
│  │ AIScore         │──── maps to ────►│ AI Training     │      │
│  │ Signature       │──── maps to ────►│ Claim Signature │      │
│  └─────────────────┘                   └─────────────────┘      │
│                                                                  │
│  NOTE: Creator identity is NEVER exported to C2PA.              │
│  The C2PA manifest proves authenticity without attribution.     │
│                                                                  │
│  Verification:                                                   │
│  - International media orgs can verify via C2PA tools           │
│  - Pars provenance provides stronger guarantees (PQ crypto)     │
│  - Both systems can be verified independently                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```go
// ExportC2PA generates a C2PA-compatible manifest from a Pars provenance record
func ExportC2PA(record *ProvenanceRecord) (*C2PAManifest, error) {
    manifest := &C2PAManifest{
        ClaimGenerator: "Pars Network Content Provenance v1",
        Title:          fmt.Sprintf("pars-provenance-%x", record.RecordID[:8]),
    }

    // Map Pars assertions to C2PA assertions
    manifest.Assertions = []C2PAAssertion{
        {
            Label: "c2pa.hash.data",
            Data:  record.ContentHash[:],
        },
        {
            Label: "c2pa.actions",
            Data:  buildActionChain(record),
        },
    }

    // Add AI detection if available
    if record.AIScore != nil {
        manifest.Assertions = append(manifest.Assertions, C2PAAssertion{
            Label: "c2pa.training-mining",
            Data:  marshalAIScore(record.AIScore),
        })
    }

    // Sign with classical key for C2PA compatibility
    // (C2PA does not yet support PQ signatures)
    manifest.Signature = signC2PA(manifest)

    return manifest, nil
}
```

### Journalist Source Protection

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOURCE PROTECTION FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SOURCE (citizen reporter)                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Captures media with Pars app                           │  │
│  │ 2. Provenance record created (identity FHE-encrypted)     │  │
│  │ 3. Shares via Pars Session to journalist (PIP-0005)       │  │
│  │ 4. Deletes original from device                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
│                          ▼                                       │
│  JOURNALIST                                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 5. Receives media + provenance record                     │  │
│  │ 6. Can verify authenticity (timestamp, integrity, AI)     │  │
│  │ 7. CANNOT identify source (FHE-encrypted identity)        │  │
│  │ 8. Creates edit record if media is cropped/redacted       │  │
│  │ 9. Exports C2PA manifest for publication                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
│                          ▼                                       │
│  PUBLICATION                                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 10. Published with C2PA manifest (verifiable)              │  │
│  │ 11. Provenance chain traceable to original capture        │  │
│  │ 12. Source identity remains completely anonymous           │  │
│  │ 13. Even under legal compulsion, journalist cannot reveal │  │
│  │     source identity (they never had it)                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Precompile Interface

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

/// @title IContentProvenance - Pars Content Provenance Precompile
/// @notice Precompile at address 0x0702 on Pars EVM
interface IContentProvenance {
    /// @notice Register a provenance record on-chain
    /// @param contentHash Poseidon2 hash of media content
    /// @param parentId Parent record ID (zero for originals)
    /// @param aiScore AI detection probability (scaled by 1e18)
    /// @param sealId Reference to PIP-0010 data integrity seal
    /// @return recordId The unique provenance record ID
    function registerProvenance(
        bytes32 contentHash,
        bytes32 parentId,
        uint256 aiScore,
        bytes32 sealId
    ) external returns (bytes32 recordId);

    /// @notice Verify a provenance record
    /// @param recordId The record to verify
    /// @return valid Whether the record is valid
    /// @return depth Edit chain depth (0 = original)
    /// @return timestamp Creation timestamp
    function verifyProvenance(
        bytes32 recordId
    ) external view returns (bool valid, uint32 depth, uint64 timestamp);

    /// @notice Get the full provenance chain for a record
    /// @param recordId The record to trace
    /// @return chain Array of record IDs from original to current
    function getProvenanceChain(
        bytes32 recordId
    ) external view returns (bytes32[] memory chain);

    /// @notice Emitted when a provenance record is registered
    event ProvenanceRegistered(
        bytes32 indexed recordId,
        bytes32 indexed parentId,
        uint32 depth,
        uint64 timestamp
    );
}
```

## Rationale

### Why Mobile-First?

In the Pars threat model, evidence is primarily captured on mobile devices by ordinary citizens. Desktop-first or server-side approaches fail because:
1. Citizens do not carry laptops to protests
2. Server-side authentication requires internet (often blocked)
3. Mobile sensors provide capture-time signals (GPS, accelerometer, gyroscope) that strengthen authenticity claims

### Why FHE-Encrypted Metadata?

Simple metadata stripping (as practiced by Signal) destroys provenance. FHE-encrypted metadata preserves provenance while protecting identity:
- Metadata exists and can be verified in zero-knowledge
- Creator identity is never revealed, even to verifiers
- Location can be selectively disclosed (e.g., "captured in Tehran" without exact coordinates)

### Why Not Just C2PA?

C2PA alone is insufficient for the Pars threat model:
1. **No PQ security**: C2PA uses classical signatures vulnerable to quantum attacks
2. **No source protection**: C2PA links manifests to signing certificates (identity exposure)
3. **No offline support**: C2PA verification requires online certificate checks
4. **No mesh compatibility**: Designed for connected, centralized environments

Pars implements C2PA export as a compatibility layer, not as the primary system.

## Security Considerations

### Source Deanonymization Resistance

The provenance system must resist all source identification attacks:

| Attack | Mitigation |
|:-------|:-----------|
| Metadata analysis | All metadata FHE-encrypted |
| Device fingerprinting | Device ID hashed before FHE encryption |
| Timing correlation | Seals batched with random delays |
| Camera fingerprinting | Sensor noise patterns not included in provenance |
| EXIF data leakage | All EXIF stripped; provenance stored separately |
| Stylometric analysis | Out of scope (content-level, not protocol-level) |

### Deepfake Detection Limitations

AI detection scores are probabilistic, not definitive:
- Scores are anchored on-chain as evidence, not as verdicts
- Detection methods evolve; scores are versioned
- A low AI score does not prove authenticity (only that current detectors found no evidence of AI generation)
- A high AI score does not prove fabrication (false positives exist)

### Provenance Chain Integrity

- Each edit record references its parent by hash, forming a Merkle chain
- Breaking the chain requires forging a Poseidon2 collision (computationally infeasible)
- Even if an intermediate node is lost, the chain can be partially verified

## References

- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)
- [PIP-0010: Data Integrity Seal](./pip-0010-data-integrity-seal.md)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [C2PA Specification](https://c2pa.org/specifications/)
- [Lux LP-7110: Content Provenance](https://github.com/luxfi/lps)
- [Lux LP-3658: Poseidon2 Precompile](https://github.com/luxfi/lps/blob/main/LPs/lp-3658-poseidon2-precompile.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
