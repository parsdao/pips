---
pip: 3
title: Coercion Resistance - Threat Model & Mitigations
tags: [security, threat-model, coercion, privacy, duress]
description: Defines the threat model and coercion resistance mechanisms for high-threat environments
author: Pars Network Team (@pars-network)
status: Draft
type: Standards Track
category: Security
created: 2026-01-23
discussions-to: https://github.com/pars-network/pips/discussions/4
order: 3
tier: core
---

## Abstract

This PIP defines Pars Network's threat model and coercion resistance mechanisms. The network is designed for operation in high-threat environments where participants face:

- State-level surveillance
- Physical coercion and torture
- Device confiscation
- Legal compulsion to reveal keys
- Social pressure and community surveillance

The design principle: **Even under duress, users cannot compromise the network or other users.**

## Motivation

### The Coercion Threat

In authoritarian contexts, adversaries don't just intercept communications—they compel revelation:

```
┌─────────────────────────────────────────────────────────────────┐
│                    COERCION ATTACK VECTORS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PHYSICAL COERCION                                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Detention and interrogation                              │  │
│  │ • Threat of violence to self or family                     │  │
│  │ • Actual torture                                            │  │
│  │ • Indefinite imprisonment without trial                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  LEGAL COERCION                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Court orders to reveal passwords                         │  │
│  │ • Contempt charges for non-compliance                      │  │
│  │ • Asset seizure                                             │  │
│  │ • Travel restrictions                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  SOCIAL COERCION                                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Pressure from family/community                           │  │
│  │ • Employment threats                                        │  │
│  │ • Reputation attacks                                        │  │
│  │ • Exclusion from services                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  DEVICE SEIZURE                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Border crossing confiscation                             │  │
│  │ • Raid and seizure                                          │  │
│  │ • "Lost" device attacks                                     │  │
│  │ • Malicious repair/custody                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why Standard Encryption Fails

Standard encrypted messaging apps fail under coercion because:

1. **Single key controls everything** - One password unlocks all data
2. **Decryption is possible** - User CAN reveal the key if forced
3. **Contacts are exposed** - Contact lists reveal network graph
4. **History is stored** - Past messages can be recovered
5. **Metadata is visible** - Who talked to whom is recorded

### Pars Design Goals

1. **Plausible Deniability**: User can deny participation
2. **Compartmentalization**: Compromising one user doesn't expose others
3. **Forward Secrecy**: Past communications protected even if keys revealed
4. **Duress Detection**: System can detect coerced access
5. **Minimal Metadata**: Cannot prove who communicated with whom

## Specification

### Threat Model

#### Adversaries

| Adversary | Capabilities | Motivation |
|:----------|:-------------|:-----------|
| **Nation-State** | Full surveillance, legal coercion, physical coercion, unlimited resources | Suppress dissent, identify participants |
| **Intelligence Agency** | Technical surveillance, infiltration, zero-days | Gather intelligence, disrupt networks |
| **Criminal** | Theft, extortion, targeted attacks | Financial gain |
| **Insider** | Access to systems, social engineering | Various (ideology, coercion, bribery) |
| **Community** | Social pressure, reputation attacks | Conformity enforcement |

#### Assets to Protect

| Asset | Confidentiality | Integrity | Availability | Notes |
|:------|:----------------|:----------|:-------------|:------|
| **Message content** | CRITICAL | HIGH | MEDIUM | Core communication |
| **Contact graph** | CRITICAL | HIGH | MEDIUM | Who knows whom |
| **Group membership** | CRITICAL | HIGH | MEDIUM | Organizational structure |
| **User identity** | CRITICAL | CRITICAL | HIGH | Real-world linkage |
| **Participation proof** | CRITICAL | N/A | N/A | Evidence of involvement |
| **Historical data** | CRITICAL | HIGH | LOW | Past activities |

### Coercion Resistance Mechanisms

#### 1. Plausible Deniability

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLAUSIBLE DENIABILITY                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HIDDEN VOLUMES                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Outer Volume (decoy)    │  Hidden Volume (real)          │  │
│  │  Password: "vacation"    │  Password: "freedom1404"       │  │
│  │                          │                                 │  │
│  │  Contains:               │  Contains:                     │  │
│  │  - Vacation photos       │  - Actual messages             │  │
│  │  - Shopping lists        │  - Group memberships           │  │
│  │  - Decoy messages        │  - Contacts                    │  │
│  │                          │                                 │  │
│  │  Under coercion:         │  Never revealed:               │  │
│  │  Reveal this password    │  Adversary doesn't know        │  │
│  │  Appears legitimate      │  hidden volume exists          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  CRYPTOGRAPHIC GUARANTEE:                                       │
│  Hidden volume is indistinguishable from random data            │
│  Cannot prove existence without correct password                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 2. Duress Codes

```
┌─────────────────────────────────────────────────────────────────┐
│                    DURESS CODE SYSTEM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User has TWO passwords:                                        │
│                                                                  │
│  NORMAL PASSWORD: "MySecurePass123"                             │
│  - Opens full application                                        │
│  - All features available                                        │
│  - Normal operation                                              │
│                                                                  │
│  DURESS PASSWORD: "MySecurePass456"                             │
│  - Opens LIMITED application                                     │
│  - Shows decoy data                                              │
│  - SILENTLY triggers:                                            │
│    • Alert to trusted contacts                                   │
│    • Wipe of sensitive data                                      │
│    • GPS/location sharing (if enabled)                          │
│    • Evidence preservation to cloud                             │
│                                                                  │
│  Adversary sees normal-looking app                              │
│  Cannot detect duress mode was triggered                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 3. Ephemeral Messages

