---
pip: 202
title: "Social Recovery Wallets"
description: "Guardian-based wallet recovery without seed phrases for Pars Network accounts"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Identity
created: 2026-01-23
tags: [identity, recovery, wallet, guardians, social]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a social recovery mechanism for Pars Network wallets. Instead of relying on seed phrases -- which are frequently lost, stolen, or coerced -- users designate trusted guardians who can collectively authorize key rotation. The scheme uses threshold cryptography so that no single guardian can unilaterally control an account.

## Motivation

Seed phrases are a critical failure point:

1. **Loss** -- users forget, lose, or destroy seed phrases; funds are permanently lost
2. **Theft** -- physical seed phrase backups are vulnerable to burglary and confiscation
3. **Coercion** -- under duress, a user can be forced to reveal a single seed phrase
4. **Complexity** -- non-technical diaspora members struggle with 24-word mnemonic management

Social recovery replaces this single point of failure with a distributed trust model that mirrors how diaspora communities already operate: through networks of trusted family, friends, and community members.

## Specification

### Guardian Configuration

```solidity
interface ISocialRecoveryWallet {
    function addGuardian(address guardian) external;
    function removeGuardian(address guardian) external;
    function setThreshold(uint256 threshold) external;
    function initiateRecovery(address newOwner) external;
    function supportRecovery(address wallet, address newOwner) external;
    function cancelRecovery() external;
    function executeRecovery() external;
    function getGuardians() external view returns (address[] memory);
    function getThreshold() external view returns (uint256);
    function getRecoveryStatus() external view returns (RecoveryStatus memory);
}
```

### Recovery Flow

```
1. Owner loses access to wallet
2. Owner contacts guardians out-of-band
3. Any guardian calls initiateRecovery(newOwnerAddress)
4. Other guardians call supportRecovery(walletAddress, newOwnerAddress)
5. Once threshold reached, 48-hour timelock begins
6. After timelock, anyone calls executeRecovery()
7. Wallet ownership transferred to newOwnerAddress
```

### Threshold Parameters

| Guardians | Recommended Threshold | Rationale |
|:----------|:---------------------|:----------|
| 3 | 2 | Small family circle |
| 5 | 3 | Extended family/friends |
| 7 | 4 | Community-level recovery |
| 9 | 5 | Organization-level security |

### Guardian Privacy

Guardians are stored as commitment hashes on-chain:

```solidity
// Guardian identity hidden until recovery
mapping(bytes32 => bool) public guardianCommitments;

function addGuardian(bytes32 commitment) external onlyOwner {
    // commitment = keccak256(abi.encodePacked(guardianAddress, salt))
    guardianCommitments[commitment] = true;
}

function supportRecovery(address wallet, address newOwner, bytes32 salt) external {
    bytes32 commitment = keccak256(abi.encodePacked(msg.sender, salt));
    require(guardianCommitments[commitment], "Not a guardian");
    // Record support...
}
```

### Timelock and Cancellation

- **Timelock**: 48-hour delay between threshold reached and execution
- **Cancellation**: Current owner (if still has access) can cancel during timelock
- **Veto**: Owner can designate a veto guardian who can block recovery alone
- **Cooldown**: After cancelled recovery, 7-day cooldown before new attempt

### Session Layer Integration

Guardians can be identified by Session IDs instead of EVM addresses, allowing recovery to work even when guardians prefer to remain pseudonymous:

```
Guardian commits: hash(sessionID || salt)
Guardian reveals: signs recovery support via session daemon
Bridge relays: session signature verified on-chain via PQ precompile
```

## Rationale

- **No seed phrases** removes the most common failure mode in cryptocurrency self-custody
- **Threshold scheme** prevents any single guardian from stealing funds
- **Timelock** gives the legitimate owner time to cancel a malicious recovery attempt
- **Hidden guardians** prevent adversaries from targeting or coercing known guardians
- **Session-layer guardians** allow fully pseudonymous recovery networks

## Security Considerations

- **Guardian collusion**: Threshold must be set high enough that colluding guardians cannot reach it; recommended minimum threshold is `ceil(n/2) + 1`
- **Guardian loss**: If too many guardians become unreachable, recovery becomes impossible; users should periodically verify guardian availability
- **Coerced recovery**: The 48-hour timelock and owner cancellation prevent coerced guardians from executing immediate theft
- **Social engineering**: Guardians MUST verify recovery requests through a separate trusted channel (voice call, in-person) before signing
- **Guardian rotation**: Users SHOULD rotate guardians annually and whenever a guardian relationship changes

## References

- [EIP-4337: Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337)
- [Vitalik Buterin: Why We Need Wide Adoption of Social Recovery Wallets](https://vitalik.eth.limo/general/2021/01/11/recovery.html)
- [PIP-0200: Decentralized Identity Standard](./pip-0200-decentralized-identity-standard.md)
- [PIP-0214: Identity Recovery DAO](./pip-0214-identity-recovery-dao.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
