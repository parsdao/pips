---
pip: 7006
title: ASHA Reserve Token Architecture
tags: [governance, treasury, asha, bonding, reserve]
description: Defines ASHA as the sole reserve token with veASHA governance
author: Pars DAO (@parsdao)
status: Draft
type: Standards Track
category: Governance
created: 2026-01-30
discussions-to: https://github.com/pars-network/pips/discussions/7006
order: 6
tier: governance
---

## Abstract

This PIP defines ASHA (آشا) as the sole reserve token for Pars Protocol. ASHA is the only mintable/inflationary token in the system, backed by protocol treasury assets. Users obtain ASHA by bonding collateral assets (CYRUS, MIGA, PARS, stablecoins, ETH) at a discount. Governance power is exclusively through veASHA (vote-escrowed ASHA).

## Motivation

The previous vePARS model conflated the network gas token (PARS) with governance. This created several issues:

1. **Governance capture risk** — Large PARS holders could dominate governance
2. **Conflicting incentives** — Network gas needs vs governance locking
3. **Unclear backing** — No explicit treasury backing for governance token
4. **Multi-token confusion** — CYRUS, MIGA, PARS all competing for governance role

The ASHA architecture provides:

- **Single governance token** — veASHA is the only way to vote
- **Clear backing** — ASHA is backed by treasury assets
- **Bonding utility** — CYRUS/MIGA/PARS become useful collateral
- **OHM-style mechanics** — Protocol-owned liquidity and reserve currency

## Specification

### Token Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ASHA TOKEN ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  COLLATERAL LAYER                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  CYRUS │ MIGA │ PARS │ USDC/USDT │ ETH/WETH │ LP Tokens                     ││
│  │                                                                              ││
│  │  These are BONDABLE COLLATERAL - NOT governance tokens                       ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                      │                                           │
│                                      ▼                                           │
│  BONDING LAYER                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                              ││
│  │  Bond Collateral ──► Receive Discounted ASHA ──► Treasury Grows             ││
│  │                                                                              ││
│  │  Discount determined by:                                                     ││
│  │  • Collateral tier (S/A/B/C/D)                                              ││
│  │  • Control variable (CV)                                                     ││
│  │  • Debt ratio                                                                ││
│  │  • Vesting period (5 days default)                                          ││
│  │                                                                              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                      │                                           │
│                                      ▼                                           │
│  RESERVE LAYER                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                              ││
│  │  ASHA (آشا) - The sole reserve token                                        ││
│  │                                                                              ││
│  │  • Only inflationary token in the system                                    ││
│  │  • Backed by treasury assets                                                 ││
│  │  • Minted only through bonding                                              ││
│  │  • Can be staked for yield or locked for governance                         ││
│  │                                                                              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                      │                                           │
│                                      ▼                                           │
│  GOVERNANCE LAYER                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                              ││
│  │  ASHA ──► Lock (1 week to 4 years) ──► veASHA                               ││
│  │                                                                              ││
│  │  veASHA is the ONLY governance token:                                       ││
│  │  • Non-transferable                                                          ││
│  │  • Linear weight based on lock duration                                      ││
│  │  • Voting power decays as lock approaches expiry                            ││
│  │                                                                              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### ASHA Token Contract

```solidity
interface IASHA is IERC20 {
    // ═══════════════════════════════════════════════════════════════════════════════
    //                              CORE ERC20
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Token name: "ASHA"
    function name() external view returns (string memory);

    /// @notice Token symbol: "ASHA"
    function symbol() external view returns (string memory);

    /// @notice Decimals: 18
    function decimals() external view returns (uint8);

    // ═══════════════════════════════════════════════════════════════════════════════
    //                              MINTING (Bonding Only)
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Mint ASHA - ONLY callable by Treasury/Bonding contracts
    /// @param to Recipient address
    /// @param amount Amount to mint
    /// @dev Reverts if caller is not authorized minter
    function mint(address to, uint256 amount) external;

    /// @notice Check if address is authorized minter
    /// @param account Address to check
    function isMinter(address account) external view returns (bool);

    /// @notice Add minter (governance only)
    /// @param minter Address to authorize
    function addMinter(address minter) external;

    /// @notice Remove minter (governance only)
    /// @param minter Address to deauthorize
    function removeMinter(address minter) external;

    // ═══════════════════════════════════════════════════════════════════════════════
    //                              BACKING METRICS
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Get backing ratio (treasury value / ASHA supply)
    /// @return ratio Backing ratio in basis points (10000 = 1:1)
    function backingRatio() external view returns (uint256);

    /// @notice Get treasury address
    function treasury() external view returns (address);
}
```

### veASHA Lock Contract

