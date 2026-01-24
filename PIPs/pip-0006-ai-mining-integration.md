---
pip: 6
title: AI Mining Integration - Decentralized Proof of AI
tags: [ai, mining, gpu, proof-of-ai, zap]
description: Defines AI mining integration for Pars Network using Hanzo's Proof of AI protocol
author: Pars Network Team (@pars-network)
status: Draft
type: Standards Track
category: Infrastructure
created: 2026-01-23
discussions-to: https://github.com/pars-network/pips/discussions/7
order: 6
tier: infrastructure
---

## Abstract

This PIP defines AI mining integration for Pars Network, enabling GPU nodes to mine PARS tokens via the decentralized Proof of AI protocol. Nodes with GPUs can contribute AI compute to the network and earn rewards, creating a sustainable infrastructure for AI-powered civic services.

## Motivation

### AI for Civilization

Pars Network provides the infrastructure for Persian diaspora civilization. AI capabilities are essential for:

- **Translation Services**: Real-time Persian/Farsi translation
- **Document Processing**: Digitizing historical archives
- **Privacy-Preserving Analysis**: Secure data processing for sensitive civic needs
- **Education**: AI-powered learning tools
- **Healthcare**: Diagnostic assistance in underserved areas

### Decentralized AI Infrastructure

Rather than depending on centralized AI providers (who can be pressured or blocked), Pars Network enables:

1. **Community-Owned Compute**: GPU owners contribute to shared infrastructure
2. **Censorship-Resistant AI**: No single provider can block access
3. **Economic Alignment**: Miners earn PARS for providing AI services
4. **Privacy by Design**: AI inference runs on trusted community nodes

## Specification

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           AI MINING ON PARS NETWORK                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  GPU MINERS                           PARS NETWORK                                  │
│  ┌─────────────────────┐             ┌─────────────────────────────────────────┐    │
│  │  H100 / RTX 4090    │             │  Pars EVM (Chain ID: 6133)              │    │
│  │  ┌───────────────┐  │             │                                          │    │
│  │  │  AI Workload  │  │  Proof      │  ┌──────────────┐  ┌──────────────┐     │    │
│  │  │  (Inference)  │──┼───────────► │  │  AI Mining   │  │   Reward     │     │    │
│  │  └───────────────┘  │  of AI      │  │  Precompile  │──│   Ledger     │     │    │
│  │  ┌───────────────┐  │             │  │  (0x0300)    │  │              │     │    │
│  │  │  NVTrust TEE  │  │             │  └──────────────┘  └──────────────┘     │    │
│  │  │  Attestation  │  │             │                                          │    │
│  │  └───────────────┘  │             └─────────────────────────────────────────┘    │
│  └─────────────────────┘                           │                                 │
│                                                    │ Teleport                        │
│                                                    ▼                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                    CROSS-CHAIN AI TOKEN ECOSYSTEM                            │    │
│  │                                                                               │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │    │
│  │  │ Pars EVM    │  │  Lux        │  │  Hanzo      │  │    Zoo      │         │    │
│  │  │   6133      │  │  96369      │  │  36963      │  │   200200    │         │    │
│  │  │  PARS, AI   │  │  LUX, AI    │  │  AI, HANZO  │  │  ZOO, AI    │         │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │    │
│  │                                                                               │    │
│  │  Same AI work can ONLY be minted on ONE chain (double-spend prevention)      │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Proof of AI Protocol

Miners submit cryptographically attested AI work proofs:

```rust
/// AI work proof submitted to Pars Network
pub struct AIWorkProof {
    /// Miner's ML-DSA public key
    pub miner: Vec<u8>,

    /// BLAKE3 hash of model used
    pub model_hash: [u8; 32],

    /// BLAKE3 hash of input data
    pub input_hash: [u8; 32],

    /// BLAKE3 hash of output data
    pub output_hash: [u8; 32],

    /// Standardized compute metric
    pub compute_units: u64,

    /// Work completion timestamp
    pub timestamp: u64,

    /// ML-DSA signature over proof
    pub signature: Vec<u8>,

    /// NVTrust attestation (if available)
    pub tee_attestation: Option<TEEAttestation>,
}
```

