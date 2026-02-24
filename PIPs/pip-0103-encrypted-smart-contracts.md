---
pip: 103
title: "Encrypted Smart Contracts"
description: "Homomorphic encryption for private smart contract state and execution"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Privacy
created: 2026-01-23
tags: [fhe, smart-contracts, privacy, homomorphic-encryption, confidential-computing]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a framework for encrypted smart contracts on the Pars EVM L2, where contract state and computation operate on encrypted data using Fully Homomorphic Encryption (FHE). Encrypted smart contracts allow developers to write Solidity code that processes encrypted inputs, stores encrypted state, and produces encrypted outputs -- all without any node ever seeing the plaintext data. Only authorized parties (the data owner or designated recipients) can decrypt the results. This enables private DeFi, confidential auctions, sealed-bid voting, and other applications where contract logic must execute on secret data.

## Motivation

Standard smart contracts expose all state and inputs to every node in the network. While this transparency enables trustless verification, it makes private applications impossible: a private auction reveals all bids, a confidential payroll contract reveals all salaries, and a medical records contract reveals all health data. For the Pars diaspora, smart contract transparency undermines privacy for community financial applications (mutual aid funds, scholarship distributions, business contracts) where participants need both the trustless execution guarantees of smart contracts and the privacy of traditional off-chain agreements.

## Specification

### FHE Types in Solidity

The Pars EVM extends Solidity with encrypted data types provided via a library:

```solidity
import "@pars/fhe/FHE.sol";

// Encrypted unsigned integers
euint8  private encryptedAge;
euint32 private encryptedBalance;
euint64 private encryptedTimestamp;

// Encrypted boolean
ebool   private encryptedFlag;

// Encrypted address
eaddress private encryptedRecipient;
```

### FHE Operations

Supported homomorphic operations on encrypted types:

- **Arithmetic**: `FHE.add(a, b)`, `FHE.sub(a, b)`, `FHE.mul(a, b)`.
- **Comparison**: `FHE.lt(a, b)`, `FHE.gt(a, b)`, `FHE.eq(a, b)` -- returns `ebool`.
- **Conditional**: `FHE.select(condition, a, b)` -- encrypted ternary operator.
- **Bitwise**: `FHE.and(a, b)`, `FHE.or(a, b)`, `FHE.xor(a, b)`.

All operations are performed homomorphically by the EVM via precompiles. Nodes process ciphertext without access to plaintext.

### Encryption and Decryption

- **Encryption**: Users encrypt inputs client-side using the network's FHE public key before submitting transactions.
- **Decryption**: Only the data owner can request decryption. Decryption uses a threshold decryption protocol: a committee of validators each hold a key share, and `t-of-n` shares are required to decrypt.
- **Re-encryption**: Data can be re-encrypted to a different user's public key, enabling controlled data sharing without exposing plaintext to the network.

### Access Control

Each encrypted value has an associated access control list (ACL) specifying which addresses may request decryption or re-encryption:

```solidity
// Grant decryption access to a specific address
FHE.allow(encryptedBalance, authorizedAddress);

// Check if an address has decryption access
FHE.isAllowed(encryptedBalance, queryAddress);
```

### Gas Costs

FHE operations are significantly more expensive than plaintext operations:

| Operation | Plaintext Gas | FHE Gas | Ratio |
|:----------|:-------------|:--------|:------|
| Addition | 3 | 50,000 | ~16,000x |
| Multiplication | 5 | 150,000 | ~30,000x |
| Comparison | 3 | 80,000 | ~26,000x |
| Conditional select | 3 | 100,000 | ~33,000x |

These costs reflect the computational overhead of FHE and are calibrated to prevent denial-of-service.

## Rationale

FHE is chosen over alternatives (secure multi-party computation, trusted execution environments) because it is non-interactive and does not require trusted hardware. MPC requires communication between parties, which is incompatible with the asynchronous blockchain execution model. TEEs (Intel SGX, ARM TrustZone) require trusting the hardware manufacturer, which is unacceptable in the Pars threat model. FHE allows any untrusted node to process encrypted data without ever seeing plaintext, providing the strongest privacy guarantees for smart contract execution.

The Solidity library approach (rather than a new language) ensures developer familiarity and toolchain compatibility. Existing Solidity tools (Hardhat, Foundry) work with encrypted contracts with minimal adaptation.

## Security Considerations

- **FHE key management**: The network FHE public key must be generated via a secure distributed key generation ceremony. Compromise of the key allows decryption of all encrypted state.
- **Ciphertext malleability**: FHE ciphertexts are malleable by design (enabling computation). Access control lists prevent unauthorized decryption of manipulated ciphertexts.
- **Side-channel leakage**: Gas consumption and execution time may reveal information about encrypted values. Mitigation: FHE operations have constant gas cost regardless of the plaintext value.
- **Threshold decryption committee**: The decryption committee must be honest-majority. Collusion of `t` members allows arbitrary decryption. Committee rotation (PIP-0028) limits exposure.
- **Quantum resistance**: The FHE scheme uses lattice-based cryptography (RLWE), which is believed quantum-resistant.

## References

- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)
- [PIP-0012: Encrypted Voting](./pip-0012-encrypted-voting.md)
- [PIP-0028: Validator Rotation Protocol](./pip-0028-validator-rotation-protocol.md)
- [TFHE: Fast Fully Homomorphic Encryption](https://eprint.iacr.org/2018/421)
- [fhEVM: Confidential Smart Contracts](https://docs.zama.ai/fhevm)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
