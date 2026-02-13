---
pip: 13
title: Encrypted CRDT for Offline-First Privacy
tags: [crdt, fhe, mesh, offline, encryption]
description: FHE+CRDT integration for encrypted, offline-capable, conflict-free data replication on Pars Mesh
author: Pars Network Team (@pars-network)
status: Draft
type: Standards Track
category: Core
created: 2026-02-13
discussions-to: https://github.com/pars-network/pips/discussions/13
order: 13
tier: core
requires: [1, 2]
---

## Abstract

This PIP defines Encrypted CRDTs (eCRDTs) for the Pars Mesh network. eCRDTs combine Conflict-Free Replicated Data Types with Fully Homomorphic Encryption, enabling nodes to merge encrypted state without ever decrypting it. This allows offline-first, partition-tolerant collaboration where relay nodes cannot read the data they carry. The protocol supports LWW-Register, OR-Set, and RGA List operations under FHE, with conflict resolution via homomorphic timestamp comparison. Transport is agnostic: Bluetooth, WiFi, USB sneakernet, and Internet all work identically.

Based on Lux Network LP-6500 (fheCRDT Architecture), adapted for the Pars threat model where relay nodes are untrusted and network partitions are the norm.

## Motivation

### The Problem: Collaboration Under Surveillance

```
┌─────────────────────────────────────────────────────────────────┐
│                    COLLABORATION THREAT MODEL                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SCENARIO: Distributed team editing a shared document           │
│                                                                  │
│  TRADITIONAL APPROACH (Google Docs, Notion):                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Requires persistent internet connection                  │  │
│  │ • Central server sees all content                          │  │
│  │ • Server can be seized or compelled to reveal data        │  │
│  │ • Fails completely during internet blackouts              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  END-TO-END ENCRYPTED (Signal notes):                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Content encrypted, but requires online sync             │  │
│  │ • Conflicts require manual resolution                      │  │
│  │ • No offline editing with guaranteed merge                 │  │
│  │ • Metadata (who edited when) still visible                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  PARS ENCRYPTED CRDT:                                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Works offline indefinitely                               │  │
│  │ • Merge is automatic and conflict-free (CRDT guarantees)  │  │
│  │ • Content encrypted under FHE (relay nodes see nothing)   │  │
│  │ • Merge happens ON CIPHERTEXT (no decryption needed)      │  │
│  │ • Any transport: BLE, WiFi, USB, Internet                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why Merge on Ciphertext?

Standard CRDTs require plaintext access to merge states. This means relay nodes must see the data, which is unacceptable in the Pars threat model. Encrypted CRDTs solve this by performing CRDT merge operations homomorphically on ciphertext:

```
Standard CRDT:
  Node A: state_A (plaintext)
  Node B: state_B (plaintext)
  Relay:  merge(state_A, state_B) → state_merged (relay sees everything)

Encrypted CRDT:
  Node A: Enc(state_A)
  Node B: Enc(state_B)
  Relay:  FHE_merge(Enc(state_A), Enc(state_B)) → Enc(state_merged)
          (relay sees only ciphertext; cannot read any content)
```

## Specification

### Encrypted CRDT Types

```go
// eCRDTType enumerates supported encrypted CRDT types
type eCRDTType uint8

const (
    eCRDT_LWWRegister eCRDTType = iota // Last-Writer-Wins Register
    eCRDT_ORSet                         // Observed-Remove Set
    eCRDT_RGAList                       // Replicated Growable Array (ordered list)
    eCRDT_PNCounter                     // Positive-Negative Counter
    eCRDT_MVRegister                    // Multi-Value Register
)

// EncryptedCRDT is the base type for all encrypted CRDTs
type EncryptedCRDT struct {
    ID          [32]byte      // Document identifier
    Type        eCRDTType     // CRDT type
    GroupKey    *FHEPublicKey // Group encryption key
    State       []byte        // FHE-encrypted CRDT state
    VectorClock []byte        // FHE-encrypted vector clock
    Version     uint64        // Monotonic version counter
    NodeID      [32]byte      // Originating node (can be anonymous)
}
```

### LWW-Register (Last-Writer-Wins)

The simplest eCRDT: a single value where the most recent write wins.

```go
// EncryptedLWWRegister holds an FHE-encrypted value with encrypted timestamp
type EncryptedLWWRegister struct {
    EncryptedValue     []byte // FHE(value)
    EncryptedTimestamp []byte // FHE(timestamp)
}

