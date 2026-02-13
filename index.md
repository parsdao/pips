---
layout: home

hero:
  name: Pars PIPs
  text: Improvement Proposals
  tagline: Governance and standardization framework for Pars Network
  image:
    src: /logo.png
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

## About Pars Network

**Pars Network** is the cryptography-based blockchain and networking stack for building local and wide-area networks with readily available hardware. Pars Network can continue to operate even in adverse conditions with very high latency and extremely low bandwidth.

### Vision

The vision of Pars Network is to allow anyone to operate their own sovereign communication networks, and to make it cheap and easy to cover vast areas with a myriad of independent, interconnectable and autonomous networks. **Pars Network is Unstoppable Networks for The People.**

Pars Network is not one network. It is a tool for building thousands of networks. Networks without kill-switches, surveillance, censorship and control. Networks that can freely interoperate, associate and disassociate with each other. **Pars Network is Networks for Human Beings.**

### Capabilities

From a users perspective, Pars Network allows the creation of applications that respect and empower the autonomy and sovereignty of communities and individuals. Pars Network provides secure digital communication that cannot be subjected to outside control, manipulation or censorship.

Pars Network enables the construction of both small and potentially planetary-scale networks, without any need for hierarchical or bureaucratic structures to control or manage them, while ensuring individuals and communities full sovereignty over their own network segments.

### Notable Characteristics

| Property | Description |
|:---------|:------------|
| **No Source Addresses** | No packets transmitted include information about the address, place, machine or person they originated from |
| **No Central Control** | Anyone can allocate as many addresses as they need, when they need them |
| **Instant Reachability** | Newly generated addresses become globally reachable in seconds to minutes |
| **Portable Addresses** | Addresses are self-sovereign and portable—can be moved physically and continue to be reachable |
| **Encryption by Default** | All communication is secured with strong, modern encryption. Cannot be disabled |
| **Forward Secrecy** | All encryption keys are ephemeral. Communication offers forward secrecy by default |
| **No Unencrypted Links** | Not possible to establish unencrypted links or send unencrypted packets |

### Core Stack

- **Post-Quantum Cryptography**: NIST ML-KEM + ML-DSA (FIPS 203/204) for all communications
- **AI-Native Blockchain**: Native precompiles for ML verification, inference consensus, and model registries
- **Coercion-Resistant Identity**: Duress passwords, anonymous recovery, and self-sovereign DIDs
- **Mesh Networking**: DAG/CRDT sync, offline capability, sneakernet support, and mobile mesh

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
