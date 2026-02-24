---
pip: 19
title: "Transaction Privacy Layer"
description: "Default transaction privacy with selective disclosure for Pars Network"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Core
created: 2026-01-23
tags: [privacy, transactions, selective-disclosure, confidential-transfers]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a transaction privacy layer that makes all ASHA transfers confidential by default. Transaction amounts are hidden using Pedersen commitments, and sender-receiver linkage is obscured using one-time stealth addresses (PIP-0101). Users may selectively disclose transaction details to chosen parties (auditors, tax authorities, counterparties) by sharing view keys. The privacy layer operates at the protocol level, ensuring that privacy is not an opt-in feature that stigmatizes users who enable it, but a universal default that protects the entire network.

## Motivation

On transparent blockchains, every transaction is a permanent public record linking sender, receiver, and amount. For the Persian diaspora, this transparency is a direct threat: authoritarian regimes can trace financial flows to identify dissidents, track remittances to families in Iran, and build social graphs of opposition networks. Making privacy the default eliminates the metadata signal that comes from opting into a privacy feature. When all transactions are private, using the network is not itself an incriminating act.

## Specification

### Confidential Amounts

Transaction amounts are replaced by Pedersen commitments:

```
C = amount * G + blinding * H
```

Where `G` and `H` are generator points, `amount` is the transfer value, and `blinding` is a random scalar. The commitment hides the amount while allowing verification that inputs equal outputs (no ASHA created or destroyed) through a balance proof.

### Range Proofs

Each commitment includes a Bulletproofs+ range proof demonstrating that the committed amount is in the range [0, 2^64). This prevents negative amounts that could inflate the ASHA supply.

### Stealth Addresses

Every transaction uses a one-time stealth address (PIP-0101) for the recipient. The sender derives a unique address from the recipient's public stealth meta-address. Only the recipient can detect and spend funds sent to a stealth address.

### Selective Disclosure

Users generate view keys that allow chosen parties to decrypt transaction details:

- **Amount view key**: Reveals the transaction amount but not the recipient.
- **Full view key**: Reveals both amount and recipient.
- **Audit key**: Reveals all incoming and outgoing transactions for an account.

View keys are derived from the account's master key using a hierarchical deterministic scheme, allowing fine-grained disclosure without exposing the spending key.

### Transaction Structure

```
ConfidentialTransaction {
    inputs:  []StealthInput       // References to prior stealth outputs
    outputs: []StealthOutput      // New stealth address outputs
    commitments: []PedersenCommit // Amount commitments
    rangeProofs: []BulletProof    // Range proofs for each output
    balanceProof: BalanceProof    // Proves sum(inputs) == sum(outputs) + fee
    fee: uint256                  // Fee is public (required for fee market)
}
```

### Fee Handling

Transaction fees are the only public value in a confidential transaction. This is necessary for the fee market mechanism (PIP-0023) to function. The fee amount reveals an upper bound on the transaction value but provides no information about the actual transfer amount.

## Rationale

Pedersen commitments with Bulletproofs+ are chosen over zk-SNARKs for amount hiding because they do not require a trusted setup, have smaller proof sizes for range proofs, and are computationally efficient. The combination with stealth addresses provides both amount privacy and address unlinkability. Making privacy the default rather than optional follows the principle that privacy is only effective when it is universal -- an opt-in privacy pool creates a smaller anonymity set that is easier to attack.

## Security Considerations

- **Anonymity set size**: Privacy is strongest when all transactions are confidential. The protocol enforces this by not supporting transparent transfers on the main chain.
- **View key compromise**: A leaked view key exposes transaction history but not spending authority. Users should rotate view keys periodically.
- **Timing analysis**: Transaction timing can reveal information even when amounts and addresses are hidden. PIP-0105 addresses network-level metadata protection.
- **Quantum threat**: Pedersen commitments rely on the discrete log assumption. Post-quantum migration is planned per PIP-0002 and PIP-0107.

## References

- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)
- [PIP-0101: Stealth Addresses](./pip-0101-stealth-addresses.md)
- [PIP-0023: Fee Market Mechanism](./pip-0023-fee-market-mechanism.md)
- [PIP-0105: Metadata Protection](./pip-0105-metadata-protection.md)
- [Bulletproofs+: Shorter Proofs for Privacy-Enhanced Distributed Ledger](https://eprint.iacr.org/2020/735)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
