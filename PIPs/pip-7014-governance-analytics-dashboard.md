---
pip: 7014
title: "Governance Analytics Dashboard"
description: "On-chain analytics for governance participation, proposal outcomes, and delegate performance"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Governance
created: 2026-01-23
tags: [governance, analytics, dashboard, transparency, metrics]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines an on-chain governance analytics system for the Pars Network. All governance activity -- proposals, votes, delegations, treasury flows, and emergency actions -- is indexed and presented through a public dashboard. The analytics system provides transparency metrics, participation tracking, delegate performance scoring, and treasury health monitoring. All data is derived from on-chain events with no off-chain dependencies, ensuring the dashboard itself is censorship-resistant and trustless.

## Motivation

### Governance Transparency

Effective self-governance requires informed participants. Without analytics:
- Voter turnout trends are invisible
- Delegate performance is difficult to evaluate
- Treasury spending is opaque
- Governance health decline goes undetected until crisis

### Accountability

Public analytics create accountability for all governance participants:
- Delegates who promise participation but rarely vote are exposed
- Treasury spending is visible to all veASHA holders
- Proposal patterns (who proposes what, how often) are transparent
- Emergency governance usage is tracked and auditable

## Specification

### Metrics Categories

```go
type GovernanceMetrics struct {
    Participation  ParticipationMetrics
    Proposals      ProposalMetrics
    Delegates      DelegateMetrics
    Treasury       TreasuryMetrics
    Emergency      EmergencyMetrics
    Health         HealthScore
}
```

### Participation Metrics

```go
type ParticipationMetrics struct {
    // Voter turnout
    CurrentTurnout    float64   // % of veASHA that voted in latest proposal
    AvgTurnout30d     float64   // 30-day rolling average
    AvgTurnout90d     float64   // 90-day rolling average
    TurnoutTrend      float64   // Positive = increasing, negative = declining

    // Unique participants
    UniqueVoters30d   uint64    // Unique voter commitments in 30 days
    UniqueDelegators  uint64    // Active delegations
    NewParticipants   uint64    // First-time voters in current epoch

    // veASHA distribution
    VeASHAConcentration float64 // Gini coefficient of voting power
    Top10PowerPct       float64 // % of power held by top 10 addresses
    MedianVoterPower    uint64  // Median veASHA of active voters
}
```

### Proposal Metrics

```go
type ProposalMetrics struct {
    TotalProposals     uint64
    ActiveProposals    uint64
    PassRate           float64   // % of proposals that pass
    AvgVotingPeriod    uint64    // Average epochs to close
    ProposalsByType    map[string]uint64
    ProposalsByCategory map[string]uint64
    ControversialCount uint64    // Proposals with < 60% majority
    QuorumFailures     uint64    // Proposals that failed quorum
}
```

### Delegate Metrics

```go
type DelegateMetrics struct {
    TotalDelegates     uint64
    ActiveDelegates    uint64    // Voted in last 30 days
    AvgParticipation   float64   // Average delegate participation rate
    DelegationConcentration float64 // Gini of delegation distribution
    TopDelegates       []DelegateRanking
    WorstPerformers    []DelegateRanking
}

type DelegateRanking struct {
    DelegateID      [32]byte
    DisplayName     string
    Score           float64
    VotingPower     uint64
    ParticipationRate float64
    DelegatorCount  uint64
}
```

### Treasury Metrics

```go
type TreasuryMetrics struct {
    TotalBalance     uint64    // Current treasury ASHA
    InflowEpoch      uint64    // ASHA received this epoch
    OutflowEpoch     uint64    // ASHA spent this epoch
    BurnRate         float64   // Epochs until treasury depletion at current rate
    SpendingByCategory map[string]uint64
    LargestGrants    []GrantInfo
    QuadraticRounds  []RoundSummary
}
```

### Health Score

```go
type HealthScore struct {
    Overall        float64    // Aggregate governance health [0.0, 1.0]
    Components     HealthComponents
    Alerts         []HealthAlert
}

type HealthComponents struct {
    Participation  float64    // Voter turnout health
    Decentralization float64  // Power distribution health
    Activity       float64    // Proposal activity health
    Treasury       float64    // Treasury sustainability health
    Delegation     float64    // Delegation ecosystem health
}

type HealthAlert struct {
    Severity   uint8     // 1 (info) to 5 (critical)
    Category   string
    Message    string
    Metric     string    // Which metric triggered the alert
    Threshold  float64   // Alert threshold
    Current    float64   // Current value
}
```

### Alert Conditions

| Alert | Threshold | Severity |
|:------|:---------|:---------|
| Voter turnout below 10% | < 10% for 3 consecutive proposals | Critical (5) |
| Treasury burn rate < 6 months | < 26 epochs at current rate | High (4) |
| Delegate concentration > 50% | Top 3 delegates hold > 50% power | High (4) |
| Quorum failures > 30% | > 30% of proposals fail quorum | Medium (3) |
| New participant decline | < 50% of 30-day average | Low (2) |
| Controversial proposal rate | > 40% of proposals < 60% majority | Info (1) |

### On-Chain Indexing

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

interface IGovernanceAnalytics {
    function getParticipationRate(
        uint64 fromEpoch,
        uint64 toEpoch
    ) external view returns (uint256 rate);

    function getDelegateScore(
        bytes32 delegateId
    ) external view returns (uint256 score, uint256 participation);

    function getTreasuryHealth() external view returns (
        uint256 balance,
        uint256 burnRate,
        uint256 epochsRemaining
    );

    function getHealthScore() external view returns (
        uint256 overall,
        uint256 participation,
        uint256 decentralization,
        uint256 activity,
        uint256 treasury
    );

    function getAlerts() external view returns (
        bytes[] memory alerts
    );

    event HealthAlertRaised(uint8 severity, string category, string message);
}
```

### Dashboard Access

The dashboard is served through:
1. Mesh-hosted web application (censorship-resistant)
2. On-chain query interface (for programmatic access)
3. RSS/Atom feeds for alerts
4. Pars Session notifications for critical alerts (PIP-0005)

## Rationale

### Why On-Chain Only?

Off-chain analytics introduce trust dependencies and single points of failure. On-chain indexing ensures anyone can independently verify every metric, and the dashboard survives even if the front-end is blocked.

### Why Health Scores?

Individual metrics are useful for experts but overwhelming for casual participants. A single health score with component breakdown gives everyone a quick read on governance state, with drill-down available for those who want detail.

### Why Automated Alerts?

Governance decline is gradual and easy to miss. Automated alerts based on empirical thresholds surface problems before they become crises, giving the community time to course-correct.

## Security Considerations

- **Metric manipulation**: All metrics derived from immutable on-chain data; cannot be retroactively altered
- **Dashboard censorship**: Mesh-hosted with multiple gateways; on-chain data always accessible
- **Privacy**: Only aggregate metrics displayed; individual voter behavior is not exposed (PIP-0012 encrypted voting)
- **Alert fatigue**: Alert thresholds are governance-adjustable to prevent desensitization

## References

- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)
- [PIP-7002: Treasury Management](./pip-7002-treasury-management.md)
- [PIP-7012: Delegation Marketplace](./pip-7012-delegation-marketplace.md)
- [PIP-0012: Encrypted Voting](./pip-0012-encrypted-voting.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