```solidity
interface IVeASHA {
    // ═══════════════════════════════════════════════════════════════════════════════
    //                              LOCK MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Lock ASHA tokens to receive veASHA
    /// @param amount Amount of ASHA to lock
    /// @param duration Lock duration in seconds
    /// @return lockId The ID of the created lock
    function lock(uint256 amount, uint256 duration) external returns (uint256 lockId);

    /// @notice Extend an existing lock duration
    /// @param lockId ID of the existing lock
    /// @param newDuration New lock duration from current timestamp
    function extendLock(uint256 lockId, uint256 newDuration) external;

    /// @notice Add more ASHA to an existing lock
    /// @param lockId ID of the existing lock
    /// @param additionalAmount Amount of ASHA to add
    function increaseLock(uint256 lockId, uint256 additionalAmount) external;

    /// @notice Withdraw ASHA after lock expires
    /// @param lockId ID of the expired lock
    function withdraw(uint256 lockId) external;

    // ═══════════════════════════════════════════════════════════════════════════════
    //                              VOTING POWER
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Get current voting power for an account
    /// @param account The address to query
    /// @return Voting power (decays linearly)
    function votingPower(address account) external view returns (uint256);

    /// @notice Get voting power at a specific block
    /// @param account The address to query
    /// @param blockNumber The block to query
    function getPriorVotes(address account, uint256 blockNumber) external view returns (uint256);

    /// @notice Get total veASHA supply
    function totalSupply() external view returns (uint256);

    // ═══════════════════════════════════════════════════════════════════════════════
    //                              DELEGATION
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Delegate voting power to another address
    /// @param delegatee Address to delegate to
    function delegate(address delegatee) external;

    /// @notice Get current delegatee for an account
    /// @param account The address to query
    function delegates(address account) external view returns (address);

    // ═══════════════════════════════════════════════════════════════════════════════
    //                              LOCK PARAMETERS
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Minimum lock duration (1 week)
    function MIN_LOCK_DURATION() external view returns (uint256);

    /// @notice Maximum lock duration (4 years)
    function MAX_LOCK_DURATION() external view returns (uint256);
}
```

### Lock Duration & Weight

veASHA uses **linear weighting** based on lock duration:

```
veASHA_weight = (lock_duration / MAX_DURATION)
```

| Lock Duration | Weight | Example: 1000 ASHA |
|:--------------|:-------|:-------------------|
| 1 week | 0.0048x | 4.8 veASHA |
| 1 month | 0.021x | 21 veASHA |
| 3 months | 0.0625x | 62.5 veASHA |
| 6 months | 0.125x | 125 veASHA |
| 1 year | 0.25x | 250 veASHA |
| 2 years | 0.50x | 500 veASHA |
| 4 years | 1.00x | 1000 veASHA |

Voting power decays linearly as the lock approaches expiry.

### Bonding System

Users bond collateral assets to receive discounted ASHA:

```solidity
interface IBondDepository {
    /// @notice Bond collateral for discounted ASHA
    /// @param bondId The bond market ID
    /// @param amount Amount of collateral to bond
    /// @param maxPrice Maximum price willing to pay (slippage protection)
    /// @return payout Amount of ASHA to receive after vesting
    function deposit(
        uint256 bondId,
        uint256 amount,
        uint256 maxPrice
    ) external returns (uint256 payout);

    /// @notice Redeem vested ASHA
    /// @param bondId The bond market ID
    /// @param redeem Whether to redeem to wallet (true) or stake (false)
    function redeem(uint256 bondId, bool redeem) external returns (uint256);

    /// @notice Get bond price for a market
    /// @param bondId The bond market ID
    function bondPrice(uint256 bondId) external view returns (uint256);

    /// @notice Get discount for a market
    /// @param bondId The bond market ID
    /// @return discount Discount in basis points
    function currentDiscount(uint256 bondId) external view returns (uint256);
}
```

### Collateral Tiers

All assets can be liquid staked (PIP-7008) to receive L-tokens (LETH, LBTC, LPARS, LCYRUS, LMIGA). L-tokens receive bonus discounts because they're yield-bearing.

| Tier | Collateral | Max Discount | Vesting | Risk Weight |
|:-----|:-----------|:-------------|:--------|:------------|
| **S** | USDC, USDT, DAI | 3-8% | 5 days | 1.0x |
| **A** | ETH, WETH, WBTC | 5-12% | 7 days | 1.2x |
| **A+** | LETH, LBTC | 6-14% | 7 days | 1.1x |
| **B** | PARS (native) | 8-18% | 14 days | 1.5x |
| **B+** | LPARS | 10-20% | 14 days | 1.4x |
| **C** | CYRUS, MIGA | 10-22% | 21 days | 1.8x |
| **C+** | LCYRUS, LMIGA | 12-24% | 21 days | 1.7x |
| **D** | LP Tokens | 12-25% | 28 days | 2.0x |