// Write sets a new value (locally, in plaintext; encrypted before propagation)
func (r *EncryptedLWWRegister) Write(
    value []byte,
    timestamp uint64,
    pk *FHEPublicKey,
) error {
    r.EncryptedValue = fhe.Encrypt(pk, value)
    r.EncryptedTimestamp = fhe.Encrypt(pk, encodeUint64(timestamp))
    return nil
}

// Merge combines two LWW registers homomorphically
// The relay node performs this WITHOUT decrypting either value
func MergeLWWRegister(
    a, b *EncryptedLWWRegister,
    pk *FHEPublicKey,
) (*EncryptedLWWRegister, error) {
    // Homomorphic comparison: which timestamp is greater?
    // FHE_compare returns Enc(1) if a > b, Enc(0) otherwise
    cmpResult, err := fhe.Compare(pk, a.EncryptedTimestamp, b.EncryptedTimestamp)
    if err != nil {
        return nil, fmt.Errorf("fhe compare: %w", err)
    }

    // Homomorphic multiplexer: select value based on comparison
    // result = cmpResult * a.value + (1 - cmpResult) * b.value
    mergedValue, err := fhe.Mux(pk, cmpResult, a.EncryptedValue, b.EncryptedValue)
    if err != nil {
        return nil, fmt.Errorf("fhe mux: %w", err)
    }

    mergedTimestamp, err := fhe.Max(pk, a.EncryptedTimestamp, b.EncryptedTimestamp)
    if err != nil {
        return nil, fmt.Errorf("fhe max: %w", err)
    }

    return &EncryptedLWWRegister{
        EncryptedValue:     mergedValue,
        EncryptedTimestamp: mergedTimestamp,
    }, nil
}
```

### OR-Set (Observed-Remove Set)

```go
// EncryptedORSet is a set where elements can be added and removed
type EncryptedORSet struct {
    // Elements are stored as FHE-encrypted (value, unique_tag) pairs
    // Adding an element creates a new unique tag
    // Removing an element marks all known tags for that value as removed
    Elements []EncryptedORSetEntry
}

type EncryptedORSetEntry struct {
    EncryptedValue []byte // FHE(value)
    EncryptedTag   []byte // FHE(unique_tag)
    EncryptedAlive []byte // FHE(1) if present, FHE(0) if removed
}

// Add inserts an element into the set
func (s *EncryptedORSet) Add(value []byte, pk *FHEPublicKey) error {
    tag := randomTag()
    entry := EncryptedORSetEntry{
        EncryptedValue: fhe.Encrypt(pk, value),
        EncryptedTag:   fhe.Encrypt(pk, tag),
        EncryptedAlive: fhe.Encrypt(pk, []byte{1}),
    }
    s.Elements = append(s.Elements, entry)
    return nil
}

// Remove marks all entries matching a value as removed
func (s *EncryptedORSet) Remove(value []byte, pk *FHEPublicKey) error {
    encValue := fhe.Encrypt(pk, value)
    for i := range s.Elements {
        // Homomorphic equality check
        isMatch, err := fhe.Equal(pk, s.Elements[i].EncryptedValue, encValue)
        if err != nil {
            return err
        }
        // If match, set alive to 0: alive = alive * (1 - isMatch)
        notMatch, _ := fhe.Sub(pk, fhe.Encrypt(pk, []byte{1}), isMatch)
        s.Elements[i].EncryptedAlive, _ = fhe.Mul(pk, s.Elements[i].EncryptedAlive, notMatch)
    }
    return nil
}

