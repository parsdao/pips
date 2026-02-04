---
layout: home

hero:
  name: Pars PIPs
  text: Improvement Proposals
  tagline: Governance and standardization framework for Pars Network
  image:
    src: /logo.svg
    alt: Pars Network
  actions:
    - theme: brand
      text: Browse PIPs
      link: /PIPs/
    - theme: alt
      text: Network Overview
      link: /PIPs/pip-0000-network-architecture
    - theme: alt
      text: GitHub
      link: https://github.com/parsdao/pips

features:
  - icon: 🏛️
    title: Core Architecture
    details: Network architecture, consensus, and protocols defining the foundation of Pars Network.
    link: /PIPs/pip-0000-network-architecture
  - icon: 🔒
    title: Post-Quantum Security
    details: Mandatory post-quantum cryptography for all communications and transactions.
    link: /PIPs/pip-0002-post-quantum
  - icon: 🌐
    title: Mesh Network
    details: DAG/CRDT mesh network enabling offline sync, sneakernet, and local communication.
    link: /PIPs/pip-0001-mesh-network
  - icon: 🛡️
    title: Coercion Resistance
    details: Security model designed for high-threat environments and key compromise scenarios.
    link: /PIPs/pip-0003-coercion-resistance
  - icon: ⚖️
    title: DAO Governance
    details: Decentralized governance framework with vePARS voting and treasury management.
    link: /PIPs/pip-7000-dao-governance-framework
  - icon: 📱
    title: Mobile First
    details: Mobile and embedded node architecture for accessible, portable sovereignty.
    link: /PIPs/pip-0004-mobile-embedded-node
---

## What are PIPs?

**Pars Improvement Proposals (PIPs)** are the primary mechanism for proposing new features, collecting community input, and documenting design decisions for Pars Network.

### PIP Categories

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

### PIP Lifecycle

```
Draft → Review → Voting → Approved/Rejected → Implemented
```

1. **Draft**: Author creates PIP following template
2. **Review**: Community discussion (minimum 7 days)
3. **Voting**: vePARS holders vote on-chain
4. **Approved**: Passes with >50% approval and quorum
5. **Implemented**: Development and deployment

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

## Contributing

1. Fork the [pips repository](https://github.com/parsdao/pips)
2. Create `PIPs/pip-XXXX-title.md` following template
3. Submit PR for review
4. Engage with community feedback
5. Once approved, proposal goes to on-chain vote

## Links

- **Website**: [pars.network](https://pars.network)
- **Docs**: [docs.pars.network](https://docs.pars.network)
- **GitHub**: [github.com/parsdao](https://github.com/parsdao)
- **Governance**: [pars.vote](https://pars.vote)
