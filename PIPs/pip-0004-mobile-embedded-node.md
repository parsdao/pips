---
pip: 4
title: Mobile Embedded Node - Every User is a Node
tags: [mobile, node, dht, embedded, decentralization]
description: Defines the architecture for embedding full blockchain nodes in mobile apps, ensuring the network survives as long as one user remains
author: Pars Network Team (@pars-network)
status: Draft
type: Standards Track
category: Clients
created: 2026-01-23
discussions-to: https://github.com/pars-network/pips/discussions/5
order: 4
tier: core
---

## Abstract

This PIP defines the architecture for embedding complete Pars Network nodes into mobile and desktop applications. The design principle:

> **As long as one Persian lives and has the network running, it will keep running and can continue forever.**

Every user IS a node. Every node is sovereign. The network is the people.

## Motivation

### The Immortal Network

Traditional networks depend on:
- Central servers (can be seized)
- Infrastructure providers (can be pressured)
- Domain registrars (can be blocked)
- Cloud services (can be terminated)

Pars Network depends only on:
- **The people themselves**

If every user runs a full node, the network cannot be killed without eliminating every participant. This is the **decentralized 'Pars Protocol' on top of which civilization will be built, funded, maintained, and operated for millennia.**

### Resilient Node Architecture

Nodes can go offline and reconnect while maintaining state consistency:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    NODE LIFECYCLE - OFFLINE/ONLINE RESILIENCE                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  PHASE 1: ONLINE                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  Node connects to Pars Network                                               │    │
│  │  • Syncs blockchain state                                                    │    │
│  │  • Participates in consensus                                                 │    │
│  │  • Relays messages for others                                                │    │
│  │  • DHT provides peer discovery                                               │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                               │
│                              Goes offline                                            │
│                                      ▼                                               │
│  PHASE 2: OFFLINE                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  Node operates independently                                                  │    │
│  │  • Creates local DAG vertices                                                │    │
│  │  • Accumulates CRDT state changes                                            │    │
│  │  • Can sync with nearby nodes (Bluetooth/WiFi)                               │    │
│  │  • Maintains local blockchain state                                          │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                               │
│                              Comes online                                            │
│                                      ▼                                               │
│  PHASE 3: RECONNECTION                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  Node rejoins network                                                         │    │
│  │  • DHT locates current peers                                                 │    │
│  │  • Syncs accumulated state to network                                        │    │
│  │  • Receives missed updates                                                    │    │
│  │  • DAG merges automatically (no conflicts)                                   │    │
│  │  • Resumes full participation                                                │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  KEY PROPERTY: No data loss. No coordination needed. Eventual consistency.          │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Specification

### Node Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           EMBEDDED NODE ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                           PARS MOBILE APP                                      │  │
│  │                                                                                 │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                        USER INTERFACE LAYER                              │  │  │
│  │  │  Messaging • Groups • Wallet • Settings • Contacts                       │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                      │                                         │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                        APPLICATION LAYER                                 │  │  │
│  │  │  Session Manager • Crypto • Storage • Sync                               │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                      │                                         │  │
│  │  ┌───────────────────────┐  ┌────────────────────────────────────────────┐   │  │
│  │  │   PARS SESSION NODE   │  │           PARS EVM LIGHT NODE             │   │  │
│  │  │                       │  │                                            │   │  │
│  │  │  • Session Daemon     │  │  • EVM State Sync                          │   │  │
│  │  │  • DAG Consensus      │  │  • Light Client Protocol                   │   │  │
│  │  │  • CRDT Storage       │  │  • Smart Contract Calls                    │   │  │
│  │  │  • Gossip Protocol    │  │  • Transaction Submission                  │   │  │
│  │  │  • Mesh Networking    │  │  • Precompile Access                       │   │  │
│  │  └───────────────────────┘  └────────────────────────────────────────────┘   │  │
│  │                                      │                                         │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                        NETWORK LAYER                                     │  │  │
│  │  │  DHT • Gossip • Bluetooth • Local WiFi • Internet • Sneakernet          │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                 │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### DHT (Distributed Hash Table) Integration

