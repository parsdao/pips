---
pip: 2
title: Post-Quantum Encryption - Mandatory Security
tags: [crypto, pq, mlkem, mldsa, security]
description: Defines mandatory post-quantum encryption for all Pars Network communications
author: Pars Network Team (@pars-network)
status: Draft
type: Standards Track
category: Crypto
created: 2026-01-23
discussions-to: https://github.com/pars-network/pips/discussions/3
order: 2
tier: core
---

## Abstract

This PIP mandates post-quantum (PQ) cryptography as the **default and only option** for all Pars Network communications. PQ encryption cannot be disabled, downgraded, or bypassed. This ensures long-term security against both current and future quantum computer attacks.

## Motivation

### The Quantum Threat

Quantum computers threaten current cryptographic systems:

| Algorithm | Type | Quantum Status |
|:----------|:-----|:---------------|
| RSA-2048 | Asymmetric | **BROKEN** by Shor's algorithm |
| ECDSA/P-256 | Asymmetric | **BROKEN** by Shor's algorithm |
| ECDH/X25519 | Key Exchange | **BROKEN** by Shor's algorithm |
| AES-256 | Symmetric | Weakened (Grover's), still secure |

### Harvest Now, Decrypt Later

Nation-state adversaries are **already collecting** encrypted traffic:

```
┌─────────────────────────────────────────────────────────────────┐
│                HARVEST NOW, DECRYPT LATER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  2024: Adversary captures encrypted communications              │
│        ┌─────────────────────────────────────────────────────┐  │
│        │ Encrypted messages stored in adversary database      │  │
│        │ Cannot decrypt today (no quantum computer)           │  │
│        └─────────────────────────────────────────────────────┘  │
│                                                                  │
│  2030+: Quantum computer becomes available                      │
│        ┌─────────────────────────────────────────────────────┐  │
│        │ Run Shor's algorithm on stored traffic               │  │
│        │ Decrypt all historical communications                │  │
│        │ Identify participants, relationships, content        │  │
│        └─────────────────────────────────────────────────────┘  │
│                                                                  │
│  IMPACT: Even if regime falls, historical records expose        │
│          participants to persecution, blackmail, harm           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why Mandatory?

Users cannot be expected to:
1. Understand quantum computing threats
2. Make informed cryptographic choices
3. Remember to enable security features

**Security must be the default, not an option.**

## Specification

### Cryptographic Primitives

Pars Network uses NIST-approved post-quantum standards:

| Algorithm | Standard | Purpose | Security Level |
|:----------|:---------|:--------|:---------------|
| **ML-KEM** | FIPS 203 | Key Encapsulation | 128/192/256 bit |
| **ML-DSA** | FIPS 204 | Digital Signatures | 128/192/256 bit |
| **SLH-DSA** | FIPS 205 | Stateless Hash Signatures | 128/192/256 bit |

### ML-KEM (Kyber) - Key Encapsulation

```
┌─────────────────────────────────────────────────────────────────┐
│                    ML-KEM KEY EXCHANGE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Alice                                           Bob             │
│    │                                              │              │
│    │  1. Generate keypair                         │              │
│    │     (pk_A, sk_A) = KeyGen()                 │              │
│    │                                              │              │
│    │  2. Send public key                          │              │
│    │ ────────────── pk_A ─────────────────────►  │              │
│    │                                              │              │
│    │                        3. Encapsulate        │              │
│    │                           (ct, ss) = Encap(pk_A)            │
│    │                                              │              │
│    │  4. Receive ciphertext                       │              │
│    │ ◄────────────── ct ─────────────────────────│              │
│    │                                              │              │
│    │  5. Decapsulate                              │              │
│    │     ss = Decap(sk_A, ct)                    │              │
│    │                                              │              │
│    │  Both parties now share secret 'ss'         │              │
│    │  Use ss for symmetric encryption            │              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### ML-KEM Parameters

| Parameter Set | Public Key | Ciphertext | Shared Secret | Security |
|:--------------|:-----------|:-----------|:--------------|:---------|
| ML-KEM-512 | 800 bytes | 768 bytes | 32 bytes | NIST Level 1 |
| ML-KEM-768 | 1184 bytes | 1088 bytes | 32 bytes | NIST Level 3 |
| **ML-KEM-1024** | 1568 bytes | 1568 bytes | 32 bytes | **NIST Level 5** |

**Pars Default**: ML-KEM-1024 (maximum security)

### ML-DSA (Dilithium) - Digital Signatures

```
┌─────────────────────────────────────────────────────────────────┐
│                    ML-DSA SIGNATURE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Signer                                          Verifier        │
│    │                                              │              │
│    │  1. Generate keypair                         │              │
│    │     (pk, sk) = KeyGen()                     │              │
│    │                                              │              │
│    │  2. Sign message                             │              │
│    │     sig = Sign(sk, message)                 │              │
│    │                                              │              │
│    │  3. Send message + signature                 │              │
│    │ ──────── (message, sig) ─────────────────►  │              │
│    │                                              │              │
│    │                        4. Verify             │              │
│    │                           Verify(pk, message, sig)          │
│    │                           Returns true/false │              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### ML-DSA Parameters

| Parameter Set | Public Key | Signature | Security |
|:--------------|:-----------|:----------|:---------|
| ML-DSA-44 | 1312 bytes | 2420 bytes | NIST Level 2 |
| ML-DSA-65 | 1952 bytes | 3293 bytes | NIST Level 3 |
| **ML-DSA-87** | 2592 bytes | 4595 bytes | **NIST Level 5** |

**Pars Default**: ML-DSA-87 (maximum security)

### SLH-DSA (SPHINCS+) - Hash-Based Signatures

Used for:
- Long-term key backup
- Root certificates
- Recovery signatures

| Parameter Set | Public Key | Signature | Security |
|:--------------|:-----------|:----------|:---------|
| SLH-DSA-128s | 32 bytes | 7856 bytes | NIST Level 1 |
| SLH-DSA-192s | 48 bytes | 16224 bytes | NIST Level 3 |
| **SLH-DSA-256s** | 64 bytes | 29792 bytes | **NIST Level 5** |

### Hybrid Mode (Defense in Depth)

For maximum security, Pars uses hybrid encryption combining classical and PQ:

```
┌─────────────────────────────────────────────────────────────────┐
│                    HYBRID ENCRYPTION                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Shared Secret = KDF(X25519_ss || ML-KEM_ss)                    │
│                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────┐       │
│  │   Classical (X25519)    │  │   Post-Quantum (ML-KEM) │       │
│  │                         │  │                         │       │
│  │  If PQ is broken:       │  │  If classical is broken:│       │
│  │  Still protected by     │  │  Still protected by     │       │
│  │  X25519                  │  │  ML-KEM                  │       │
│  └────────────┬────────────┘  └────────────┬────────────┘       │
│               │                             │                    │
│               └──────────┬──────────────────┘                    │
│                          │                                       │
│                   ┌──────▼──────┐                                │
│                   │    KDF      │                                │
│                   │  (HKDF)     │                                │
│                   └──────┬──────┘                                │
│                          │                                       │
│                   ┌──────▼──────┐                                │
│                   │   Shared    │                                │
│                   │   Secret    │                                │
│                   └─────────────┘                                │
│                                                                  │
│  Both algorithms must be broken to compromise the connection    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Session Encryption

All session messages use:

```go
// Session encryption structure
type EncryptedMessage struct {
    // Key encapsulation (hybrid)
    X25519Ephemeral  [32]byte    // Classical ephemeral public key
    MLKEMCiphertext  []byte      // ML-KEM-1024 ciphertext

    // Symmetric encryption
    Nonce            [24]byte    // XChaCha20-Poly1305 nonce
    Ciphertext       []byte      // Encrypted payload
    Tag              [16]byte    // Authentication tag
}

// Encrypt message
func EncryptMessage(recipientPK *HybridPublicKey, plaintext []byte) (*EncryptedMessage, error) {
    // 1. Classical key exchange
    x25519Ephemeral, x25519SS := x25519.GenerateEphemeral(recipientPK.X25519)

    // 2. Post-quantum key encapsulation
    mlkemCT, mlkemSS := mlkem.Encapsulate(recipientPK.MLKEM)

    // 3. Derive shared secret
    sharedSecret := hkdf.Derive(x25519SS, mlkemSS, "pars-session-v1")

    // 4. Symmetric encryption
    nonce := randomNonce()
    ciphertext, tag := xchacha20poly1305.Seal(sharedSecret, nonce, plaintext)

    return &EncryptedMessage{
        X25519Ephemeral: x25519Ephemeral,
        MLKEMCiphertext: mlkemCT,
        Nonce:           nonce,
        Ciphertext:      ciphertext,
        Tag:             tag,
    }, nil
}
```

### Forward Secrecy

Double Ratchet protocol with PQ keys:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PQ DOUBLE RATCHET                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Each message uses new ephemeral keys:                          │
│                                                                  │
│  Message 1: (ephemeral_pk_1, ct_1) → derive key_1              │
│  Message 2: (ephemeral_pk_2, ct_2) → derive key_2              │
│  Message 3: (ephemeral_pk_3, ct_3) → derive key_3              │
│  ...                                                             │
│                                                                  │
│  Properties:                                                     │
│  - Compromising key_N doesn't reveal key_N-1 or key_N+1        │
│  - Past messages protected (backward secrecy)                   │
│  - Future messages protected (forward secrecy)                  │
│                                                                  │
│  Implementation:                                                 │
│  - Ratchet step triggers on each DH exchange                   │
│  - KDF chain for message keys                                   │
│  - ML-KEM ephemeral keys generated per ratchet                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### No Downgrade Attacks

```go
// MANDATORY: PQ encryption cannot be disabled
const (
    MinKeySize    = MLKEMLevel5  // Cannot use smaller keys
    MinSigSize    = MLDSALevel5  // Cannot use smaller signatures
    RequireHybrid = true         // Must use hybrid mode
)

// Reject connections that don't meet requirements
func ValidateConnection(params *ConnectionParams) error {
    if params.KEMLevel < MinKeySize {
        return ErrInsufficientSecurity // Connection rejected
    }
    if params.SigLevel < MinSigSize {
        return ErrInsufficientSecurity // Connection rejected
    }
    if RequireHybrid && !params.HybridMode {
        return ErrInsufficientSecurity // Connection rejected
    }
    return nil
}
```

### Precompile Interface

Smart contracts can access PQ crypto via precompiles:

```solidity
// ML-KEM Precompile (0x0601)
interface IMLKEM {
    /// @notice Generate ML-KEM keypair
    /// @param parameterSet 2=ML-KEM-512, 3=ML-KEM-768, 5=ML-KEM-1024
    function keyGen(uint8 parameterSet) external returns (
        bytes memory publicKey,
        bytes memory secretKey
    );

    /// @notice Encapsulate shared secret
    function encapsulate(bytes memory publicKey) external returns (
        bytes memory ciphertext,
        bytes memory sharedSecret
    );

    /// @notice Decapsulate shared secret
    function decapsulate(
        bytes memory secretKey,
        bytes memory ciphertext
    ) external returns (bytes memory sharedSecret);
}

// ML-DSA Precompile (0x0602)
interface IMLDSA {
    /// @notice Generate ML-DSA keypair
    /// @param mode 2=ML-DSA-44, 3=ML-DSA-65, 5=ML-DSA-87
    function keyGen(uint8 mode) external returns (
        bytes memory publicKey,
        bytes memory secretKey
    );

    /// @notice Sign message
    function sign(
        bytes memory secretKey,
        bytes memory message
    ) external returns (bytes memory signature);

    /// @notice Verify signature
    function verify(
        bytes memory publicKey,
        bytes memory message,
        bytes memory signature
    ) external returns (bool valid);
}
```

## Security Considerations

### Key Sizes

PQ algorithms have larger keys/signatures than classical:

| Operation | Classical | Post-Quantum | Overhead |
|:----------|:----------|:-------------|:---------|
| Key Exchange PK | 32 bytes (X25519) | 1568 bytes (ML-KEM-1024) | 49x |
| Signature | 64 bytes (Ed25519) | 4595 bytes (ML-DSA-87) | 72x |

This is acceptable because:
1. Security is non-negotiable
2. Modern networks handle larger payloads
3. Size overhead amortizes over session lifetime

### Performance

| Operation | Time (ms) | Notes |
|:----------|:----------|:------|
| ML-KEM KeyGen | ~0.1 | Once per session |
| ML-KEM Encap | ~0.1 | Per key exchange |
| ML-KEM Decap | ~0.1 | Per key exchange |
| ML-DSA Sign | ~0.5 | Per message (optional) |
| ML-DSA Verify | ~0.2 | Per message |

Performance is acceptable for real-time communications.

### Side-Channel Resistance

All implementations must be:
- Constant-time (no timing leaks)
- Power-analysis resistant
- Cache-timing resistant

Use reference implementations from:
- [liboqs](https://github.com/open-quantum-safe/liboqs)
- [pqcrypto](https://github.com/rustpq/pqcrypto)

## Implementation

### Library Integration

```go
import (
    "github.com/luxfi/node/crypto/mlkem"
    "github.com/luxfi/node/crypto/mldsa"
    "github.com/luxfi/node/crypto/slhdsa"
)

// Generate identity keypair
func GenerateIdentity() (*Identity, error) {
    // PQ signature key (for authentication)
    sigPK, sigSK, err := mldsa.GenerateKey(mldsa.Mode5)
    if err != nil {
        return nil, err
    }

    // PQ KEM key (for encryption)
    kemPK, kemSK, err := mlkem.GenerateKey(mlkem.Level5)
    if err != nil {
        return nil, err
    }

    // Classical keys (for hybrid)
    x25519PK, x25519SK := x25519.GenerateKey()
    ed25519PK, ed25519SK := ed25519.GenerateKey()

    return &Identity{
        MLDSA:   KeyPair{Public: sigPK, Secret: sigSK},
        MLKEM:   KeyPair{Public: kemPK, Secret: kemSK},
        X25519:  KeyPair{Public: x25519PK, Secret: x25519SK},
        Ed25519: KeyPair{Public: ed25519PK, Secret: ed25519SK},
    }, nil
}
```

## References

- [NIST FIPS 203: ML-KEM](https://csrc.nist.gov/pubs/fips/203/final)
- [NIST FIPS 204: ML-DSA](https://csrc.nist.gov/pubs/fips/204/final)
- [NIST FIPS 205: SLH-DSA](https://csrc.nist.gov/pubs/fips/205/final)
- [PIP-0000: Network Architecture](./pip-0000-network-architecture.md)
- [PIP-0003: Coercion Resistance](./pip-0003-coercion-resistance.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
