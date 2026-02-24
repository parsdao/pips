---
pip: 22
title: "Mempool Encryption"
description: "Encrypted mempool to prevent front-running and MEV extraction"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Core
created: 2026-01-23
tags: [mempool, encryption, mev, front-running, fairness]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines an encrypted mempool protocol for the Pars Network. Transactions are encrypted before entering the mempool using a threshold encryption scheme. Block proposers include encrypted transactions in blocks without seeing their contents. Only after a block is committed does the decryption committee reveal the transaction contents for execution. This eliminates front-running, sandwich attacks, and other forms of maximal extractable value (MEV) that harm users. For the Pars diaspora, mempool encryption also prevents surveillance of pending transactions by network observers.

## Motivation

On transparent-mempool blockchains, pending transactions are visible to all network participants before inclusion in a block. This enables MEV extraction: validators and searchers observe pending transactions and insert their own transactions before, after, or around them to extract profit. Common attacks include front-running (buying before a large buy order), sandwich attacks (buying before and selling after a user's trade), and censorship (excluding transactions that compete with the validator's interests).

For Pars Network users, mempool transparency has an additional danger: authoritarian surveillance. A government observer monitoring the mempool can see transaction details (sender, recipient, amount, contract calls) in real-time, before they are even confirmed. Mempool encryption eliminates this surveillance vector entirely.

## Specification

### Encryption Scheme

Transactions are encrypted using a threshold identity-based encryption (IBE) scheme where the identity is the future block number:

1. The user encrypts their transaction to the identity `block_number = current_height + 1`.
2. The encrypted transaction is broadcast to the mempool.
3. The block proposer includes encrypted transactions in the block (ordered by gas price of a publicly committed bid).
4. After the block is committed, the decryption committee reveals the IBE secret key for that block number.
5. All nodes decrypt the transactions and execute them.

### Threshold Decryption Committee

The decryption committee is a rotating subset of validators (overlapping with PIP-0028 rotation). The committee uses a t-of-n threshold scheme:

- Committee size: 21 validators.
- Threshold: 14-of-21.
- Rotation: every 100 blocks.

No single committee member can decrypt transactions alone. At least 14 members must cooperate to produce the block's decryption key.

### Transaction Ordering

Since transaction contents are hidden, ordering within a block cannot be based on gas price of the transaction itself. Instead, users attach a public priority bid alongside their encrypted transaction:

```
EncryptedMempoolEntry {
    encryptedTx:  bytes     // IBE-encrypted transaction
    priorityBid:  uint256   // Public gas price bid for ordering
    blockTarget:  uint256   // Target block number (IBE identity)
    commitment:   bytes32   // Hash of encrypted tx (prevents tampering)
}
```

Transactions are ordered by `priorityBid` descending. The `commitment` prevents the proposer from substituting a different encrypted transaction.

### Decryption Timeline

```
Block N proposed  ->  Block N committed  ->  Decryption key for N released
                                              (within 1 slot)
     |                                              |
     | Encrypted txs included                       | Txs decrypted and executed
     | Contents unknown to proposer                 | State transitions applied
```

### Fallback

If the decryption committee fails to produce the key within 5 slots after block commitment, the block's encrypted transactions are considered expired. Users must resubmit. Committee members who fail to contribute their key share are slashed.

## Rationale

Threshold IBE is chosen over commit-reveal schemes because it requires only one round of communication from the user (submit encrypted tx) rather than two rounds (commit, then reveal). This halves the latency for transaction inclusion. The public priority bid preserves the fee market's ability to prioritize transactions without revealing their contents. The block-number-as-identity approach ensures that decryption keys are specific to each block and cannot be used to decrypt transactions targeted at other blocks.

## Security Considerations

- **Committee collusion**: If 14+ committee members collude, they can decrypt transactions before block commitment, enabling MEV. Mitigation: committee rotation every 100 blocks, slashing for proven pre-commitment decryption.
- **Bid manipulation**: The public priority bid reveals some information (willingness to pay). This is a minimal information leak compared to full transaction visibility.
- **Latency**: Encrypted mempool adds one slot of latency (decryption step). This is acceptable for most applications.
- **Transaction validity**: Block proposers cannot validate encrypted transactions before inclusion. Invalid transactions consume block space but are not executed. The priority bid serves as a spam deterrent.
- **Denial of service**: An attacker could flood the mempool with invalid encrypted transactions. Mitigation: priority bid acts as a cost barrier, and invalid transactions are penalized by forfeiting the bid.

## References

- [PIP-0023: Fee Market Mechanism](./pip-0023-fee-market-mechanism.md)
- [PIP-0028: Validator Rotation Protocol](./pip-0028-validator-rotation-protocol.md)
- [PIP-0019: Transaction Privacy Layer](./pip-0019-transaction-privacy-layer.md)
- [Threshold Encrypted Mempools](https://eprint.iacr.org/2022/898)
- [MEV and the Future of Blockchains](https://arxiv.org/abs/2101.05511)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
