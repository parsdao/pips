---
pip: 7008
title: Liquid Staking Protocol
tags: [staking, liquid, leth, lbtc, lpars, defi]
description: Defines the liquid staking protocol for 1:1 in-kind receipt tokens
author: Pars DAO (@parsdao)
status: Draft
type: Standards Track
category: DeFi
created: 2026-01-30
discussions-to: https://github.com/pars-network/pips/discussions/7008
order: 8
tier: defi
---

## Abstract

This PIP defines the Liquid Staking Protocol for Pars Network. Users can deposit assets and receive 1:1 liquid staking tokens (L-tokens) that represent their staked position. L-tokens are always redeemable 1:1 for the underlying asset and can be used as collateral throughout the ecosystem.

## Motivation

Users holding assets like ETH, BTC, PARS, CYRUS, or MIGA face a choice:
- **Hold**: Keep assets liquid but earn no yield
- **Stake**: Earn yield but lose liquidity

Liquid staking solves this by providing:
1. **1:1 receipt tokens** that maintain full liquidity
2. **Yield accrual** while tokens remain usable
3. **Collateral utility** in DeFi protocols
4. **Composability** with ASHA bonding and other systems

## Specification

### Liquid Staking Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           LIQUID STAKING PROTOCOL                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  DEPOSIT LAYER                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                               │  │
│  │  ETH ──────► Stake ──────► LETH (1:1)                                        │  │
│  │  BTC ──────► Stake ──────► LBTC (1:1)                                        │  │
│  │  PARS ─────► Stake ──────► LPARS (1:1)                                       │  │
│  │  CYRUS ────► Stake ──────► LCYRUS (1:1)                                      │  │
│  │  MIGA ─────► Stake ──────► LMIGA (1:1)                                       │  │
│  │                                                                               │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│                                      ▼                                               │
│  YIELD LAYER                                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                               │  │
│  │  Underlying assets deployed to yield strategies:                              │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  ETH  → Validator staking, restaking (EigenLayer)                       │  │  │
│  │  │  BTC  → Wrapped BTC yield strategies                                    │  │  │
│  │  │  PARS → Protocol staking, gauge rewards                                 │  │  │
│  │  │  CYRUS/MIGA → DAO treasury yield                                        │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                               │  │
│  │  Yield accrues to L-token holders via rebasing or exchange rate             │  │
│  │                                                                               │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│                                      ▼                                               │
│  UTILITY LAYER                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                               │  │
│  │  L-tokens can be used for:                                                    │  │
│  │  • Collateral in lending protocols                                            │  │
│  │  • Liquidity provision (LETH/ETH, LPARS/PARS pools)                          │  │
│  │  • ASHA bonding (deposit LETH → get ASHA at discount)                        │  │
│  │  • Governance (LPARS counts for veASHA eligibility)                          │  │
│  │                                                                               │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### L-Token Contracts

#### Base Interface

```solidity
interface ILiquidStakingToken {
    // ═══════════════════════════════════════════════════════════════════════════════
    //                              STAKING
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Deposit underlying asset and receive L-token 1:1
    /// @param amount Amount of underlying to deposit
    /// @param recipient Address to receive L-tokens
    /// @return shares Amount of L-tokens minted
    function deposit(uint256 amount, address recipient) external returns (uint256 shares);

    /// @notice Deposit underlying asset (native ETH version)
    /// @param recipient Address to receive L-tokens
    /// @return shares Amount of L-tokens minted
    function depositETH(address recipient) external payable returns (uint256 shares);

    /// @notice Withdraw underlying asset by burning L-tokens
    /// @param amount Amount of L-tokens to burn
    /// @param recipient Address to receive underlying
    /// @return assets Amount of underlying returned
    function withdraw(uint256 amount, address recipient) external returns (uint256 assets);

    // ═══════════════════════════════════════════════════════════════════════════════
    //                              EXCHANGE RATE
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Get current exchange rate (L-token to underlying)
    /// @return rate Exchange rate with 18 decimals (starts at 1e18)
    function exchangeRate() external view returns (uint256 rate);

    /// @notice Convert L-token amount to underlying amount
    /// @param shares Amount of L-tokens
    /// @return assets Equivalent underlying amount
    function convertToAssets(uint256 shares) external view returns (uint256 assets);

    /// @notice Convert underlying amount to L-token amount
    /// @param assets Amount of underlying
    /// @return shares Equivalent L-token amount
    function convertToShares(uint256 assets) external view returns (uint256 shares);

    // ═══════════════════════════════════════════════════════════════════════════════
    //                              INFO
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice The underlying asset address
    function asset() external view returns (address);

    /// @notice Total underlying assets managed by this contract
    function totalAssets() external view returns (uint256);

    /// @notice Current APY from yield strategies
    function currentAPY() external view returns (uint256);
}
```

### L-Token Registry