### NVTrust Chain-Binding (Double-Spend Prevention)

AI work is bound to a specific chain BEFORE compute runs:

```rust
/// Pre-commit context binds work to Pars Network
pub struct WorkContext {
    /// Target chain: Pars = 6133
    pub chain_id: u32,

    /// Job identifier
    pub job_id: [u8; 32],

    /// Model being used
    pub model_hash: [u8; 32],

    /// Input data hash
    pub input_hash: [u8; 32],

    /// GPU hardware ID
    pub device_id: [u8; 32],

    /// Unique nonce (replay protection)
    pub nonce: [u8; 32],

    /// Timestamp
    pub timestamp: u64,
}
```

**Key Invariant**: The same AI work cannot be claimed on Pars, Lux, AND Hanzo - only on the chain specified in `WorkContext.chain_id`.

### Supported GPUs

| GPU Model | Trust Level | AI Mining Support |
|:----------|:------------|:------------------|
| H100 | Full NVTrust | Full attestation |
| H200 | Full NVTrust | Full attestation |
| B100 | Full NVTrust + TEE-I/O | Full attestation |
| B200 | Full NVTrust + TEE-I/O | Full attestation |
| RTX PRO 6000 | NVTrust | Full attestation |
| RTX 5090 | Software only | Limited (trust score 60) |
| RTX 4090 | Software only | Limited (trust score 60) |

### ZAP Protocol Integration

Nodes communicate via ZAP (Zero-copy Agent Protocol) for high-performance AI workload coordination:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           ZAP FOR AI MINING                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  AI CLIENT                        ZAP GATEWAY                       GPU MINERS       │
│  ┌─────────────┐                  ┌─────────────┐                  ┌─────────────┐  │
│  │  Request    │  ZAP (Cap'n      │  Route to   │  ZAP (Cap'n      │  Execute    │  │
│  │  AI Task    │────Proto)──────► │  Available  │────Proto)──────► │  Inference  │  │
│  │             │                  │  Miner      │                  │             │  │
│  └─────────────┘                  └─────────────┘                  └─────────────┘  │
│        │                               │                                │            │
│        │  Zero-copy binary             │  10-100x faster               │            │
│        │  No JSON parsing              │  than JSON-RPC                │            │
│        │  Native tensor support        │                                │            │
│        │                               │                                │            │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                    ZAP BENEFITS FOR AI WORKLOADS                                │ │
│  │  • Parse latency: 0.2 us vs 45 us (JSON) - 225x faster                         │ │
│  │  • Binary tensors: 0% overhead vs 33% Base64                                    │ │
│  │  • Memory: 0 allocations vs 47 per message                                      │ │
│  │  • Throughput: 3.2 GB/s vs 180 MB/s                                            │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### AI Mining Precompile

The AI Mining precompile at `0x0300` enables smart contract integration:

```solidity
interface IAIMining {
    /// @notice Get mining balance for an address
    function miningBalance(address miner) external view returns (uint256);

    /// @notice Verify ML-DSA signature
    function verifyMLDSA(
        bytes calldata pk,
        bytes calldata msg,
        bytes calldata sig
    ) external view returns (bool);

    /// @notice Claim teleported mining rewards
    function claimTeleport(bytes32 teleportId) external returns (uint256);

    /// @notice Get pending teleport transfers
    function pendingTeleports(address recipient) external view returns (bytes32[] memory);

    /// @notice Submit AI work proof
    function submitWorkProof(
        bytes calldata proof,
        bytes calldata attestation
    ) external returns (uint256 reward);
}
```

### Reward Distribution

Mining rewards calculated as:

```
reward = base_reward * compute_units * difficulty_adjustment * trust_multiplier
```

