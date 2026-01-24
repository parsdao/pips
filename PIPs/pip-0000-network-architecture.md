---
pip: 0
title: Pars Network Architecture - Sovereign Infrastructure
tags: [core, architecture, network, lux]
description: Defines the Pars Network dual-layer architecture combining L2 EVM with native session daemon
author: Pars Network Team (@pars-network)
status: Draft
type: Standards Track
category: Core
created: 2026-01-23
discussions-to: https://github.com/pars-network/pips/discussions/1
order: 0
tier: core
---

## Abstract

Pars Network is a dual-layer sovereign blockchain infrastructure providing:

1. **Pars EVM**: L2 EVM-compatible chain on Lux Network with advanced precompiles
2. **Pars Session**: Native L1 session daemon for private, permissionless communications

This PIP establishes the foundational architecture for both layers.

## Motivation

The global Persian diaspora requires sovereign infrastructure that:

1. **Cannot be censored** - No single point of failure or control
2. **Cannot be surveilled** - Privacy is mandatory, not optional
3. **Cannot be coerced** - Resistant to key compromise under duress
4. **Cannot be isolated** - Works through network partitions and blackouts

Existing solutions fail because:
- Centralized platforms can be pressured or shutdown
- Most blockchains leak metadata (who transacted with whom)
- Standard encryption is vulnerable to quantum attacks
- Internet blackouts completely disable communication

## Specification

### Network Parameters

| Parameter | Value | Description |
|:----------|:------|:------------|
| **Chain ID** | `6133` | Pars Network mainnet |
| **Block Time** | `~400ms` | Sub-second finality |
| **Consensus** | Snow++ | Lux-derived BFT consensus |
| **VM** | EVM + Session | Dual execution environments |
| **Gas Token** | PARS | Network gas and staking |
| **Finality** | ~1 second | Probabilistic finality |

### Dual-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           PARS NETWORK LAYERS                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  LAYER 2: PARS EVM                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Smart Contracts • DeFi • DAOs • Governance • Bridges                          │  │
│  │                                                                                 │  │
│  │  Precompiles:                                                                   │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │  │
│  │  │   AI    │ │   DEX   │ │  Graph  │ │   PQ    │ │ Privacy │ │   ZK    │      │  │
│  │  │ 0x0300  │ │ 0x0400  │ │ 0x0500  │ │ 0x0600  │ │ 0x0700  │ │ 0x0900  │      │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘      │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│                              Cross-Layer Bridge                                      │
│                                      │                                               │
│  LAYER 1: PARS SESSION                                                              │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Native Session Daemon • P2P Messaging • Encrypted Blobs • DAG Consensus      │  │
│  │                                                                                 │  │
│  │  Components:                                                                    │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                  │  │
│  │  │ Session │ │ Gossip  │ │   DAG   │ │  CRDT   │ │  Mesh   │                  │  │
│  │  │  Core   │ │Protocol │ │Consensus│ │ Storage │ │ Network │                  │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘                  │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  BASE LAYER: LUX NETWORK                                                            │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Snow++ Consensus • Post-Quantum Ready • Multi-VM • Validator Set             │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Pars EVM (L2)

The EVM layer provides smart contract functionality with enhanced precompiles:

#### Precompile Registry

| Address | Name | Function |
|:--------|:-----|:---------|
| `0x0300-0x03FF` | AI | AI inference, mining, model verification |
| `0x0400-0x04FF` | DEX | Uniswap v4-style hooks, pools, vaults |
| `0x0500-0x05FF` | Graph | GraphQL queries, oracles |
| `0x0600-0x06FF` | PQ Crypto | ML-KEM, ML-DSA, SLH-DSA |
| `0x0700-0x07FF` | Privacy | Ring signatures, ECIES, HPKE |
| `0x0800-0x08FF` | Threshold | FROST, CGGMP21, threshold ECDSA |
| `0x0900-0x09FF` | ZK | Poseidon, Pedersen, STARK verifier |

#### Post-Quantum Precompiles

```solidity
// ML-KEM (Kyber) Key Encapsulation
interface IMLKEM {
    function keyGen(uint8 parameterSet) external returns (bytes memory pk, bytes memory sk);
    function encapsulate(bytes memory pk) external returns (bytes memory ct, bytes memory ss);
    function decapsulate(bytes memory sk, bytes memory ct) external returns (bytes memory ss);
}

// ML-DSA (Dilithium) Signatures
interface IMLDSA {
    function keyGen(uint8 mode) external returns (bytes memory pk, bytes memory sk);
    function sign(bytes memory sk, bytes memory message) external returns (bytes memory sig);
    function verify(bytes memory pk, bytes memory message, bytes memory sig) external returns (bool);
}
```

