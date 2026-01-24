---
pip: 1
title: Mesh Network - DAG/CRDT Resilient Communications
tags: [mesh, dag, crdt, offline, sneakernet]
description: Defines the mesh network architecture for offline-capable, partition-tolerant communications
author: Pars Network Team (@pars-network)
status: Draft
type: Standards Track
category: Mesh
created: 2026-01-23
discussions-to: https://github.com/pars-network/pips/discussions/2
order: 1
tier: core
---

## Abstract

This PIP defines Pars Network's mesh networking layer - a DAG-based, CRDT-powered communications system that operates through network partitions, internet blackouts, and physical separation. The mesh enables continued operation even when:

- Internet is completely blocked
- WiFi networks are jammed
- Physical infrastructure is destroyed
- Nodes are isolated for extended periods

## Motivation

### The Blackout Scenario

During civil unrest, authoritarian regimes routinely:
1. **Cut internet access** - Total blackout or severe throttling
2. **Block specific protocols** - VPNs, Tor, Signal detected and blocked
3. **Monitor metadata** - Who talked to whom, even if content is encrypted
4. **Seize devices** - Extract data from confiscated phones

Traditional messaging apps fail because they require:
- Persistent internet connectivity
- Centralized servers (can be blocked/seized)
- Metadata exposure (connection patterns visible)

### The Pars Solution

Pars Mesh provides:
1. **Offline-first operation** - Nodes sync when connected, work independently when not
2. **Multiple transport options** - Internet, local WiFi, Bluetooth, USB sneakernet
3. **DAG consensus** - Eventual consistency without central coordination
4. **CRDT storage** - Conflict-free merging after partitions heal

## Specification

### DAG Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           DAG CONSENSUS ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  TIME ──────────────────────────────────────────────────────────────────────►       │
│                                                                                      │
│  Node A:    ●──────────●──────────●──────────●                                      │
│              │          │          │          │                                      │
│              │          │    ┌─────┤          │                                      │
│              │          │    │     │          │                                      │
│  Node B:    ●──────────●────┼─────●──────────●                                      │
│              │          │    │     │          │                                      │
│              │    ┌─────┼────┘     │    ┌─────┤                                      │
│              │    │     │          │    │     │                                      │
│  Node C:    ●────┼─────●──────────●────┼─────●                                      │
│              │    │     │          │    │     │                                      │
│                   │                     │                                            │
│                   │                     │                                            │
│            Cross-references form DAG structure                                       │
│            Each vertex references multiple parents                                   │
│            No single linear chain - parallel histories merge                         │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### DAG Vertex Structure

```go
// Vertex in the DAG
type Vertex struct {
    ID        [32]byte    // SHA3-256 hash of content
    Parents   [][32]byte  // References to parent vertices
    Timestamp uint64      // Logical timestamp
    Author    [32]byte    // Author's public key hash
    Signature []byte      // PQ signature over content
    Payload   []byte      // Encrypted message content
}

// DAG state
type DAG struct {
    Frontiers map[[32]byte]bool  // Current frontier vertices
    Vertices  map[[32]byte]*Vertex
    Index     *VertexIndex       // For efficient queries
}
```

### Frontier Management

The DAG maintains "frontiers" - the set of vertices with no children:

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTIER EVOLUTION                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Time T1: Frontier = {A, B, C}                                  │
│           ●A   ●B   ●C                                          │
│                                                                  │
│  Time T2: New vertex D references A and B                       │
│           ●A   ●B   ●C                                          │
│            \   /                                                 │
│             ●D                                                   │
│           Frontier = {C, D}                                     │
│                                                                  │
│  Time T3: New vertex E references C and D                       │
│           ●A   ●B   ●C                                          │
│            \   /    /                                            │
│             ●D────-┘                                             │
│              \                                                   │
│               ●E                                                 │
│           Frontier = {E}                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### CRDT Storage

Conflict-Free Replicated Data Types enable automatic merging:

