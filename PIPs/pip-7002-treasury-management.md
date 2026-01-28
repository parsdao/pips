---
pip: 7002
title: Treasury Management Standard
tags: [governance, treasury, safe, sablier, payments]
description: Defines treasury management policies for Pars Network DAO
author: Pars Network Team (@pars-network)
status: Draft
type: Standards Track
category: Governance
created: 2026-01-28
discussions-to: https://github.com/pars-network/pips/discussions/7002
order: 2
tier: governance
---

## Abstract

This PIP defines the treasury management standard for Pars DAO. It establishes policies for fund custody, spending authorization, contributor payments, reserve requirements, and emergency procedures. The treasury operates through a Safe multisig with Azorius governance integration and uses Sablier for continuous streaming payments.

## Motivation

Responsible treasury management is essential for long-term sustainability of Pars Network:

1. **Accountability** - Community funds must be managed transparently with clear authorization policies
2. **Security** - Multi-layered authorization prevents theft, mismanagement, and single-point-of-failure risks
3. **Sustainability** - Reserve requirements and diversification ensure operational continuity
4. **Efficiency** - Streaming payments and tiered approvals enable rapid allocation without sacrificing oversight
5. **Resilience** - Emergency procedures protect funds during crisis scenarios

Without formalized treasury management:
- Large transfers could be executed without sufficient community review
- Concentration in a single asset exposes the DAO to catastrophic loss
- Lack of reserve policy risks operational shutdown during market downturns
- No emergency procedures leaves funds vulnerable during attacks

## Specification

### Treasury Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           PARS DAO TREASURY                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  GOVERNANCE LAYER (PIP-7000)                                                        │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  vePARS Voting ──► Azorius Module ──► Proposal Approval                      │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│                                      ▼                                               │
│  CUSTODY LAYER (Safe Multisig)                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                               │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │  │
│  │  │  Main Treasury   │  │  Operations      │  │  Grants          │              │  │
│  │  │  (3-of-5)        │  │  (2-of-5)        │  │  (3-of-5)        │              │  │
│  │  │                  │  │                  │  │                  │              │  │
│  │  │  Long-term       │  │  Monthly opex    │  │  Ecosystem       │              │  │
│  │  │  reserves        │  │  up to $10K/mo   │  │  development     │              │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘              │  │
│  │                                                                               │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│                                      ▼                                               │
│  PAYMENT LAYER (Sablier Streams)                                                    │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Contributor Streams    Grant Streams    Vesting Streams                      │  │
│  │  ┌──────────────┐     ┌──────────────┐  ┌──────────────┐                     │  │
│  │  │ Monthly pay  │     │ Milestone    │  │ Token vest   │                     │  │
│  │  │ continuous   │     │ based        │  │ 4-year cliff │                     │  │
│  │  └──────────────┘     └──────────────┘  └──────────────┘                     │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Multi-Sig Policies

The treasury uses multiple Safe vaults with different authorization levels:

| Vault | Threshold | Purpose | Monthly Limit |
|:------|:----------|:--------|:--------------|
| **Main Treasury** | 3-of-5 | Long-term reserves, large allocations | Governance approval required |
| **Operations** | 2-of-5 | Recurring operational expenses | $10,000 |
| **Grants** | 3-of-5 | Ecosystem grants and bounties | Governance approval required |

For the Main Treasury, higher thresholds apply to large transfers:

| Transfer Size | Signer Threshold | Additional Requirements |
|:--------------|:-----------------|:-----------------------|
| Standard operations | 3-of-5 | Standard governance proposal |
| Large transfers ($100K+) | 4-of-5 | Super-majority vote (67%), 30-day timelock |

### Spending Tiers

All treasury expenditures follow a tiered approval process:

#### Tier 1: Under $10,000

| Parameter | Value |
|:----------|:------|
| **Proposal Type** | Standard |
| **Voting Period** | 7 days |
| **Quorum** | 10% of circulating vePARS |
| **Approval Threshold** | >50% |
| **Timelock** | 48 hours |
| **Signer Threshold** | 3-of-5 |

#### Tier 2: $10,000 - $100,000

| Parameter | Value |
|:----------|:------|
| **Proposal Type** | Extended Review |
| **Voting Period** | 14 days |
| **Quorum** | 15% of circulating vePARS |
| **Approval Threshold** | >50% |
| **Timelock** | 7 days |
| **Signer Threshold** | 3-of-5 |

#### Tier 3: Over $100,000

| Parameter | Value |
|:----------|:------|
| **Proposal Type** | Major Allocation |
| **Voting Period** | 21 days |
| **Quorum** | 20% of circulating vePARS |
| **Approval Threshold** | >67% (super-majority) |
| **Timelock** | 30 days |
| **Signer Threshold** | 4-of-5 |

### Sablier Streaming Payments

Contributors and grant recipients receive payments via Sablier token streams:

