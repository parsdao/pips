---
pip: 208
title: "Pseudonym Management"
description: "Multiple pseudonym support for a single Pars Network identity"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Identity
created: 2026-01-23
tags: [identity, pseudonym, privacy, persona, unlinkability]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a pseudonym management system allowing a single Pars Network identity to operate multiple unlinkable pseudonyms. Each pseudonym has its own keys, session ID, and on-chain address, while the owner can privately prove they all derive from one root identity. This enables context separation -- a user can participate in governance, commerce, and social activities under different personas without cross-context surveillance.

## Motivation

For the Persian diaspora, pseudonymity is not a luxury but a survival tool:

1. **Compartmentalized risk** -- political activism under one name should not endanger a commercial identity
2. **Social context** -- cultural, professional, and personal interactions have different norms and audiences
3. **Surveillance resistance** -- a single identity across all contexts creates a complete profile for adversaries
4. **Selective disclosure** -- proving identity equivalence should be voluntary, not forced by metadata correlation

## Specification

### Pseudonym Derivation

Pseudonyms are derived from the master identity using hierarchical deterministic key derivation:

```
Master Seed
├── Pseudonym 0 (default / primary)
│   ├── EVM Key: m/44'/6133'/0'/0/0
│   ├── Session Key: derived via HKDF("pars-pseudonym-0", master_secret)
│   └── DID: did:pars:mainnet:0xPSEUDO0...
├── Pseudonym 1 (activism)
│   ├── EVM Key: m/44'/6133'/1'/0/0
│   ├── Session Key: derived via HKDF("pars-pseudonym-1", master_secret)
│   └── DID: did:pars:mainnet:0xPSEUDO1...
└── Pseudonym N
    └── ...
```

### Pseudonym Registry (Client-Side Only)

```go
type PseudonymRegistry struct {
    MasterID    [32]byte
    Pseudonyms  []Pseudonym
    encrypted   bool  // Registry encrypted at rest
}

type Pseudonym struct {
    Index       uint32
    Label       string      // User-defined label ("activism", "work")
    DID         string
    SessionID   SessionID
    EVMAddress  common.Address
    CreatedAt   int64
    Active      bool
}
```

The pseudonym registry is stored only on the user's device. No on-chain record links pseudonyms to each other.

### Equivalence Proof

When a user needs to prove two pseudonyms belong to the same entity (e.g., to transfer reputation), they generate a ZK proof:

```
Public inputs:  pseudonym_A_DID, pseudonym_B_DID, proof_type
Private inputs: master_seed, derivation_paths
Proof:          SNARK proving both DIDs derive from the same master seed
```

This proof reveals nothing about the master identity or other pseudonyms.

### Cross-Pseudonym Operations

| Operation | Mechanism | Privacy |
|:----------|:---------|:--------|
| Transfer ASHA between pseudonyms | Private relay via session layer | Unlinkable on-chain |
| Share credentials | Re-issue VC to target pseudonym | Issuer sees only target |
| Merge reputation | ZK equivalence proof + reputation transfer | Score transferred, link not revealed |
| Unified messaging | Client-side routing, separate sessions | Contacts see only their pseudonym |

### Pseudonym Lifecycle

1. **Creation**: Derived from master seed, registered nowhere
2. **Active use**: Independent keys, addresses, sessions
3. **Retirement**: User stops using; keys can be archived
4. **Merge**: User proves equivalence and consolidates (irreversible -- breaks unlinkability)

## Rationale

- **HD derivation** ensures pseudonyms are deterministically recoverable from the master seed
- **Client-side only registry** means no server or chain leaks the pseudonym mapping
- **ZK equivalence proofs** allow voluntary linking without permanent on-chain correlation
- **Context separation by default** protects users who do not actively manage their privacy
- **Unlimited pseudonyms** accommodate the full range of social contexts a diaspora member navigates

## Security Considerations

- **Master seed compromise**: All pseudonyms are derived from the master seed; its compromise exposes every pseudonym; social recovery (PIP-0202) mitigates this
- **Traffic analysis**: If a user operates multiple pseudonyms from the same network location, an ISP-level adversary could correlate them; users SHOULD use different network paths
- **On-chain correlation**: Transferring funds directly between pseudonym addresses links them; the private relay mechanism MUST be used
- **Forced equivalence proof**: Under coercion, a user could be forced to prove pseudonym linkage; the duress mechanisms from PIP-0003 apply
- **Pseudonym exhaustion**: HD derivation supports 2^31 pseudonyms per identity; practical exhaustion is infeasible

## References

- [BIP-32: Hierarchical Deterministic Wallets](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)
- [PIP-0200: Decentralized Identity Standard](./pip-0200-decentralized-identity-standard.md)
- [PIP-0003: Coercion Resistance](./pip-0003-coercion-resistance.md)
- [PIP-0203: Reputation System](./pip-0203-reputation-system.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
