---
pip: 7003
title: Fee Routing Protocol
tags: [governance, treasury, fees, gauges, revenue]
description: Defines the fee collection and distribution mechanism for Pars Network
author: Pars DAO (@parsdao)
status: Draft
type: Standards Track
category: Governance
created: 2026-01-30
discussions-to: https://github.com/pars-network/pips/discussions/7003
order: 3
tier: governance
---

## Abstract

This PIP defines the Fee Routing Protocol for Pars Network. It establishes how protocol fees are collected, aggregated, and distributed across the ecosystem including the 10 Committees, gauge-directed emissions, and staker rewards.

## Motivation

Pars Network generates revenue from multiple sources:
- Bond premiums
- Advance facility fees
- Protocol-owned liquidity trading fees
- Yield from treasury positions

This revenue must be distributed transparently and efficiently to:
1. Fund the 10 operational Committees
2. Reward veASHA stakers
3. Incentivize liquidity via gauge-directed emissions
4. Build treasury reserves

Without a standardized fee routing system:
- Distribution would require manual governance actions
- Committee funding would be inconsistent
- Staker rewards would be unpredictable
- Gauge incentives could not respond to market conditions

## Specification

### Fee Routing Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           FEE ROUTING PROTOCOL                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  REVENUE SOURCES                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Bond Premiums │ Advance Fees │ Trading Fees │ Yield │ Liquidations          │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│                                      ▼                                               │
│  FEE ROUTER                                                                          │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                               │  │
│  │  Revenue In ──► Aggregate ──► Distribute per epoch                            │  │
│  │                                                                               │  │
│  │  Distribution Split:                                                          │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  10% ──► Base Allocation (10 Committees)                                │  │  │
│  │  │  │       └──► KHAZ 25% │ AMN 10% │ SAL 10% │ FARH 10% │ DAN 10%        │  │  │
│  │  │  │           └──► SAZ 10% │ DAD 5% │ PAY 5% │ WAQF 10% │ MIZ 5%        │  │  │
│  │  │  │                                                                      │  │  │
│  │  │  90% ──► Gauge Controller                                               │  │  │
│  │  │         └──► veASHA-weighted gauge voting determines allocation         │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                               │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│                                      ▼                                               │
│  DISTRIBUTION TARGETS                                                                │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐            │
│  │ Committee │ │  xPARS    │ │ Liquidity │ │ Treasury  │ │  Bonds    │            │
│  │ Treasuries│ │  Stakers  │ │  Gauges   │ │ Reserves  │ │  Market   │            │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘            │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Fee Router Contract

The FeeRouter is the central hub for all protocol fee collection:

```solidity
interface IFeeRouter {
    /// @notice Deposit fees into the router
    /// @param token The fee token (PARS, USDC, etc.)
    /// @param amount Amount of fees
    /// @param source Revenue source identifier
    function depositFees(
        address token,
        uint256 amount,
        bytes32 source
    ) external;

    /// @notice Trigger epoch distribution
    /// @dev Called by keeper or governance at epoch boundaries
    function distributeEpoch() external;

    /// @notice Get current epoch accumulated fees
    /// @return Total fees per token in current epoch
    function getEpochFees() external view returns (FeeAccumulator[] memory);

    /// @notice Get distribution split configuration
    /// @return baseAllocationPct Percentage to Committees (basis points)
    /// @return gaugeAllocationPct Percentage to GaugeController (basis points)
    function getDistributionSplit() external view returns (
        uint256 baseAllocationPct,
        uint256 gaugeAllocationPct
    );
}
```

### Distribution Split

| Allocation | Percentage | Recipient | Purpose |
|:-----------|:-----------|:----------|:--------|
| **Base Allocation** | 10% | 10 Committees | Guaranteed operational funding |
| **Gauge-Directed** | 90% | GaugeController | veASHA-weighted distribution |

The base allocation ensures Committees have predictable funding regardless of gauge voting outcomes.

### Base Allocation Distribution

The 10% base allocation is split among Committees according to PIP-7002:

| Committee | Symbol | Share of Base | Effective Total |
|:----------|:-------|:--------------|:----------------|
| Treasury | KHAZ | 25% | 2.5% of fees |
| Security | AMN | 10% | 1.0% of fees |
| Health | SAL | 10% | 1.0% of fees |
| Culture | FARH | 10% | 1.0% of fees |
| Research | DAN | 10% | 1.0% of fees |
| Infrastructure | SAZ | 10% | 1.0% of fees |
| Governance | DAD | 5% | 0.5% of fees |
| Consular | PAY | 5% | 0.5% of fees |
| Endowment | WAQF | 10% | 1.0% of fees |
| Integrity | MIZ | 5% | 0.5% of fees |

### Gauge Controller Integration

The remaining 90% flows to the GaugeController for veASHA-weighted distribution:

```solidity
interface IGaugeController {
    /// @notice Get gauge weight for a recipient
    /// @param gauge The gauge address
    /// @return Weight in basis points
    function getGaugeWeight(address gauge) external view returns (uint256);

    /// @notice Vote for gauge weight allocation
    /// @param gauge The gauge to vote for
    /// @param weight Weight allocation (basis points of voter's veASHA)
    function vote(address gauge, uint256 weight) external;

    /// @notice Get total weight across all gauges
    /// @return Total weight sum
    function getTotalWeight() external view returns (uint256);

    /// @notice Distribute fees to gauges based on weights
    /// @param token Token to distribute
    /// @param amount Total amount to distribute
    function distribute(address token, uint256 amount) external;
}
```

### Gauge Types

| Gauge Type | Purpose | Example Recipients |
|:-----------|:--------|:-------------------|
| **Liquidity Gauges** | Incentivize DEX liquidity | PARS/ETH, PARS/USDC pools |
| **Staking Gauges** | Reward xPARS stakers | xPARS vault |
| **Committee Gauges** | Additional Committee funding | Any of 10 Committees |
| **Treasury Gauge** | Build reserves | Main Treasury |
| **Bond Gauge** | Subsidize bond markets | Bond market contracts |

### Epoch Mechanics

Fees are distributed on a weekly epoch cycle:

| Phase | Duration | Description |
|:------|:---------|:------------|
| **Accumulation** | 6 days | Fees accumulate in FeeRouter |
| **Distribution** | 1 day | Keeper triggers distribution |
| **Claim** | Ongoing | Recipients claim their allocation |

### Receipt Registry

All fee distributions are recorded on-chain for transparency:

```solidity
interface IReceiptRegistry {
    /// @notice Record a fee distribution
    /// @param epoch The epoch number
    /// @param recipient The receiving address
    /// @param token Token distributed
    /// @param amount Amount distributed
    /// @param source Distribution source (base/gauge)
    function recordDistribution(
        uint256 epoch,
        address recipient,
        address token,
        uint256 amount,
        bytes32 source
    ) external;

    /// @notice Get distribution history for a recipient
    /// @param recipient The address to query
    /// @param fromEpoch Starting epoch
    /// @param toEpoch Ending epoch
    /// @return Array of distribution records
    function getDistributions(
        address recipient,
        uint256 fromEpoch,
        uint256 toEpoch
    ) external view returns (DistributionRecord[] memory);
}
```

### Governance Parameters

| Parameter | Default Value | Governance Control |
|:----------|:--------------|:-------------------|
| `baseAllocationPct` | 1000 (10%) | Council resolution |
| `epochDuration` | 7 days | Council resolution |
| `minGaugeWeight` | 100 (1%) | Council resolution |
| `maxGaugeWeight` | 5000 (50%) | Council resolution |
| `voteDecayPeriod` | 30 days | Council resolution |

## Security Considerations

### Fee Manipulation

- Revenue sources are whitelisted contracts only
- Fee deposits require valid source identifier
- Epoch timing prevents flash loan attacks on distribution

### Gauge Voting

- veASHA-weighted voting prevents Sybil attacks
- Vote decay requires ongoing engagement
- Maximum weight cap prevents single gauge domination

### Distribution Safety

- Multi-sig approval for parameter changes
- Timelock on distribution split modifications
- Emergency pause via 2-of-5 Guardian signers

## References

- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)
- [PIP-7002: Treasury Management Standard](./pip-7002-treasury-management.md)
- [Curve Gauge Controller](https://curve.readthedocs.io/dao-gauges.html)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
