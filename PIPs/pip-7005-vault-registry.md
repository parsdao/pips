---
pip: 7005
title: Vault Registry (ERC-4626)
tags: [governance, treasury, vaults, erc-4626, yield]
description: Defines the ERC-4626 vault system for Committee and Sub-DAO treasuries
author: Pars DAO (@parsdao)
status: Draft
type: Standards Track
category: Governance
created: 2026-01-30
discussions-to: https://github.com/pars-network/pips/discussions/7005
order: 5
tier: governance
---

## Abstract

This PIP defines the Vault Registry system for Pars Network. Each Committee, Working Group, and Sub-DAO operates a standardized ERC-4626 vault for treasury management, enabling yield generation, transparent accounting, and interoperability with DeFi protocols.

## Motivation

Pars Network's distributed governance structure requires:

1. **Standardized treasury management** across 10 Committees, Working Groups, and Sub-DAOs
2. **Yield generation** on treasury holdings
3. **Transparent accounting** of all fund flows
4. **Interoperability** with external DeFi protocols
5. **Clear fund ownership** distinguishing ALLOCATED vs BONDED capital

ERC-4626 provides:
- Standard vault interface for deposits and withdrawals
- Share-based accounting for proportional ownership
- Composability with yield strategies
- On-chain transparency

## Specification

### Vault Registry Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           VAULT REGISTRY                                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  PARS DAO TREASURY (Main Vault)                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  ERC-4626 Vault: PARS Treasury                                                │  │
│  │  Asset: Multi-asset (PARS, USDC, ETH via aggregator)                         │  │
│  │  Strategy: Diversified yield + Reserves                                       │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│               ┌──────────────────────┼──────────────────────┐                       │
│               │                      │                      │                       │
│               ▼                      ▼                      ▼                       │
│  10 COMMITTEE VAULTS          WORKING GROUP VAULTS     SUB-DAO VAULTS              │
│  ┌─────────────────┐         ┌─────────────────┐      ┌─────────────────┐          │
│  │ SECURITY (امنیّت) │         │ Temp WG Vault   │      │ MIGA Vault      │          │
│  │ TREASURY (خزانه)  │         │ (All funds      │      │ CYRUS Vault     │          │
│  │ GOVERNANCE (داد)  │         │  recallable)    │      │ (Bonded funds   │          │
│  │ HEALTH (سلامت)    │         │                 │      │  NOT recallable)│          │
│  │ CULTURE (فرهنگ)   │         └─────────────────┘      └─────────────────┘          │
│  │ RESEARCH (دانش)   │                                                               │
│  │ INFRA (سازندگی)   │                                                               │
│  │ CONSULAR (پیام)   │                                                               │
│  │ VENTURE (وقف)     │                                                               │
│  │ IMPACT (میزان)    │                                                               │
│  └─────────────────┘                                                                │
│                                                                                      │
│  FUND SOURCE TRACKING                                                                │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  ALLOCATED: Parent can recall (1% baseline, grants, streaming)                │  │
│  │  BONDED: Parent CANNOT recall (user-purchased tokens, bonds)                  │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Vault Registry Contract