```solidity
interface ITreasuryStreams {
    /// @notice Create a contributor payment stream
    /// @param recipient Contributor address
    /// @param totalAmount Total PARS for the stream period
    /// @param startTime Stream start timestamp
    /// @param endTime Stream end timestamp
    /// @return streamId The Sablier stream identifier
    function createContributorStream(
        address recipient,
        uint256 totalAmount,
        uint256 startTime,
        uint256 endTime
    ) external returns (uint256 streamId);

    /// @notice Create a milestone-based grant stream
    /// @param recipient Grant recipient address
    /// @param milestones Array of (amount, unlockTime) pairs
    /// @return streamId The Sablier stream identifier
    function createGrantStream(
        address recipient,
        Milestone[] memory milestones
    ) external returns (uint256 streamId);

    /// @notice Cancel a stream (returns unvested funds to treasury)
    /// @param streamId The stream to cancel
    function cancelStream(uint256 streamId) external;
}
```

**Stream Types**:

| Type | Curve | Use Case |
|:-----|:------|:---------|
| **Contributor** | Linear | Monthly contributor compensation, continuous vesting |
| **Grant** | Cliff + Linear | Ecosystem grants with milestone-based unlocks |
| **Vesting** | Cliff + Linear | Team token vesting (1-year cliff, 4-year total) |

**Stream Benefits**:
- Contributors receive compensation continuously (claimable at any time)
- DAO can cancel streams if contributor stops contributing (unvested funds return to treasury)
- Transparent: all streams visible on-chain
- Reduces treasury management overhead (no manual monthly transfers)

### Reserve Requirements

The DAO must maintain minimum reserves at all times:

| Requirement | Value | Description |
|:------------|:------|:------------|
| **Operational Runway** | 6 months minimum | Sufficient funds to cover all active contributor streams and operational costs |
| **Stablecoin Reserve** | 30% of operational runway | Denominated in USDC/DAI to hedge volatility |
| **Emergency Fund** | $100,000 minimum | Immediately accessible for security incidents |

If reserves fall below the minimum, all Tier 2 and Tier 3 spending is automatically suspended until reserves are replenished.

### Diversification Policy

The treasury must maintain asset diversification:

| Constraint | Limit | Description |
|:-----------|:------|:------------|
| **Single Asset Maximum** | 30% of total treasury | No single asset (excluding PARS) may exceed 30% |
| **Stablecoin Minimum** | 20% of total treasury | Minimum stablecoin allocation for stability |
| **PARS Maximum** | 50% of total treasury | Prevents excessive exposure to native token |
| **Rebalancing Period** | Quarterly | Treasury composition reviewed every 90 days |

### Quarterly Treasury Reports

The treasury committee must publish quarterly reports including:

1. **Balance Sheet**: All assets held across all vaults
2. **Income Statement**: Revenue sources and amounts
3. **Expenditure Report**: All outflows categorized by type
4. **Stream Status**: Active contributor and grant streams
5. **Reserve Compliance**: Current reserves vs. minimum requirements
6. **Diversification Compliance**: Current allocation vs. policy limits
7. **Upcoming Obligations**: Projected expenses for next quarter

Reports are published on-chain (IPFS hash stored in governance contract) and on the governance portal (pars.vote).

### Emergency Procedures

#### Emergency Freeze

Any 2-of-5 Safe signers can trigger an emergency freeze:

```solidity
interface IEmergencyFreeze {
    /// @notice Trigger emergency freeze on all treasury vaults
    /// @param reason Description of the emergency
    /// @dev Requires 2-of-5 signers to co-sign within 1 hour
    function emergencyFreeze(string memory reason) external;

    /// @notice Lift emergency freeze
    /// @dev Requires 3-of-5 signers or governance vote
    function liftFreeze() external;
}
```

- **Duration**: 72 hours maximum
- **Effect**: All pending transactions and streams are paused
- **Extension**: Requires governance vote to extend beyond 72 hours
- **Notification**: All vePARS holders notified via Session daemon (PIP-0005)

#### Emergency Recovery

In case of signer compromise:

1. Remaining signers freeze the treasury
2. Emergency governance proposal to replace compromised signer (expedited 3-day vote)
3. New signer added via governance execution
4. Freeze lifted by remaining honest signers

## Audit Requirements

### Financial Audits

- **Quarterly**: Internal audit by treasury committee
- **Annual**: External audit by independent third party
- **Continuous**: On-chain transparency (all transactions publicly visible)

### Smart Contract Audits

- All treasury contracts audited before deployment
- Any contract upgrades require fresh audit
- Bug bounty program for treasury-related contracts

## Security Considerations

### Fund Safety

- Multi-sig prevents unilateral fund movement
- Tiered approval scales security with transfer size
- Timelock allows community review of large transfers
- Emergency freeze provides rapid response to threats

### Signer Security

- Signers must use hardware wallets
- Post-quantum signatures supported for signer operations (PIP-0002)
- Signer key rotation every 6 months
- No single signer has access to more than one vault's threshold

### Economic Security

- Reserve requirements prevent insolvency
- Diversification prevents catastrophic loss from single asset
- Streaming payments prevent large lump-sum extraction
- Quarterly reporting ensures transparency

### Censorship Resistance

- Treasury operations execute on Pars EVM (censorship-resistant by design)
- Emergency procedures accessible via mesh network (PIP-0001)
- No dependence on centralized infrastructure for fund management

## References

- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)
- [PIP-0001: Mesh Network](./pip-0001-mesh-network.md)
- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [Gnosis Safe Documentation](https://docs.safe.global)
- [Sablier Documentation](https://docs.sablier.com)
- [Azorius Module](https://github.com/decentdao/decent-contracts)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
