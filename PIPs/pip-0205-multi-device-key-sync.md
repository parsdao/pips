---
pip: 205
title: "Multi-Device Key Sync"
description: "Secure key synchronization across multiple user devices on Pars Network"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Identity
created: 2026-01-23
tags: [identity, keys, sync, multi-device, encryption]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a protocol for securely synchronizing cryptographic keys across a user's devices. The protocol uses device-to-device encrypted channels, requires explicit authorization of each new device, and ensures that compromise of any single device does not expose the full key hierarchy. No central server stores or relays key material.

## Motivation

Diaspora members use multiple devices daily -- a phone for messaging, a laptop for governance, a tablet for media. Without key sync:

1. **Fragmented identity** -- each device has a separate identity, confusing contacts
2. **Missed messages** -- session messages only reach the device they were sent to
3. **Repeated setup** -- users must re-establish trust with every new device
4. **Backup fragility** -- losing one device loses access to that device's keys and data

A secure sync protocol unifies the user experience across devices without introducing a central point of compromise.

## Specification

### Device Authorization

```
Primary Device (P)                New Device (N)
      │                                │
      │  1. N displays QR code with:   │
      │     - Device public key        │
      │     - One-time nonce           │
      │                                │
      │  2. P scans QR code            │
      │     Verifies nonce out-of-band │
      │                                │
      │  3. P ──► N: Encrypted device  │
      │     authorization token        │
      │     (ML-KEM encapsulated)      │
      │                                │
      │  4. N ──► P: Signed ack        │
      │     (ML-DSA signature)         │
      │                                │
      │  5. P publishes device list    │
      │     update to identity anchor  │
      │                                │
```

### Key Sync Envelope

```go
type KeySyncEnvelope struct {
    SenderDeviceID   [32]byte
    ReceiverDeviceID [32]byte
    EncryptedPayload []byte    // ML-KEM + AES-256-GCM encrypted
    Nonce            [24]byte
    Signature        []byte    // ML-DSA signature from sender device
    Timestamp        int64
    SequenceNumber   uint64
}

type KeySyncPayload struct {
    KeyType    string   // "session", "signing", "evm"
    KeyData    []byte   // Encrypted private key material
    Metadata   []byte   // Key usage policy, expiry
    DeviceList []DeviceInfo // Current authorized device list
}
```

### Sync Protocol

1. **Initial sync**: Primary device encrypts key material to each authorized device's public key individually
2. **Incremental sync**: When keys are rotated, only the delta is encrypted and distributed
3. **Conflict resolution**: Highest sequence number wins; ties broken by device priority (primary > secondary)
4. **Revocation**: Removing a device triggers key rotation for all remaining devices

### Device Hierarchy

| Role | Capabilities | Limit |
|:-----|:------------|:------|
| Primary | Full key access, authorize/revoke devices | 1 per identity |
| Secondary | Full key access, cannot authorize devices | Up to 4 |
| View-only | Read messages, cannot sign transactions | Up to 8 |

### Transport

Key sync messages are transmitted over the Pars session layer (PIP-0005). Devices discover each other via the DHT using a shared device-group identifier derived from the identity master key.

## Rationale

- **Device-to-device encryption** means no server or relay sees key material
- **QR-based authorization** provides a simple, verifiable out-of-band channel
- **Per-device encryption** ensures that intercepting sync messages for one device does not compromise others
- **Device hierarchy** limits blast radius -- view-only devices cannot authorize transactions even if compromised
- **Session-layer transport** reuses existing private infrastructure

## Security Considerations

- **Primary device compromise**: Attacker gains full key access and can authorize rogue devices; mitigated by requiring biometric auth (PIP-0204) for device authorization
- **MITM during pairing**: QR code includes a nonce that must be verified visually or verbally; automated MITM is detectable
- **Stale device revocation**: Users MUST revoke lost/stolen devices immediately; revocation triggers automatic key rotation
- **Metadata leakage**: Device sync traffic patterns could reveal device count; sync messages should use padding and cover traffic
- **Key material at rest**: Synced keys MUST be stored in device secure enclave or encrypted with device-local key

## References

- [Signal Multi-Device Protocol](https://signal.org/docs/)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [PIP-0200: Decentralized Identity Standard](./pip-0200-decentralized-identity-standard.md)
- [PIP-0204: Biometric Authentication](./pip-0204-biometric-authentication.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
