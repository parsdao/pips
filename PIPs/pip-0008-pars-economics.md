# PIP-0008: Pars Network Economics & Storage Architecture

```
PIP: 0008
Title: Pars Network Economics & Storage Architecture
Author: Pars Core Team
Status: Draft
Type: Standards Track
Category: Economics
Created: 2026-01-23
```

## Abstract

This PIP defines the economic model and storage architecture for the Pars Network,
a post-quantum secure messaging sovereign L1. It describes how validators earn PARS,
how storage is allocated across the network, and how the system maintains
permissionless operation while ensuring adequate storage capacity.

## Motivation

Pars Network needs a sustainable economic model that:
1. Incentivizes sufficient validator/storage node participation
2. Ensures messages are reliably stored and replicated
3. Operates permissionlessly without central coordination
4. Remains compatible with existing Session mobile applications
5. Provides post-quantum security guarantees

## Specification

### 1. Network Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     PARS SOVEREIGN L1                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  P-Chain    │  │  X-Chain    │  │      C-Chain (EVM)      │ │
│  │  Validator  │  │   PARS      │  │  Chain ID: 7070         │ │
│  │  Staking    │  │  Liquidity  │  │  PQ Precompiles:        │ │
│  │             │  │  & Fees     │  │  - ML-DSA (0x0601)      │ │
│  │  Min: 15K   │  │             │  │  - ML-KEM (0x0603)      │ │
│  │  PARS       │  │             │  │  - BLS (0x0B00)         │ │
│  └─────────────┘  └─────────────┘  │  - Ringtail (0x0700)    │ │
│                                     │  - FHE (0x0800)         │ │
│                                     └─────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    S-Chain (SessionVM)                    │  │
│  │                    VMID: speKUg...vRP48                   │  │
│  │                                                           │  │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │  │
│  │   │ Swarm 0 │  │ Swarm 1 │  │ Swarm 2 │  │ Swarm N │    │  │
│  │   │ ┌─────┐ │  │ ┌─────┐ │  │ ┌─────┐ │  │ ┌─────┐ │    │  │
│  │   │ │Node │ │  │ │Node │ │  │ │Node │ │  │ │Node │ │    │  │
│  │   │ │ A   │ │  │ │ D   │ │  │ │ G   │ │  │ │ J   │ │    │  │
│  │   │ ├─────┤ │  │ ├─────┤ │  │ ├─────┤ │  │ ├─────┤ │    │  │
│  │   │ │Node │ │  │ │Node │ │  │ │Node │ │  │ │Node │ │    │  │
│  │   │ │ B   │ │  │ │ E   │ │  │ │ H   │ │  │ │ K   │ │    │  │
│  │   │ ├─────┤ │  │ ├─────┤ │  │ ├─────┤ │  │ ├─────┤ │    │  │
│  │   │ │Node │ │  │ │Node │ │  │ │Node │ │  │ │Node │ │    │  │
│  │   │ │ C   │ │  │ │ F   │ │  │ │ I   │ │  │ │ L   │ │    │  │
│  │   │ └─────┘ │  │ └─────┘ │  │ └─────┘ │  │ └─────┘ │    │  │
│  │   └─────────┘  └─────────┘  └─────────┘  └─────────┘    │  │
│  │                                                           │  │
│  │   Storage: ~10GB per node, replicated 3x within swarm     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Validator/Storage Node Economics

#### 2.1 X-Chain Staking Model

PARS uses a **native X-Chain staking** model where validators lock PARS on X-Chain
which enables transparent cross-chain access to Lux ecosystem:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARS STAKING FLOW                            │
└─────────────────────────────────────────────────────────────────┘

    Validator                 Pars L1                 Lux Ecosystem
    ─────────                 ───────                 ─────────────
        │                        │                         │
        │  1. Stake PARS         │                         │
        │───────────────────────>│                         │
        │                        │                         │
        │                        │  2. Lock on X-Chain     │
        │                        │────────────────────────>│
        │                        │                         │
        │                        │  3. Bridge fees to      │
        │                        │     T-Chain/Z-Chain     │
        │                        │<───────────────────────>│
        │                        │                         │
        │  4. Earn rewards       │                         │
        │<───────────────────────│                         │
        │                        │                         │

