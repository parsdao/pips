---
pip: 102
title: "Ring Signatures"
description: "Ring signatures for anonymous transaction signing within an anonymity set"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Privacy
created: 2026-01-23
tags: [ring-signatures, anonymity, privacy, signing, transactions]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a ring signature scheme for the Pars Network that allows a user to sign a transaction on behalf of an anonymity group without revealing which member of the group produced the signature. The signer selects a set of public keys (the ring) from the blockchain and produces a signature that is verifiable against the entire ring but attributable to no specific member. Combined with stealth addresses (PIP-0101) and confidential amounts (PIP-0019), ring signatures complete the privacy trifecta: hidden sender, hidden recipient, and hidden amount.

## Motivation

Confidential transactions (PIP-0019) hide amounts and stealth addresses (PIP-0101) hide recipients, but the sender's address remains visible on-chain. An observer can see which address initiated a transaction, enabling sender profiling and social graph construction. For the Pars diaspora, sender identification allows authoritarian regimes to target individuals who send funds to dissidents or opposition groups. Ring signatures hide the sender within a plausible set of other users, providing sender ambiguity.

## Specification

### Ring Construction

When signing a transaction, the sender:

1. Selects `n-1` decoy public keys from recent transaction outputs on the Pars blockchain.
2. Combines these with their own public key to form a ring of `n` members.
3. Produces a ring signature that proves one of the `n` members signed, without revealing which one.

Default ring size: `n = 16`. The protocol enforces a minimum of `n = 8`.

### Signature Scheme

The Pars ring signature uses a linkable ring signature based on the Borromean ring signature construction:

```
RingSignature {
    keyImage:    bytes32     // Linkable key image (prevents double-spending)
    ringMembers: address[]   // The n public keys in the ring
    c0:          bytes32     // Initial challenge
    responses:   bytes32[]   // n response scalars
}
```

### Key Image

Each signing key produces a deterministic key image: `I = x * HashToPoint(P)`, where `x` is the private key and `P` is the public key. The key image is unique per signing key and published with the signature. This enables double-spend detection: if the same key image appears in two transactions, the signer has double-spent.

Key images are stored in a global set on-chain. A transaction is rejected if its key image already exists.

### Decoy Selection

Decoys are selected from a recent window of transaction outputs (last 10,000 blocks) using a triangular distribution biased toward more recent outputs. This distribution matches real spending patterns and prevents statistical analysis that could identify the true signer based on output age.

### Ring Signature Verification

Verification checks:

1. All ring members are valid public keys with unspent outputs.
2. The signature is mathematically valid against the ring.
3. The key image is not in the spent key image set.
4. The ring size meets the minimum requirement.

### Mandatory Rings

To prevent privacy degradation from small anonymity sets, the protocol mandates that all ASHA transfer transactions use ring signatures. Transactions without ring signatures are rejected by consensus rules. This ensures that ring signature usage is not an opt-in behavior that would stigmatize privacy-seeking users.

## Rationale

Linkable ring signatures are chosen because they provide the essential property of double-spend prevention (via key images) while maintaining signer anonymity. The Borromean construction is efficient and well-studied. A ring size of 16 provides a reasonable anonymity set while keeping signature size and verification cost manageable. The mandatory ring requirement prevents the anonymity set from shrinking due to non-participation, which is the primary failure mode of optional privacy features.

The triangular decoy distribution is critical: uniform random decoy selection would allow an adversary to identify the true signer by analyzing output age patterns (real spends tend to use recent outputs).

## Security Considerations

- **Ring size attacks**: An adversary who controls many addresses in a ring can reduce the effective anonymity set. Mitigation: decoys are selected from a large pool (10,000 blocks) and the adversary would need to control a significant fraction of all outputs.
- **Key image linkability**: While key images prevent double-spending, they also link all transactions from the same key. Users should use fresh keys (via stealth addresses) for each received payment.
- **Timing analysis**: The time between receiving funds and spending them can narrow the anonymity set. Mitigation: users should wait for multiple blocks before spending.
- **Output age analysis**: If the decoy distribution does not match real spending patterns, statistical analysis can identify the true signer. The triangular distribution is calibrated against observed Pars network spending patterns.
- **Quantum threat**: The current scheme relies on discrete log hardness. Migration to lattice-based ring signatures is planned under PIP-0107.

## References

- [PIP-0019: Transaction Privacy Layer](./pip-0019-transaction-privacy-layer.md)
- [PIP-0101: Stealth Addresses](./pip-0101-stealth-addresses.md)
- [PIP-0107: Post-Quantum Key Exchange](./pip-0107-post-quantum-key-exchange.md)
- [CryptoNote: Ring Signatures](https://cryptonote.org/whitepaper.pdf)
- [Borromean Ring Signatures](https://raw.githubusercontent.com/ElementsProject/borromean-signatures-writeup/master/borromean.pdf)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
