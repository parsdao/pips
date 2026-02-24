---
pip: 304
title: "Broadcast Channel Standard"
description: "One-to-many broadcast channels for content creators on Pars Network"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Communication
created: 2026-01-23
tags: [communication, broadcast, channels, content, media]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a broadcast channel standard for Pars Network, enabling content creators, journalists, community leaders, and organizations to publish signed, encrypted content to unlimited subscribers. Channels support text, media, and rich content with optional subscriber-only access, verifiable authorship, and censorship-resistant distribution.

## Motivation

One-to-many communication is critical for diaspora communities:

1. **News and journalism** -- independent journalists need censorship-resistant publication channels
2. **Community announcements** -- organizations need reliable broadcast to members
3. **Cultural content** -- artists, poets, and musicians need distribution channels outside centralized platforms
4. **Emergency alerts** -- crisis information must reach the community rapidly and verifiably

Telegram channels serve this role today but are centralized, censorable, and metadata-leaking. Pars broadcast channels are decentralized, encrypted, and verifiable.

## Specification

### Channel Structure

```go
type BroadcastChannel struct {
    ChannelID    [32]byte
    OwnerDID     string
    Name         string
    Description  string
    CreatedAt    int64
    Subscribers  uint64       // Count only, list is private
    AccessPolicy AccessPolicy
    SigningKey    []byte       // Owner's ML-DSA public key
}

type AccessPolicy uint8
const (
    PublicChannel  AccessPolicy = iota // Anyone can subscribe
    PrivateChannel                     // Invite-only subscription
    PaidChannel                        // Requires ASHA payment
    GatedChannel                       // Requires credential/reputation
)
```

### Publishing

```go
type BroadcastMessage struct {
    ChannelID   [32]byte
    MessageID   [16]byte
    Sequence    uint64        // Monotonic sequence for ordering
    ContentType uint8         // Text, media, rich
    Content     []byte        // Encrypted if private channel
    Signature   []byte        // Owner's ML-DSA signature
    Timestamp   int64
    Attachments []MediaRef    // References to PIP-0302 media
}
```

All broadcast messages are signed by the channel owner. Subscribers verify the signature to confirm authenticity.

### Subscription Protocol

```
Subscriber                     Channel Owner (via swarm)
     │                                │
     │  1. SubscribeRequest           │
     │     {subscriberSessionID}      │
     │ ─────────────────────────────► │
     │                                │
     │  2. For private channels:      │
     │     Owner approves/rejects     │
     │                                │
     │  3. SubscribeConfirm           │
     │     {channelKey (encrypted)}   │
     │ ◄───────────────────────────── │
     │                                │
     │  4. Messages delivered via     │
     │     swarm multicast            │
     │ ◄═══════════════════════════── │
```

### Distribution

Broadcast messages are distributed through the session-layer swarm:

1. Owner publishes message to their swarm nodes
2. Swarm nodes replicate to subscriber swarms
3. Each subscriber polls their swarm for new channel messages
4. Multicast tree optimizes bandwidth for large channels

### Access-Gated Channels

| Gate Type | Requirement | Verification |
|:----------|:-----------|:-------------|
| Credential | Hold a specific VC (PIP-0201) | ZK proof of credential |
| Reputation | Meet reputation threshold (PIP-0203) | ZK reputation proof |
| Token | Hold minimum ASHA balance | Merkle proof of balance |
| NFT | Hold specific NFT | Ownership proof |
| Age | Meet age threshold (PIP-0209) | ZK age proof |

### Channel Discovery

```solidity
interface IChannelRegistry {
    function registerChannel(bytes32 channelId, string memory name, bytes memory metadata) external;
    function searchChannels(string memory query) external view returns (Channel[] memory);
    function getChannelInfo(bytes32 channelId) external view returns (Channel memory);
    function reportChannel(bytes32 channelId, bytes memory reason) external;
}
```

The on-chain registry provides discoverability. Registration requires a small ASHA fee to prevent spam.

## Rationale

- **Signed messages** provide verifiable authorship without centralized certificate authorities
- **Swarm-based distribution** ensures no single point of censorship for content delivery
- **Access gating** via ZK proofs enables subscriber-only content without revealing subscriber identities
- **Sequence numbers** prevent message reordering or suppression attacks
- **Multiple access policies** accommodate free community channels, premium content, and restricted organizational communications

## Security Considerations

- **Channel impersonation**: The signing key in the channel registration prevents impersonation; subscribers verify all messages against the registered key
- **Censorship by swarm nodes**: Messages are replicated across multiple swarm nodes; suppression requires compromising a majority of the channel's swarm
- **Subscriber privacy**: The subscriber list is not published; swarm delivery prevents channel owners from enumerating subscribers (except in private channels where approval is required)
- **Content authenticity**: ML-DSA signatures are quantum-resistant; channel messages remain verifiable indefinitely
- **Spam channels**: Registration fee and community reporting provide basic spam deterrence; the Content Moderation DAO (PIP-0308) handles escalated cases

## References

- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [PIP-0300: Encrypted Messaging Protocol](./pip-0300-encrypted-messaging-protocol.md)
- [PIP-0302: Media Sharing Protocol](./pip-0302-media-sharing-protocol.md)
- [PIP-0308: Content Moderation DAO](./pip-0308-content-moderation-dao.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