```go
// CRDT types supported
type CRDTType uint8

const (
    CRDTGCounter     CRDTType = iota  // Grow-only counter
    CRDTPNCounter                      // Positive-negative counter
    CRDTGSet                           // Grow-only set
    CRDTORSet                          // Observed-remove set
    CRDTLWWRegister                    // Last-writer-wins register
    CRDTMVRegister                     // Multi-value register
    CRDTRGArray                        // Replicated growable array
)

// CRDT document
type CRDTDocument struct {
    ID       [32]byte
    Type     CRDTType
    State    []byte       // Serialized CRDT state
    Vector   VectorClock  // Version vector
}

// Merge operation (automatic, no conflicts)
func (c *CRDTDocument) Merge(other *CRDTDocument) {
    // Merge is commutative, associative, idempotent
    // Result is always the same regardless of merge order
}
```

### Transport Layers

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           TRANSPORT LAYER STACK                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  LAYER 4: APPLICATION                                                               │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Messaging • File Sharing • Group Chat • Voice (future)                        │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│  LAYER 3: SESSION                                                                   │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Session Keys • PQ Encryption • Forward Secrecy • Ratcheting                  │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│  LAYER 2: DAG/CRDT                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Vertex Creation • Parent Selection • Frontier Mgmt • Merge Operations        │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│  LAYER 1: GOSSIP                                                                    │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Push Gossip • Pull Gossip • Bloom Filters • Anti-Entropy                     │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│  LAYER 0: TRANSPORT                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │  Internet   │ │ Local WiFi  │ │  Bluetooth  │ │  USB/File   │ │   Starlink  │  │
│  │  (TCP/QUIC) │ │  (mDNS)     │ │   (BLE)     │ │ (Sneakernet)│ │  (Satellite)│  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Gossip Protocol

```go
// Gossip message types
type GossipType uint8

const (
    GossipPush    GossipType = iota  // "I have these vertices"
    GossipPull                        // "What do you have?"
    GossipHave                        // Bloom filter of known vertices
    GossipWant                        // Request specific vertices
)

// Push gossiper (proactive propagation)
type PushGossiper struct {
    fanout       int           // Number of peers to push to
    frequency    time.Duration // How often to push
    maxQueueSize int           // Pending items limit
}

// Pull gossiper (anti-entropy repair)
type PullGossiper struct {
    frequency time.Duration // How often to pull
    peers     []PeerID      // Peers to pull from
}
```

### Offline Sync Protocols

#### 1. Bluetooth Low Energy (BLE)

