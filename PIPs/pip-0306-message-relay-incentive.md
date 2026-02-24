---
pip: 306
title: "Message Relay Incentive"
description: "Token incentives for message relay nodes on Pars Network"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Communication
created: 2026-01-23
tags: [communication, incentive, relay, staking, asha]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a token incentive mechanism for nodes that relay, store, and forward messages on the Pars Network session layer. Relay nodes stake ASHA tokens, earn rewards proportional to their service quality, and face slashing for misbehavior. The system ensures that the session layer has sufficient infrastructure for reliable message delivery without relying on altruism alone.

## Motivation

The session layer depends on relay and swarm nodes to deliver messages:

1. **Infrastructure costs** -- running relay nodes requires bandwidth, storage, and compute that must be compensated
2. **Reliability** -- incentivized nodes have economic motivation to maintain high uptime and availability
3. **Geographic distribution** -- token rewards can be weighted to incentivize nodes in underserved regions
4. **Censorship resistance** -- a large, economically motivated relay network is harder to shut down than a volunteer network

## Specification

### Relay Node Requirements

| Requirement | Minimum | Recommended |
|:-----------|:--------|:-----------|
| ASHA stake | 500 ASHA | 2000 ASHA |
| Bandwidth | 10 Mbps | 100 Mbps |
| Storage | 50 GB | 500 GB |
| Uptime | 95% | 99.5% |
| Latency (p95) | 500 ms | 100 ms |

### Staking Contract

```solidity
interface IRelayStaking {
    function stake(uint256 amount) external;
    function unstake(uint256 amount) external;  // 7-day unbonding
    function claimRewards() external;
    function getRelayInfo(address relay) external view returns (RelayInfo memory);
    function slash(address relay, bytes memory evidence) external;
    function getRewardRate() external view returns (uint256 rewardPerEpoch);
}

struct RelayInfo {
    uint256 staked;
    uint256 pendingRewards;
    uint256 uptimeScore;      // 0-1000
    uint256 messagesRelayed;
    uint256 storageUsed;
    uint256 slashCount;
    uint256 registeredAt;
}
```

### Reward Calculation

Rewards are distributed per epoch (1 hour):

```
relay_reward = base_reward
             * stake_weight(relay)
             * uptime_score(relay)
             * service_quality(relay)
             * geographic_multiplier(relay)
```

Where:
- `stake_weight` = sqrt(staked_amount) / total_sqrt_stakes (square root to reduce plutocracy)
- `uptime_score` = measured_uptime / required_uptime (capped at 1.0)
- `service_quality` = successful_deliveries / total_attempts
- `geographic_multiplier` = 1.0 to 2.0 based on region scarcity

### Service Quality Metrics

| Metric | Weight | Measurement |
|:-------|:-------|:-----------|
| Delivery success | 40% | Messages delivered / messages received |
| Latency | 20% | Average relay latency |
| Storage reliability | 20% | Stored messages retrievable on demand |
| Uptime | 20% | Percentage of time online |

Metrics are measured via random sampling by a committee of staked validators who send test messages through relay nodes.

### Slashing Conditions

| Offense | Slash Amount | Evidence |
|:--------|:-----------|:---------|
| Message dropping | 5% of stake | Proof of receipt without forwarding |
| Message tampering | 50% of stake | Proof of modified ciphertext |
| Selective censorship | 25% of stake | Statistical proof of discriminatory dropping |
| Extended downtime (>48h) | 2% of stake | Automated monitoring |

### Geographic Incentive Zones

Regions with few relay nodes receive higher reward multipliers:

| Zone | Multiplier | Rationale |
|:-----|:----------|:----------|
| Iran | 2.0x | Highest censorship risk, most needed |
| Afghanistan | 2.0x | Extremely limited infrastructure |
| Central Asia | 1.5x | Underserved Persian-speaking communities |
| Global default | 1.0x | Baseline |

Zone classification is governed by the Pars DAO and updated quarterly.

## Rationale

- **Square-root stake weighting** prevents wealthy operators from dominating rewards
- **Quality-based rewards** incentivize good service, not just staking
- **Geographic multipliers** direct infrastructure to where it is most needed
- **Slashing** deters misbehavior with real economic consequences
- **7-day unbonding** prevents rapid stake-and-run attacks

## Security Considerations

- **Sybil relay nodes**: Stake requirements make it expensive to operate many fake nodes; quality metrics ensure staked but non-functional nodes earn nothing
- **Validator collusion**: The measurement committee is randomly selected from the validator set; collusion requires compromising a supermajority
- **Reward gaming**: Relaying your own messages to inflate delivery counts is detectable via traffic analysis; statistical outlier detection flags suspicious patterns
- **Stake centralization**: Square-root weighting and geographic multipliers promote a decentralized operator set
- **Economic sustainability**: The total relay reward budget is a fixed percentage of ASHA inflation, adjustable via governance

## References

- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [PIP-0008: Pars Economics](./pip-0008-pars-economics.md)
- [PIP-0305: Offline Messaging Queue](./pip-0305-offline-messaging-queue.md)
- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
