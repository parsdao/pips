---
pip: 212
title: "Emergency Identity Revocation"
description: "Emergency identity freeze and revocation under duress for Pars Network users"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Identity
created: 2026-01-23
tags: [identity, emergency, revocation, duress, coercion-resistance]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines an emergency identity revocation protocol for Pars Network. When a user is under duress -- arrest, detention, device seizure, or coercion -- they or their pre-designated emergency contacts can instantly freeze the identity, preventing any transactions, credential presentations, or session activity. The freeze is reversible through the social recovery process (PIP-0202) once the emergency has passed.

## Motivation

The Persian diaspora faces real threats that make emergency identity controls essential:

1. **Arrest and detention** -- authorities may attempt to use a detained person's identity to access funds, contacts, or communications
2. **Device seizure** -- confiscated devices may contain active sessions and cached credentials
3. **Coerced transactions** -- under threat, a user may be forced to transfer funds or revoke others' access
4. **Border crossings** -- devices inspected at borders may expose identity information

An emergency freeze provides a dead man's switch for identity protection.

## Specification

### Freeze Mechanisms

| Mechanism | Trigger | Latency | Reversible |
|:----------|:--------|:--------|:-----------|
| Self-freeze | Owner sends freeze transaction | Immediate | Yes, via recovery |
| Duress PIN | Special PIN triggers freeze silently | Immediate | Yes, via recovery |
| Emergency contact | Pre-designated contact triggers freeze | Immediate | Yes, via recovery |
| Dead man's switch | No activity for N days | Configurable | Yes, via check-in |
| Guardian freeze | Threshold of guardians agree | Immediate | Yes, via recovery |

### Freeze Contract

```solidity
interface IEmergencyRevocation {
    function selfFreeze() external;
    function duressFreeze(bytes32 identityHash, bytes memory duressProof) external;
    function contactFreeze(bytes32 identityHash) external;
    function guardianFreeze(bytes32 identityHash) external;
    function isFrozen(bytes32 identityHash) external view returns (bool);
    function unfreeze(bytes32 identityHash, bytes memory recoveryProof) external;

    function setDeadManSwitch(uint256 inactivityPeriod) external;
    function checkIn() external;
    function addEmergencyContact(address contact) external;
    function removeEmergencyContact(address contact) external;
}
```

### Frozen State Effects

When an identity is frozen:

| System | Effect |
|:-------|:-------|
| EVM | All transactions from this address are rejected |
| Session | All active sessions are terminated; new sessions cannot be created |
| Credentials | All credential presentations are invalidated |
| Delegations | All delegated permissions are suspended |
| Recovery | Social recovery process can still be initiated |

### Duress PIN Protocol

Users configure a secondary PIN that appears to work normally but triggers a silent freeze:

```
Normal PIN:  authenticates normally
Duress PIN:  authenticates but simultaneously:
  1. Freezes the identity on-chain
  2. Sends alert to emergency contacts via session layer
  3. Moves funds to pre-configured safe address
  4. Wipes sensitive data from device after brief delay
```

### Dead Man's Switch

```go
type DeadManSwitch struct {
    IdentityHash     [32]byte
    InactivityPeriod time.Duration  // e.g., 30 days
    LastCheckIn      time.Time
    AlertContacts    []SessionID
    AutoFreeze       bool
}
```

If the user does not check in within the configured period:
1. Alert sent to emergency contacts
2. Grace period (configurable, default 72 hours)
3. If still no check-in, identity is frozen automatically

### Recovery from Freeze

1. User regains access (released, recovered device, etc.)
2. Initiates social recovery (PIP-0202) with guardian threshold
3. New keys generated, old keys invalidated
4. Identity unfrozen with new key set
5. Funds in safe address recovered via new keys

## Rationale

- **Multiple freeze triggers** accommodate different emergency scenarios
- **Silent duress PIN** prevents adversaries from knowing the identity has been locked
- **Dead man's switch** protects users who become unreachable (detained, hospitalized)
- **Reversible freeze** ensures the identity is not permanently lost in a false alarm
- **Safe address** ensures funds are protected even if the freeze transaction is observed

## Security Considerations

- **False freeze**: Malicious emergency contacts could freeze an identity to cause disruption; the recovery process provides a path back, and contacts should be chosen with care
- **Freeze transaction censorship**: If the network is censored, the freeze transaction may not propagate; emergency contacts on different network segments provide redundancy
- **Duress PIN discovery**: If an adversary knows about the duress PIN feature, they may demand the "real" PIN; plausible deniability mechanisms (PIP-0003) help here
- **Dead man's switch timing**: Too short creates false positives; too long reduces protection; recommended default is 30 days with 72-hour grace period
- **Fund movement visibility**: Moving funds to a safe address during duress is visible on-chain; the safe address SHOULD be a stealth address to prevent tracing

## References

- [PIP-0003: Coercion Resistance](./pip-0003-coercion-resistance.md)
- [PIP-0200: Decentralized Identity Standard](./pip-0200-decentralized-identity-standard.md)
- [PIP-0202: Social Recovery Wallets](./pip-0202-social-recovery-wallets.md)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
