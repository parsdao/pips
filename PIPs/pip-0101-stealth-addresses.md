---
pip: 101
title: "Stealth Addresses"
description: "One-time stealth addresses for unlinkable payment reception"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Privacy
created: 2026-01-23
tags: [stealth-addresses, privacy, payments, unlinkability]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a stealth address protocol for the Pars Network that enables recipients to receive ASHA payments at one-time addresses that cannot be linked to their public identity. The sender derives a unique stealth address for each payment using the recipient's stealth meta-address (a public key pair). Only the recipient can detect and spend funds sent to stealth addresses using their private viewing and spending keys. This provides recipient unlinkability: an observer cannot determine that two payments were sent to the same person.

## Motivation

Even with confidential transaction amounts (PIP-0019), address reuse creates a linkability problem. If a user publishes a single address for receiving payments (e.g., for donations, commerce, or remittances), all payments to that address are trivially linked. For the Persian diaspora, this linkability allows authoritarian regimes to build a complete financial profile of any user who shares their address publicly. Stealth addresses break this linkability by generating a fresh, unique address for every payment.

## Specification

### Stealth Meta-Address

Each user generates a stealth meta-address consisting of two public keys:

```
StealthMetaAddress {
    spendingPubKey: bytes33   // Public key for spending stealth funds
    viewingPubKey:  bytes33   // Public key for detecting incoming payments
}
```

The stealth meta-address is published once (on-chain registry, ENS-style name, QR code, etc.) and used by all senders.

### Sending to a Stealth Address

To send ASHA to a recipient:

1. Sender generates an ephemeral key pair: `(r, R = r * G)`.
2. Sender computes the shared secret: `S = r * viewingPubKey`.
3. Sender derives the stealth address: `stealthAddr = spendingPubKey + hash(S) * G`.
4. Sender sends ASHA to `stealthAddr` and publishes `R` (the ephemeral public key) in the transaction's `ephemeralPubKey` field.

### Detecting Incoming Payments

The recipient scans new transactions:

1. For each transaction with an `ephemeralPubKey` field, compute: `S' = viewingKey * R`.
2. Derive the expected stealth address: `expectedAddr = spendingPubKey + hash(S') * G`.
3. If `expectedAddr` matches the transaction's recipient, this payment is for us.

### Spending from a Stealth Address

To spend from a stealth address:

1. Compute the stealth private key: `stealthPrivKey = spendingKey + hash(S')`.
2. Sign the spending transaction with `stealthPrivKey`.

### Viewing Key Delegation

The viewing key can be shared with a trusted third party (auditor, tax advisor) to allow them to detect incoming payments without the ability to spend funds. This supports selective disclosure requirements.

### Stealth Address Registry

An on-chain registry maps human-readable identifiers to stealth meta-addresses:

```solidity
interface IStealthRegistry {
    /// Register a stealth meta-address
    function register(
        bytes calldata spendingPubKey,
        bytes calldata viewingPubKey
    ) external;

    /// Look up a stealth meta-address
    function resolve(address owner) external view returns (
        bytes memory spendingPubKey,
        bytes memory viewingPubKey
    );
}
```

### Scanning Optimization

Full scanning of all transactions is expensive. To reduce the scanning burden:

- **Tag system**: Each stealth transaction includes a 4-byte view tag derived from `hash(S')[0:4]`. Recipients first check the view tag before computing the full shared secret, filtering out ~99.998% of irrelevant transactions.
- **Scanning service**: Optional off-chain scanning services can use the viewing key to detect payments and notify users, reducing mobile device workload.

## Rationale

The dual-key stealth address scheme (separate viewing and spending keys) is chosen over single-key schemes because it enables viewing key delegation without compromising spending authority. This is essential for compliance use cases where an auditor needs to see incoming payments but must not be able to spend funds. The view tag optimization reduces scanning cost by 4 orders of magnitude, making stealth address detection feasible on mobile devices. The ephemeral public key is stored in the transaction rather than a separate announcement contract, reducing the number of on-chain lookups required.

## Security Considerations

- **Viewing key compromise**: A leaked viewing key allows detection of all incoming payments but not spending. Users should rotate stealth meta-addresses periodically.
- **Timing correlation**: If a user receives a stealth payment and immediately spends it, the timing correlation can link the two transactions. Mitigation: users should batch spending or use time delays.
- **Ephemeral key reuse**: Reusing the ephemeral key `r` for multiple payments to the same recipient links those payments. The protocol mandates fresh ephemeral keys per transaction.
- **Quantum threat**: The ECDH-based scheme is vulnerable to quantum computers. Migration to ML-KEM-based stealth addresses is planned under PIP-0107.

## References

- [PIP-0019: Transaction Privacy Layer](./pip-0019-transaction-privacy-layer.md)
- [PIP-0107: Post-Quantum Key Exchange](./pip-0107-post-quantum-key-exchange.md)
- [EIP-5564: Stealth Addresses](https://eips.ethereum.org/EIPS/eip-5564)
- [EIP-6538: Stealth Meta-Address Registry](https://eips.ethereum.org/EIPS/eip-6538)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
