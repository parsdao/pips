---
pip: 106
title: "Threshold Decryption"
description: "Threshold cryptography for distributed secret management and key escrow"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Privacy
created: 2026-01-23
tags: [threshold-cryptography, secret-sharing, key-management, distributed]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a threshold decryption framework for the Pars Network. A secret (such as a decryption key, signing key, or data blob) is split into `n` shares distributed among a committee, where any `t` shares are sufficient to reconstruct the secret but `t-1` shares reveal nothing. The framework provides distributed key generation (DKG), threshold decryption, threshold signing, and proactive secret sharing (resharing to a new committee without reconstructing the secret). This is the cryptographic foundation used by the encrypted mempool (PIP-0022), encrypted voting (PIP-0012), and encrypted smart contracts (PIP-0103).

## Motivation

Many privacy-preserving protocols on the Pars Network require a secret that no single party should know. A single decryption key holder is a single point of failure and a target for coercion. Threshold cryptography distributes trust: no individual can decrypt data or sign messages alone, and the system tolerates up to `t-1` compromised participants. For the Pars diaspora, this means that no single validator, committee member, or developer can be coerced into revealing encrypted data, because no individual possesses sufficient key material.

## Specification

### Distributed Key Generation (DKG)

The DKG protocol generates a shared public key and individual secret shares without any party ever seeing the full secret:

1. Each of `n` participants generates a random polynomial of degree `t-1` and publishes commitments to its coefficients.
2. Each participant sends encrypted evaluations of their polynomial to every other participant.
3. Each participant verifies received evaluations against the published commitments.
4. Each participant combines their received evaluations to compute their secret share.
5. The shared public key is computed from the published commitments.

The protocol is non-interactive after the initial commitment round and tolerates up to `t-1` malicious participants.

### Threshold Decryption

Given a ciphertext encrypted under the shared public key:

1. Each committee member computes a partial decryption using their secret share.
2. Each partial decryption includes a proof of correctness (DLEQ proof).
3. Any party collecting `t` valid partial decryptions can combine them to produce the plaintext.
4. Fewer than `t` partial decryptions reveal nothing about the plaintext.

### Threshold Signing

The committee can produce a signature on a message without reconstructing the signing key:

1. A signing request is broadcast with the message to be signed.
2. Each committee member produces a partial signature using their share.
3. Any `t` partial signatures combine into a valid signature under the shared public key.

### Proactive Secret Sharing

To rotate the committee without changing the public key:

1. The current committee performs a resharing protocol, generating new shares for the new committee.
2. Each current member distributes encrypted share fragments to new members.
3. New members combine received fragments to compute their new shares.
4. Old shares become invalid after resharing completes.

This enables committee rotation (PIP-0028) without requiring data re-encryption.

### Committee Parameters

| Use Case | Committee Size (n) | Threshold (t) | Rotation Period |
|:---------|:-------------------|:---------------|:----------------|
| Mempool encryption (PIP-0022) | 21 | 14 | 100 blocks |
| Voting decryption (PIP-0012) | 15 | 10 | Per election |
| FHE key management (PIP-0103) | 21 | 14 | 1 epoch |
| Bridge committee (PIP-0021) | 21 | 14 | 24 hours |

### On-Chain Coordination

Committee membership and DKG ceremony coordination occur through an on-chain registry:

```solidity
interface IThresholdCommittee {
    /// Register as a committee candidate
    function register(bytes calldata publicKeyShare) external;

    /// Submit DKG round 1 commitment
    function submitCommitment(bytes32 commitment) external;

    /// Submit DKG round 2 encrypted shares
    function submitShares(bytes[] calldata encryptedShares) external;

    /// Submit a partial decryption for a pending request
    function submitPartialDecryption(
        bytes32 requestId,
        bytes calldata partialDecryption,
        bytes calldata proof
    ) external;
}
```

## Rationale

Feldman's Verifiable Secret Sharing (VSS) is used as the DKG foundation because it provides verifiable commitments that allow participants to detect malicious behavior during key generation. DLEQ proofs on partial decryptions prevent committee members from submitting invalid shares to sabotage decryption. Proactive secret sharing is essential for the Pars model where committee membership changes frequently due to validator rotation. Without proactive resharing, every rotation would require re-encrypting all data under a new key, which is impractical for large-scale encrypted state.

## Security Considerations

- **Threshold compromise**: An adversary who compromises `t` committee members can decrypt any ciphertext. Mitigation: `t` is set to >2/3 of the committee, requiring a supermajority compromise.
- **DKG manipulation**: A malicious participant could contribute biased randomness during DKG. Mitigation: commitment verification ensures all contributions are consistent.
- **Liveness**: If fewer than `t` members are online, decryption requests cannot be fulfilled. Mitigation: committee size is large enough to tolerate temporary unavailability, and members are incentivized via staking rewards.
- **Share storage**: Committee members must securely store their secret shares. Loss of a share reduces the effective threshold. Mitigation: shares are backed up using PIP-0003 coercion-resistant storage.
- **Quantum threat**: Current DKG relies on discrete log assumptions. Post-quantum threshold schemes are being researched and will be adopted per PIP-0107 timeline.

## References

- [PIP-0012: Encrypted Voting](./pip-0012-encrypted-voting.md)
- [PIP-0022: Mempool Encryption](./pip-0022-mempool-encryption.md)
- [PIP-0028: Validator Rotation Protocol](./pip-0028-validator-rotation-protocol.md)
- [PIP-0103: Encrypted Smart Contracts](./pip-0103-encrypted-smart-contracts.md)
- [Feldman's Verifiable Secret Sharing](https://www.cs.umd.edu/~gasarch/TOPICS/secretsharing/feldmanVSS.pdf)
- [Proactive Secret Sharing](https://eprint.iacr.org/2019/017)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
