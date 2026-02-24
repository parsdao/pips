---
pip: 206
title: "Delegated Authentication"
description: "Proxy authentication for family and community accounts on Pars Network"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Identity
created: 2026-01-23
tags: [identity, delegation, proxy, family, access-control]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a delegated authentication protocol enabling Pars Network users to authorize trusted individuals to act on their behalf with scoped permissions. This supports family accounts where elders grant children limited access, community leaders who manage shared resources, and caregivers who assist non-technical users -- all without sharing private keys.

## Motivation

Persian diaspora communities operate with strong family and communal trust structures:

1. **Elder management** -- older family members may not be technically proficient but hold significant assets
2. **Family accounts** -- parents grant children allowances or access to specific services
3. **Community treasuries** -- local community leaders manage shared funds for events and aid
4. **Caregiver access** -- trusted individuals help manage accounts for those who cannot (illness, displacement, detention)

Existing blockchain wallets offer all-or-nothing access. Delegation provides granular, revocable, time-bounded permissions.

## Specification

### Delegation Structure

```solidity
struct Delegation {
    address delegator;      // Account owner
    address delegate;       // Authorized proxy
    bytes32 scope;          // Permission scope hash
    uint256 maxValue;       // Maximum per-transaction value
    uint256 dailyLimit;     // Maximum daily cumulative value
    uint256 expiresAt;      // Delegation expiry timestamp
    bool requiresApproval;  // Delegator must confirm each action
}

interface IDelegatedAuth {
    function createDelegation(Delegation memory d, bytes memory mldsaSig) external returns (bytes32 delegationId);
    function revokeDelegation(bytes32 delegationId) external;
    function executeAsDelegate(bytes32 delegationId, bytes memory calldata_) external;
    function getDelegations(address delegator) external view returns (Delegation[] memory);
    function getDelegatePermissions(address delegate) external view returns (Delegation[] memory);
}
```

### Permission Scopes

| Scope | Description | Example |
|:------|:-----------|:--------|
| `transfer.limited` | Transfer up to maxValue per tx | Child allowance |
| `governance.vote` | Vote on proposals | Community representative |
| `session.message` | Send messages on behalf | Caregiver communication |
| `credential.present` | Present VCs on behalf | Employment verification |
| `nft.manage` | Manage NFT collection | Art curator |
| `full` | All permissions (dangerous) | Emergency power of attorney |

### Approval Modes

1. **Pre-approved**: Delegate can act immediately within scope limits
2. **Approval-required**: Each action queued until delegator signs approval
3. **Time-delayed**: Actions execute after N hours unless delegator vetoes

### Session Layer Delegation

For communication delegation (e.g., a caregiver sending messages on behalf of an elder):

```go
type SessionDelegation struct {
    DelegatorSessionID SessionID
    DelegateSessionID  SessionID
    Permissions        []string  // "send", "read", "group.join"
    ExpiresAt          int64
    Signature          []byte    // Delegator's ML-DSA signature
}
```

Messages sent by a delegate are tagged with the delegation proof, allowing recipients to verify the message origin and delegation authority.

### Delegation Chain

Delegations are non-transitive by default. A delegate cannot sub-delegate unless the original delegation explicitly allows it:

```solidity
struct Delegation {
    // ... existing fields ...
    bool allowSubDelegation;
    uint8 maxChainDepth;    // Maximum sub-delegation depth (0 = no sub-delegation)
}
```

## Rationale

- **Scoped permissions** prevent delegates from exceeding their intended authority
- **Time-bounded** delegations automatically expire, reducing risk of forgotten access
- **Approval modes** let delegators choose between convenience and control
- **Session-layer support** extends delegation beyond financial transactions to communication
- **Non-transitive default** prevents unauthorized delegation chains

## Security Considerations

- **Delegate compromise**: Scoped permissions and daily limits contain the damage; delegator can revoke immediately
- **Coerced delegation**: The `requiresApproval` mode ensures the delegator must actively confirm each action, preventing silent abuse
- **Stale delegations**: Expired delegations are automatically invalid; the contract rejects expired delegation IDs
- **Social engineering**: Delegates could manipulate non-technical delegators into creating overly broad delegations; the UI MUST clearly explain each scope
- **Emergency revocation**: Delegators can revoke all delegations in a single transaction; guardians (PIP-0202) can also revoke on behalf of an incapacitated delegator

## References

- [EIP-7710: Smart Account Delegation](https://eips.ethereum.org/EIPS/eip-7710)
- [PIP-0200: Decentralized Identity Standard](./pip-0200-decentralized-identity-standard.md)
- [PIP-0202: Social Recovery Wallets](./pip-0202-social-recovery-wallets.md)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