```solidity
interface IVaultRegistry {
    // ═══════════════════════════════════════════════════════════════════════════════
    //                              VAULT MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Register a new vault
    /// @param vault The ERC-4626 vault address
    /// @param vaultType Type (committee, working_group, subdao)
    /// @param parent Parent vault/DAO (0x0 for root)
    /// @param metadata IPFS hash of vault metadata
    function registerVault(
        address vault,
        VaultType vaultType,
        address parent,
        bytes32 metadata
    ) external;

    /// @notice Get all registered vaults
    /// @return Array of vault addresses
    function getVaults() external view returns (address[] memory);

    /// @notice Get vault by entity (committee, subdao)
    /// @param entity The entity identifier (e.g., "SECURITY", "MIGA")
    /// @return Vault address
    function getVaultByEntity(bytes32 entity) external view returns (address);

    /// @notice Get vault hierarchy (parent → children)
    /// @param vault The vault to query
    /// @return parent Parent vault address
    /// @return children Array of child vault addresses
    function getVaultHierarchy(address vault) external view returns (
        address parent,
        address[] memory children
    );

    // ═══════════════════════════════════════════════════════════════════════════════
    //                              FUND SOURCE TRACKING
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Record fund allocation (recallable by parent)
    /// @param vault Target vault
    /// @param amount Amount allocated
    /// @param source Source identifier
    function recordAllocation(
        address vault,
        uint256 amount,
        bytes32 source
    ) external;

    /// @notice Record bonded funds (NOT recallable by parent)
    /// @param vault Target vault
    /// @param amount Amount bonded
    /// @param bonder Address of bonder
    function recordBond(
        address vault,
        uint256 amount,
        address bonder
    ) external;

    /// @notice Get fund breakdown for a vault
    /// @param vault The vault to query
    /// @return allocated Total allocated funds (recallable)
    /// @return bonded Total bonded funds (not recallable)
    function getFundBreakdown(address vault) external view returns (
        uint256 allocated,
        uint256 bonded
    );

    /// @notice Check if parent can recall specific amount
    /// @param vault The vault to query
    /// @param amount Amount to recall
    /// @return canRecall Whether recall is possible
    /// @return maxRecallable Maximum amount that can be recalled
    function canRecall(
        address vault,
        uint256 amount
    ) external view returns (bool canRecall, uint256 maxRecallable);

    // ═══════════════════════════════════════════════════════════════════════════════
    //                              RECALL MECHANICS
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Recall allocated funds from child vault
    /// @param childVault The child vault to recall from
    /// @param amount Amount to recall
    /// @dev Only parent vault/council can call
    function recallFunds(address childVault, uint256 amount) external;

    /// @notice Halt future allocations to vault
    /// @param vault The vault to halt
    /// @dev Requires parent authority
    function haltAllocations(address vault) external;

    /// @notice Resume allocations to vault
    /// @param vault The vault to resume
    function resumeAllocations(address vault) external;
}
```

### Committee Vault Implementation

Each Committee operates an ERC-4626 vault with additional governance features:

```solidity
interface ICommitteeVault is IERC4626 {
    // ═══════════════════════════════════════════════════════════════════════════════
    //                              ERC-4626 CORE (inherited)
    // ═══════════════════════════════════════════════════════════════════════════════
    // deposit(uint256 assets, address receiver) → uint256 shares
    // withdraw(uint256 assets, address receiver, address owner) → uint256 shares
    // redeem(uint256 shares, address receiver, address owner) → uint256 assets
    // convertToShares(uint256 assets) → uint256 shares
    // convertToAssets(uint256 shares) → uint256 assets

    // ═══════════════════════════════════════════════════════════════════════════════
    //                              COMMITTEE-SPECIFIC
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Get committee identity token
    /// @return Token address (e.g., SECURITY, TREASURY, etc.)
    function identityToken() external view returns (address);

    /// @notice Get committee council (Safe multisig)
    /// @return Council address
    function council() external view returns (address);

    /// @notice Get committee charter
    /// @return Charter contract address
    function charter() external view returns (address);

    /// @notice Check if address is committee member
    /// @param account Address to check
    /// @return True if member
    function isMember(address account) external view returns (bool);

    /// @notice Get spending authority for member
    /// @param member Member address
    /// @return maxSpend Maximum single spend
    /// @return dailyLimit Daily spending limit
    function getSpendingAuthority(address member) external view returns (
        uint256 maxSpend,
        uint256 dailyLimit
    );

    // ═══════════════════════════════════════════════════════════════════════════════
    //                              FUND SOURCE AWARE
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Get allocated vs bonded breakdown
    function getFundSources() external view returns (
        uint256 allocatedBalance,
        uint256 bondedBalance
    );

    /// @notice Deposit as allocated funds (from parent)
    function depositAllocated(uint256 assets) external returns (uint256 shares);

    /// @notice Deposit as bonded funds (from bond purchase)
    function depositBonded(uint256 assets, address bonder) external returns (uint256 shares);
}
```

### Fund Source Rules

| Source Type | Description | Parent Can Recall? | Examples |
|:------------|:------------|:-------------------|:---------|
| **ALLOCATED** | Funds delegated from parent | ✓ Yes | 1% baseline, grants, streaming payments |
| **BONDED** | Funds from community bond purchases | ✗ No | User-purchased Committee tokens |

### Recall Mechanics

When a Committee/Working Group goes rogue, the parent (Pars DAO) can:

```
Committee Goes Rogue
├── ALLOCATED: $50K → Parent CAN recall ✓
├── BONDED: $200K → Parent CANNOT recall ✗
├── Parent Actions Available:
│   ├── Halt future allocations ✓
│   ├── Veto pending proposals ✓
│   ├── Recall allocated funds ✓
│   └── Recall bonded funds ✗
└── Committee continues with bonded funds
    └── Community can fork/exit/reform
```