Cross-Chain Precompile Access (via locked stake):
  - 0x1000: X-Chain liquidity operations
  - 0x1100: T-Chain DEX/trading access
  - 0x1200: Z-Chain ZK proof verification
  - 0x1300: Warp cross-subnet messaging
  - 0x2000-0x2300: LX DEX orderbook/pools (HFT optimized)
```

#### 2.2 Staking Requirements

| Parameter | Value | Description |
|-----------|-------|-------------|
| `stakingRequirement` | 15,000 PARS | Minimum stake to run a node |
| `minOperatorStake` | 25% (3,750 PARS) | Operator must stake at least 25% |
| `maxContributors` | 10 | Maximum contributors per node |
| `smallContributorThreshold` | 25% | Contributors < 25% have delayed exit |
| `lockPeriod` | 30 days | Stake lock period on X-Chain |
| `xchainBridge` | enabled | Cross-chain fee bridge active |

#### 2.2 Reward Distribution

Validators earn PARS from two sources:

1. **Block Rewards** (inflation):
   - Year 1: 8% annual inflation
   - Year 2: 6% annual inflation
   - Year 3+: 4% annual inflation (terminal rate)
   - Distributed proportionally to staked PARS

2. **Transaction Fees**:
   - Session creation fee: 0.001 PARS
   - Message storage fee: 0.0001 PARS per KB
   - EVM transaction fees: Standard gas model

```solidity
// Reward calculation (simplified)
function calculateReward(
    uint256 stakedAmount,
    uint256 totalStaked,
    uint256 blockReward
) public pure returns (uint256) {
    return (stakedAmount * blockReward) / totalStaked;
}
```

#### 2.3 Claim Mechanics

| Parameter | Value | Description |
|-----------|-------|-------------|
| `claimThreshold` | 1,000,000 PARS | Max claimable per cycle |
| `claimCycle` | 12 hours | Cycle duration |
| `signatureExpiry` | 10 minutes | BLS signature validity |

### 3. Storage Allocation (Swarm Architecture)

#### 3.1 Swarm Formation

Nodes are organized into **swarms** (shards) based on their public key:

```go
// Swarm ID calculation
func calculateSwarmID(nodePubKey []byte, totalSwarms uint64) uint64 {
    hash := sha256.Sum256(nodePubKey)
    return binary.BigEndian.Uint64(hash[:8]) % totalSwarms
}

// User -> Swarm mapping
func userToSwarm(userSessionID string, totalSwarms uint64) uint64 {
    hash := sha256.Sum256([]byte(userSessionID))
    return binary.BigEndian.Uint64(hash[:8]) % totalSwarms
}
```

#### 3.2 Storage Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `SIZE_LIMIT` | 10 GB | Max storage per node |
| `sessionTTL` | 86,400s (24h) | Default session lifetime |
| `maxMessages` | 10,000 | Max messages per session |
| `retentionDays` | 30 | Message retention period |
| `replicationFactor` | 3 | Copies per swarm |

#### 3.3 Swarm Sizing

The network automatically adjusts swarm count based on total nodes:

```go
const (
    MinNodesPerSwarm = 3   // Minimum for replication
    MaxNodesPerSwarm = 10  // Maximum for efficiency
    TargetNodesPerSwarm = 5
)

func calculateSwarmCount(totalNodes uint64) uint64 {
    if totalNodes < MinNodesPerSwarm {
        return 1 // Single swarm mode
    }
    return (totalNodes + TargetNodesPerSwarm - 1) / TargetNodesPerSwarm
}
```

#### 3.4 Storage Proof (Data Availability)

Nodes prove they're storing data via periodic challenges:

```go
type StorageProof struct {
    NodeID      string    `json:"nodeId"`
    SwarmID     uint64    `json:"swarmId"`
    MerkleRoot  [32]byte  `json:"merkleRoot"`
    MessageCount uint64   `json:"messageCount"`
    UsedBytes   uint64    `json:"usedBytes"`
    Timestamp   int64     `json:"timestamp"`
    Signature   []byte    `json:"signature"`  // ML-DSA signature
}

