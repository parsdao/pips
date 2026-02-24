---
pip: 301
title: "Group Messaging Standard"
description: "Scalable encrypted group messaging with MLS for Pars Network"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Communication
created: 2026-01-23
tags: [communication, group, messaging, mls, encryption]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a scalable encrypted group messaging standard for Pars Network based on the Messaging Layer Security (MLS) protocol. It enables groups of up to 10,000 members to communicate with end-to-end encryption, efficient key management, forward secrecy, and post-compromise security. The standard supports both small private groups and large community channels.

## Motivation

Diaspora coordination requires group communication:

1. **Community organizing** -- local chapters, cultural groups, and advocacy organizations need private group spaces
2. **Scalability** -- existing group encryption (sender-keys, pairwise) does not scale beyond small groups
3. **Dynamic membership** -- people join and leave; key management must handle this efficiently
4. **Decentralized operation** -- no central server should manage group state or hold group keys

MLS provides a tree-based key agreement protocol that scales logarithmically with group size.

## Specification

### Group Parameters

| Parameter | Value | Notes |
|:----------|:------|:------|
| Max members | 10,000 | Soft limit, extendable |
| Key update latency | O(log n) | Tree-based ratchet |
| Forward secrecy | Per-epoch | Key material deleted after use |
| Post-compromise security | Per-update | Compromised member healed on next update |
| Encryption | AES-256-GCM | With PQ key encapsulation |

### MLS Tree Structure

```
                    Root Key
                   /        \
              Node_L         Node_R
             /     \        /      \
          Leaf_0  Leaf_1  Leaf_2  Leaf_3
          (Alice) (Bob)   (Carol) (Dave)
```

Each leaf is a group member. Internal nodes hold derived key material. Updating a single leaf requires updating only the path from that leaf to the root -- O(log n) operations.

### Group Lifecycle

```go
type GroupState struct {
    GroupID     [32]byte
    Epoch       uint64
    TreeHash    [32]byte      // Hash of current ratchet tree
    Members     []MemberInfo
    AdminPolicy AdminPolicy
    CreatedAt   int64
}

type GroupOperations interface {
    CreateGroup(name string, initialMembers []SessionID) (*GroupState, error)
    AddMember(groupID [32]byte, member SessionID) error
    RemoveMember(groupID [32]byte, member SessionID) error
    UpdateKeys(groupID [32]byte) error  // Self-update for post-compromise security
    SendMessage(groupID [32]byte, content []byte) error
    GetMessages(groupID [32]byte, since time.Time) ([]*GroupMessage, error)
}
```

### Member Addition

1. Admin sends Welcome message to new member containing current group state
2. Welcome encrypted with new member's public key (ML-KEM)
3. New member's leaf inserted into the ratchet tree
4. Path keys updated from new leaf to root
5. All members receive Commit message with updated tree

### Member Removal

1. Admin issues Remove proposal
2. Removed member's leaf blanked in the tree
3. Path from blanked leaf to root re-derived
4. Removed member cannot decrypt any future messages
5. Group epoch incremented

### Message Format

```go
type GroupMessage struct {
    GroupID     [32]byte
    Epoch       uint64
    SenderLeaf  uint32        // Sender's position in tree
    ContentType uint8
    Ciphertext  []byte        // AES-256-GCM encrypted content
    Signature   []byte        // Sender's ML-DSA signature
}
```

Messages are encrypted with the current epoch's group key. Only current members can derive this key.

### Admin Policies

| Policy | Description |
|:-------|:-----------|
| `open` | Any member can add others |
| `admin-only` | Only admins can add/remove |
| `vote` | Addition requires N% member approval |
| `invite-link` | Members join via time-limited invite tokens |

### Group Types

| Type | Max Size | Key Rotation | Use Case |
|:-----|:---------|:------------|:---------|
| Private | 50 | Per-message | Sensitive coordination |
| Community | 1,000 | Hourly | Local community chat |
| Channel | 10,000 | Daily | Broadcast with discussion |

## Rationale

- **MLS protocol** is the IETF standard for scalable group encryption, with formal security proofs
- **Tree-based key management** reduces the cost of member changes from O(n) to O(log n)
- **Epoch-based forward secrecy** ensures past messages remain secure even if current keys are compromised
- **Post-compromise security** means a temporarily compromised member's access is automatically revoked on the next key update
- **Flexible admin policies** accommodate the diverse governance needs of diaspora community groups

## Security Considerations

- **Malicious admin**: Admins can add unauthorized members; the vote-based policy mitigates this for sensitive groups
- **Tree state divergence**: Network partitions can cause members to have inconsistent tree state; the protocol includes epoch synchronization and conflict resolution
- **Insider attack**: A current member can always read current messages; removal is the only mitigation, which takes effect on the next epoch
- **Metadata leakage**: Group membership list is visible to all members; anonymous group membership is out of scope but could be layered via PIP-0208 pseudonyms
- **Denial of service**: A malicious member could flood the group; rate limiting per sender and admin kick capabilities provide mitigation

## References

- [IETF MLS Protocol (RFC 9420)](https://www.rfc-editor.org/rfc/rfc9420)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [PIP-0300: Encrypted Messaging Protocol](./pip-0300-encrypted-messaging-protocol.md)
- [PIP-0307: Anti-Spam Framework](./pip-0307-anti-spam-framework.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