This preserves **community sovereignty** while giving parent **oversight over delegated capital**.

### Vault Types

| Type | Structure | Fund Recallability | Example |
|:-----|:----------|:-------------------|:--------|
| **Committee** | Safe + Council + Charter + Identity Token | Allocated: Yes, Bonded: No | Security (AMN), Treasury (KHAZ) |
| **Working Group** | Lighter Safe, temporary | ALL funds recallable | Task forces |
| **Sub-DAO** | Full DAO structure, independent | Bonded funds NOT recallable | MIGA, CYRUS |

### Committee Identity Tokens

Each Committee has an identity token for membership and governance:

| Committee | Symbol | Token Name |
|:----------|:-------|:-----------|
| Security | SECURITY | امنیّت Token |
| Treasury | TREASURY | خزانه Token |
| Governance | GOVERN | داد Token |
| Health | HEALTH | سلامت Token |
| Culture | CULTURE | فرهنگ Token |
| Research | RESEARCH | دانش Token |
| Infrastructure | INFRA | سازندگی Token |
| Consular | CONSULAR | پیام Token |
| Venture | VENTURE | وقف Token |
| Impact | IMPACT | میزان Token |

### Yield Strategies

Committee vaults can deploy idle capital to approved yield strategies:

```solidity
interface IYieldStrategy {
    /// @notice Deposit assets into yield strategy
    function deposit(uint256 assets) external returns (uint256 shares);

    /// @notice Withdraw assets from yield strategy
    function withdraw(uint256 assets) external returns (uint256 withdrawn);

    /// @notice Get current APY
    function getAPY() external view returns (uint256);

    /// @notice Get strategy risk rating (1-10)
    function riskRating() external view returns (uint8);
}
```

**Approved Strategies** (per Committee risk tolerance):

| Committee | Max Risk | Approved Strategies |
|:----------|:---------|:--------------------|
| WAQF (Endowment) | 3 | Stablecoin yield, Treasury bonds |
| KHAZ (Treasury) | 4 | Diversified yield, POL |
| AMN (Security) | 2 | Stablecoin only |
| Others | 5 | Committee discretion |

### Spending Timelock

Large expenditures require timelock:

```solidity
interface ISpendingTimelock {
    /// @notice Queue a spending transaction
    function queueSpend(
        address vault,
        address recipient,
        uint256 amount,
        bytes calldata data
    ) external returns (bytes32 txId);

    /// @notice Execute after timelock
    function executeSpend(bytes32 txId) external;

    /// @notice Cancel queued transaction
    function cancelSpend(bytes32 txId) external;

    /// @notice Get timelock delay for amount
    function getDelay(uint256 amount) external view returns (uint256);
}
```

| Spend Amount | Timelock Delay |
|:-------------|:---------------|
| < $5,000 | None (Committee lead) |
| $5,000 - $25,000 | 24 hours |
| $25,000 - $100,000 | 48 hours |
| > $100,000 | 7 days |

### Spending Allowlist

Vaults maintain an allowlist of approved spending destinations:

```solidity
interface ISpendingAllowlist {
    /// @notice Add address to allowlist
    function addToAllowlist(address recipient, bytes32 category) external;

    /// @notice Remove from allowlist
    function removeFromAllowlist(address recipient) external;

    /// @notice Check if recipient is allowed
    function isAllowed(address recipient) external view returns (bool);

    /// @notice Get spending limit for recipient
    function getSpendingLimit(address recipient) external view returns (uint256);
}
```

## Security Considerations

### Fund Separation

- Allocated and bonded funds tracked separately
- Recall mechanics respect fund source
- Clear audit trail for all movements

### Vault Compromise

- Multi-sig requirement for large withdrawals
- Timelock allows community response
- Emergency pause available

### Yield Strategy Risks

- Approved strategy list maintained by governance
- Risk ratings enforced per Committee
- Emergency withdrawal mechanisms

### Parent Authority Limits

- Parent cannot recall bonded funds
- Preserves community sovereignty
- Prevents central capture

## References

- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)
- [PIP-7002: Treasury Management Standard](./pip-7002-treasury-management.md)
- [PIP-7003: Fee Routing Protocol](./pip-7003-fee-routing.md)
- [EIP-4626: Tokenized Vault Standard](https://eips.ethereum.org/EIPS/eip-4626)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