| L-Token | Underlying | Symbol | Yield Source |
|:--------|:-----------|:-------|:-------------|
| **LETH** | ETH | Liquid Staked ETH | Validator staking, restaking |
| **LBTC** | WBTC | Liquid Staked BTC | BTC yield strategies |
| **LPARS** | PARS | Liquid Staked PARS | Protocol staking rewards |
| **LCYRUS** | CYRUS | Liquid Staked CYRUS | DAO treasury yield |
| **LMIGA** | MIGA | Liquid Staked MIGA | DAO treasury yield |

### Yield Strategies

Each L-token vault deploys underlying to yield-generating strategies:

#### LETH Strategies

| Strategy | Allocation | Expected APY |
|:---------|:-----------|:-------------|
| Validator Staking | 60% | 3-5% |
| Restaking (EigenLayer) | 30% | 2-8% |
| Reserve | 10% | 0% |

#### LPARS Strategies

| Strategy | Allocation | Expected APY |
|:---------|:-----------|:-------------|
| xPARS Staking | 70% | Variable |
| Gauge Rewards | 20% | Variable |
| Reserve | 10% | 0% |

### Yield Distribution Models

Two models supported:

#### 1. Rebasing (Default for LETH)

L-token balance increases automatically as yield accrues:

```solidity
// User deposits 1 ETH, gets 1 LETH
// After 1 year at 4% APY, user has 1.04 LETH
// Each LETH still redeems for 1 ETH
```

#### 2. Exchange Rate (Default for LPARS, LCYRUS, LMIGA)

L-token balance stays constant, exchange rate increases:

```solidity
// User deposits 100 PARS, gets 100 LPARS
// After 1 year at 10% APY, exchange rate = 1.1
// 100 LPARS redeems for 110 PARS
```

### Integration with ASHA Bonding

L-tokens can be used as collateral for ASHA bonding (PIP-7006):

```
┌─────────────────────────────────────────────────────────────────┐
│                    L-TOKEN → ASHA BONDING                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Liquid Stake                                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  ETH ──► Deposit ──► LETH (1:1)                             ││
│  │  Keeps earning yield while you decide what to do            ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  Step 2: Bond for ASHA (Optional)                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  LETH ──► Bond ──► ASHA at discount                         ││
│  │  You give up LETH, receive ASHA at 5-12% discount           ││
│  │  LETH goes to treasury, ASHA minted to you                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  Step 3: Lock for Governance (Optional)                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  ASHA ──► Lock ──► veASHA                                   ││
│  │  veASHA = governance power                                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Bonding Tier Updates (L-tokens)

L-tokens get favorable bonding rates since they're yield-bearing:

| Tier | Collateral | Discount Range | Lock Period |
|:-----|:-----------|:---------------|:------------|
| S | USDC, USDT, DAI | 3-8% | 5 days |
| A | ETH, WBTC | 5-12% | 7 days |
| A+ | **LETH, LBTC** | 6-14% | 7 days |
| B | PARS | 8-18% | 14 days |
| B+ | **LPARS** | 10-20% | 14 days |
| C | CYRUS, MIGA | 10-22% | 21 days |
| C+ | **LCYRUS, LMIGA** | 12-24% | 21 days |
| D | LP tokens | 12-25% | 28 days |

### Withdrawal Queue

To ensure solvency, withdrawals may be queued during high demand:

```solidity
interface IWithdrawalQueue {
    /// @notice Request withdrawal (instant if liquidity available)
    /// @param amount L-tokens to withdraw
    /// @return requestId Withdrawal request ID (0 if instant)
    function requestWithdrawal(uint256 amount) external returns (uint256 requestId);

    /// @notice Claim queued withdrawal
    /// @param requestId The withdrawal request ID
    function claimWithdrawal(uint256 requestId) external;

    /// @notice Check if withdrawal is claimable
    function isClaimable(uint256 requestId) external view returns (bool);

    /// @notice Time until withdrawal is claimable
    function timeUntilClaimable(uint256 requestId) external view returns (uint256);
}
```

### Governance Parameters

| Parameter | Default | Description |
|:----------|:--------|:------------|
| `withdrawalDelay` | 0-7 days | Queue delay when reserve < 10% |
| `reserveRatio` | 10% | Minimum liquid reserve |
| `maxDepositCap` | Variable | Per-token deposit limit |
| `strategyAllocation` | Per-token | Yield strategy weights |
| `performanceFee` | 10% | Fee on yield (to treasury) |

## Security Considerations

### Depeg Risk

- L-tokens should trade at or near 1:1 with underlying
- Arbitrage keeps peg stable (deposit cheap, withdraw expensive)
- Oracle price feeds use TWAP to resist manipulation

### Smart Contract Risk

- Yield strategies vetted by AMN Committee
- Strategy caps limit exposure per strategy
- Emergency withdrawal to reserve

### Liquidity Risk

- 10% reserve ensures most withdrawals instant
- Queue system for high-demand periods
- Priority withdrawal for long-term holders

## References

- [PIP-7006: ASHA Reserve Token](./pip-7006-asha-reserve-token.md)
- [PIP-7005: Vault Registry](./pip-7005-vault-registry.md)
- [Lido stETH](https://docs.lido.fi/)
- [Rocket Pool rETH](https://docs.rocketpool.net/)
- [Alchemix alETH](https://alchemix-finance.gitbook.io/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
