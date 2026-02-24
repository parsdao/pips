---
pip: 109
title: "Plausible Deniability"
description: "Deniable encryption for coercion resistance and plausible deniability"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Privacy
created: 2026-01-23
tags: [deniability, coercion-resistance, encryption, steganography, privacy]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a plausible deniability framework for the Pars Network that enables users to maintain multiple layers of encrypted data, where surrendering one key reveals innocuous content while the true content remains hidden and undetectable. The framework integrates deniable encryption into the Pars wallet, Session protocol, and on-chain storage, ensuring that users under physical coercion cannot be compelled to reveal their real data because the existence of hidden data is cryptographically undetectable. This extends the coercion resistance principles of PIP-0003 into a comprehensive protocol-level deniability system.

## Motivation

Coercion resistance (PIP-0003) addresses the scenario where an adversary demands a user's keys under threat of violence. Traditional encryption fails here: the adversary knows encrypted data exists and will not stop coercing until the key is surrendered. Deniable encryption transforms this scenario: the user can surrender a key that reveals plausible but innocuous data, while the real data remains hidden within what appears to be random padding. The adversary has no way to prove that additional hidden data exists.

For the Persian diaspora, this is not theoretical. Users may be detained at borders, subjected to device searches, or coerced by security services to reveal their wallet contents, message history, or governance participation. Plausible deniability ensures these users can comply with demands without revealing their actual activity.

## Specification

### Deniable Encryption Scheme

The Pars deniable encryption scheme supports multiple hidden volumes within a single encrypted container:

```
DeniableContainer {
    outerSize:  uint64      // Total container size (fixed)
    layers:     []Layer     // Multiple encryption layers
}

Layer {
    key:        bytes32     // Layer-specific encryption key
    offset:     uint64      // Byte offset within container
    size:       uint64      // Layer data size
    data:       bytes       // Encrypted payload
    // Unused space filled with random bytes indistinguishable from encrypted data
}
```

### Layer Architecture

A deniable container has at least two layers:

1. **Decoy layer** (outer): Contains plausible but non-sensitive data (e.g., a small ASHA balance, public messages, benign transaction history). Revealed under coercion.
2. **Hidden layer** (inner): Contains the user's actual data (real ASHA balance, private messages, governance votes). Never revealed to an adversary.

An observer with access to the outer key cannot determine whether a hidden layer exists, because the hidden layer is stored in space that would otherwise be random padding.

### Wallet Integration

The Pars wallet supports deniable wallets:

```
DeniableWallet {
    decoyWallet: {
        address:  address
        balance:  uint256     // Small, plausible balance
        history:  []Transaction // Innocuous transaction history
    }
    hiddenWallet: {
        address:  address
        balance:  uint256     // Real balance
        history:  []Transaction // Actual transaction history
    }
}
```

- **Normal use**: The user enters their real PIN/passphrase to access the hidden wallet.
- **Under duress**: The user enters a duress PIN/passphrase (PIP-0003) to access the decoy wallet.
- **Key derivation**: Both wallets derive from the same master seed using different derivation paths, where the hidden path is deterministic but unprovable without the real passphrase.

### Session Protocol Integration

Deniable messaging in the Session protocol (PIP-0005):

1. Each Session conversation maintains a decoy message history and a hidden message history.
2. The decoy history contains plausible but bland messages.
3. Under coercion, the user reveals the decoy conversation key.
4. The hidden conversation remains invisible within the encrypted Session state.

### On-Chain Deniability

For on-chain data (encrypted state in smart contracts, encrypted blobs):

1. Users can publish deniable transactions where the same ciphertext can be opened to different plaintexts depending on the key provided.
2. The encryption scheme uses a commitment with equivocal opening, allowing the sender to later produce a fake opening for any desired plaintext.
3. Only the true opening (held by the sender) produces the actual transaction content.

### Indistinguishability Guarantee

The security property is formalized as:

**Deniability**: Given a deniable container `C` and a decoy key `k_decoy`, no probabilistic polynomial-time adversary can determine with probability greater than 1/2 + negligible whether `C` contains a hidden layer.

This holds because:

1. All unused space in the container is filled with cryptographically random bytes.
2. The hidden layer's ciphertext is indistinguishable from random under the chosen encryption scheme (AES-256-CTR or ChaCha20).
3. The container size is fixed regardless of whether a hidden layer exists.

### Duress Detection

The Pars wallet can detect potential duress situations and automatically present the decoy wallet:

- **Geofencing**: If the device detects it is in a high-risk country (based on IP geolocation or cell tower data), it defaults to the decoy interface.
- **Timing patterns**: If the wallet is opened at unusual hours or after an extended period of inactivity, it may prompt for the duress PIN first.
- **Dead man's switch**: If the wallet is not accessed with the real PIN within a configurable period (default: 30 days), it auto-locks the hidden layer and presents only the decoy.

These heuristics are optional and configurable per user.

## Rationale

The multi-layer deniable container approach is chosen over steganography (hiding data in images/media) because it provides cryptographic indistinguishability rather than relying on the adversary's inability to detect statistical anomalies. Fixed container sizes prevent the adversary from inferring hidden data based on container size variations. The equivocal commitment scheme for on-chain deniability is based on established cryptographic constructions that provide information-theoretic deniability rather than computational deniability. The wallet integration ensures that deniability is not an afterthought but a default behavior.

## Security Considerations

- **Rubber hose cryptanalysis**: Deniable encryption cannot protect against an adversary who does not believe the decoy and continues applying coercion indefinitely. Mitigation: the decoy data must be plausible enough to satisfy the adversary. The decoy wallet should show regular, believable activity.
- **Multiple hidden layers**: The protocol supports only two layers (decoy + hidden) by default. Supporting more layers increases complexity and the risk of user error. Users can nest containers for additional layers at their own risk.
- **Backup consistency**: If a user backs up their wallet, the backup must include both layers. A backup that only contains the decoy layer is suspicious if the adversary knows the user made backups.
- **Forensic analysis**: Advanced forensic tools may detect the Pars wallet software and assume deniable features are in use. Mitigation: the wallet binary itself does not reveal whether deniability is enabled.
- **Behavioral analysis**: If a user always submits transactions from the hidden wallet during certain hours, timing analysis could reveal the pattern. Mitigation: PIP-0105 metadata protection and timing obfuscation.
- **Geofencing reliability**: IP-based geolocation can be spoofed or may be inaccurate. The duress detection heuristics should supplement, not replace, the user's judgment.

## References

- [PIP-0003: Coercion Resistance](./pip-0003-coercion-resistance.md)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [PIP-0105: Metadata Protection](./pip-0105-metadata-protection.md)
- [Deniable Encryption (Canetti et al.)](https://link.springer.com/chapter/10.1007/BFb0052229)
- [TrueCrypt/VeraCrypt Hidden Volumes](https://www.veracrypt.fr/en/Hidden%20Volume.html)
- [On Deniable Encryption and Sender-Equivocable Encryption](https://eprint.iacr.org/2014/680)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
