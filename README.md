# Pars Improvement Proposals (PIPs)

<div align="center">

**Governance and standardization framework for [Pars Network](https://pars.network)**

_Sovereign infrastructure for the global Persian diaspora. Private communications. Censorship resistance. Coercion-proof governance._

[![Documentation](https://img.shields.io/badge/docs-latest-brightgreen?style=for-the-badge)](https://docs.pars.network)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](./LICENSE)

</div>

---

## Network Architecture

Pars Network is a **dual-layer sovereign blockchain** combining:

1. **Pars EVM (L2)**: EVM-compatible chain on Lux Network with advanced precompiles
2. **Pars Session (L1)**: Native session daemon for private, permissionless communications

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           PARS NETWORK ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                         LUX NETWORK (L1 Base Layer)                           │  │
│  │  • Snow++ Consensus • Post-Quantum Ready • Multi-VM Architecture              │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│                              Anchoring + Sessions                                    │
│                                      ▼                                               │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                         PARS NETWORK (L2 + Native)                            │  │
│  │                                                                                │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │  │
│  │  │   Pars EVM      │  │   Pars Session  │  │   Pars Mesh     │               │  │
│  │  │  (L2 Subnet)    │  │  (Native L1)    │  │   (DAG/CRDT)    │               │  │
│  │  │                 │  │                 │  │                 │               │  │
│  │  │ • Smart Contracts│  │ • E2E Encryption│  │ • Offline Sync  │               │  │
│  │  │ • DeFi + DEX    │  │ • Session Keys  │  │ • Sneakernet    │               │  │
│  │  │ • Precompiles   │  │ • No Metadata   │  │ • Bluetooth     │               │  │
│  │  │ • DAO Governance │  │ • PQ-Mandatory  │  │ • Local WiFi    │               │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘               │  │
│  │                                                                                │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Principles

### 1. Post-Quantum Security is MANDATORY

PQ encryption is **the default and cannot be disabled**. Every message, every session, every key exchange uses post-quantum cryptography.

### 2. Coercion Resistance by Design

The network is designed for high-threat environments where:
- Participants face state surveillance
- Keys may be compromised under duress
- Network access may be intermittent or blocked

### 3. Mesh-First Architecture

Every node is equal. Every user can be a node. The network survives:
- Complete WiFi/internet blackouts
- Physical network partitions
- State-level blocking

### 4. Privacy Without Permission

No KYC. No registration. No metadata. Communications are private by design, not by policy.

---

## Quick Start

### Browse Proposals
- **[All PIPs Index](./PIPs)** - Complete list of all Pars Improvement Proposals
- **[Documentation](https://docs.pars.network)** - Interactive docs
- **[Network Overview](./PIPs/pip-0000-network-architecture.md)** - Core design

### Essential PIPs

| Category | PIP | Description | Status |
|:---------|:----|:------------|:-------|
| **Architecture** | [PIP-0000](./PIPs/pip-0000-network-architecture.md) | Network architecture | Draft |
| **Mesh** | [PIP-0001](./PIPs/pip-0001-mesh-network.md) | DAG/CRDT mesh network | Draft |
| **Crypto** | [PIP-0002](./PIPs/pip-0002-post-quantum.md) | Mandatory PQ encryption | Draft |
| **Security** | [PIP-0003](./PIPs/pip-0003-coercion-resistance.md) | Coercion resistance model | Draft |
| **Mobile** | [PIP-0004](./PIPs/pip-0004-mobile-embedded-node.md) | Mobile app with embedded node | Draft |
| **Sessions** | [PIP-0005](./PIPs/pip-0005-session-protocol.md) | Session daemon protocol | Draft |

---

## PIP Categories

| Range | Category | Description |
|:------|:---------|:------------|
| 0xxx | **Core** | Network architecture, consensus, protocols |
| 1xxx | **Mesh** | DAG, CRDT, offline sync, sneakernet |
| 2xxx | **Crypto** | Post-quantum, encryption, key management |
| 3xxx | **Security** | Threat model, coercion resistance, privacy |
| 4xxx | **Clients** | Mobile, desktop, embedded nodes |
| 5xxx | **Sessions** | Session daemon, messaging, groups |
| 6xxx | **Bridges** | Cross-chain, teleport, interoperability |
| 7xxx | **Governance** | DAOs, voting, treasury |

---

## PIP Lifecycle

```
Draft → Review → Voting → Approved/Rejected → Implemented
```

1. **Draft**: Author creates PIP following template
2. **Review**: Community discussion (minimum 7 days)
3. **Voting**: vePARS holders vote on-chain
4. **Approved**: Passes with >50% approval and quorum
5. **Implemented**: Development and deployment

---

## Contributing

1. Fork this repository
2. Create `PIPs/pip-XXXX-title.md` following template
3. Submit PR for review
4. Engage with community feedback
5. Once approved, proposal goes to on-chain vote

---

## Links

- **Website**: [pars.network](https://pars.network)
- **Docs**: [docs.pars.network](https://docs.pars.network)
- **GitHub**: [github.com/pars-network](https://github.com/pars-network)
- **MIGA Protocol**: [miga.us.org](https://miga.us.org)

---

## License

MIT License - see [LICENSE](./LICENSE)