Where:
- `base_reward`: Network-configured base rate (governance controlled)
- `compute_units`: Verified AI compute performed
- `difficulty_adjustment`: Dynamic based on network compute capacity
- `trust_multiplier`: Based on GPU attestation level (0.6 - 1.0)

### Mobile Mining (Light)

Mobile nodes can participate in AI mining through federated inference:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           MOBILE AI MINING                                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  MOBILE DEVICES                                                                      │
│  ┌─────────────────────┐                                                            │
│  │  iPhone / Android   │                                                            │
│  │                     │                                                            │
│  │  ┌───────────────┐  │     Federated                                             │
│  │  │  Neural Engine│  │     Learning     ┌─────────────────────────────────────┐   │
│  │  │  (NPU)        │──┼────────────────► │  AGGREGATE NODE                     │   │
│  │  └───────────────┘  │                  │  • Collects model updates           │   │
│  │                     │                  │  • Verifies contributions           │   │
│  │  ┌───────────────┐  │                  │  • Distributes rewards              │   │
│  │  │  Privacy      │  │                  └─────────────────────────────────────┘   │
│  │  │  Preserved    │  │                                                            │
│  │  │  (on-device)  │  │                                                            │
│  │  └───────────────┘  │                                                            │
│  └─────────────────────┘                                                            │
│                                                                                      │
│  Mobile mining rewards are lower but contribute to network without GPU              │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Cross-Chain AI Token Ecosystem

PARS, ZOO, Hanzo AI, and Lux can all participate in AI mining:

| Chain | Chain ID | Native Token | AI Token | Mining Support |
|:------|:---------|:-------------|:---------|:---------------|
| **Pars Network** | 6133 | PARS | AI | Full (via precompile) |
| **Lux Network** | 96369 | LUX | AI | Full (via precompile) |
| **Hanzo Network** | 36963 | HANZO | AI | Full (native L1) |
| **Zoo Network** | 200200 | ZOO | AI | Full (via precompile) |

**Teleport enables seamless movement of AI tokens between chains.**

## Security Considerations

### TEE Attestation

- NVTrust provides hardware-backed attestation
- Compromised GPUs produce invalid attestations
- Trust scores reflect verification confidence

### Double-Spend Prevention

- WorkContext binds work to chain BEFORE execution
- Spent set tracked per chain
- Cross-chain double-spend impossible with chain_id commitment

### Replay Protection

- Unique nonce per job
- Timestamp validation
- Spent key tracking

## Implementation

### Mining Node Setup

```bash
# Install Pars mining node
git clone https://github.com/pars-network/pars-miner
cd pars-miner && cargo build --release

# Configure for Pars Network
cat > config.toml << EOF
[network]
chain_id = 6133
rpc_endpoint = "https://rpc.pars.network"

[mining]
wallet_path = "~/.pars/mining-wallet.json"
models = ["llama3", "mistral", "qwen3"]

[gpu]
enable_nvtrust = true
device_ids = [0, 1]

[zap]
gateway = "zap://mine.pars.network:9999"
EOF

# Start mining
./target/release/pars-miner --config config.toml
```

### ZAP Miner Registration

```rust
// Register as AI miner via ZAP
let gateway = Gateway::connect("zap://mine.pars.network:9999").await?;

gateway.register_miner(MinerInfo {
    id: miner_id,
    capabilities: vec!["llm-inference", "embedding", "vision"],
    gpu_info: get_gpu_info(),
    trust_attestation: get_nvtrust_attestation(),
}).await?;

// Receive work assignments
while let Some(job) = gateway.next_job().await? {
    let result = execute_ai_job(&job).await?;
    gateway.submit_result(result).await?;
}
```

## References

- [HIP-006: Hanzo AI Mining Protocol](https://github.com/hanzoai/hips/blob/main/HIP-006-ai-mining-protocol.md)
- [HIP-007: ZAP Protocol](https://github.com/hanzoai/hips/blob/main/HIP-007-zap.md)
- [PIP-0000: Network Architecture](./pip-0000-network-architecture.md)
- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
