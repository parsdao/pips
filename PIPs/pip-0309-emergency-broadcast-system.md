---
pip: 309
title: "Emergency Broadcast System"
description: "Emergency alert system for Persian diaspora communities on Pars Network"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Communication
created: 2026-01-23
tags: [communication, emergency, broadcast, alert, crisis]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines an Emergency Broadcast System (EBS) for Pars Network. The EBS enables authorized community leaders to issue verified, high-priority alerts that propagate rapidly across the network via session layer, mesh networks, and even SMS/voice gateways. Alerts are cryptographically signed, tamper-proof, and reach users even during partial internet outages.

## Motivation

The Persian diaspora faces emergencies that require rapid, reliable communication:

1. **Political crises** -- sudden arrests, protest crackdowns, or policy changes affecting diaspora rights
2. **Natural disasters** -- earthquakes (Iran sits on major fault lines), floods, or other events affecting homeland communities
3. **Internet shutdowns** -- alerts about imminent or ongoing blackouts
4. **Community safety** -- scam warnings, security advisories, and evacuation notices
5. **Humanitarian** -- missing persons, urgent aid requests, medical emergencies

Existing emergency systems (government alerts, social media) are either unavailable, untrustworthy, or censorable for diaspora communities.

## Specification

### Alert Levels

| Level | Name | Priority | Propagation | TTL |
|:------|:-----|:---------|:-----------|:----|
| 0 | Critical | Highest | Immediate, all channels | 72 hours |
| 1 | Urgent | High | Immediate, session + mesh | 48 hours |
| 2 | Warning | Medium | Standard session delivery | 24 hours |
| 3 | Advisory | Low | Standard session delivery | 12 hours |
| 4 | Info | Lowest | Standard session delivery | 6 hours |

### Alert Structure

```go
type EmergencyAlert struct {
    AlertID       [16]byte
    Level         uint8
    Category      AlertCategory
    Title         string        // Brief title (max 140 chars)
    Body          string        // Detailed description
    Region        string        // Affected geographic region
    IssuedBy      string        // Issuer DID
    IssuedAt      int64
    ExpiresAt     int64
    Signature     []byte        // ML-DSA signature from authorized issuer
    Translations  map[string]AlertTranslation  // "fa", "en", "de", etc.
    ActionURL     string        // Optional link for more information
    Supersedes    [16]byte      // Previous alert this replaces (if any)
}

type AlertCategory uint8
const (
    CategoryPolitical    AlertCategory = iota
    CategoryNatural
    CategorySecurity
    CategoryHumanitarian
    CategoryHealth
    CategoryNetwork
    CategoryCommunity
)
```

### Authorized Issuers

Alerts can only be issued by DAO-authorized entities. The EBS contract supports issuer registration (with DAO vote proof), alert issuance (with ML-DSA signature), alert revocation, and issuer revocation. Active alerts are queryable by region.
```

### Issuer Hierarchy

| Issuer Level | Max Alert Level | Authorization |
|:-------------|:---------------|:-------------|
| Pars DAO | Critical (0) | Governance vote |
| Regional Community DAO | Urgent (1) | Regional governance vote |
| Community Organization | Warning (2) | Organization multi-sig |
| Verified Individual | Advisory (3) | Reputation > 800 + DAO approval |

### Propagation Protocol

Critical and Urgent alerts use aggressive propagation:

```
1. Issuer publishes alert to EBS contract + session swarm
2. All relay nodes prioritize alert distribution
3. Alert bypasses normal rate limits and PoW requirements
4. Mesh network nodes broadcast alert to all nearby devices
5. Gateway nodes forward to SMS/voice bridges (if configured)
6. Client devices display alert notification immediately
```

### Multi-Channel Delivery

| Channel | Latency | Reach |
|:--------|:--------|:------|
| Session layer | Seconds | Online users |
| Mesh broadcast | Minutes | Nearby devices |
| SMS/Voice gateway | Minutes | Opt-in phone numbers |
| Email bridge | Minutes | Opt-in email addresses |

### Verification

Recipients verify alerts by checking the ML-DSA signature against the registered issuer's public key, confirming issuer authorization for the alert level, and verifying no revocation. Alerts include a `Supersedes` field so updated information replaces previous alerts.

## Rationale

- **Cryptographic verification** prevents fake emergency alerts -- a common social engineering attack
- **Multi-channel delivery** ensures alerts reach users regardless of their connectivity situation
- **DAO-authorized issuers** prevent both censorship and abuse of the emergency system
- **Level-based propagation** ensures critical alerts get maximum priority without degrading normal messaging
- **Multi-language translations** serve the global diaspora in their preferred language

## Security Considerations

- **False alerts**: Only DAO-authorized issuers can publish; authorization revocable by governance vote
- **Alert flooding**: Rate limited to max 3 Critical alerts per 24h per issuer
- **Issuer compromise**: Keys revocable immediately by DAO; alerts from revoked issuers flagged as unverified
- **Alert suppression**: Multi-channel delivery and mesh propagation make suppression difficult
- **SMS gateway abuse**: Phone numbers stored only on user devices; gateway operator cannot build recipient list

## References

- [PIP-0001: Mesh Network](./pip-0001-mesh-network.md)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [PIP-0304: Broadcast Channel Standard](./pip-0304-broadcast-channel-standard.md)
- [PIP-0305: Offline Messaging Queue](./pip-0305-offline-messaging-queue.md)
- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
