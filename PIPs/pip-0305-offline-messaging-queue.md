---
pip: 305
title: "Offline Messaging Queue"
description: "Store-and-forward messaging for offline and censored Pars Network users"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Communication
created: 2026-01-23
tags: [communication, offline, queue, mesh, censorship-resistance]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a store-and-forward messaging system for Pars Network users who are offline, experiencing internet blackouts, or operating under network censorship. Messages are queued across the swarm network and delivered when the recipient reconnects. The system also supports mesh-network delivery via Bluetooth, local WiFi, and physical media (sneakernet) for operation during complete internet shutdowns.

## Motivation

Internet blackouts are a regular tool of authoritarian governments:

1. **Full shutdowns** -- entire countries lose internet access during protests or elections
2. **Throttling** -- bandwidth reduced to make real-time communication impossible
3. **Protocol blocking** -- specific protocols (VPN, Tor) selectively blocked
4. **Regional isolation** -- specific cities or provinces disconnected

The Pars Network must continue functioning in all these scenarios. Messaging must degrade gracefully from real-time to eventually-consistent delivery.

## Specification

### Message Queue Architecture

```
┌──────────────────────────────────────────────────┐
│  ONLINE: Normal session-layer delivery            │
│  Sender ──► Onion Routing ──► Swarm ──► Recipient │
└───────────────────┬──────────────────────────────┘
                    │ (recipient offline)
┌───────────────────▼──────────────────────────────┐
│  QUEUED: Swarm stores encrypted messages          │
│  Swarm Node 1: [msg_a, msg_b, msg_c]            │
│  Swarm Node 2: [msg_a, msg_b, msg_c] (replica)  │
│  Swarm Node 3: [msg_a, msg_b, msg_c] (replica)  │
│  TTL: 14 days (configurable up to 30)            │
└───────────────────┬──────────────────────────────┘
                    │ (internet blackout)
┌───────────────────▼──────────────────────────────┐
│  MESH: Local network delivery                     │
│  Device ──► Bluetooth ──► Local WiFi ──► Device  │
│  CRDT-based sync, eventual consistency            │
└───────────────────┬──────────────────────────────┘
                    │ (no local network)
┌───────────────────▼──────────────────────────────┐
│  SNEAKERNET: Physical media delivery              │
│  Device ──► USB/SD Card ──► Physical ──► Device  │
│  Signed bundle with integrity verification        │
└──────────────────────────────────────────────────┘
```

### Swarm Queue Protocol

```go
type QueuedMessage struct {
    RecipientSwarmKey [32]byte   // Derived from recipient's session ID
    EncryptedPayload  []byte     // E2E encrypted message
    StoredAt          int64      // Timestamp of storage
    ExpiresAt         int64      // TTL expiry
    Priority          uint8      // 0=normal, 1=high, 2=emergency
    Size              uint32     // Payload size
}

type SwarmQueue interface {
    Enqueue(msg QueuedMessage) error
    Dequeue(recipientKey [32]byte, since int64) ([]QueuedMessage, error)
    Acknowledge(recipientKey [32]byte, messageIDs [][16]byte) error
    GetQueueDepth(recipientKey [32]byte) (uint32, error)
}
```

### Mesh Delivery Protocol

When internet is unavailable, devices form local mesh networks:

```go
type MeshTransport interface {
    // Discover nearby Pars nodes
    DiscoverPeers() ([]PeerInfo, error)

    // Sync message queues with peer
    SyncMessages(peer PeerInfo) error

    // Available transports
    Transports() []TransportType  // Bluetooth, WiFi Direct, NFC
}

type TransportType uint8
const (
    TransportBluetooth  TransportType = iota
    TransportWiFiDirect
    TransportNFC
    TransportUSB
)
```

### CRDT-Based Sync

Mesh synchronization uses CRDTs (PIP-0013) to achieve eventual consistency without a central coordinator. Each device maintains a local message set (G-Set CRDT). When two devices connect, they exchange set differences and merge new messages. Messages propagate transitively through the mesh.

### Sneakernet Bundle

For physical media delivery, a user exports pending outbound messages as an encrypted bundle to USB/SD card. Another user physically carries it to a location with connectivity and uploads to the swarm. Bundles include a Merkle root and creator signature for integrity verification.

### Priority System

| Priority | TTL | Replication | Use Case |
|:---------|:----|:-----------|:---------|
| Normal (0) | 14 days | 3 nodes | Standard messages |
| High (1) | 30 days | 5 nodes | Important coordination |
| Emergency (2) | 30 days | 7 nodes | Crisis communication |

Emergency messages also trigger immediate mesh broadcast to all nearby devices.

## Rationale

- **Graceful degradation** from internet to mesh to sneakernet ensures communication never fully stops
- **CRDT sync** requires no central coordinator and handles network partitions naturally
- **Priority tiers** ensure critical messages get maximum redundancy and persistence
- **Swarm replication** prevents message loss from individual node failures
- **Sneakernet support** is the ultimate censorship-resistant transport

## Security Considerations

- **Mesh traffic analysis** -- Bluetooth and WiFi Direct broadcast device identifiers; the mesh protocol MUST use randomized MAC addresses and encrypted discovery
- **Sneakernet interception** -- physical media can be confiscated; bundles are encrypted and the carrier cannot read contents; plausible deniability is provided by encrypting the bundle in a way that appears as random data
- **Message injection** -- mesh sync could be used to inject fake messages; all messages are verified against session-layer signatures before delivery
- **Queue flooding** -- an attacker could flood a recipient's queue; per-sender rate limits and priority-based eviction mitigate this
- **Stale messages** -- messages delivered after long delays may be outdated; clients SHOULD display delivery delay prominently

## References

- [PIP-0001: Mesh Network](./pip-0001-mesh-network.md)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [PIP-0013: Encrypted CRDT](./pip-0013-encrypted-crdt.md)
- [PIP-0300: Encrypted Messaging Protocol](./pip-0300-encrypted-messaging-protocol.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