The DHT provides:
1. **Peer Discovery**: Find other nodes without central servers
2. **Content Routing**: Locate data across the network
3. **Resilient Lookup**: Works even with high node churn

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           DHT ARCHITECTURE                                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  KADEMLIA-BASED DHT                                                                 │
│                                                                                      │
│  Each node has a 256-bit ID: Hash(public_key)                                       │
│                                                                                      │
│  Routing table organized by XOR distance:                                           │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Bucket 0: Nodes with distance 2^0 to 2^1 (closest)                           │  │
│  │  Bucket 1: Nodes with distance 2^1 to 2^2                                     │  │
│  │  Bucket 2: Nodes with distance 2^2 to 2^3                                     │  │
│  │  ...                                                                           │  │
│  │  Bucket 255: Nodes with distance 2^255 to 2^256 (farthest)                   │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  OPERATIONS:                                                                        │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  FIND_NODE(id)   → Returns k closest nodes to id                              │  │
│  │  FIND_VALUE(key) → Returns value or k closest nodes                           │  │
│  │  STORE(key, val) → Stores value at k closest nodes                            │  │
│  │  PING(node)      → Check if node is alive                                     │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  RESILIENCE:                                                                        │
│  - O(log n) lookups even in large networks                                         │
│  - Handles high churn (nodes joining/leaving)                                      │
│  - No single point of failure                                                       │
│  - Self-healing routing tables                                                      │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

#### DHT for Session Discovery

```go
// DHT-based peer discovery
type SessionDHT struct {
    node      *dht.Node
    routeTable *dht.RoutingTable
    store     dht.Store
}

// Store session presence
func (d *SessionDHT) AnnouncePresence(sessionID []byte) error {
    // Hash session ID
    key := sha256.Sum256(sessionID)

    // Store our address at that key
    return d.node.Store(key[:], d.node.Addr())
}

// Find session participants
func (d *SessionDHT) FindSessionPeers(sessionID []byte) ([]PeerAddr, error) {
    key := sha256.Sum256(sessionID)

    // Iterative lookup
    return d.node.FindValue(key[:])
}

// Bootstrap from known nodes
func (d *SessionDHT) Bootstrap(bootstrapNodes []string) error {
    for _, addr := range bootstrapNodes {
        if err := d.node.Ping(addr); err == nil {
            d.node.AddPeer(addr)
        }
    }
    return d.node.RefreshRoutingTable()
}
```

### Node Types

#### Full Session Node (Recommended)

```go
// Full session node - maximum decentralization
type FullSessionNode struct {
    // Session layer
    dag        *DAGConsensus
    crdt       *CRDTStore
    gossip     *GossipProtocol
    sessions   *SessionManager

    // Network layer
    dht        *SessionDHT
    transports []Transport
    mesh       *MeshNetwork

    // Storage
    db         Database
    keystore   SecureKeystore
}

// Node participates fully in network
func (n *FullSessionNode) Start(ctx context.Context) error {
    // Start DHT
    if err := n.dht.Bootstrap(DefaultBootstrapNodes); err != nil {
        log.Warn("DHT bootstrap failed, will retry", "err", err)
    }

    // Start gossip
    go n.gossip.Run(ctx)

    // Start mesh networking
    go n.mesh.Run(ctx)

    // Sync existing state
    return n.syncState(ctx)
}
```

#### Light EVM Node

```go
// Light EVM node for contract interaction
type LightEVMNode struct {
    // EVM light client
    client     *LightClient
    stateSync  *StateSyncer

    // Precompile access
    precompiles PrecompileRegistry

    // Transaction pool
    txPool     *TxPool
}

// Submit transaction through full nodes
func (n *LightEVMNode) SendTransaction(tx *Transaction) error {
    // Sign transaction
    signedTx, err := n.signTx(tx)
    if err != nil {
        return err
    }

    // Submit via DHT-discovered full nodes
    peers := n.dht.FindValidators()
    return n.submitToPool(peers, signedTx)
}
```

### Offline Operation

When offline, nodes continue to function:

```go
// Offline operation mode
type OfflineMode struct {
    // Local state accumulation
    pendingVertices []*DAGVertex
    pendingCRDT     []*CRDTOp
    pendingTxs      []*Transaction

    // Local peer sync
    localPeers      []*LocalPeer

    // State tracking
    lastOnlineSync  time.Time
    offlineSince    time.Time
}

// Create local DAG vertex while offline
func (o *OfflineMode) CreateVertex(content []byte) (*DAGVertex, error) {
    vertex := &DAGVertex{
        ID:        hash(content),
        Parents:   o.getLocalFrontiers(),
        Timestamp: time.Now().UnixNano(),
        Content:   content,
    }

    // Store locally
    o.pendingVertices = append(o.pendingVertices, vertex)

    // Sync with any local peers via Bluetooth/WiFi
    for _, peer := range o.localPeers {
        go peer.SyncVertex(vertex)
    }

    return vertex, nil
}

// Reconnection sync
func (o *OfflineMode) Resync(ctx context.Context, network *Network) error {
    // 1. Push accumulated vertices to network
    for _, v := range o.pendingVertices {
        if err := network.BroadcastVertex(v); err != nil {
            return err
        }
    }

    // 2. Pull missed vertices from network
    missedVertices, err := network.GetVerticesSince(o.lastOnlineSync)
    if err != nil {
        return err
    }

    // 3. Merge DAGs (automatic, no conflicts)
    for _, v := range missedVertices {
        o.dag.AddVertex(v)
    }

    // 4. Submit pending transactions
    for _, tx := range o.pendingTxs {
        network.SubmitTransaction(tx)
    }

    o.lastOnlineSync = time.Now()
    return nil
}
```

### Resource Management

Mobile devices have limited resources. The node adapts:

```go
// Adaptive resource management
type ResourceManager struct {
    // Limits
    maxMemory     int64  // Max memory usage
    maxStorage    int64  // Max disk usage
    maxBandwidth  int64  // Max network bandwidth
    batteryAware  bool   // Reduce activity on low battery
}

// Adjust behavior based on resources
func (r *ResourceManager) Configure(node *Node) {
    // Memory management
    if runtime.MemStats().Alloc > r.maxMemory * 0.8 {
        node.gossip.ReduceFanout()
        node.dag.PruneOldVertices()
    }

    // Storage management
    if node.storage.Used() > r.maxStorage * 0.9 {
        node.pruneOldData()
    }

    // Battery awareness
    if r.batteryAware && battery.Level() < 20 {
        node.SetLowPowerMode(true)
    }

    // Bandwidth management
    if network.IsMetered() {
        node.gossip.SetMeteredMode(true)
    }
}
```

### Platform-Specific Implementations

#### iOS

```swift
// iOS embedded node
class ParsNode {
    private let sessionNode: SessionNode
    private let evmLight: LightEVMNode

    // Background execution
    func enableBackgroundMode() {
        // Request background fetch
        UIApplication.shared.setMinimumBackgroundFetchInterval(
            UIApplication.backgroundFetchIntervalMinimum
        )

        // Background task for sync
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: "network.pars.sync",
            using: nil
        ) { task in
            self.performBackgroundSync(task: task as! BGAppRefreshTask)
        }
    }

    // Bluetooth mesh
    func enableBluetoothMesh() {
        let mesh = CBCentralManager()
        mesh.scanForPeripherals(withServices: [parsServiceUUID])
    }
}
```

#### Android

```kotlin
// Android embedded node
class ParsNode(context: Context) {
    private val sessionNode = SessionNode()
    private val evmLight = LightEVMNode()

    // Foreground service for continuous operation
    fun startForegroundService() {
        val notification = createNotification()
        startForeground(NOTIFICATION_ID, notification)
    }

    // WorkManager for background sync
    fun scheduleBackgroundSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val syncWork = PeriodicWorkRequestBuilder<SyncWorker>(
            15, TimeUnit.MINUTES
        ).setConstraints(constraints).build()

        WorkManager.getInstance(context).enqueue(syncWork)
    }

    // Nearby Connections for local mesh
    fun enableNearbyMesh() {
        Nearby.getConnectionsClient(context)
            .startAdvertising(nodeId, SERVICE_ID, connectionCallback, advertisingOptions)
    }
}
```

#### Desktop