```
┌─────────────────────────────────────────────────────────────────┐
│                    MESSAGE EPHEMERALITY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DEFAULT: Messages are ephemeral (not stored long-term)         │
│                                                                  │
│  Timeline:                                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ T+0    : Message sent                                    │    │
│  │ T+read : Message read by recipient                       │    │
│  │ T+1hr  : Message deleted from sender device              │    │
│  │ T+24hr : Message deleted from recipient device           │    │
│  │ T+7d   : Message purged from any relay nodes             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  SECURE DELETION:                                               │
│  - Cryptographic erasure (key destroyed)                        │
│  - Multiple overwrites of storage                               │
│  - Cannot be forensically recovered                             │
│                                                                  │
│  USER CONTROL:                                                  │
│  - Extend retention for specific messages                       │
│  - Immediate delete for urgent situations                       │
│  - Panic button: wipe all local data instantly                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 4. Contact Graph Protection

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTACT GRAPH PROTECTION                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PROBLEM: Traditional apps store contact lists                  │
│           Seizing one device reveals network structure          │
│                                                                  │
│  SOLUTION: Contacts stored as encrypted blobs                   │
│            Only resolvable with contact's cooperation           │
│                                                                  │
│  IMPLEMENTATION:                                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Contact "Alice" stored as:                                │  │
│  │                                                             │  │
│  │  contact_id = Hash(shared_secret)                          │  │
│  │  encrypted_name = Encrypt(shared_secret, "Alice")          │  │
│  │                                                             │  │
│  │  To resolve contact:                                        │  │
│  │  1. Both parties must be online                            │  │
│  │  2. Perform mutual authentication                          │  │
│  │  3. Derive shared_secret from session                      │  │
│  │  4. Decrypt contact info                                   │  │
│  │                                                             │  │
│  │  If device seized:                                          │  │
│  │  - Contact IDs are random hashes                           │  │
│  │  - Names are encrypted blobs                               │  │
│  │  - Cannot identify WHO the contacts are                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 5. Group Membership Privacy

```
┌─────────────────────────────────────────────────────────────────┐
│                    GROUP MEMBERSHIP PRIVACY                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  THREAT: Group membership reveals organizational structure      │
│                                                                  │
│  PROTECTION:                                                    │
│                                                                  │
│  1. BLIND GROUP MEMBERSHIP                                      │
│     - Members don't know full member list                       │
│     - Only see members they directly interact with              │
│     - Group operations use threshold crypto                     │
│                                                                  │
│  2. ONION-ROUTED DELIVERY                                       │
│     - Messages routed through multiple hops                     │
│     - No single node sees full path                             │
│     - Sender and recipient not linkable                         │
│                                                                  │
│  3. COVER TRAFFIC                                               │
│     - Constant background noise                                 │
│     - Real messages indistinguishable from decoys              │
│     - Activity patterns not visible                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 6. Key Compartmentalization

