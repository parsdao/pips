---
pip: 7004
title: Gauge Controller and Emissions
tags: [governance, gauges, emissions, liquidity, incentives]
description: Defines the gauge-weighted emissions system for Pars Network
author: Pars DAO (@parsdao)
status: Draft
type: Standards Track
category: Governance
created: 2026-01-30
discussions-to: https://github.com/pars-network/pips/discussions/7004
order: 4
tier: governance
---

## Abstract

This PIP defines the Gauge Controller system for Pars Network. The Gauge Controller directs protocol emissions and fee distributions based on veASHA-weighted voting, enabling decentralized allocation of incentives across liquidity pools, staking vaults, and protocol operations.

## Motivation

Pars Network requires a flexible mechanism to:

1. **Direct liquidity incentives** to pools that benefit the protocol
2. **Reward participation** in staking and governance
3. **Adapt to market conditions** through community governance
4. **Prevent capture** by large stakeholders through balanced voting mechanics

The Gauge Controller provides:
- veASHA-weighted voting for emission allocation
- Time-decaying votes requiring ongoing engagement
- Balanced distribution across multiple gauge types
- Transparent, on-chain allocation decisions

## Specification

### Gauge Controller Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           GAUGE CONTROLLER                                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  VOTING LAYER                                                                        │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  veASHA Holders ──► Vote for Gauges ──► Weights Updated Weekly               │  │
│  │                                                                               │  │
│  │  Vote Properties:                                                             │  │
│  │  - Weight = veASHA balance × allocation percentage                           │  │
│  │  - Decay: 10% per week until refreshed                                       │  │
│  │  - Max allocation per gauge: 50%                                              │  │
│  │  - Min allocation per gauge: 1%                                               │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│                                      ▼                                               │
│  GAUGE REGISTRY                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                               │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │  │
│  │  │  Liquidity   │  │   Staking    │  │  Committee   │  │   Treasury   │     │  │
│  │  │   Gauges     │  │    Gauges    │  │    Gauges    │  │    Gauge     │     │  │
│  │  │              │  │              │  │              │  │              │     │  │
│  │  │ PARS/ETH     │  │ xPARS Vault  │  │ AMN, FARH    │  │ Main Treasury│     │  │
│  │  │ PARS/USDC    │  │              │  │ etc.         │  │              │     │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │  │
│  │                                                                               │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│                                      ▼                                               │
│  EMISSION DISTRIBUTION (Weekly)                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  90% of Protocol Fees ──► Distributed per Gauge Weight                        │  │
│  │                                                                               │  │
│  │  Example Distribution (100 PARS epoch):                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  PARS/ETH Gauge:     35% weight ──► 35 PARS                             │  │  │
│  │  │  xPARS Staking:      25% weight ──► 25 PARS                             │  │  │
│  │  │  PARS/USDC Gauge:    20% weight ──► 20 PARS                             │  │  │
│  │  │  Treasury Gauge:     10% weight ──► 10 PARS                             │  │  │
│  │  │  Committee Gauges:   10% weight ──► 10 PARS                             │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Gauge Controller Contract

```solidity
interface IGaugeController {
    // ═══════════════════════════════════════════════════════════════════════════════
    //                              GAUGE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Register a new gauge
    /// @param gauge The gauge contract address
    /// @param gaugeType The gauge type (liquidity, staking, committee, treasury)
    /// @param initialWeight Initial weight (governance can set)
    function addGauge(
        address gauge,
        GaugeType gaugeType,
        uint256 initialWeight
    ) external;

    /// @notice Remove a gauge from receiving emissions
    /// @param gauge The gauge to remove
    function removeGauge(address gauge) external;

    /// @notice Get all registered gauges
    /// @return Array of gauge addresses
    function getGauges() external view returns (address[] memory);

    // ═══════════════════════════════════════════════════════════════════════════════
    //                              VOTING
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Vote for gauge weight allocation
    /// @param gauges Array of gauge addresses to vote for
    /// @param weights Array of weight allocations (basis points, must sum to 10000)
    function voteForGauges(
        address[] memory gauges,
        uint256[] memory weights
    ) external;

    /// @notice Get user's current vote allocation
    /// @param user The voter address
    /// @return gauges Array of gauges voted for
    /// @return weights Array of weight allocations
    function getUserVotes(address user) external view returns (
        address[] memory gauges,
        uint256[] memory weights
    );

    /// @notice Get the effective weight of a user's vote (after decay)
    /// @param user The voter address
    /// @param gauge The gauge to check
    /// @return Effective voting weight
    function getEffectiveVoteWeight(
        address user,
        address gauge
    ) external view returns (uint256);

    // ═══════════════════════════════════════════════════════════════════════════════
    //                              WEIGHTS
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Get current gauge weight
    /// @param gauge The gauge address
    /// @return Current weight in basis points
    function getGaugeWeight(address gauge) external view returns (uint256);

    /// @notice Get relative weight for next epoch
    /// @param gauge The gauge address
    /// @return Relative weight (basis points of total)
    function getGaugeRelativeWeight(address gauge) external view returns (uint256);

    /// @notice Get total weight across all gauges
    /// @return Sum of all gauge weights
    function getTotalWeight() external view returns (uint256);

    /// @notice Checkpoint gauge weights for current epoch
    /// @dev Called weekly by keeper
    function checkpoint() external;

    // ═══════════════════════════════════════════════════════════════════════════════
    //                              DISTRIBUTION
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Distribute emissions to all gauges for current epoch
    /// @param token The token to distribute
    /// @param totalAmount Total amount to distribute
    function distributeEmissions(
        address token,
        uint256 totalAmount
    ) external;

    /// @notice Claim accumulated emissions for a gauge
    /// @param gauge The gauge to claim for
    /// @param token The token to claim
    /// @return Amount claimed
    function claimForGauge(
        address gauge,
        address token
    ) external returns (uint256);
}
```

