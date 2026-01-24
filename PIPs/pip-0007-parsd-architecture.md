---
pip: 7
title: parsd Architecture - EVM + SessionVM Plugin Assembly
tags: [parsd, vm, evm, session, architecture]
description: Architecture for parsd node which assembles Lux EVM and SessionVM plugins
author: Pars Network Team (@pars-network)
status: Draft
type: Standards Track
category: Core
created: 2026-01-23
discussions-to: https://github.com/pars-network/pips/discussions
order: 7
tier: core
requires: [5]
---

## Abstract

This PIP defines the `parsd` node architecture - a lightweight wrapper around `luxd` that automatically configures and loads EVM + SessionVM plugins for the Pars network.

## Motivation

The Pars network requires two distinct virtual machines:

1. **EVM** - For smart contracts, DeFi, tokens with post-quantum precompiles
2. **SessionVM** - For secure messaging, session management, private communications

Running these as separate plugins on luxd allows:
- Independent scaling
- Separate upgrade paths
- Clean separation of concerns
- Validator flexibility

### Problem

Manually configuring luxd with both plugins and Pars-specific settings is complex and error-prone.

### Solution

`parsd` is a thin wrapper that:
- Auto-discovers and symlinks plugin binaries
- Configures PQ precompile addresses
- Sets Pars network defaults
- Passes through to luxd

## Specification

### parsd Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           PARSD NODE ARCHITECTURE                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  parsd (wrapper)                                                                    │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  1. Configure plugin directory                                                 │  │
│  │  2. Symlink EVM + SessionVM plugins                                           │  │
│  │  3. Set Pars defaults (network ID, precompiles)                               │  │
│  │  4. Execute luxd with configuration                                           │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│                                      ▼                                               │
│  luxd (Lux node)                                                                    │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  - Consensus (Quasar)                                                          │  │
│  │  - P2P networking                                                              │  │
│  │  - State management                                                            │  │
│  │  - Plugin loader                                                               │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│              ┌───────────────────────┴───────────────────────┐                      │
│              ▼                                               ▼                      │
│  ┌───────────────────────────┐           ┌───────────────────────────┐              │
│  │       EVM Plugin          │           │     SessionVM Plugin      │              │
│  │                           │           │                           │              │
│  │  - Smart contracts        │           │  - Session management     │              │
│  │  - PQ precompiles:        │           │  - Encrypted messaging    │              │
│  │    - ML-DSA (0x0601)     │           │  - Channel management     │              │
│  │    - ML-KEM (0x0603)     │◄─────────►│  - PQ key exchange        │              │
│  │    - BLS    (0x0B00)     │   Warp    │  - Message storage        │              │
│  │    - Ringtail (0x0700)   │           │                           │              │
│  │    - FHE    (0x0800)     │           │                           │              │
│  └───────────────────────────┘           └───────────────────────────┘              │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Plugin IDs

| Plugin | VMID | Source |
|:-------|:-----|:-------|
| EVM | `srEXiWaHuhNyGwPUi444Tu47ZEDwxTWrbQiuD7FmgSAQ6X7Dy` | github.com/luxfi/evm |
| SessionVM | `speKUgLBX6WRD5cfGeEfLa43LxTXUBckvtv4td6F3eTXvRP48` | github.com/luxfi/session |

### Configuration

parsd sets the following defaults:

```go
const (
    ParsNetworkID = 7070

    EVMID       = "srEXiWaHuhNyGwPUi444Tu47ZEDwxTWrbQiuD7FmgSAQ6X7Dy"
    SessionVMID = "speKUgLBX6WRD5cfGeEfLa43LxTXUBckvtv4td6F3eTXvRP48"
)

func buildLuxdArgs(dataDir, pluginDir string) []string {
    return []string{
        fmt.Sprintf("--network-id=%d", ParsNetworkID),
        fmt.Sprintf("--data-dir=%s", dataDir),
        fmt.Sprintf("--plugin-dir=%s", pluginDir),
        "--warp-api-enabled=true",
        "--chain-config-content=" + getParsChainConfig(),
    }
}
```

### PQ Precompile Addresses

| Precompile | Address | Standard |
|:-----------|:--------|:---------|
| ML-DSA-65 | `0x0601` | FIPS 204 |
| ML-KEM-768 | `0x0603` | FIPS 203 |
| BLS12-381 | `0x0B00` | - |
| Ringtail | `0x0700` | Threshold signatures |
| FHE | `0x0800` | Fully homomorphic |

### Installation

#### From Source

```bash
# Clone parsd
git clone https://github.com/parsdao/node
cd node

# Build
go build -o parsd ./cmd/parsd/

# Install
cp parsd /usr/local/bin/
```

#### Run

```bash
# Start with defaults
parsd

# Custom network ID
parsd --network-id=7071

# Custom ports (run alongside luxd)
parsd --http-port=9660 --staking-port=9659

# Custom data directory
parsd --data-dir=/data/pars
```

### For Existing luxd Validators

Validators already running luxd can add Pars support:

```bash
# Option 1: Build and install SessionVM plugin
cd ~/work/lux/session
go build -o sessionvm ./plugin/
cp sessionvm ~/.lux/plugins/speKUgLBX6WRD5cfGeEfLa43LxTXUBckvtv4td6F3eTXvRP48

# Option 2: Use parsd (recommended)
# parsd auto-configures everything
parsd --http-port=9660  # Run on different port
```

### Chain Creation

Create a Pars chain using lux CLI:

```bash
# Create chain with Pars VM (auto-includes EVM + SessionVM)
lux chain create mychain --pars

# Or create with just SessionVM
lux chain create mychain --session
```

### Interoperability

EVM and SessionVM communicate via Warp messaging:

```solidity
// EVM contract triggering session action
interface ISessionVM {
    function createSession(address[] memory participants) external returns (bytes32);
    function sendMessage(bytes32 sessionId, bytes memory encrypted) external;
}

contract SessionBridge {
    function createEncryptedChannel(address[] memory participants) external {
        // Call SessionVM via Warp
        ISessionVM(SESSIONVM_ADDRESS).createSession(participants);
    }
}
```

### Directory Structure

```
~/.pars/
├── plugins/
│   ├── srEXiWaH...  -> ~/.lux/plugins/srEXiWaH... (EVM symlink)
│   └── speKUgLB...  (SessionVM binary)
├── db/
│   ├── evm/
│   └── session/
├── staking/
│   └── signer.key
└── config.json
```

## Rationale

### Why a Wrapper?

1. **Simplicity**: One command to run Pars node
2. **Consistency**: Same defaults for all validators
3. **Maintenance**: Single place to update configurations
4. **Compatibility**: Still uses luxd under the hood

### Why Two VMs?

1. **Separation**: Messaging and smart contracts have different needs
2. **Scaling**: Can scale each VM independently
3. **Security**: Isolate attack surfaces
4. **Upgrades**: Update VMs without affecting each other

## Security Considerations

1. **Plugin Verification**: Validate plugin binaries before symlinking
2. **Key Storage**: Store staking keys securely
3. **Network Isolation**: Consider running on separate network from main luxd
4. **Updates**: Keep both plugins updated for security patches

## Backwards Compatibility

parsd is a new component and has no backwards compatibility concerns. It is compatible with any luxd version that supports the plugin architecture.

## Reference Implementation

- **parsd**: https://github.com/parsdao/node
- **SessionVM**: https://github.com/luxfi/session
- **EVM**: https://github.com/luxfi/evm

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