**L-token Bonus**: Liquid staked tokens get +2% max discount and -0.1x risk weight because they:
- Generate yield while vesting
- Represent proven long-term commitment
- Provide additional backing value

### Bonding Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BONDING FLOW                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. DEPOSIT COLLATERAL                                                           │
│     User deposits 1000 USDC                                                      │
│     ┌─────────────────────────────────────────────────────────────────────────┐ │
│     │  Collateral: USDC (Tier S)                                              │ │
│     │  Amount: 1000 USDC                                                       │ │
│     │  Discount: 5%                                                            │ │
│     │  ASHA Price: $10 market, $9.50 bond                                      │ │
│     │  Payout: 105.26 ASHA ($1000 / $9.50)                                     │ │
│     │  Vesting: 5 days                                                          │ │
│     └─────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                           │
│  2. TREASURY RECEIVES COLLATERAL                                                 │
│     ┌─────────────────────────────────────────────────────────────────────────┐ │
│     │  Treasury receives: 1000 USDC                                            │ │
│     │  Treasury mints: 105.26 ASHA (vesting)                                   │ │
│     │  Backing increases by: 1000 USDC                                         │ │
│     └─────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                           │
│  3. VESTING PERIOD (5 days)                                                      │
│     ┌─────────────────────────────────────────────────────────────────────────┐ │
│     │  Day 1: 21.05 ASHA claimable                                             │ │
│     │  Day 2: 42.10 ASHA claimable                                             │ │
│     │  Day 3: 63.16 ASHA claimable                                             │ │
│     │  Day 4: 84.21 ASHA claimable                                             │ │
│     │  Day 5: 105.26 ASHA claimable (full)                                     │ │
│     └─────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                           │
│  4. CLAIM / STAKE / LOCK                                                         │
│     ┌─────────────────────────────────────────────────────────────────────────┐ │
│     │  Option A: Claim to wallet (liquid ASHA)                                 │ │
│     │  Option B: Auto-stake in xASHA (yield)                                   │ │
│     │  Option C: Lock for veASHA (governance)                                  │ │
│     └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Treasury Backing

ASHA is backed by diversified treasury assets:

| Asset Class | Target Allocation | Purpose |
|:------------|:------------------|:--------|
| **Stablecoins** | 40-50% | Stability, operational runway |
| **ETH/BTC** | 20-30% | Growth exposure, liquidity |
| **Ecosystem** | 15-25% | PARS, CYRUS, MIGA alignment |
| **POL** | 10-20% | Protocol-owned liquidity |

### Backing Ratio

```
Backing Ratio = Treasury Value / ASHA Supply
```

| Range | Status | Actions |
|:------|:-------|:--------|
| >110% | **Surplus** | May enable buybacks |
| 100-110% | **Healthy** | Normal operations |
| 90-100% | **Caution** | Reduce bond discounts |
| <90% | **Under-backed** | Halt new bonds, recovery mode |

### Governor Integration

veASHA integrates with the Governor module:

| Parameter | Value |
|:----------|:------|
| Proposal Threshold | 0.25% of veASHA supply |
| Quorum | 10% of veASHA supply |
| Approval Threshold | 50% (67% for treasury >$100K) |
| Voting Delay | 3 days |
| Voting Period | 7 days |
| Timelock | 48 hours |

## Security Considerations

### Bonding Risks

- **Discount manipulation** — Control variable adjusts slowly to prevent exploitation
- **Debt ceiling** — Maximum ASHA mintable per epoch prevents dilution
- **Vesting** — 5-day vesting prevents immediate arbitrage

### Governance Risks

- **Vote buying** — veASHA non-transferable, requires long-term commitment
- **Flash loans** — Cannot acquire veASHA via flash loans
- **Concentration** — Long lock periods distribute governance over time

### Treasury Risks

- **Backing collapse** — Emergency mode if backing ratio <90%
- **Asset concentration** — Diversification targets enforced by governance
- **Smart contract** — Multi-sig and timelock protect treasury

## References

- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)
- [PIP-7003: Fee Routing Protocol](./pip-7003-fee-routing.md)
- [PIP-7004: Gauge Controller](./pip-7004-gauge-controller.md)
- [PIP-7005: Vault Registry](./pip-7005-vault-registry.md)
- [PIP-7008: Liquid Staking Protocol](./pip-7008-liquid-staking.md)
- [Olympus DAO Documentation](https://docs.olympusdao.finance/)
- [Lido Finance Documentation](https://docs.lido.fi/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
