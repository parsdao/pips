---
pip: 7001
title: Town Hall Protocol for Pars
tags: [governance, town-hall, webrtc, privacy, communication]
description: Private audio/video rooms for vePARS holders with post-quantum encrypted signaling
author: Pars Network Team (@pars-network)
status: Draft
type: Standards Track
category: Governance
created: 2026-01-28
discussions-to: https://github.com/pars-network/pips/discussions/7001
order: 1
tier: governance
---

## Abstract

This PIP defines the Town Hall Protocol for Pars Network -- private audio/video rooms for DAO governance discussions. Town Hall rooms are gated by vePARS balance or Safe signer status, secured with post-quantum encrypted signaling, and designed to operate through network partitions via mesh fallback.

## Motivation

The Pars diaspora community needs a private, censorship-resistant communication layer for governance discussions:

1. **Centralized platforms fail** - Video conferencing services (Zoom, Google Meet) can be monitored, blocked, or shut down by nation-state actors
2. **Privacy is mandatory** - Governance discussions may contain sensitive information about community members in hostile jurisdictions
3. **Participation requires trust** - Speakers and participants must be verified as legitimate stakeholders without revealing personal identity
4. **Availability under pressure** - The system must function during internet blackouts and partial network partitions

Existing solutions lack:
- On-chain access gating tied to governance tokens
- Post-quantum encrypted signaling channels
- Mesh network fallback for censored regions
- Coercion-resistant anonymous participation

## Specification

### Town Hall Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           TOWN HALL PROTOCOL                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ACCESS LAYER                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  On-Chain Gating                                                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                           │  │
│  │  │  vePARS     │  │ Safe Signer │  │  ZK Proof   │                           │  │
│  │  │  Balance    │  │   Status    │  │ (anonymous) │                           │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                           │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│                                      ▼                                               │
│  SIGNALING LAYER (Post-Quantum Encrypted)                                           │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  ML-KEM Key Exchange ──► Encrypted SDP Offer/Answer ──► Secure ICE           │  │
│  │                                                                               │  │
│  │  Signaling via Pars Session daemon (PIP-0005)                                │  │
│  │  Fallback: Mesh gossip (PIP-0001)                                            │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│                                      ▼                                               │
│  MEDIA LAYER                                                                        │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  LiveKit SFU (Selective Forwarding Unit)                                      │  │
│  │  ┌─────────────────────────────┐  ┌─────────────────────────────┐            │  │
│  │  │  Presenter Mode             │  │  Participant Mode            │            │  │
│  │  │  - Video + Audio            │  │  - Audio + Text Chat         │            │  │
│  │  │  - Screen share             │  │  - Reactions                 │            │  │
│  │  │  - 1-5 designated speakers  │  │  - Hand raise queue          │            │  │
│  │  └─────────────────────────────┘  └─────────────────────────────┘            │  │
│  │                                                                               │  │
│  │  E2EE via Insertable Streams (WebRTC)                                        │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Room Types

| Type | Capacity | Media | Access |
|:-----|:---------|:------|:-------|
| **Town Hall** | Up to 1,000 | Presenter: video+audio, Participants: audio+chat | Minimum vePARS balance |
| **Committee** | Up to 25 | All participants: video+audio+chat | Safe signers or designated committee |
| **Open Forum** | Up to 500 | Audio only + text chat | Any vePARS holder |

### Access Gating

Access to Town Hall rooms is verified on-chain:

```solidity
interface ITownHallGating {
    /// @notice Check if an address can join a room
    /// @param roomId The room identifier
    /// @param participant The address requesting access
    /// @return allowed Whether access is granted
    function canJoin(bytes32 roomId, address participant) external view returns (bool);

    /// @notice Check access via ZK proof (anonymous mode)
    /// @param roomId The room identifier
    /// @param proof ZK proof of vePARS eligibility
    /// @param nullifier Nullifier to prevent replay
    /// @return allowed Whether access is granted
    function canJoinAnonymous(
        bytes32 roomId,
        bytes memory proof,
        bytes32 nullifier
    ) external view returns (bool);
}
```

Access requirements per room type:

| Room Type | Standard Access | Anonymous Access |
|:----------|:----------------|:-----------------|
| Town Hall | vePARS balance >= room minimum | ZK proof of sufficient vePARS |
| Committee | Safe signer or committee member | Not available (identity required) |
| Open Forum | Any vePARS balance > 0 | ZK proof of any vePARS |

### Participant Modes

**Presenter Mode**:
- Video and audio transmission
- Screen sharing capability
- Designated by room creator or moderator
- Maximum 5 concurrent presenters per room
- Presenter identity verified (not anonymous)

**Participant Mode**:
- Audio transmission (muted by default)
- Text chat
- Reactions and hand raise
- Can request promotion to presenter via hand raise queue
- Anonymous participation supported

### Post-Quantum Encrypted Signaling

