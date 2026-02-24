---
pip: 209
title: "Age Verification ZK"
description: "Zero-knowledge age verification without revealing birthdate on Pars Network"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Identity
created: 2026-01-23
tags: [identity, age, zero-knowledge, privacy, verification]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a zero-knowledge age verification protocol for Pars Network. Users can prove they are above or below a specified age threshold without revealing their actual birthdate, name, or any other personal information. The protocol uses a trusted issuer attestation combined with a ZK-SNARK proof circuit.

## Motivation

Age-gated access is required in several Pars Network contexts:

1. **Governance** -- minimum age for voting on community proposals
2. **Content** -- age-restricted media channels and broadcasts
3. **Financial** -- regulatory compliance for DeFi participation in certain jurisdictions
4. **Community** -- age-appropriate community spaces (youth groups, elder councils)

Traditional age verification exposes full identity documents. ZK age proofs provide the same gating with zero personal data leakage.

## Specification

### Attestation Phase

A trusted issuer (community elder, KYC provider, or institutional verifier) issues an age credential:

```json
{
  "type": "AgeAttestation",
  "subject": "did:pars:mainnet:0xSUBJECT...",
  "birthdate": "1990-03-15",
  "issuer": "did:pars:mainnet:0xISSUER...",
  "issuedAt": 1706000000,
  "signature": "0xMLDSA..."
}
```

This attestation is stored encrypted on the user's device. It never appears on-chain.

### ZK Proof Circuit

```
Public inputs:
  - age_threshold (e.g., 18)
  - current_date (coarsened to month)
  - issuer_public_key
  - attestation_nullifier (prevents double-use per verifier)

Private inputs:
  - birthdate
  - issuer_signature
  - attestation_data

Constraints:
  1. issuer_signature is valid over attestation_data
  2. attestation_data contains birthdate
  3. (current_date - birthdate) >= age_threshold * 365.25 days
  4. nullifier = hash(attestation_id || verifier_id)
```

### Verification Contract

```solidity
interface IAgeVerificationZK {
    function verifyAge(
        uint8 ageThreshold,
        bytes32 nullifier,
        bytes memory zkProof
    ) external view returns (bool);

    function registerIssuer(
        bytes32 issuerDID,
        bytes memory publicKey
    ) external;

    function isNullifierUsed(bytes32 nullifier) external view returns (bool);
}
```

### Nullifier System

Each proof generates a unique nullifier per verifier context, preventing:
- **Double verification**: Same attestation cannot produce two valid proofs for the same verifier
- **Cross-verifier linking**: Different verifiers see different nullifiers for the same user

### Supported Thresholds

| Threshold | Use Case |
|:----------|:---------|
| 13+ | Youth community participation |
| 16+ | Limited governance voting |
| 18+ | Full governance, standard content |
| 21+ | Regulatory DeFi in restricted jurisdictions |
| 65+ | Elder council membership |

## Rationale

- **ZK proofs** reveal only the boolean result (above/below threshold), not the birthdate
- **Trusted issuers** provide the initial attestation; the ZK circuit ensures the attestation is valid without revealing it
- **Nullifiers** prevent sybil attacks through repeated verification while preserving unlinkability across verifiers
- **Month-coarsened dates** reduce timing precision attacks on birthdate inference
- **Multiple threshold support** accommodates diverse community needs from a single attestation

## Security Considerations

- **Issuer collusion**: A dishonest issuer could attest a false birthdate; multiple independent issuers mitigate this risk
- **Attestation theft**: Stolen attestation data is useless without the user's private key to generate the ZK proof
- **Timing attacks**: Coarsening current_date to month granularity prevents narrow birthdate inference from threshold boundary behavior
- **Nullifier correlation**: If the same nullifier scheme is used across contexts, verifiers could collude to link users; context-specific nullifiers prevent this
- **Regulatory compliance**: This protocol provides cryptographic age proof; whether specific jurisdictions accept ZK proofs for compliance is a legal question outside this specification's scope

## References

- [PIP-0200: Decentralized Identity Standard](./pip-0200-decentralized-identity-standard.md)
- [PIP-0201: Verifiable Credentials](./pip-0201-verifiable-credentials.md)
- [PIP-0203: Reputation System](./pip-0203-reputation-system.md)
- [Semaphore Protocol](https://semaphore.pse.dev/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