```
┌─────────────────────────────────────────────────────────────────┐
│                    BLUETOOTH MESH SYNC                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Phone A                                Phone B                  │
│     │                                      │                     │
│     │  1. BLE Advertisement (Service UUID) │                     │
│     │ ◄───────────────────────────────────┤                     │
│     │                                      │                     │
│     │  2. Connect + Exchange frontiers     │                     │
│     │ ─────────────────────────────────────►                     │
│     │                                      │                     │
│     │  3. Diff calculation                 │                     │
│     │      (what A has that B needs)       │                     │
│     │                                      │                     │
│     │  4. Transfer missing vertices        │                     │
│     │ ─────────────────────────────────────►                     │
│     │                                      │                     │
│     │  5. Merge DAGs                       │                     │
│     │                                      │                     │
│     │  Max range: ~10-30m                  │                     │
│     │  Throughput: ~1-2 Mbps               │                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 2. Local WiFi (No Internet)

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOCAL WIFI MESH SYNC                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    LOCAL WIFI NETWORK                        ││
│  │         (Internet may be blocked/unavailable)                ││
│  │                                                               ││
│  │     ┌─────────┐      ┌─────────┐      ┌─────────┐           ││
│  │     │ Phone A │──────│ Laptop  │──────│ Phone B │           ││
│  │     └─────────┘      └────┬────┘      └─────────┘           ││
│  │                           │                                   ││
│  │                      ┌────┴────┐                             ││
│  │                      │ Phone C │                             ││
│  │                      └─────────┘                             ││
│  │                                                               ││
│  │  Discovery: mDNS (_pars-mesh._tcp.local)                     ││
│  │  Protocol: QUIC over UDP                                      ││
│  │  Throughput: ~100+ Mbps                                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 3. USB Sneakernet

```
┌─────────────────────────────────────────────────────────────────┐
│                    USB SNEAKERNET SYNC                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Location A                              Location B              │
│  (No internet)                          (Has internet)           │
│                                                                  │
│  ┌─────────┐        USB Drive         ┌─────────┐               │
│  │ Phone A │ ──── Export bundle ────► │ USB-C   │               │
│  └─────────┘                          └────┬────┘               │
│                                            │                     │
│                    Physical transport      │                     │
│                    (person carries USB)    │                     │
│                                            │                     │
│  ┌─────────┐                          ┌────▼────┐               │
│  │ Phone B │ ◄── Import bundle ────── │ USB-C   │               │
│  └─────────┘                          └─────────┘               │
│                                                                  │
│  Bundle format:                                                  │
│  - Encrypted DAG vertices                                        │
│  - CRDT state snapshots                                         │
│  - Frontier markers                                              │
│  - Signed by exporting device                                    │
│                                                                  │
│  Security:                                                       │
│  - Bundle is encrypted with group key                           │
│  - Cannot be read without membership                            │
│  - Tamper-evident (signed)                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 4. Starlink Bridge

```
┌─────────────────────────────────────────────────────────────────┐
│                    STARLINK BRIDGE NODE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BLOCKED ZONE                         UNBLOCKED ZONE            │
│  (No internet)                        (Starlink access)         │
│                                                                  │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐   │
│  │ Phone A │─────│ Phone B │─────│ Bridge  │═════│ Network │   │
│  └─────────┘     └─────────┘     │  Node   │     └─────────┘   │
│       │               │          └────┬────┘                    │
│       │               │               │                          │
│  ┌────┴────┐     ┌────┴────┐         │  Starlink                │
│  │ Phone C │     │ Phone D │         │  Satellite               │
│  └─────────┘     └─────────┘         │  Connection              │
│                                       │                          │
│  Local mesh via                  Bridge node syncs              │
│  Bluetooth/WiFi                  with global network            │
│                                  via Starlink                   │
│                                                                  │
│  One Starlink terminal can serve hundreds of local users        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Partition Recovery

When partitioned networks reconnect:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARTITION RECOVERY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BEFORE PARTITION (t=0)                                         │
│  Group has nodes: A, B, C, D, E                                 │
│  All nodes have same frontier: {V100}                           │
│                                                                  │
│  DURING PARTITION (t=1 to t=N)                                  │
│  Partition 1: A, B       Partition 2: C, D, E                   │
│  Creates: V101, V102     Creates: V201, V202, V203              │
│                                                                  │
│  AFTER RECONNECTION (t=N+1)                                     │
│  1. Exchange frontiers                                          │
│     P1 frontier: {V102}                                         │
│     P2 frontier: {V203}                                         │
│                                                                  │
│  2. Identify missing vertices via Bloom filters                 │
│                                                                  │
│  3. Request and transfer missing vertices                       │
│                                                                  │
│  4. Merge DAGs                                                  │
│     New vertex V300 references both V102 and V203               │
│     Unified frontier: {V300}                                    │
│                                                                  │
│  5. CRDT state automatically converges                          │
│     - Messages appear in correct logical order                  │
│     - No conflicts, no data loss                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Mesh Discovery

```go
// Discovery methods
type DiscoveryMethod uint8

const (
    DiscoveryMDNS      DiscoveryMethod = iota  // Local network
    DiscoveryBLE                                // Bluetooth
    DiscoveryDHT                                // Distributed hash table
    DiscoveryBootstrap                          // Known bootstrap nodes
    DiscoveryQR                                 // QR code (manual)
)