All signaling messages are encrypted using ML-KEM (FIPS 203) as defined in PIP-0002:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PQ SIGNALING FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Participant A              Signaling Server              B     │
│       │                          │                         │     │
│       │  1. ML-KEM KeyGen()      │                         │     │
│       │     pk_a, sk_a           │                         │     │
│       │                          │                         │     │
│       │  2. Join(roomId, pk_a)   │                         │     │
│       │ ────────────────────────►│                         │     │
│       │                          │  3. Forward pk_a        │     │
│       │                          │ ───────────────────────►│     │
│       │                          │                         │     │
│       │                          │  4. Encap(pk_a) → ct,ss │     │
│       │                          │ ◄───────────────────────│     │
│       │  5. ct (ciphertext)      │                         │     │
│       │ ◄────────────────────────│                         │     │
│       │                          │                         │     │
│       │  6. Decap(sk_a, ct) → ss │                         │     │
│       │     Shared secret        │      Shared secret      │     │
│       │     established          │      established        │     │
│       │                          │                         │     │
│       │  7. AES-256-GCM encrypted SDP exchange             │     │
│       │ ◄───────────────────────────────────────────────►  │     │
│       │                          │                         │     │
└─────────────────────────────────────────────────────────────────┘
```

The signaling channel uses the Pars Session daemon (PIP-0005) as the transport layer. The SFU server never has access to the shared secret -- it only forwards encrypted media.

### Mesh Fallback

When internet connectivity is disrupted, Town Hall rooms degrade gracefully:

1. **Full connectivity**: LiveKit SFU handles all media routing
2. **Partial connectivity**: Participants with internet relay for those without
3. **Local mesh only**: Bluetooth/WiFi mesh (PIP-0001) enables local-area audio rooms
4. **Complete isolation**: Rooms operate in local mesh with reduced capacity

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEGRADATION MODES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FULL         SFU-routed video + audio          (up to 1,000)   │
│  PARTIAL      P2P mesh video + SFU audio        (up to 100)     │
│  LOCAL MESH   Bluetooth/WiFi audio only         (up to 20)      │
│  OFFLINE      Store-and-forward text only       (async)         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Recording Policy

- **Default**: No recording. Media streams are ephemeral.
- **Opt-in**: Recording can be enabled only with explicit on-chain consent from all participants.
- **Consent transaction**: Each participant signs a consent message (classical or PQ signature).
- **Recording storage**: Encrypted and stored on IPFS with access gated by room participants.
- **Indicator**: All participants see a visible recording indicator when active.

### Coercion Resistance

Anonymous participation mode ensures:

1. **Unlinkable identity**: Participant's vePARS address is not revealed to other participants or the SFU
2. **Voice anonymization**: Optional real-time voice modification to prevent speaker identification
3. **Text-only mode**: Participants can choose text-only to avoid any audio fingerprinting
4. **Deniable participation**: No on-chain record of room attendance (access check is stateless)

### Integration with Pars Session Daemon

Town Hall rooms integrate with the Pars Session daemon (PIP-0005):

- Room creation and discovery via session gossip protocol
- Signaling messages routed through encrypted session channels
- Room metadata stored in session CRDT state
- Offline room invitations via session message queue

## Privacy Guarantees

1. **No metadata leakage**: Room participation is not recorded on-chain
2. **Forward secrecy**: ML-KEM key pairs are ephemeral per session
3. **Transport privacy**: All signaling through Pars Session (no cleartext metadata)
4. **SFU isolation**: SFU handles encrypted media only; cannot decrypt content
5. **IP protection**: Participants connect via Pars mesh; real IPs not exposed to SFU

## Security Considerations

### SFU Compromise

- Media is end-to-end encrypted via Insertable Streams; SFU compromise does not reveal content
- Signaling is PQ-encrypted; SFU cannot forge or modify offers/answers
- Room access is verified on-chain; SFU cannot grant unauthorized access

### Denial of Service

- Rate limiting on room creation (one room per vePARS holder per hour)
- Participant limits enforced by room type
- SFU can be geo-distributed for resilience
- Mesh fallback ensures local availability

### Quantum Threats

- All signaling encrypted with ML-KEM-768 (NIST Level 3)
- Media encryption uses AES-256-GCM (quantum-resistant symmetric)
- Identity verification via ML-DSA when non-anonymous

### Network Attacks

- Mesh fallback prevents complete denial of service during internet blackouts
- Gossip protocol resists selective message dropping
- Multiple SFU nodes prevent single point of failure

## References

- [PIP-0001: Mesh Network](./pip-0001-mesh-network.md)
- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)
- [PIP-0003: Coercion Resistance](./pip-0003-coercion-resistance.md)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [LiveKit Documentation](https://docs.livekit.io)
- [WebRTC Insertable Streams](https://w3c.github.io/webrtc-encoded-transform/)
- [FIPS 203: ML-KEM](https://csrc.nist.gov/pubs/fips/203/final)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
