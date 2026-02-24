---
pip: 107
title: "Post-Quantum Key Exchange"
description: "Lattice-based key exchange protocol for quantum-resistant secure communication"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Privacy
created: 2026-01-23
tags: [post-quantum, key-exchange, lattice, ml-kem, cryptography]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a post-quantum key exchange protocol for the Pars Network based on ML-KEM (Module Lattice Key Encapsulation Mechanism, formerly CRYSTALS-Kyber), the NIST-selected standard for post-quantum key encapsulation. The protocol replaces ECDH-based key exchanges throughout the Pars stack (peer-to-peer connections, stealth addresses, Session protocol key agreements) with a hybrid scheme that combines ML-KEM with X25519, providing security against both classical and quantum adversaries. This ensures that data encrypted today remains secure even if large-scale quantum computers become available in the future.

## Motivation

Quantum computers capable of running Shor's algorithm will break all currently deployed public-key cryptography based on integer factorization (RSA) and discrete logarithms (ECDH, ECDSA). While large-scale quantum computers do not yet exist, a "harvest now, decrypt later" attack is already practical: an adversary records encrypted communications today and decrypts them once quantum computers become available. For the Pars Network, this threat is particularly severe: political communications and financial transactions encrypted today could be decrypted by authoritarian regimes in 10-20 years, endangering users retroactively. Post-quantum key exchange ensures that today's communications remain secure against future quantum attacks.

## Specification

### Hybrid Key Exchange

The Pars Network uses a hybrid key exchange combining classical and post-quantum algorithms:

```
HybridKeyExchange {
    classical:   X25519          // 128-bit classical security
    postQuantum: ML-KEM-768      // NIST Security Level 3 (192-bit quantum)
    combiner:    HKDF-SHA256     // Key derivation function
}
```

The shared secret is derived by combining both key exchange results:

```
classicalSecret = X25519(privateKey, peerPublicKey)
pqSecret = ML-KEM-768.Decaps(pqCiphertext, pqPrivateKey)
sharedSecret = HKDF(classicalSecret || pqSecret, salt, info)
```

This hybrid approach ensures security even if one of the two schemes is broken.

### ML-KEM Parameters

The protocol uses ML-KEM-768 (NIST Security Level 3):

| Parameter | Value |
|:----------|:------|
| Module dimension | 3 |
| Polynomial degree | 256 |
| Modulus | 3329 |
| Public key size | 1,184 bytes |
| Ciphertext size | 1,088 bytes |
| Shared secret size | 32 bytes |

### Protocol Integration Points

The hybrid key exchange replaces ECDH in the following protocols:

1. **Peer-to-peer transport (Noise protocol)**: The Noise NK handshake pattern uses hybrid key exchange for establishing encrypted peer connections.
2. **Stealth addresses (PIP-0101)**: Ephemeral key derivation uses a hybrid scheme where the sender computes both an X25519 and ML-KEM shared secret with the recipient's meta-address.
3. **Session protocol (PIP-0005)**: Group key agreement uses a tree-based hybrid key exchange (TreeKEM with ML-KEM leaves).
4. **TLS connections**: External-facing HTTPS endpoints support hybrid TLS 1.3 with ML-KEM.

### Key Sizes

Post-quantum keys are larger than classical keys:

| Key Type | Classical (X25519) | Hybrid (X25519 + ML-KEM-768) |
|:---------|:-------------------|:-----------------------------|
| Public key | 32 bytes | 1,216 bytes |
| Private key | 32 bytes | 2,432 bytes |
| Ciphertext | 32 bytes | 1,120 bytes |

The increased key sizes impact storage and bandwidth. Peer connections amortize the overhead across many messages. Stealth address transactions include the larger ephemeral public key.

### Migration Plan

1. **Phase 1 (current)**: Hybrid mode -- both classical and PQ keys are used. Nodes must support hybrid key exchange.
2. **Phase 2 (2028 target)**: Classical-only mode deprecated. New connections require hybrid key exchange.
3. **Phase 3 (2030 target)**: Classical keys removed entirely. Pure ML-KEM key exchange.

### Signature Algorithm

Alongside key exchange, the protocol mandates ML-DSA-65 (formerly CRYSTALS-Dilithium) for digital signatures, as specified in PIP-0002. This PIP focuses specifically on the key exchange component.

## Rationale

ML-KEM-768 (NIST Security Level 3) is chosen because it provides a strong security margin (192-bit quantum security) while maintaining reasonable key and ciphertext sizes. ML-KEM-512 (Level 1) would be smaller but offers only 128-bit quantum security, which may be insufficient for long-term data protection. ML-KEM-1024 (Level 5) provides maximum security but doubles key sizes, which is impractical for bandwidth-constrained mesh network use cases.

The hybrid approach is mandated because ML-KEM is relatively new and has not undergone the decades of cryptanalysis that X25519 has. By combining both, the system is secure as long as either scheme remains unbroken.

## Security Considerations

- **Implementation correctness**: Post-quantum cryptography implementations are newer and less audited than classical ones. Mitigation: the Pars Network uses NIST-validated ML-KEM implementations from well-audited libraries.
- **Side-channel attacks**: Lattice-based schemes may be vulnerable to timing and power analysis attacks. Mitigation: constant-time implementations are required.
- **Key size impact**: Larger keys increase bandwidth usage by approximately 3x for key exchange phases. This is acceptable for connection establishment (amortized) but increases stealth address transaction sizes.
- **Algorithm agility**: If ML-KEM is broken, the network must be able to switch to an alternative PQ scheme. The hybrid combiner design allows replacing the PQ component without protocol redesign.
- **Harvest-now-decrypt-later**: The primary motivation for this PIP. Without post-quantum key exchange, all current communications are vulnerable to future quantum decryption.

## References

- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [PIP-0101: Stealth Addresses](./pip-0101-stealth-addresses.md)
- [NIST FIPS 203: ML-KEM](https://csrc.nist.gov/pubs/fips/203/final)
- [Hybrid Key Exchange in TLS 1.3](https://datatracker.ietf.org/doc/draft-ietf-tls-hybrid-design/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