### Pars Session (L1)

The native session layer provides private communications:

#### Session State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION STATE MACHINE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐    create    ┌─────────┐    ready    ┌─────────┐  │
│   │ Pending │ ──────────►  │ Running │ ──────────► │WaitingIO│  │
│   └─────────┘              └─────────┘              └─────────┘  │
│                                  │                      │        │
│                                  │                      │        │
│                           error  │              success │        │
│                                  ▼                      ▼        │
│                            ┌─────────┐           ┌──────────┐   │
│                            │ Failed  │           │Finalized │   │
│                            └─────────┘           └──────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Core Session Structure

```go
type Session struct {
    ID          ID          `json:"id"`
    ServiceID   ID          `json:"serviceId"`
    Epoch       uint64      `json:"epoch"`
    TxID        ID          `json:"txId"`
    Committee   []ID        `json:"committee"`
    State       SessionState `json:"state"`
    Steps       []*Step     `json:"steps"`
    OutputHash  ID          `json:"outputHash,omitempty"`
}
```

#### Transport Protocol

```go
type MessageType uint8

const (
    MessageTypeHandshake      MessageType = iota  // Initial connection
    MessageTypeSessionCreate                       // Create new session
    MessageTypeOracleRequest                       // Request oracle data
    MessageTypeAttestation                         // Cryptographic attestation
    MessageTypeReceipt                             // Execution receipt
    MessageTypeHeartbeat                           // Keepalive
)
```

### Cross-Layer Integration

The two layers communicate via:

1. **State Anchoring**: Session state roots anchored to EVM
2. **Oracle Bridge**: EVM contracts can query session state
3. **Event Relay**: Session events trigger EVM transactions

### Network Topology

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           NETWORK TOPOLOGY                                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  VALIDATORS (Full Nodes)                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                                │
│  │   V1    │──│   V2    │──│   V3    │──│   V4    │   Full EVM + Session           │
│  │ Tehran  │  │  LA     │  │ London  │  │ Sydney  │   Geographically distributed   │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘                                │
│       │            │            │            │                                       │
│       └────────────┴────────────┴────────────┘                                       │
│                         │                                                            │
│                    P2P Gossip                                                        │
│                         │                                                            │
│  LIGHT NODES (Session Only)                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                                │
│  │ Mobile  │  │ Desktop │  │ Tablet  │  │Embedded │   Session daemon only          │
│  │  App    │  │   App   │  │   App   │  │  Node   │   Can operate offline          │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘                                │
│                                                                                      │
│  MESH NODES (Offline Capable)                                                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                                             │
│  │Bluetooth│──│Local WiFi│──│USB Sync │   Can sync without internet                │
│  │  Mesh   │  │   Mesh   │  │Sneakernet│   CRDT-based eventual consistency         │
│  └─────────┘  └─────────┘  └─────────┘                                             │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Rationale

### Why Dual-Layer?

1. **EVM for DeFi**: Full smart contract support, composability
2. **Native for Privacy**: Session layer has no metadata leakage
3. **Separation of Concerns**: Financial vs communication needs

### Why Lux?

1. **Snow++ Consensus**: Battle-tested, high-throughput
2. **Subnet Architecture**: Sovereign validator set
3. **PQ Roadmap**: Already preparing for quantum threats
4. **Bridge Native**: Proven cross-chain infrastructure

### Why Native Sessions?

1. **No Metadata**: Sessions don't touch EVM (no on-chain traces)
2. **Offline Capable**: Works without internet connectivity
3. **Mesh Ready**: Direct peer-to-peer without servers

## Security Considerations

### Consensus Security

- Minimum 21 validators for mainnet
- 2/3 honest assumption for Snow++
- Slashing for misbehavior
- Emergency pause capabilities

### Bridge Security

- Multi-sig guardians
- Rate limiting on large transfers
- 24-hour timelock on governance changes

### Session Security

- Client-side encryption only
- No server-side key storage
- PQ encryption mandatory

## Implementation

### RPC Endpoints

| Network | Endpoint | Chain ID |
|:--------|:---------|:---------|
| Mainnet | `https://rpc.pars.network` | 6133 |
| Testnet | `https://testnet.pars.network` | 6134 |

### Session Daemon

```bash
# Run session daemon
sessiond --network pars --datadir ~/.pars/session

# Connect to existing node
sessiond --bootstrap /ip4/x.x.x.x/tcp/9000/p2p/QmPeerId
```

### Explorer

- Mainnet: `https://explorer.pars.network`
- Testnet: `https://testnet-explorer.pars.network`

## References

- [Lux Network Documentation](https://docs.lux.network)
- [PIP-0001: Mesh Network](./pip-0001-mesh-network.md)
- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