```
┌─────────────────────────────────────────────────────────────────┐
│                    KEY COMPARTMENTALIZATION                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PRINCIPLE: No single key provides full access                  │
│                                                                  │
│  KEY HIERARCHY:                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Identity Key (long-term)                                  │  │
│  │  └── Device Key (per-device)                               │  │
│  │      └── Session Key (per-conversation)                    │  │
│  │          └── Message Key (per-message)                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  COMPROMISE IMPACT:                                             │
│  - Message Key: One message exposed                             │
│  - Session Key: One conversation exposed                        │
│  - Device Key: One device's data exposed                        │
│  - Identity Key: Must revoke and re-establish all contacts      │
│                                                                  │
│  COERCION SCENARIO:                                             │
│  User forced to reveal Device Key:                              │
│  - Other devices NOT compromised                                │
│  - Other users NOT compromised                                  │
│  - Historical data (with deleted keys) NOT recoverable          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 7. Panic Wipe

```
┌─────────────────────────────────────────────────────────────────┐
│                    PANIC WIPE SYSTEM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TRIGGERS:                                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Panic button (on-screen)                                │  │
│  │ 2. Hardware sequence (volume up + power x3)                │  │
│  │ 3. Duress password entry                                    │  │
│  │ 4. Remote wipe command (from trusted contact)              │  │
│  │ 5. Dead man's switch (no check-in for N days)              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  WIPE ACTIONS:                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Immediate:                                                  │  │
│  │ - Zeroize all keys in memory                               │  │
│  │ - Overwrite local database                                 │  │
│  │ - Clear caches and temp files                              │  │
│  │ - Reset app to fresh install state                         │  │
│  │                                                             │  │
│  │ Background:                                                 │  │
│  │ - Secure multi-pass overwrite of storage                   │  │
│  │ - Notify trusted contacts of wipe                          │  │
│  │ - Revoke device from identity                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  APPEARANCE:                                                    │
│  App appears normally uninstalled or freshly installed         │
│  No evidence of panic wipe vs. normal uninstall                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 8. Dead Man's Switch

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEAD MAN'S SWITCH                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SETUP:                                                         │
│  - User configures check-in interval (e.g., 72 hours)          │
│  - Designates trusted contacts                                  │
│  - Defines actions on trigger                                   │
│                                                                  │
│  OPERATION:                                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Normal: User checks in regularly                          │  │
│  │          Timer resets                                       │  │
│  │                                                             │  │
│  │  Missed: User doesn't check in for 72 hours                │  │
│  │          → Grace period warning                             │  │
│  │          → User can extend or disable                       │  │
│  │                                                             │  │
│  │  Trigger: Grace period expires                              │  │
│  │           → Alert trusted contacts                          │  │
│  │           → Wipe local data (optional)                      │  │
│  │           → Release pre-written message (optional)          │  │
│  │           → Transfer custody of digital assets (optional)   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  USE CASES:                                                     │
│  - Detained without access to device                           │
│  - Incapacitated (medical emergency)                           │
│  - Device confiscated at border                                │
│  - Forced disappearance                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Requirements

#### Device Security

```go
// Secure storage requirements
type SecureStorage interface {
    // Store with encryption
    Store(key string, value []byte) error

    // Retrieve with decryption
    Retrieve(key string) ([]byte, error)

    // Secure delete with overwrite
    SecureDelete(key string) error

    // Wipe all data
    PanicWipe() error
}

// Key storage must use hardware security when available
type KeyStorage interface {
    // Use Secure Enclave (iOS) or StrongBox (Android)
    StoreInHardware(keyID string, key []byte) error

    // Keys never leave hardware
    SignInHardware(keyID string, message []byte) ([]byte, error)

    // Hardware-backed secure deletion
    DeleteFromHardware(keyID string) error
}
```

#### Session Security

```go
// Session with coercion resistance
type SecureSession struct {
    // Normal session data
    messages    []*Message
    contacts    []*Contact

    // Coercion resistance
    duressMode  bool
    decoyData   *DecoyDataset
    panicButton func()

    // Ephemeral settings
    retention   time.Duration
    autoDelete  bool
}

// Check for duress password
func (s *SecureSession) Authenticate(password string) error {
    if s.isDuressPassword(password) {
        s.duressMode = true
        go s.triggerDuressAlert()
        return s.loadDecoyData()
    }
    return s.loadRealData(password)
}
```

## Security Considerations

### What We Can Protect Against

| Attack | Protection | Confidence |
|:-------|:-----------|:-----------|
| **Passive surveillance** | End-to-end encryption | HIGH |
| **Active interception** | Authentication, PQ crypto | HIGH |
| **Device seizure** | Encryption, plausible deniability | MEDIUM-HIGH |
| **Physical coercion** | Duress codes, panic wipe | MEDIUM |
| **Legal compulsion** | Plausible deniability | MEDIUM |
| **Targeted malware** | Limited (requires device security) | LOW |

### What We Cannot Protect Against

| Attack | Why | Mitigation |
|:-------|:----|:-----------|
| **$5 wrench attack** | Physical force bypasses crypto | Duress codes, compartmentalization |
| **Compromised device** | Malware sees plaintext | Use hardened devices |
| **Betrayal by contact** | They have the plaintext | Compartmentalization |
| **Rubber hose cryptanalysis** | Torture extracts passwords | Dead man's switch, panic wipe |

### Operational Security Guidance

Users in high-threat environments should:

1. **Use dedicated devices** - Not personal phones with other apps
2. **Maintain cover** - Decoy apps, plausible alternative use
3. **Practice duress procedures** - Know your duress password
4. **Compartmentalize** - Don't know what you don't need to know
5. **Dead man's switch** - Configure and maintain check-ins
6. **Trust verification** - Verify contacts through independent channels

## References

- [PIP-0000: Network Architecture](./pip-0000-network-architecture.md)
- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [EFF Surveillance Self-Defense](https://ssd.eff.org/)
- [Security in a Box](https://securityinabox.org/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