```rust
// Desktop node (full capabilities)
pub struct ParsDesktopNode {
    session_node: FullSessionNode,
    evm_node: FullEVMNode,  // Can run full EVM node on desktop
}

impl ParsDesktopNode {
    // Desktop can run full validator
    pub fn enable_validator(&mut self, stake: U256) -> Result<()> {
        self.evm_node.register_validator(stake)?;
        self.session_node.enable_validation()?;
        Ok(())
    }

    // System tray operation
    pub fn run_in_tray(&self) {
        let tray = SystemTray::new()
            .with_tooltip("Pars Network Node")
            .with_menu(self.create_tray_menu());

        tray.run();
    }
}
```

### Network Bootstrapping

How nodes find each other initially:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           BOOTSTRAP HIERARCHY                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  LEVEL 1: HARDCODED BOOTSTRAP NODES                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  • Known reliable nodes (geographically distributed)                          │  │
│  │  • Updated with app releases                                                   │  │
│  │  • Last resort fallback                                                        │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│  LEVEL 2: DNS BOOTSTRAP                                                             │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  • bootstrap.pars.network → returns peer list                                 │  │
│  │  • Decentralized DNS (ENS, Handshake)                                         │  │
│  │  • DNSSEC verified                                                             │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│  LEVEL 3: DHT DISCOVERY                                                             │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  • Once connected to any node, DHT takes over                                 │  │
│  │  • Find peers by session ID, group ID, etc.                                   │  │
│  │  • Self-sustaining after initial bootstrap                                    │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│  LEVEL 4: LOCAL DISCOVERY                                                           │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  • mDNS on local network                                                       │  │
│  │  • Bluetooth scanning                                                          │  │
│  │  • QR code sharing (manual)                                                    │  │
│  │  • NFC tap (peer-to-peer)                                                      │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  RESILIENCE: Even if levels 1-3 fail, level 4 allows local mesh formation          │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### The Immortality Guarantee

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           NETWORK IMMORTALITY                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  SCENARIO: Total network destruction attempt                                        │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Attack: All servers shut down                                                 │  │
│  │  Result: No effect (no central servers exist)                                 │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Attack: All known nodes blocked                                               │  │
│  │  Result: DHT routes around, new nodes discoverable                            │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Attack: Internet completely blocked                                           │  │
│  │  Result: Local mesh continues, syncs when reconnected                         │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Attack: 99% of nodes destroyed                                                │  │
│  │  Result: 1% continues operating, rebuilds when new users join                 │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  GUARANTEE:                                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  As long as ONE node survives with the state, the network lives.              │  │
│  │  That node can be a phone in someone's pocket, waiting for a connection.      │  │
│  │  When it finds another device, the network expands again.                     │  │
│  │                                                                                 │  │
│  │  The network dies only when the last Persian forgets.                         │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Security Considerations

### Resource Exhaustion

Mobile nodes must protect against:
- Battery drain attacks
- Storage exhaustion
- Memory pressure

Mitigations: Rate limiting, resource caps, peer reputation.

### Sybil Attacks

In decentralized discovery:
- DHT can be attacked by Sybil nodes
- Mitigation: Proof-of-stake for reputation, peer scoring

### Eclipse Attacks

Malicious nodes surrounding a victim:
- Victim only sees attacker nodes
- Mitigation: Diverse peer selection, out-of-band verification

## Implementation

### App Store Compliance

The embedded node design is app store compliant:
- No mining that drains battery
- User controls when node is active
- Background operation follows platform guidelines
- No deceptive practices

### Code Repository

```bash
# Clone pars mobile app
git clone https://github.com/pars-network/pars-mobile

# Build iOS
cd pars-mobile/ios && pod install && xcodebuild

# Build Android
cd pars-mobile/android && ./gradlew assembleRelease

# Build Desktop
cd pars-mobile/desktop && cargo build --release
```

## References

- [PIP-0000: Network Architecture](./pip-0000-network-architecture.md)
- [PIP-0001: Mesh Network](./pip-0001-mesh-network.md)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [Kademlia DHT Paper](https://pdos.csail.mit.edu/~petar/papers/maymounkov-kademlia-lncs.pdf)
- [libp2p](https://libp2p.io/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
