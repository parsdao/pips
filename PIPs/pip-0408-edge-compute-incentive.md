---
pip: 408
title: "Edge Compute Incentive"
description: "Token incentives for edge computing on mobile Pars nodes including NPU and GPU contributions"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: AI
created: 2026-01-23
tags: [ai, edge-computing, mobile, incentive, npu]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines an incentive mechanism for edge computing contributions from mobile Pars nodes (PIP-0004). Mobile devices with Neural Processing Units (NPUs) and GPUs can contribute compute for lightweight AI inference, federated learning (PIP-0404), and content processing tasks. Contributors earn ASHA proportional to verified compute contributions, with rewards calibrated to cover device wear, battery consumption, and bandwidth costs.

## Motivation

### Untapped Mobile Compute

The Persian diaspora overwhelmingly accesses the internet through mobile devices. Modern phones contain powerful NPUs capable of running inference on quantized models. This compute is idle most of the time. Edge compute incentives transform passive users into active network contributors.

### Resilient Infrastructure

Edge compute provides infrastructure resilience that datacenter-only approaches cannot:
1. **Geographic distribution** -- compute available wherever diaspora members are
2. **Censorship resistance** -- no data centers to raid or block
3. **Cost efficiency** -- marginal cost of idle phone compute approaches zero
4. **Scalability** -- the network grows with its user base

## Specification

### Edge Node Registration

```go
type EdgeNode struct {
    NodeID          [32]byte     // Anonymous commitment
    DeviceClass     DeviceClass
    NPUCapability   NPUSpec
    GPUCapability   GPUSpec
    AvailableRAM    uint64       // Bytes available for inference
    BatteryPolicy   BatteryPolicy
    BandwidthCap    uint64       // Monthly bandwidth limit in bytes
    Reputation      uint64       // Accumulated reputation score
}

type DeviceClass uint8

const (
    DevicePhoneHigh   DeviceClass = iota // Flagship phone (A18, Snapdragon 8 Gen 4)
    DevicePhoneMid                        // Mid-range (Snapdragon 7 series)
    DevicePhoneLow                        // Entry-level
    DeviceTablet                          // Tablet
    DeviceLaptop                          // Laptop with integrated GPU
)

type BatteryPolicy struct {
    MinBatteryPct    uint8   // Don't compute below this %
    ChargingOnly     bool    // Only compute while charging
    MaxThermalC      uint8   // Stop if device exceeds temperature
}
```

### Task Assignment

Tasks are matched to edge nodes based on capability:

| Task Type | Min Device Class | Typical Duration | CU Reward |
|:----------|:----------------|:----------------|:----------|
| Text inference (small model) | PhoneMid | 1-5s | 0.5 |
| Image classification | PhoneMid | 0.5-2s | 0.3 |
| Embedding generation | PhoneLow | 0.1-0.5s | 0.1 |
| Federated learning round | PhoneHigh | 30-120s | 5.0 |
| Content indexing | PhoneLow | 1-10s | 0.2 |
| Translation (short text) | PhoneMid | 1-3s | 0.4 |

### Reward Calculation

```go
func CalculateEdgeReward(task CompletedTask, node EdgeNode) uint64 {
    baseReward := task.ComputeUnits

    // Device class multiplier (compensate for wear on more expensive devices)
    classMultiplier := deviceClassMultiplier(node.DeviceClass)

    // Reliability bonus (consistent availability)
    reliabilityBonus := reliabilityScore(node.Reputation)

    // Battery cost compensation
    batteryCost := estimateBatteryCost(task.Duration, task.PowerDraw)

    reward := uint64(float64(baseReward) * classMultiplier * reliabilityBonus) + batteryCost
    return reward
}
```

### Verification

Edge compute results are verified through:

1. **Redundant execution** -- same task sent to 2-3 nodes; majority result wins
2. **Spot checks** -- random tasks with known answers verify node honesty
3. **Reputation tracking** -- nodes build reputation over time; dishonest nodes lose stake
4. **Latency bounds** -- results must arrive within expected time for the device class

### Slashing Conditions

```go
type SlashingCondition uint8

const (
    SlashIncorrectResult SlashingCondition = iota // Verifiably wrong output
    SlashTimeout                                    // Accepted task but never responded
    SlashSybil                                      // Multiple nodes from same device
    SlashSpam                                       // Submitting junk results
)
```

Slashing deducts from staked ASHA and reduces reputation. Three slashing events within one epoch trigger temporary ban.

## Rationale

### Why Not Just Use Cloud GPUs?

Cloud GPUs are centralized, expensive, and blockable. Edge compute is decentralized, nearly free (marginal cost), and distributed across the entire diaspora. For lightweight tasks, edge compute is both cheaper and more resilient.

### Why Battery-Aware Policies?

Users will not contribute compute if it visibly drains their battery or heats their phone. Battery-aware policies ensure contributions are invisible to the user experience, maintaining participation rates.

### Why Reputation-Based Rewards?

Reputation rewards encourage consistent, long-term participation over drive-by compute. Reliable nodes that are consistently available earn more, creating a stable compute base.

## Security Considerations

- **Result manipulation**: Redundant execution with majority consensus; spot checks with known answers
- **Sybil nodes**: Each node requires veASHA stake; device attestation prevents one device running multiple nodes
- **Battery drain attacks**: Tasks are size-limited; nodes enforce local battery policies
- **Privacy of compute tasks**: Tasks are encrypted; edge nodes see inputs but not requester identity (PIP-0400)

## References

- [PIP-0004: Mobile Embedded Node](./pip-0004-mobile-embedded-node.md)
- [PIP-0006: AI Mining Integration](./pip-0006-ai-mining-integration.md)
- [PIP-0400: Decentralized Inference Protocol](./pip-0400-decentralized-inference-protocol.md)
- [PIP-0402: Compute Credit System](./pip-0402-compute-credit-system.md)
- [PIP-0404: Federated Learning Framework](./pip-0404-federated-learning-framework.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