// Challenge-response for random message retrieval
type StorageChallenge struct {
    ChallengerID string   `json:"challengerId"`
    TargetID     string   `json:"targetId"`
    MessageHash  string   `json:"messageHash"`
    Nonce        [32]byte `json:"nonce"`
}
```

### 4. How We Know We Have Enough Nodes

#### 4.1 Network Health Metrics

The network monitors several health indicators:

```go
type NetworkHealth struct {
    TotalNodes       uint64  `json:"totalNodes"`
    ActiveNodes      uint64  `json:"activeNodes"`
    SwarmCount       uint64  `json:"swarmCount"`
    AvgNodesPerSwarm float64 `json:"avgNodesPerSwarm"`
    MinSwarmSize     uint64  `json:"minSwarmSize"`
    StorageCapacity  uint64  `json:"storageCapacity"`  // Total GB
    StorageUsed      uint64  `json:"storageUsed"`      // Used GB
    ReplicationOK    bool    `json:"replicationOk"`    // All swarms have 3+ nodes
}

func (h NetworkHealth) IsHealthy() bool {
    return h.MinSwarmSize >= 3 &&
           h.ActiveNodes >= h.TotalNodes*80/100 &&
           h.StorageUsed < h.StorageCapacity*90/100
}
```

#### 4.2 Dynamic Fee Adjustment

When storage is scarce, fees increase to incentivize more nodes:

```go
func calculateStorageFee(baseRate uint64, networkHealth NetworkHealth) uint64 {
    utilization := networkHealth.StorageUsed * 100 / networkHealth.StorageCapacity

    switch {
    case utilization < 50:
        return baseRate
    case utilization < 70:
        return baseRate * 2
    case utilization < 85:
        return baseRate * 5
    case utilization < 95:
        return baseRate * 10
    default:
        return baseRate * 50 // Extreme scarcity
    }
}
```

#### 4.3 Minimum Network Requirements

| Metric | Minimum | Target | Description |
|--------|---------|--------|-------------|
| Total Nodes | 15 | 100+ | For 5 swarms with 3 nodes each |
| Nodes per Swarm | 3 | 5-7 | For adequate replication |
| Total Stake | 225,000 PARS | 1.5M+ PARS | 15 nodes × 15K PARS |
| Storage Capacity | 150 GB | 1+ TB | 15 nodes × 10 GB |

### 5. Session/Lokinet Compatibility

#### 5.1 Protocol Compatibility

Pars is designed to be **wire-compatible** with Session:

| Component | Session/Oxen | Pars | Compatibility |
|-----------|--------------|------|---------------|
| Transport | libquic | libquic | ✅ Same |
| Message Queue | liboxenmq | liboxenmq | ✅ Same |
| Storage Format | SQLite | SQLite | ✅ Same |
| Consensus | Oxend | Lux ServiceNodeVM | 🔄 Different chain |
| Crypto | Ed25519/X25519 | ML-DSA/ML-KEM | 🔄 PQ upgrade |
| Staking | SENT on Arbitrum | Native PARS on Pars C-Chain | 🔄 Native L1 token |

#### 5.1.1 Key Difference: Native Staking

Session uses SENT token on Arbitrum (external L2). Pars uses **native PARS** on its own C-Chain:

```
Session/Oxen:                         Pars:
┌─────────────┐                      ┌─────────────────────────┐
│  Arbitrum   │                      │   Pars Sovereign L1     │
│  (External) │                      │                         │
│  ┌───────┐  │                      │  ┌─────────────────┐   │
│  │ SENT  │  │                      │  │   P-Chain       │   │
│  │ Token │  │                      │  │   Validators    │   │
│  └───────┘  │                      │  │   stake PARS    │   │
│  ┌───────┐  │                      │  └─────────────────┘   │
│  │Staking│  │                      │  ┌─────────────────┐   │
│  │Contract│ │                      │  │   C-Chain EVM   │   │
│  └───────┘  │                      │  │   Chain ID 7070 │   │
└──────┬──────┘                      │  │   Native PARS   │   │
       │                             │  │   ┌───────────┐ │   │
       ▼                             │  │   │ServiceNode│ │   │