// MergeORSet combines two OR-Sets homomorphically
func MergeORSet(a, b *EncryptedORSet, pk *FHEPublicKey) (*EncryptedORSet, error) {
    merged := &EncryptedORSet{}

    // Union of all elements from both sets
    // For elements with matching tags: alive = a.alive AND b.alive
    // For elements unique to one set: include as-is
    allElements := append(a.Elements, b.Elements...)

    // Deduplicate by tag (homomorphic tag comparison)
    for i := 0; i < len(allElements); i++ {
        isDuplicate := false
        for j := 0; j < i; j++ {
            match, _ := fhe.Equal(pk, allElements[i].EncryptedTag, allElements[j].EncryptedTag)
            matchPlain := fhe.IsEncryptedOne(match) // Only needed for loop control
            if matchPlain {
                // Merge alive status: both must be alive
                merged.Elements[j].EncryptedAlive, _ = fhe.Mul(
                    pk,
                    merged.Elements[j].EncryptedAlive,
                    allElements[i].EncryptedAlive,
                )
                isDuplicate = true
                break
            }
        }
        if !isDuplicate {
            merged.Elements = append(merged.Elements, allElements[i])
        }
    }

    return merged, nil
}
```

### RGA List (Replicated Growable Array)

```go
// EncryptedRGAList is an ordered list supporting insert and delete
type EncryptedRGAList struct {
    Nodes []EncryptedRGANode
}

type EncryptedRGANode struct {
    EncryptedValue    []byte // FHE(character or element)
    EncryptedPosition []byte // FHE(Lamport timestamp for ordering)
    EncryptedNodeID   []byte // FHE(unique node identifier)
    EncryptedDeleted  []byte // FHE(0 or 1)
    LeftParent        []byte // FHE(position of left neighbor at insert time)
}

// InsertAfter inserts a new element after a given position
func (l *EncryptedRGAList) InsertAfter(
    afterPos []byte, // Encrypted position of predecessor
    value []byte,
    timestamp uint64,
    nodeID [32]byte,
    pk *FHEPublicKey,
) error {
    node := EncryptedRGANode{
        EncryptedValue:    fhe.Encrypt(pk, value),
        EncryptedPosition: fhe.Encrypt(pk, encodeUint64(timestamp)),
        EncryptedNodeID:   fhe.Encrypt(pk, nodeID[:]),
        EncryptedDeleted:  fhe.Encrypt(pk, []byte{0}),
        LeftParent:        afterPos,
    }
    l.Nodes = append(l.Nodes, node)
    return nil
}

