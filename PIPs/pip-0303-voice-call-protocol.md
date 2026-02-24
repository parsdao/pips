---
pip: 303
title: "Voice Call Protocol"
description: "Decentralized encrypted voice calls over Pars Network"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Communication
created: 2026-01-23
tags: [communication, voice, calls, webrtc, encryption]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a decentralized encrypted voice call protocol for Pars Network. Voice calls are established over the session layer using WebRTC with post-quantum key exchange, relayed through the onion network when direct peer-to-peer connection is not possible. The protocol supports one-to-one calls and small group calls (up to 8 participants) with end-to-end encryption.

## Motivation

Voice communication is irreplaceable for diaspora families and communities:

1. **Emotional connection** -- text cannot convey tone, emotion, and nuance the way voice can
2. **Accessibility** -- older family members and non-literate community members depend on voice
3. **Real-time coordination** -- crisis response and community organizing require synchronous communication
4. **Censorship of VoIP** -- many countries block or degrade commercial VoIP services; a decentralized alternative is essential

## Specification

### Call Setup

```
Caller (Alice)                          Callee (Bob)
      │                                      │
      │  1. Session message: CallOffer        │
      │     {callId, sdpOffer, pqKeyShare}   │
      │ ────────────────────────────────────► │
      │                                      │
      │                                      │  2. User accepts/rejects
      │                                      │
      │  3. Session message: CallAnswer       │
      │     {callId, sdpAnswer, pqKeyShare}  │
      │ ◄──────────────────────────────────── │
      │                                      │
      │  4. ICE candidates exchanged          │
      │     via session messages              │
      │ ◄───────────────────────────────────► │
      │                                      │
      │  5. DTLS-SRTP + PQ key established   │
      │     Voice stream begins              │
      │ ◄═══════════════════════════════════► │
```

### Audio Parameters

| Parameter | Value | Notes |
|:----------|:------|:------|
| Codec | Opus | Adaptive bitrate |
| Sample rate | 48 kHz | High quality voice |
| Bitrate | 6-128 kbps | Adaptive to network conditions |
| Frame size | 20 ms | Low latency |
| Encryption | SRTP + AES-256-GCM | PQ key exchange |
| Max latency | 300 ms | One-way target |

### Relay Architecture

When direct P2P connection fails (NAT, firewall, censorship):

```
Alice ──► Relay Node A ──► Relay Node B ──► Bob
          (onion hop 1)    (onion hop 2)
```

Relay nodes see only encrypted SRTP packets. They cannot:
- Identify the caller or callee
- Decode the audio content
- Determine call duration (cover traffic masks idle periods)

### Group Calls

Group calls use a star topology with a mixing bridge:

```go
type GroupCall struct {
    CallID       [16]byte
    Participants []SessionID
    MaxSize      uint8        // Maximum 8 participants
    MixerNode    SessionID    // Elected mixer (rotates)
    Epoch        uint64       // Key rotation epoch
    GroupKey     []byte       // Derived from MLS group state
}
```

Each participant sends their encrypted audio stream to the mixer node. The mixer combines streams and redistributes to all participants. The mixer cannot decrypt audio -- it performs encrypted mixing using homomorphic properties of the encryption scheme.

### Quality Adaptation

The client automatically adapts quality based on measured bandwidth and packet loss, ranging from ultra-low (6 kbps, 60ms frames with FEC) for extreme bandwidth constraints to HD (128 kbps, 20ms frames) for excellent connectivity.

### Call Metadata Protection

| Metadata | Protection |
|:---------|:----------|
| Caller identity | Onion routing hides IP |
| Callee identity | Call setup via session layer |
| Call duration | Cover traffic during and after call |
| Call frequency | Session message indistinguishable from other messages |

## Rationale

- **WebRTC foundation** provides proven, well-optimized real-time media transport
- **PQ key exchange** layer on top of DTLS provides quantum resistance
- **Onion-routed relays** provide the same metadata protection as session messages
- **Opus codec** provides excellent quality across a wide range of bitrates, critical for bandwidth-constrained users
- **Small group limit** (8) ensures manageable latency and bandwidth requirements without centralized infrastructure

## Security Considerations

- **Relay node eavesdropping**: SRTP encryption prevents content access; relay nodes see only packet timing and sizes
- **Call interception**: PQ key exchange prevents future quantum decryption of recorded calls
- **Voice fingerprinting**: Voice activity detection padding mitigates identification from encrypted audio characteristics
- **Denial of service**: Requiring an established session before call initiation prevents flooding
- **Mixer compromise**: A compromised mixer cannot decrypt content; mixer rotation limits disruption window

## References

- [WebRTC Specification](https://www.w3.org/TR/webrtc/)
- [Opus Audio Codec (RFC 6716)](https://www.rfc-editor.org/rfc/rfc6716)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [PIP-0300: Encrypted Messaging Protocol](./pip-0300-encrypted-messaging-protocol.md)
- [PIP-0301: Group Messaging Standard](./pip-0301-group-messaging-standard.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