// Peer discovery service
type Discovery struct {
    methods  []DiscoveryMethod
    peers    map[PeerID]*PeerInfo
    handlers map[DiscoveryMethod]DiscoveryHandler
}

// Discovered peer info
type PeerInfo struct {
    ID         PeerID
    Addresses  []string      // Multiaddrs
    LastSeen   time.Time
    Frontiers  [][32]byte    // Known frontiers
    Transports []Transport   // Available transports
}
```

## Security Considerations

### Transport Security

All transports use the same encryption layer:
- PQ key exchange (ML-KEM)
- PQ authentication (ML-DSA)
- Symmetric encryption (AES-256-GCM)
- Forward secrecy (ratcheting keys)

### Metadata Protection

```
┌─────────────────────────────────────────────────────────────────┐
│                    METADATA MINIMIZATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  VISIBLE to network observers:                                  │
│  - Two devices connected (can't hide physical proximity)        │
│  - Data transferred (can't hide that sync happened)             │
│                                                                  │
│  NOT VISIBLE to network observers:                              │
│  - Message content (encrypted)                                  │
│  - Group membership (encrypted metadata)                        │
│  - Message timing (batched, padded)                            │
│  - Sender identity (onion-style routing)                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Sybil Resistance

- Proof-of-stake for validators
- Rate limiting per identity
- Reputation system for peers
- Challenge-response for expensive operations

## Implementation

### Data Structures

```go
// Mesh node
type MeshNode struct {
    identity   *Identity
    dag        *DAG
    crdt       *CRDTStore
    gossiper   *Gossiper
    transports []Transport
    discovery  *Discovery
}

// Initialize mesh node
func NewMeshNode(config *Config) (*MeshNode, error) {
    // Generate or load identity
    identity, err := LoadOrCreateIdentity(config.DataDir)
    if err != nil {
        return nil, err
    }

    // Initialize DAG
    dag := NewDAG(config.DataDir)

    // Initialize CRDT store
    crdt := NewCRDTStore(config.DataDir)

    // Start transports
    transports := []Transport{
        NewInternetTransport(config.ListenAddr),
        NewBluetoothTransport(),
        NewLocalWiFiTransport(),
    }

    return &MeshNode{
        identity:   identity,
        dag:        dag,
        crdt:       crdt,
        transports: transports,
    }, nil
}
```

### Sync Algorithm

```go
// Sync with peer
func (m *MeshNode) SyncWithPeer(ctx context.Context, peer PeerID) error {
    // 1. Exchange frontiers
    myFrontiers := m.dag.GetFrontiers()
    theirFrontiers, err := m.RequestFrontiers(ctx, peer)
    if err != nil {
        return err
    }

    // 2. Calculate diff using Bloom filters
    myBloom := m.dag.GetBloomFilter()
    theirBloom, err := m.RequestBloomFilter(ctx, peer)
    if err != nil {
        return err
    }

    // 3. Request missing vertices
    missing := m.dag.FindMissing(theirFrontiers, theirBloom)
    vertices, err := m.RequestVertices(ctx, peer, missing)
    if err != nil {
        return err
    }

    // 4. Merge into local DAG
    for _, v := range vertices {
        if err := m.dag.AddVertex(v); err != nil {
            log.Warn("Failed to add vertex", "id", v.ID, "err", err)
        }
    }

    // 5. Merge CRDT states
    return m.crdt.MergeFromPeer(ctx, peer)
}
```

## References

- [PIP-0000: Network Architecture](./pip-0000-network-architecture.md)
- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)
- [PIP-0004: Mobile Embedded Node](./pip-0004-mobile-embedded-node.md)
- [CRDT.tech](https://crdt.tech/)
- [Merkle-DAG](https://docs.ipfs.io/concepts/merkle-dag/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
