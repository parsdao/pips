---
pip: 201
title: "Verifiable Credentials Framework"
description: "W3C-compatible verifiable credential issuance and verification on Pars Network"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Identity
created: 2026-01-23
tags: [identity, credentials, w3c, verifiable, privacy]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a verifiable credential (VC) framework for Pars Network, compatible with the W3C Verifiable Credentials Data Model. It enables issuers to attest facts about subjects, subjects to present proofs selectively, and verifiers to confirm authenticity -- all without contacting the issuer. Credentials use hybrid post-quantum signatures and support zero-knowledge selective disclosure.

## Motivation

Diaspora communities need portable, tamper-proof attestations that:

1. **Do not depend on any government** -- credentials work even when state institutions are hostile or unreachable
2. **Preserve privacy** -- a credential proving language fluency should not reveal the holder's birthdate
3. **Resist forgery** -- quantum-safe signatures ensure long-term integrity
4. **Enable community trust** -- community elders, educators, and organizations can issue meaningful credentials without institutional gatekeepers

Use cases include proof of diaspora membership, language proficiency, professional skills, community contributions, and cultural heritage.

## Specification

### Credential Structure

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1", "https://pars.network/ns/vc/v1"],
  "type": ["VerifiableCredential", "DiasporaMembershipCredential"],
  "issuer": "did:pars:mainnet:0xISSUER...",
  "issuanceDate": "2026-01-23T00:00:00Z",
  "credentialSubject": {
    "id": "did:pars:mainnet:0xSUBJECT...",
    "memberSince": "2026-01",
    "community": "pars-network"
  },
  "proof": {
    "type": "MLDSASignature2024",
    "verificationMethod": "did:pars:mainnet:0xISSUER...#key-pq",
    "proofValue": "z5MLdsaSig..."
  }
}
```

### Issuer Registry Contract

```solidity
interface ICredentialRegistry {
    function registerIssuer(bytes32 issuerDID, bytes memory metadata) external;
    function revokeCredential(bytes32 credentialHash) external;
    function isRevoked(bytes32 credentialHash) external view returns (bool);
    function getIssuerMetadata(bytes32 issuerDID) external view returns (bytes memory);
}
```

### Selective Disclosure

Credentials support BBS+ style selective disclosure:

1. Issuer signs a credential with multiple attributes
2. Holder generates a derived proof revealing only chosen attributes
3. Verifier confirms the proof without seeing hidden attributes

```
Full Credential: {name, birthdate, language, community, skills}
Disclosed Proof:  {language, community} + ZK proof of valid signature
```

### Presentation Protocol

```
Verifier                          Holder
   │                                 │
   │  1. PresentationRequest         │
   │  (requested attributes, nonce)  │
   │ ──────────────────────────────► │
   │                                 │
   │                                 │  2. Select credentials
   │                                 │     Generate derived proofs
   │                                 │
   │  3. VerifiablePresentation      │
   │  (proofs, disclosed attributes) │
   │ ◄────────────────────────────── │
   │                                 │
   │  4. Verify signatures           │
   │     Check revocation status     │
   │     Validate nonce              │
```

### Credential Lifecycle

| State | Description | On-chain |
|:------|:------------|:---------|
| Issued | Credential signed and delivered to holder | Optional anchor |
| Active | Credential valid and not revoked | Revocation registry checked |
| Suspended | Temporarily invalid | Issuer sets suspension flag |
| Revoked | Permanently invalid | Issuer writes to revocation registry |
| Expired | Past expiration date | Client-side check |

## Rationale

- **W3C compatibility** allows credentials to be verified by any standards-compliant system worldwide
- **BBS+ selective disclosure** prevents over-sharing of personal information
- **On-chain revocation** provides a censorship-resistant, always-available revocation check
- **Community issuers** democratize trust beyond institutional gatekeepers
- **PQ signatures** ensure credentials remain valid and unforgeable in a post-quantum world

## Security Considerations

- **Issuer compromise**: Revocation registry allows bulk invalidation of all credentials from a compromised issuer
- **Replay attacks**: Presentation protocol includes verifier-provided nonces to prevent credential replay
- **Correlation**: Holders SHOULD use different derived proofs for different verifiers to prevent cross-verifier tracking
- **Credential theft**: Credentials are bound to holder DIDs; stolen credential data is useless without the holder's private key
- **Long-term validity**: PQ signatures ensure credentials cannot be forged even with future quantum computers

## References

- [W3C Verifiable Credentials Data Model](https://www.w3.org/TR/vc-data-model/)
- [BBS+ Signatures](https://identity.foundation/bbs-signature/draft-irtf-cfrg-bbs-signatures.html)
- [PIP-0200: Decentralized Identity Standard](./pip-0200-decentralized-identity-standard.md)
- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
