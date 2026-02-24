---
pip: 300
title: "Encrypted Messaging Protocol"
description: "End-to-end encrypted messaging over the Pars Network session layer"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Communication
created: 2026-01-23
tags: [communication, messaging, encryption, e2e, privacy]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines the end-to-end encrypted messaging protocol for Pars Network. Built on the session layer (PIP-0005), it provides confidential one-to-one messaging with forward secrecy, post-quantum encryption, deniability, and offline delivery. Messages are indistinguishable from random data to any observer, including network validators and relay nodes.

## Motivation

Secure communication is the foundation of diaspora coordination:

1. **Surveillance resistance** -- state-level adversaries actively monitor communications of diaspora activists and journalists
2. **Metadata protection** -- who talks to whom is as dangerous as what they say; existing messengers leak metadata to servers
3. **Censorship circumvention** -- messages must reach recipients even when the network is partially blocked
4. **Offline resilience** -- during internet blackouts, messages must queue and deliver when connectivity returns

## Specification

### Message Types

| Type | ID | Description |
|:-----|:---|:-----------|
| Text | 0x01 | UTF-8 text message |
| Rich Text | 0x02 | Markdown-formatted text |
| Reaction | 0x03 | Emoji reaction to a message |
| Reply | 0x04 | Threaded reply referencing parent message ID |
| Edit | 0x05 | Edit of a previously sent message |
| Delete | 0x06 | Deletion request for a message |
| Read Receipt | 0x07 | Acknowledgment of message receipt |
| Typing | 0x08 | Typing indicator (ephemeral) |
| System | 0xFF | Protocol-level notifications |

### Message Envelope

```go
type MessageEnvelope struct {
    Version     uint8       // Protocol version
    Type        uint8       // Message type
    MessageID   [16]byte    // Unique message identifier
    Timestamp   int64       // Unix timestamp (coarsened to 5-minute windows)
    ParentID    [16]byte    // Parent message ID (for replies)
    Body        []byte      // Encrypted message body
    Attachments []Attachment // Encrypted attachment references
    Padding     []byte      // Random padding to fixed size
}
```

### Encryption Pipeline

```
1. Plaintext message composed
2. Message serialized with msgpack
3. Padded to next 256-byte boundary
4. Encrypted with current message key (AES-256-GCM)
5. Message key derived from double ratchet (PIP-0005)
6. Encrypted envelope wrapped in onion routing layers
7. Routed through 3-hop path to recipient's swarm
8. Stored encrypted until recipient retrieves
```

### Delivery Guarantees

| Guarantee | Mechanism |
|:----------|:---------|
| At-least-once delivery | Swarm replication across 3+ nodes |
| Ordering | Sequence numbers within session |
| Deduplication | Message ID checked on receipt |
| Expiry | Messages expire after 14 days if undelivered |
| Acknowledgment | Optional read receipts (sender configurable) |

### Message Retrieval

```go
func (c *Client) PollMessages(sessionID [32]byte) ([]*MessageEnvelope, error) {
    // 1. Query swarm nodes for pending messages
    swarmNodes := c.dht.FindSwarm(c.sessionID)

    var messages []*MessageEnvelope
    for _, node := range swarmNodes {
        msgs, err := node.Retrieve(c.sessionID, c.lastSync)
        if err == nil {
            messages = append(messages, msgs...)
        }
    }

    // 2. Deduplicate by message ID
    messages = deduplicate(messages)

    // 3. Decrypt each message with ratchet state
    for _, msg := range messages {
        msg.Body = c.ratchet.Decrypt(msg.Body)
    }

    // 4. Update sync timestamp
    c.lastSync = time.Now()

    return messages, nil
}
```

### Disappearing Messages

Sessions can enable auto-delete with configurable timers (30s, 5min, 24h, 7d, or off). Both sender and recipient clients delete the message after the timer expires. The deletion is best-effort -- a compromised client could retain messages.

### Deniability

The protocol provides cryptographic deniability: any party could have forged any message in a session. This is achieved by using shared MAC keys rather than non-repudiable signatures for message authentication within an established session.

## Rationale

- **Double ratchet** provides forward secrecy and break-in recovery for every message
- **Fixed-size padding** prevents message length analysis
- **Coarsened timestamps** reduce temporal correlation attacks
- **Swarm delivery** eliminates the need for the sender and recipient to be online simultaneously
- **Deniability** protects users who may need to deny message content under interrogation

## Security Considerations

- **Compromised ratchet state**: If ratchet state is extracted from a device, only messages since the last DH ratchet step are exposed; prior messages remain secure
- **Swarm node compromise**: Messages are encrypted end-to-end; compromised swarm nodes see only ciphertext and cannot identify sender or recipient
- **Message retention**: Disappearing messages rely on client cooperation; a determined adversary with device access can screenshot or photograph content
- **Replay attacks**: Message IDs and sequence numbers prevent replay; duplicate messages are discarded
- **Traffic analysis**: Onion routing and cover traffic make it difficult to correlate message sends with deliveries; users in high-risk environments should enable cover traffic mode

## References

- [Signal Protocol Specification](https://signal.org/docs/)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)
- [PIP-0305: Offline Messaging Queue](./pip-0305-offline-messaging-queue.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