┌─────────────┐                      │  │   │Rewards.sol│ │   │
│   Oxend     │                      │  │   └───────────┘ │   │
│  (Separate  │                      │  └─────────────────┘   │
│   Chain)    │                      │  ┌─────────────────┐   │
└─────────────┘                      │  │   S-Chain       │   │
                                     │  │   SessionVM     │   │
                                     │  └─────────────────┘   │
                                     └─────────────────────────┘
```

**Advantages of native staking:**
- No bridge risk (PARS is native, not wrapped)
- Single chain for all operations
- Validators stake on P-Chain, contracts on C-Chain
- Users pay fees in PARS directly

#### 5.2 Migration Path

The `pars/` directory in session-storage-server provides the integration:

```cpp
// From session-storage-server/pars/daemon/parsd.cpp
// Key differences:

// 1. Consensus backend
#include <pars/rpc/lux_rpc.h>  // Instead of oxend_rpc.h

// 2. Post-quantum crypto
#include <session/pq/pq_crypto.hpp>
auto pq_identity = rpc::get_pq_keys(options.lux_rpc, ...);

// 3. Channel encryption
crypto::PQChannelEncryption channel_encryption{*pq_identity};  // ML-KEM based
```

#### 5.3 Mobile App Compatibility

Session mobile apps can connect to Pars network with configuration change:

```json
{
  "network": "pars",
  "bootstrap_nodes": [
    "pars://seed1.pars.network:22025",
    "pars://seed2.pars.network:22025"
  ],
  "crypto": {
    "kem": "ML-KEM-768",
    "dsa": "ML-DSA-65"
  }
}
```

### 6. Fee Market

#### 6.1 Fee Structure

| Operation | Base Fee | Description |
|-----------|----------|-------------|
| Session Create | 0.001 PARS | Create new messaging session |
| Message Store | 0.0001 PARS/KB | Store encrypted message |
| Message Retrieve | Free | Read messages (included in stake) |
| Session Close | Free | Clean up session |
| EVM Transaction | Gas-based | Standard EVM fees |

#### 6.2 Fee Distribution

```
┌─────────────────────────────────────┐
│         Transaction Fee             │
│              100%                   │
└─────────────────┬───────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
   ┌─────────┐        ┌─────────┐
   │ Swarm   │        │ Network │
   │ Nodes   │        │ Treasury│
   │   80%   │        │   20%   │
   └─────────┘        └─────────┘
```

### 7. Incentive Alignment

#### 7.1 Node Operators

- **Reward**: Block rewards + storage fees
- **Penalty**: Slashing for unavailability or storage proof failures
- **Requirement**: 15K PARS stake + 10GB storage + reliable uptime

#### 7.2 Users

- **Cost**: Small fees for message storage
- **Benefit**: Post-quantum secure, decentralized messaging
- **Experience**: Same as Session but with stronger security

#### 7.3 Network

- **Goal**: Sufficient storage capacity with redundancy
- **Mechanism**: Dynamic fees + staking rewards
- **Safety**: BLS aggregate signatures + storage proofs

### 8. Native HFT/DEX Integration

Pars C-Chain provides **native DEX access** via precompiles, enabling high-frequency
trading without leaving the EVM:

#### 8.1 DEX Precompile Addresses

| Address | Name | Function |
|---------|------|----------|
| `0x2000` | LXBook | Orderbook operations (place/cancel/match) |
| `0x2100` | LXPool | AMM liquidity pools |
| `0x2200` | LXVault | Yield vaults and strategies |
| `0x2300` | LXFeed | Real-time price feeds (sub-ms latency) |

#### 8.2 HFT-Optimized Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILXBook {
    /// @notice Place a limit order on the orderbook
    /// @param pair Trading pair (e.g., PARS/USDC)
    /// @param side 0=buy, 1=sell
    /// @param price Price in quote currency (18 decimals)
    /// @param amount Amount in base currency
    /// @return orderId Unique order identifier
    function placeOrder(
        bytes32 pair,
        uint8 side,
        uint256 price,
        uint256 amount
    ) external returns (uint256 orderId);

    /// @notice Cancel an existing order
    function cancelOrder(uint256 orderId) external returns (bool);

    /// @notice Get best bid/ask (optimized for HFT)
    function getBBO(bytes32 pair) external view returns (
        uint256 bestBid,
        uint256 bestBidSize,
        uint256 bestAsk,
        uint256 bestAskSize
    );

    /// @notice Atomic swap (market order with slippage protection)
    function swap(
        bytes32 pair,
        uint8 side,
        uint256 amount,
        uint256 minReceived
    ) external returns (uint256 received);
}

interface ILXFeed {
    /// @notice Get latest price (optimized for HFT, sub-ms)
    function getPrice(bytes32 pair) external view returns (
        uint256 price,
        uint256 timestamp,
        uint8 confidence
    );

    /// @notice Get TWAP over period
    function getTWAP(bytes32 pair, uint256 period) external view returns (uint256);

    /// @notice Subscribe to price updates (via logs)
    event PriceUpdate(bytes32 indexed pair, uint256 price, uint256 timestamp);
}
```