// MergeRGAList merges two RGA lists while preserving order
func MergeRGAList(a, b *EncryptedRGAList, pk *FHEPublicKey) (*EncryptedRGAList, error) {
    // 1. Union all nodes from both lists
    // 2. Deduplicate by (position, nodeID) pair
    // 3. Sort by (leftParent, position, nodeID) for deterministic ordering
    // All comparisons are homomorphic

    merged := &EncryptedRGAList{}
    allNodes := append(a.Nodes, b.Nodes...)

    // Deduplicate
    seen := make(map[int]bool)
    for i := 0; i < len(allNodes); i++ {
        if seen[i] {
            continue
        }
        for j := i + 1; j < len(allNodes); j++ {
            posMatch, _ := fhe.Equal(pk, allNodes[i].EncryptedPosition, allNodes[j].EncryptedPosition)
            idMatch, _ := fhe.Equal(pk, allNodes[i].EncryptedNodeID, allNodes[j].EncryptedNodeID)
            bothMatch, _ := fhe.Mul(pk, posMatch, idMatch)
            if fhe.IsEncryptedOne(bothMatch) {
                // Merge deleted status: deleted if either says deleted
                allNodes[i].EncryptedDeleted, _ = fhe.Max(
                    pk,
                    allNodes[i].EncryptedDeleted,
                    allNodes[j].EncryptedDeleted,
                )
                seen[j] = true
            }
        }
        merged.Nodes = append(merged.Nodes, allNodes[i])
    }

    return merged, nil
}
```

### Mesh Sync Protocol

```
┌─────────────────────────────────────────────────────────────────┐
│                    eCRDT MESH SYNC PROTOCOL                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Node A (offline for 3 days)          Node B (has updates)      │
│      │                                      │                    │
│      │  1. BLE/WiFi/USB connection          │                    │
│      │ ◄────────────────────────────────────┤                    │
│      │                                      │                    │
│      │  2. Exchange document version vectors │                    │
│      │     A: {doc1: v5, doc2: v3}          │                    │
│      │     B: {doc1: v8, doc2: v3, doc3: v1}│                    │
│      │                                      │                    │
│      │  3. Diff: B has newer doc1 + new doc3│                    │
│      │                                      │                    │
│      │  4. Transfer encrypted CRDT states    │                    │
│      │     (relay sees only ciphertext)      │                    │
│      │ ◄──── Enc(doc1_state), Enc(doc3) ────┤                    │
│      │                                      │                    │
│      │  5. Homomorphic merge on Node A      │                    │
│      │     FHE_merge(local_doc1, remote_doc1)│                    │
│      │                                      │                    │
│      │  6. A now has: {doc1: v8, doc2: v3, doc3: v1}            │
│      │     All operations on ciphertext     │                    │
│      │     A only decrypts locally to read  │                    │
│      │                                      │                    │
└─────────────────────────────────────────────────────────────────┘
```

```go
// SynceCRDTs synchronizes encrypted CRDTs between two mesh nodes
func SynceCRDTs(local *eCRDTStore, remote *MeshPeer) error {
    // 1. Exchange version vectors
    localVersions := local.GetVersionVector()
    remoteVersions, err := remote.RequestVersionVector()
    if err != nil {
        return fmt.Errorf("request versions: %w", err)
    }

    // 2. Compute diff
    needFromRemote := computeDiff(localVersions, remoteVersions)
    needFromLocal := computeDiff(remoteVersions, localVersions)

    // 3. Request missing/newer states from remote
    for _, docID := range needFromRemote {
        encState, err := remote.RequesteCRDTState(docID)
        if err != nil {
            log.Warn("Failed to fetch eCRDT", "doc", docID, "err", err)
            continue
        }

        // 4. Merge homomorphically (no decryption)
        localState, exists := local.Get(docID)
        if exists {
            merged, err := MergeeCRDT(localState, encState)
            if err != nil {
                log.Warn("Merge failed", "doc", docID, "err", err)
                continue
            }
            local.Put(docID, merged)
        } else {
            local.Put(docID, encState)
        }
    }

    // 5. Push local updates to remote
    for _, docID := range needFromLocal {
        localState, _ := local.Get(docID)
        remote.PusheCRDTState(docID, localState)
    }

    return nil
}
```

### Local Materialization

Nodes decrypt eCRDT state locally for reading. Only the node's owner can read the plaintext.

```go
// MaterializeDocument decrypts an eCRDT locally for reading
func MaterializeDocument(
    ecrdt *EncryptedCRDT,
    groupSK *FHESecretKey,
) (interface{}, error) {
    switch ecrdt.Type {
    case eCRDT_LWWRegister:
        reg := deserializeLWWRegister(ecrdt.State)
        plainValue, err := fhe.Decrypt(groupSK, reg.EncryptedValue)
        if err != nil {
            return nil, err
        }
        return plainValue, nil

    case eCRDT_ORSet:
        set := deserializeORSet(ecrdt.State)
        var elements [][]byte
        for _, entry := range set.Elements {
            alive, _ := fhe.Decrypt(groupSK, entry.EncryptedAlive)
            if alive[0] == 1 {
                val, _ := fhe.Decrypt(groupSK, entry.EncryptedValue)
                elements = append(elements, val)
            }
        }
        return elements, nil

    case eCRDT_RGAList:
        list := deserializeRGAList(ecrdt.State)
        var ordered [][]byte
        // Decrypt, sort by position, filter deleted
        for _, node := range list.Nodes {
            deleted, _ := fhe.Decrypt(groupSK, node.EncryptedDeleted)
            if deleted[0] == 0 {
                val, _ := fhe.Decrypt(groupSK, node.EncryptedValue)
                ordered = append(ordered, val)
            }
        }
        return ordered, nil

    default:
        return nil, fmt.Errorf("unsupported eCRDT type: %d", ecrdt.Type)
    }
}
```

### SQLite Local View

Following LP-6500's pattern, each node maintains a local SQLite database materialized from eCRDT state:

```go
// MaterializeToSQLite decrypts eCRDT state into a local SQLite database
func MaterializeToSQLite(db *sql.DB, ecrdt *EncryptedCRDT, sk *FHESecretKey) error {
    switch ecrdt.Type {
    case eCRDT_LWWRegister:
        plaintext, _ := MaterializeDocument(ecrdt, sk)
        _, err := db.Exec(
            "INSERT OR REPLACE INTO registers (id, value, version) VALUES (?, ?, ?)",
            ecrdt.ID[:], plaintext, ecrdt.Version,
        )
        return err

    case eCRDT_ORSet:
        elements, _ := MaterializeDocument(ecrdt, sk)
        tx, _ := db.Begin()
        tx.Exec("DELETE FROM set_elements WHERE set_id = ?", ecrdt.ID[:])
        for _, elem := range elements.([][]byte) {
            tx.Exec(
                "INSERT INTO set_elements (set_id, value) VALUES (?, ?)",
                ecrdt.ID[:], elem,
            )
        }
        return tx.Commit()

    case eCRDT_RGAList:
        ordered, _ := MaterializeDocument(ecrdt, sk)
        tx, _ := db.Begin()
        tx.Exec("DELETE FROM list_elements WHERE list_id = ?", ecrdt.ID[:])
        for i, elem := range ordered.([][]byte) {
            tx.Exec(
                "INSERT INTO list_elements (list_id, position, value) VALUES (?, ?, ?)",
                ecrdt.ID[:], i, elem,
            )
        }
        return tx.Commit()

    default:
        return fmt.Errorf("unsupported eCRDT type: %d", ecrdt.Type)
    }
}
```

### Pars Session Integration

eCRDTs integrate with Pars Session (PIP-0005) for encrypted group editing:

```go
// GroupDocument manages a shared eCRDT document within a Pars Session group
type GroupDocument struct {
    DocID       [32]byte
    eCRDT       *EncryptedCRDT
    GroupKey    *FHEPublicKey     // Shared group encryption key
    Session     *GroupSession      // PIP-0005 session for notifications
    LocalDB     *sql.DB           // SQLite materialization
}

