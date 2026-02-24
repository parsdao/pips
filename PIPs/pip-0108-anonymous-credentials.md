---
pip: 108
title: "Anonymous Credentials"
description: "Credential system for proving attributes without revealing identity"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Privacy
created: 2026-01-23
tags: [credentials, anonymous, privacy, attributes, selective-disclosure]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines an anonymous credential system for the Pars Network based on BBS+ signatures. Credentials are multi-attribute signed tokens issued by trusted authorities. The holder can selectively disclose any subset of attributes while proving the credential is validly signed, without revealing the undisclosed attributes or the holder's identity. Unlike the zk-SNARK identity system (PIP-0100), which requires on-chain Merkle trees and circuit-specific proofs, anonymous credentials use efficient BBS+ signature proofs that work entirely off-chain with optional on-chain verification. This provides a complementary, lightweight credentialing system suitable for high-frequency, interactive use cases.

## Motivation

The Pars diaspora needs a credentialing system for everyday interactions: proving membership in a community organization, demonstrating completion of an educational course, verifying professional qualifications, or attesting to participation in governance. These interactions are frequent and often occur off-chain (in peer-to-peer messaging, marketplace transactions, or access control). The zk-SNARK approach (PIP-0100) is powerful but requires on-chain Merkle tree lookups and is gas-intensive. BBS+ credentials provide a faster, off-chain-first alternative where the holder controls exactly which attributes to reveal in each interaction.

## Specification

### Credential Structure

A credential contains a set of attributes signed by an issuer:

```
Credential {
    issuer:     PublicKey       // Issuer's BBS+ public key
    attributes: string[]       // Ordered list of attribute values
    signature:  BBS+Signature  // Issuer's signature over all attributes
}

Example attributes:
    [0] "Pars DAO"              // Issuing organization
    [1] "2025-06-15"            // Issue date
    [2] "2027-06-15"            // Expiry date
    [3] "contributor"           // Membership tier
    [4] "governance-eligible"   // Permission
    [5] "Tehran"                // City (sensitive)
    [6] "Reza Mohammadi"        // Full name (sensitive)
```

### Selective Disclosure

The holder generates a zero-knowledge proof that reveals only chosen attributes:

```
SelectiveDisclosure {
    revealedIndices:  uint[]       // Which attributes to reveal
    revealedValues:   string[]     // The revealed attribute values
    proof:            BBS+Proof    // ZK proof of valid signature
    nonce:            bytes32      // Verifier-provided freshness nonce
}
```

For the example above, a holder proving governance eligibility might reveal only indices [0, 3, 4] ("Pars DAO", "contributor", "governance-eligible") while hiding indices [1, 2, 5, 6] (dates, city, name).

### BBS+ Proof Properties

The BBS+ selective disclosure proof guarantees:

1. **Unforgeability**: The proof is valid only if the issuer signed all attributes (including hidden ones).
2. **Unlinkability**: Two proofs from the same credential cannot be linked to each other (no persistent identifier is revealed).
3. **Selective disclosure**: Only chosen attributes are revealed; hidden attributes are information-theoretically secret.
4. **Non-transferability**: The proof is bound to the verifier's nonce, preventing replay.

### Issuer Key Management

Issuers generate BBS+ key pairs and register their public keys on-chain:

```solidity
interface ICredentialRegistry {
    /// Register an issuer's BBS+ public key
    function registerIssuer(
        bytes calldata publicKey,
        string calldata issuerName,
        string[] calldata attributeSchema
    ) external;

    /// Revoke an issuer's key
    function revokeIssuerKey(bytes calldata publicKey) external;

    /// Check if an issuer key is valid
    function isValidIssuer(bytes calldata publicKey) external view returns (bool);
}
```

### Credential Revocation

Issuers revoke credentials using a privacy-preserving revocation accumulator. Holders prove non-revocation as part of their selective disclosure proof, without revealing which specific credential they hold.

### Predicate Proofs

Beyond selective disclosure, holders can prove predicates over hidden attributes without revealing the attribute value:

- **Range**: "My age attribute is >= 18" without revealing the exact age.
- **Inequality**: "My membership tier is not 'suspended'" without revealing the actual tier.
- **Set membership**: "My country is in the EU list" without revealing which country.

### Off-Chain Verification

BBS+ proofs are designed for off-chain verification between two parties. A typical flow:

1. Verifier sends a challenge nonce.
2. Holder generates a selective disclosure proof bound to the nonce.
3. Verifier checks the proof against the issuer's on-chain public key.
4. Verification succeeds without any on-chain transaction.

On-chain verification is available via a precompile at address `0x0740` for smart contract access control.

## Rationale

BBS+ signatures are chosen over CL signatures (used in Hyperledger Indy) because they produce shorter signatures, faster verification, and support efficient predicate proofs. BBS+ is also more widely implemented and has been submitted to IETF for standardization. The off-chain-first design reflects that most credentialing interactions do not need blockchain-level finality -- they need privacy and speed. The on-chain registry provides a trust anchor for issuer keys without putting credential data on-chain.

## Security Considerations

- **Issuer compromise**: A compromised issuer can create fraudulent credentials. Mitigation: issuers are registered via DAO governance and can be revoked.
- **Credential sharing**: A holder could share their credential with another party. Mitigation: proofs are bound to the verifier's nonce and can optionally include a hardware-binding proof.
- **Accumulator maintenance**: The revocation accumulator must be updated by the issuer. If the issuer goes offline, revocation status cannot be updated. Mitigation: issuers should delegate accumulator management to a smart contract.
- **Quantum vulnerability**: BBS+ signatures rely on pairing-based cryptography, which is vulnerable to quantum attacks. Migration to a post-quantum anonymous credential scheme is planned as a future PIP.
- **Correlation through timing**: Presenting credentials at predictable times or to the same verifier repeatedly can enable correlation. Mitigation: PIP-0105 metadata protection applies to credential presentation channels.

## References

- [PIP-0100: Zero-Knowledge Identity](./pip-0100-zero-knowledge-identity.md)
- [PIP-0105: Metadata Protection](./pip-0105-metadata-protection.md)
- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)
- [BBS+ Signatures](https://identity.foundation/bbs-signature/draft-irtf-cfrg-bbs-signatures.html)
- [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model-2.0/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