#### 8.3 Cross-Chain Trading Flow

```
User (Pars C-Chain)
       │
       │ 1. Call LXBook.placeOrder()
       ▼
┌──────────────────┐
│ LXBook Precompile│ ──── Native EVM call (no bridge)
│    (0x2000)      │
└────────┬─────────┘
         │
         │ 2. Route via X-Chain bridge
         ▼
┌──────────────────┐
│   T-Chain DEX    │ ──── Lux trading chain
│   (LX Exchange)  │
└────────┬─────────┘
         │
         │ 3. Execute & settle
         ▼
┌──────────────────┐
│  Settlement via  │
│  Warp messaging  │
└──────────────────┘
```

#### 8.4 Fee Structure for Trading

| Operation | Fee | Distribution |
|-----------|-----|--------------|
| Maker Order | 0.01% | 80% T-Chain, 20% Pars Treasury |
| Taker Order | 0.05% | 80% T-Chain, 20% Pars Treasury |
| Price Feed | Free | Subsidized by staking rewards |
| Cross-chain Swap | 0.1% | 50% X-Chain, 50% Pars Treasury |

## Implementation

### Phase 1: Bootstrap (Current)
- [x] SessionVM implementation
- [x] E2E tests passing
- [ ] parsd integration with session-storage-server
- [ ] Staking contracts deployment
- [ ] X-Chain staking bridge

### Phase 2: Testnet
- [ ] Deploy to Pars testnet (ID: 7071)
- [ ] Session app testnet build
- [ ] Validator onboarding
- [ ] Storage proof implementation

### Phase 3: Mainnet
- [ ] Mainnet launch (ID: 7070)
- [ ] Token distribution
- [ ] Session app mainnet support
- [ ] Lokinet integration

## Backwards Compatibility

This is a new network. Session apps will need to add Pars network support
alongside existing Oxen network support.

## Security Considerations

1. **Post-Quantum Security**: All cryptographic operations use NIST-approved
   PQ algorithms (ML-KEM-768, ML-DSA-65)

2. **Stake Slashing**: Malicious or offline nodes lose stake

3. **Storage Proofs**: Regular challenges ensure data availability

4. **BLS Signatures**: Aggregate signatures prevent forgery

## References

- [PIP-0007](./PIP-0007-parsd-architecture.md): parsd Architecture
- [LP-0042](https://github.com/luxfi/lps/blob/main/LP-0042-sessionvm.md): SessionVM Specification
- [Session Protocol](https://getsession.org/): Original Session Network
- [NIST FIPS 203](https://csrc.nist.gov/pubs/fips/203/final): ML-KEM Standard
- [NIST FIPS 204](https://csrc.nist.gov/pubs/fips/204/final): ML-DSA Standard

## Copyright

Copyright 2026 Pars Foundation. All rights reserved.
