---
pip: 307
title: "Anti-Spam Framework"
description: "Proof-of-work and staking based anti-spam for Pars Network messaging"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Communication
created: 2026-01-23
tags: [communication, spam, anti-abuse, proof-of-work, staking]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a multi-layered anti-spam framework for Pars Network messaging. The system combines proof-of-work (PoW), ASHA micro-stakes, reputation scoring, and rate limiting to prevent spam without requiring centralized moderation or sacrificing sender privacy. The framework adapts dynamically based on network load and spam prevalence.

## Motivation

Decentralized messaging systems are vulnerable to spam:

1. **Free sending** -- without cost, an attacker can flood the network with millions of messages
2. **No central moderation** -- there is no authority to block spammers; anti-spam must be protocol-level
3. **Privacy constraint** -- anti-spam cannot require identity verification, which would undermine the privacy goals of PIP-0005
4. **Resource exhaustion** -- spam consumes relay bandwidth, swarm storage, and recipient attention

## Specification

### Anti-Spam Layers

```
Layer 1: Proof-of-Work (per message)
    │
    ▼
Layer 2: ASHA Micro-Stake (per session)
    │
    ▼
Layer 3: Reputation Gate (per sender)
    │
    ▼
Layer 4: Rate Limiting (per time window)
    │
    ▼
Layer 5: Recipient Controls (per user)
```

### Layer 1: Proof-of-Work

Every message includes a PoW solution:

```go
type MessagePoW struct {
    Nonce      uint64
    Difficulty uint8     // Adjusts based on network load
    Timestamp  int64     // Must be within 5 minutes
    Hash       [32]byte  // SHA3(message_header || nonce)
}

// PoW must satisfy: Hash < target(Difficulty)
// At baseline difficulty, ~50ms of computation on mobile device
// At high difficulty (spam surge), ~2 seconds on mobile device
```

### Layer 2: ASHA Micro-Stake

Each session requires a small ASHA deposit:

| Session Type | Stake | Refund After |
|:------------|:------|:------------|
| Direct message | 0.01 ASHA | Session ends normally |
| Group message | 0.05 ASHA | No spam reports for 24h |
| Broadcast | 0.10 ASHA | No spam reports for 7d |
| Anonymous | 0.50 ASHA | No spam reports for 30d |

Stakes are forfeited if the session receives spam reports exceeding a threshold.

### Layer 3: Reputation Gate

Messages from senders with higher reputation (PIP-0203) face lower anti-spam friction:

| Reputation | PoW Difficulty | Stake Required | Rate Limit |
|:-----------|:-------------|:--------------|:-----------|
| 800+ | 0.5x baseline | 0x (waived) | 2x baseline |
| 500-799 | 1.0x baseline | 0.5x baseline | 1x baseline |
| 200-499 | 1.5x baseline | 1.0x baseline | 0.5x baseline |
| <200 | 2.0x baseline | 2.0x baseline | 0.25x baseline |

### Layer 4: Rate Limiting

```go
type RateLimit struct {
    MessagesPerMinute  uint32  // Max messages per minute per session
    MessagesPerHour    uint32  // Max messages per hour per session
    BytesPerMinute     uint64  // Max bytes per minute per session
    NewSessionsPerHour uint32  // Max new sessions per hour per identity
}

var BaselineRateLimit = RateLimit{
    MessagesPerMinute:  10,
    MessagesPerHour:    200,
    BytesPerMinute:     1048576,  // 1 MB
    NewSessionsPerHour: 20,
}
```

Rate limits are enforced by relay nodes. Exceeding limits causes messages to be queued with lower priority rather than dropped.

### Layer 5: Recipient Controls

Individual users configure their own spam filters:

| Control | Description |
|:--------|:-----------|
| Contacts only | Only accept messages from known sessions |
| Reputation minimum | Require sender reputation above threshold |
| PoW minimum | Require higher-than-baseline PoW |
| Blocklist | Block specific session IDs |
| Keywords | Client-side keyword filtering (local only) |

### Dynamic Difficulty Adjustment

The network adjusts PoW difficulty every 10 minutes based on aggregate message volume. If actual messages exceed the 10,000/minute target, difficulty scales proportionally (max 2x change per period).

## Rationale

- **Multi-layered defense** ensures no single bypass defeats the entire system
- **PoW** provides a CPU-cost floor that is proportional to message volume
- **Micro-stakes** add economic cost that scales with abuse
- **Reputation integration** rewards good actors with lower friction
- **Recipient controls** give users final authority over what they receive
- **Dynamic adjustment** prevents both spam floods and excessive friction during low-traffic periods

## Security Considerations

- **ASIC/GPU PoW acceleration**: The PoW algorithm should be memory-hard (e.g., Argon2) to reduce ASIC advantage
- **Stake accumulation attacks**: An attacker could accumulate ASHA to afford spam; the combination with PoW and rate limiting ensures economic cost is not the sole defense
- **Reputation farming**: Building reputation solely to bypass spam filters is possible but time-consuming; rapid reputation changes trigger additional scrutiny
- **Relay node enforcement**: Relay nodes that fail to enforce rate limits face slashing (PIP-0306); enforcement is verified by the measurement committee
- **Accessibility**: PoW difficulty must remain achievable on low-end mobile devices; the baseline is calibrated for a 3-year-old smartphone

## References

- [Hashcash (Adam Back)](http://www.hashcash.org/)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [PIP-0203: Reputation System](./pip-0203-reputation-system.md)
- [PIP-0306: Message Relay Incentive](./pip-0306-message-relay-incentive.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
