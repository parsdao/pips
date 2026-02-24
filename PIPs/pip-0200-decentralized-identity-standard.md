---
pip: 200
title: "Decentralized Identity Standard"
description: "DID standard for Pars Network users based on W3C DID Core"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Identity
created: 2026-01-23
tags: [identity, did, w3c, privacy]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines the Pars Decentralized Identity (DID) standard, providing self-sovereign identity for Pars Network users. Identities are created locally without any registration authority, anchored on-chain via the Pars EVM, and interoperable with the W3C DID Core specification. The standard uses hybrid post-quantum cryptography to ensure long-term identity security.

## Motivation

The Persian diaspora faces unique identity challenges:

1. **State-issued identity is weaponized** -- governments revoke passports, freeze accounts, and surveil citizens based on identity documents
2. **Platform identity is fragile** -- centralized services can deplatform users without recourse
3. **Pseudonymity is survival** -- activists, journalists, and dissidents require identity without attribution
4. **Interoperability matters** -- diaspora members span dozens of countries and hundreds of platforms

Pars Network requires a native identity layer that is self-sovereign, censorship-resistant, and quantum-safe.

## Specification

### DID Method

Pars DIDs follow the format:

```
did:pars:<network>:<identifier>
```

Examples:
- `did:pars:mainnet:0x1a2b3c4d5e6f...` (EVM-anchored)
- `did:pars:session:05a1b2c3d4e5f6...` (Session-layer identity)

### DID Document Structure

```json
{
  "@context": ["https://www.w3.org/ns/did/v1", "https://pars.network/ns/did/v1"],
  "id": "did:pars:mainnet:0x1a2b3c4d5e6f...",
  "verificationMethod": [
    {
      "id": "did:pars:mainnet:0x1a2b...#key-1",
      "type": "EcdsaSecp256k1VerificationKey2019",
      "controller": "did:pars:mainnet:0x1a2b...",
      "publicKeyMultibase": "zQ3shN..."
    },
    {
      "id": "did:pars:mainnet:0x1a2b...#key-pq",
      "type": "MLDSAVerificationKey2024",
      "controller": "did:pars:mainnet:0x1a2b...",
      "publicKeyMultibase": "zML5..."
    }
  ],
  "authentication": ["#key-1", "#key-pq"],
  "service": [
    {
      "id": "#session",
      "type": "ParsSession",
      "serviceEndpoint": "pars://session/05a1b2c3..."
    }
  ]
}
```

### Identity Registry Contract

```solidity
interface IParsIdentityRegistry {
    function createIdentity(bytes memory didDocument, bytes memory mldsaSig) external returns (bytes32 didHash);
    function resolveIdentity(bytes32 didHash) external view returns (bytes memory didDocument);
    function updateIdentity(bytes32 didHash, bytes memory newDocument, bytes memory mldsaSig) external;
    function deactivateIdentity(bytes32 didHash, bytes memory mldsaSig) external;
    function isActive(bytes32 didHash) external view returns (bool);
}
```

### Key Hierarchy

```
Master Seed
├── EVM Key (secp256k1) ─── On-chain transactions
├── Session Key (ML-KEM + X25519) ─── Private messaging
├── Signing Key (ML-DSA + Ed25519) ─── Identity assertions
└── Recovery Key (Shamir shares) ─── Social recovery
```

### Resolution Protocol

1. Client parses DID string to extract network and identifier
2. For `mainnet` DIDs: query the Identity Registry contract
3. For `session` DIDs: query the DHT via the session daemon
4. DID Document returned and verified against on-chain anchor hash
5. Cache resolved documents locally with configurable TTL

## Rationale

- **W3C DID Core compliance** ensures interoperability with the broader decentralized identity ecosystem
- **Hybrid PQ cryptography** protects against both classical and quantum adversaries
- **Dual anchoring** (EVM + Session) allows identity to function in both financial and communication contexts
- **No registration authority** means identity creation cannot be censored or denied
- **Minimal on-chain footprint** stores only a hash of the DID Document, keeping costs low and privacy high

## Security Considerations

- **Key compromise**: Compromised keys can be rotated via the `updateIdentity` function; recovery keys stored as Shamir shares prevent single-point failure
- **Correlation attacks**: Users SHOULD use separate DIDs for unrelated contexts to prevent cross-context linkage
- **Quantum threats**: ML-DSA signatures on the DID Document ensure quantum-resistant verification; classical keys retained for backward compatibility
- **Sybil resistance**: Identity creation is permissionless but on-chain anchoring requires gas, providing a natural cost floor against mass identity creation
- **Censorship**: DID Documents are replicated across session-layer swarm nodes; deactivation requires the owner's signature

## References

- [W3C DID Core Specification](https://www.w3.org/TR/did-core/)
- [PIP-0000: Network Architecture](./pip-0000-network-architecture.md)
- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [PIP-0202: Social Recovery Wallets](./pip-0202-social-recovery-wallets.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