// Edit applies a local edit and broadcasts the update
func (g *GroupDocument) Edit(operation *EditOperation, sk *FHESecretKey) error {
    // 1. Apply operation to local eCRDT state
    if err := g.eCRDT.Apply(operation, g.GroupKey); err != nil {
        return err
    }

    // 2. Re-materialize local SQLite view
    if err := MaterializeToSQLite(g.LocalDB, g.eCRDT, sk); err != nil {
        return err
    }

    // 3. Broadcast encrypted state update via Pars Session
    update := &StateUpdate{
        DocID:   g.DocID,
        Delta:   operation.Marshal(),
        Version: g.eCRDT.Version,
    }
    return g.Session.Broadcast(update)
}
```

### Transport Adapters

```go
// TransportAdapter abstracts the sync transport layer
type TransportAdapter interface {
    // SendeCRDT sends encrypted CRDT state to a peer
    SendeCRDT(peerID PeerID, docID [32]byte, state []byte) error
    // ReceiveeCRDT receives encrypted CRDT state from a peer
    ReceiveeCRDT() (PeerID, [32]byte, []byte, error)
}

// Available transports (all carry identical encrypted payloads)
var transports = []TransportAdapter{
    &BluetoothTransport{},   // BLE for proximity sync
    &WiFiDirectTransport{},  // WiFi Direct for local sync
    &USBTransport{},         // USB sneakernet bundles
    &InternetTransport{},    // QUIC over Internet
    &MeshGossipTransport{},  // Multi-hop mesh gossip
}
```

## Rationale

### Why Not Standard CRDTs with E2E Encryption?

Standard CRDTs encrypted with E2E encryption require decryption at merge time. This means either:
1. A central server must decrypt (unacceptable in Pars threat model)
2. Every relay node must have the key (key distribution nightmare)
3. Merge only happens when an authorized node is online (defeats offline-first)

FHE-based eCRDTs allow merge on ciphertext by any node, authorized or not.

### Why Not MPC Instead of FHE?

Multi-Party Computation (MPC) could theoretically achieve similar goals, but:
1. MPC requires interaction between parties (impossible during partitions)
2. MPC has high communication overhead (problematic over BLE)
3. FHE is non-interactive: encrypt locally, merge anywhere, decrypt locally

### Performance Trade-offs

FHE operations are computationally expensive compared to plaintext CRDTs:

| Operation | Plaintext CRDT | Encrypted CRDT | Overhead |
|:----------|:---------------|:---------------|:---------|
| LWW Write | ~1 us | ~10 ms | ~10,000x |
| LWW Merge | ~1 us | ~50 ms | ~50,000x |
| OR-Set Add | ~5 us | ~15 ms | ~3,000x |
| OR-Set Merge (100 elements) | ~100 us | ~2 s | ~20,000x |
| RGA Insert | ~10 us | ~20 ms | ~2,000x |

This overhead is acceptable because:
1. Human collaboration is measured in seconds, not microseconds
2. Merge happens infrequently (on sync, not per keystroke)
3. Security is non-negotiable in the Pars threat model
4. Hardware acceleration (GPU, FPGA) can reduce FHE overhead

## Reference Implementation

### Smart Contract (Solidity + FHE)

**Repository**: [luxfhe/examples/encrypted-crdt](https://github.com/luxfhe/luxfhe/tree/main/examples/encrypted-crdt)

| File | Description |
|:-----|:------------|
| `contracts/EncryptedCRDT.sol` | LWW-Register with FHE-encrypted values, OR-Set with tag-based add/remove, Lamport timestamp conflict resolution, deterministic merge |
| `test/EncryptedCRDT.test.ts` | LWW semantics (higher timestamp wins), stale rejection, merge operations, OR-Set add/remove, decryption |
| `tasks/set-register.ts` | Set encrypted register values |
| `tasks/get-register.ts` | Read and decrypt registers |
| `tasks/merge-registers.ts` | Merge conflicting peer registers |

### Boolean-Circuit FHE (Go)

**Repository**: [luxfi/fhe/cmd/crdt](https://github.com/luxfi/fhe/tree/main/cmd/crdt)

Pure Go implementation using boolean gate FHE (TFHE):
- LWW-Register with encrypted values
- MUX gate for homomorphic conflict resolution
- Timestamp comparison under encryption
- Simulates two peers with independent state

### Lux Network LPs

- [LP-6500: fheCRDT Architecture](https://lps.lux.network/docs/lp-6500-fhecrdt-architecture) — Core specification
- [LP-6501: DocReceipts](https://lps.lux.network/docs/lp-6501-fhecrdt-docreceipts) — On-chain document update receipts
- [LP-6502: DAReceipts](https://lps.lux.network/docs/lp-6502-fhecrdt-dareceipts) — Data availability certificates

## Security Considerations

### Relay Node Trust Model

Relay nodes in the mesh see only FHE ciphertext. They can:
- Store and forward encrypted state (intended)
- Observe sync frequency and data volume (metadata)
- Attempt denial-of-service (rate-limited by PIP-0001)

They cannot:
- Read any document content
- Determine which documents are being edited
- Identify document authors
- Modify encrypted state undetectably (ciphertext integrity)

### Key Management

Group FHE keys are managed per-document or per-group:
- Key generation uses distributed key generation (DKG) among group members
- Key rotation is periodic and triggered by membership changes
- Old keys are retained for historical document access
- Key distribution uses Pars Session (PIP-0005) with PQ encryption (PIP-0002)

### Ciphertext Size

FHE ciphertexts are significantly larger than plaintexts:

| Plaintext Size | FHE Ciphertext Size | Expansion |
|:---------------|:--------------------|:----------|
| 1 byte | ~32 KB | ~32,000x |
| 1 KB | ~64 KB | ~64x |
| 10 KB | ~128 KB | ~13x |

For mesh sync over BLE (~1 Mbps), a 128 KB document sync takes ~1 second. This is acceptable for the collaboration use case.

### Quantum Resistance

The FHE scheme is lattice-based (RLWE/RGSW), which is believed quantum-resistant. Combined with ML-DSA signatures for authentication and ML-KEM for key exchange (PIP-0002), the entire eCRDT protocol is post-quantum secure.

## References

- [PIP-0001: Mesh Network](./pip-0001-mesh-network.md)
- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [Lux LP-6500: fheCRDT Architecture](https://github.com/luxfi/lps/blob/main/LPs/lp-6500-fhecrdt-architecture.md)
- [Lux LP-6501: DocReceipts](https://github.com/luxfi/lps/blob/main/LPs/lp-6501-fhecrdt-docreceipts.md)
- [Lux LP-6502: DAReceipts](https://github.com/luxfi/lps/blob/main/LPs/lp-6502-fhecrdt-dareceipts.md)
- [CRDT.tech](https://crdt.tech/)
- [TFHE: Fast Fully Homomorphic Encryption](https://eprint.iacr.org/2018/421)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