### Gauge Types

| Type | ID | Purpose | Examples |
|:-----|:---|:--------|:---------|
| **Liquidity** | 0 | Incentivize DEX pools | PARS/ETH, PARS/USDC |
| **Staking** | 1 | Reward stakers | xPARS vault |
| **Committee** | 2 | Additional Committee funding | Any of 10 Committees |
| **Treasury** | 3 | Build reserves | Main Treasury |
| **Bond** | 4 | Subsidize bond markets | Bond market contracts |

### Voting Mechanics

#### Weight Calculation

```solidity
effective_weight = veASHA_balance × vote_allocation × decay_factor

where:
- veASHA_balance: User's veASHA at time of vote
- vote_allocation: Percentage allocated to gauge (0-10000 bps)
- decay_factor: (epochs_since_vote <= decay_period) ? 1 - (0.1 × epochs_since_vote) : 0
```

#### Vote Decay

Votes decay 10% per week to encourage ongoing participation:

| Weeks Since Vote | Decay Factor | Effective Weight |
|:-----------------|:-------------|:-----------------|
| 0 | 100% | Full weight |
| 1 | 90% | 0.90× |
| 2 | 80% | 0.80× |
| 3 | 70% | 0.70× |
| 10+ | 0% | No weight |

Users must refresh votes to maintain influence.

#### Weight Limits

| Constraint | Value | Purpose |
|:-----------|:------|:--------|
| **Max per gauge** | 50% | Prevent single gauge domination |
| **Min per gauge** | 1% | Ensure minimum viable allocation |
| **Max gauges per user** | 10 | Prevent vote dilution |

### Epoch Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEEKLY EPOCH CYCLE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Day 1-6: VOTING PERIOD                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  - Users vote for gauge allocations                          ││
│  │  - Votes can be changed any time                             ││
│  │  - Decayed votes can be refreshed                            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                      │                           │
│                                      ▼                           │
│  Day 7: CHECKPOINT                                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  - Weights frozen for epoch                                  ││
│  │  - Relative weights calculated                               ││
│  │  - Keeper calls checkpoint()                                 ││
│  └─────────────────────────────────────────────────────────────┘│
│                                      │                           │
│                                      ▼                           │
│  Day 7: DISTRIBUTION                                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  - FeeRouter sends gauge allocation                          ││
│  │  - Emissions distributed per weight                          ││
│  │  - Gauges accumulate for claim                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Gauge Implementations

#### Liquidity Gauge

For DEX pool incentives:

```solidity
interface ILiquidityGauge {
    /// @notice Deposit LP tokens to earn emissions
    function deposit(uint256 amount) external;

    /// @notice Withdraw LP tokens
    function withdraw(uint256 amount) external;

    /// @notice Claim earned emissions
    function claim() external returns (uint256);

    /// @notice Get claimable emissions for user
    function claimable(address user) external view returns (uint256);
}
```

#### Staking Gauge

For xPARS staking rewards:

```solidity
interface IStakingGauge {
    /// @notice Notify gauge of new emissions
    function notifyRewardAmount(uint256 amount) external;

    /// @notice Get reward rate per second
    function rewardRate() external view returns (uint256);

    /// @notice Get accumulated rewards per token
    function rewardPerToken() external view returns (uint256);
}
```

### Governance Parameters

| Parameter | Default | Description |
|:----------|:--------|:------------|
| `epochDuration` | 7 days | Length of voting epoch |
| `voteDecayPeriod` | 10 epochs | Epochs until vote fully decays |
| `maxGaugeWeight` | 5000 (50%) | Maximum weight per gauge |
| `minGaugeWeight` | 100 (1%) | Minimum weight per gauge |
| `checkpointBuffer` | 1 hour | Grace period for checkpoint |

All parameters adjustable via Council resolution (PIP-7000).

## Security Considerations

### Vote Manipulation

- veASHA requirement prevents Sybil attacks
- Decay mechanism prevents passive accumulation
- Weight caps prevent single gauge capture

### Emission Frontrunning

- Checkpoint timing is public but predictable
- Weight changes take effect next epoch
- No benefit to last-second voting

### Gauge Exploits

- New gauges require governance approval
- Gauge removal requires timelock
- Emergency pause available for compromised gauges

### Economic Attacks

- Minimum allocation prevents economic griefing
- Maximum allocation prevents liquidity concentration
- Committee base allocation ensures operational continuity

## References

- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)
- [PIP-7003: Fee Routing Protocol](./pip-7003-fee-routing.md)
- [Curve Gauge Controller](https://curve.readthedocs.io/dao-gauges.html)
- [Balancer Gauge System](https://docs.balancer.fi/concepts/vebal-and-gauges/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
