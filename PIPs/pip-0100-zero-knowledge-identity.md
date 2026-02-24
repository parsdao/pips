---
pip: 100
title: "Zero-Knowledge Identity"
description: "zk-proof based identity verification without exposing personal data"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Privacy
created: 2026-01-23
tags: [zk-proofs, identity, privacy, verification, sybil-resistance]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a zero-knowledge identity system for the Pars Network that enables users to prove attributes about themselves (age, nationality, membership, credential) without revealing their actual identity or personal data. The system uses zk-SNARKs to generate proofs against a credential Merkle tree maintained by trusted issuers. Users can prove statements like "I am over 18" or "I hold a valid Pars DAO membership" without revealing their name, birthdate, or membership ID. This forms the foundation for privacy-preserving KYC, Sybil resistance, and access control on the Pars Network.

## Motivation

Identity verification is often required for governance participation, regulatory compliance, and access to certain services. Traditional identity systems require users to reveal personally identifiable information (PII), which creates surveillance vectors. For the Persian diaspora, revealing identity to participate in a censorship-resistant network defeats the network's purpose. A zero-knowledge identity system allows users to satisfy verification requirements while revealing absolutely nothing beyond the specific attribute being proven.

## Specification

### Credential Issuance

Trusted issuers (the Pars DAO, community organizations, external identity providers) issue credentials to users:

```
Credential {
    issuer:     address     // Issuer's on-chain address
    subject:    bytes32     // Blinded subject identifier
    attributes: bytes[]     // Encrypted attribute values
    signature:  bytes       // Issuer's ML-DSA signature
    expiry:     uint64      // Credential expiration epoch
}
```

Credentials are stored locally on the user's device, never on-chain. The issuer publishes a commitment to all issued credentials in an on-chain Merkle tree.

### Proof Generation

To prove an attribute, the user generates a zk-SNARK proof:

**Public inputs**: Merkle root of the issuer's credential tree, the attribute predicate (e.g., "age >= 18"), and a nullifier (to prevent double-use if needed).

**Private inputs (witness)**: The credential, the Merkle path proving inclusion, and the actual attribute values.

The proof demonstrates: "I hold a credential issued by this trusted issuer, included in the on-chain Merkle tree, and the attribute satisfies the predicate" -- without revealing which credential, which subject, or the actual attribute value.

### Predicate Types

The system supports the following predicate types:

- **Range**: `attribute >= threshold` (e.g., age >= 18).
- **Membership**: `attribute IN set` (e.g., nationality IN {IR, US, DE, ...}).
- **Equality**: `attribute == value` (e.g., membership_tier == "gold").
- **Existence**: "I hold a credential from issuer X" (no attribute check).

### On-Chain Verification

A verifier contract checks zk-SNARK proofs:

```solidity
interface IZKIdentity {
    /// Verify a zero-knowledge identity proof
    function verifyIdentity(
        bytes32 credentialRoot,
        uint8 predicateType,
        bytes calldata predicateParams,
        bytes32 nullifier,
        bytes calldata proof
    ) external view returns (bool valid);
}
```

The verifier is deployed as a precompile at address `0x0730` for gas-efficient proof verification.

### Issuer Registry

Trusted issuers register on-chain via DAO governance (PIP-7000). The registry maps issuer addresses to their credential tree roots and trust levels:

- **Level 1**: Self-attested (lowest trust, suitable for forum access).
- **Level 2**: Community-vouched (moderate trust, suitable for governance).
- **Level 3**: KYC-verified (highest trust, suitable for regulated interactions).

### Revocation

Issuers can revoke credentials by adding the credential's commitment to a revocation accumulator. Proofs must demonstrate non-membership in the revocation accumulator to remain valid.

## Rationale

zk-SNARKs are chosen over zk-STARKs for proof compactness (proofs are approximately 200 bytes vs several kilobytes), which is critical for on-chain verification gas costs. The Groth16 proving system is used with a circuit-specific trusted setup performed by the Pars community via a multi-party computation ceremony. The credential Merkle tree pattern is inspired by Semaphore and supports efficient batch issuance. The nullifier system enables rate-limiting without identity correlation.

## Security Considerations

- **Trusted setup**: Groth16 requires a trusted setup. If all ceremony participants are compromised, fake proofs become possible. Mitigation: the ceremony includes 100+ independent participants; only one needs to be honest.
- **Issuer compromise**: A compromised issuer could issue credentials to non-qualified subjects. Mitigation: multiple issuer levels and DAO governance for issuer registration.
- **Credential theft**: If a user's device is compromised, their credentials could be stolen. Mitigation: credentials are encrypted under a device-local key and require biometric or PIN authentication to use.
- **Correlation via timing**: Proof submission timing could correlate with identity. Mitigation: users can pre-generate proofs and submit them via a mixer or delayed submission.

## References

- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)
- [PIP-0003: Coercion Resistance](./pip-0003-coercion-resistance.md)
- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)
- [Semaphore: Zero-Knowledge Signaling](https://semaphore.pse.dev/)
- [Groth16: On the Size of Pairing-Based Non-interactive Arguments](https://eprint.iacr.org/2016/260)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
