---
pip: 402
title: "Compute Credit System"
description: "Tokenized compute credits for AI workloads with privacy-preserving payment channels"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: AI
created: 2026-01-23
tags: [ai, compute, credits, tokens, payment]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a tokenized compute credit system for AI workloads on the Pars Network. Users acquire compute credits by staking or spending ASHA, then spend credits on inference (PIP-0400), training (PIP-0404), and other AI services without per-transaction identity linkage. Credits are managed through anonymous payment channels that batch multiple inference calls into single on-chain settlements, reducing gas costs and enhancing privacy.

## Motivation

### Privacy-Preserving AI Payments

Per-inference on-chain payments create a transaction trail that links users to their AI usage patterns. A user querying about asylum law, then medical symptoms, then political organizing creates a deanonymizing profile. Compute credits decouple payment from usage:

1. **Batch settlement** -- multiple inferences settle as a single credit deduction
2. **Prepaid privacy** -- credits purchased in advance; spending is off-chain
3. **No usage profiling** -- on-chain observers see credit purchases, not individual queries

### Economic Sustainability

Node operators need predictable revenue to justify hardware investment. The credit system provides:
- Guaranteed payment for served inference
- Prepaid demand signal for capacity planning
- Staking-based credit generation that aligns long-term incentives

## Specification

### Credit Types

```go
type ComputeCredit struct {
    CreditID    [32]byte
    Owner       [32]byte   // Anonymous commitment
    Balance     uint64     // Remaining compute units
    CreditType  CreditType
    ExpiryEpoch uint64     // Expiry (0 = no expiry)
    CreatedAt   uint64
}

type CreditType uint8

const (
    CreditPurchased CreditType = iota // Bought with ASHA
    CreditStaked                       // Generated from veASHA staking
    CreditGranted                      // Community grants (governance)
    CreditEarned                       // Earned by providing compute
)
```

### Credit Acquisition

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

interface IComputeCredits {
    /// @notice Purchase compute credits with ASHA
    function purchaseCredits(
        uint256 ashaAmount,
        bytes32 ownerCommitment
    ) external returns (bytes32 creditId, uint256 creditUnits);

    /// @notice Generate credits from veASHA staking
    function claimStakingCredits(
        bytes32 ownerCommitment
    ) external returns (uint256 creditUnits);

    /// @notice Settle a batch of inference payments
    function settleBatch(
        bytes32 creditId,
        bytes calldata settlements,
        bytes calldata proof
    ) external returns (uint256 remaining);

    /// @notice Get credit balance
    function creditBalance(bytes32 creditId) external view returns (uint256);

    event CreditsPurchased(bytes32 indexed creditId, uint256 units);
    event CreditsSettled(bytes32 indexed creditId, uint256 consumed);
}
```

### Pricing Model

Compute is measured in standardized units:

| Operation | Compute Units |
|:----------|:-------------|
| 1K input tokens (inference) | 1 CU |
| 1K output tokens (inference) | 3 CU |
| 1 image generation (512x512) | 10 CU |
| 1 hour federated learning | 100 CU |
| 1 embedding (1K tokens) | 0.5 CU |

ASHA-to-CU exchange rate is governed by the DAO (PIP-7000) and adjusts based on network compute supply and demand.

### Off-Chain Payment Channels

```go
type PaymentChannel struct {
    ChannelID    [32]byte
    CreditID     [32]byte   // Source credit account
    ProviderNode [32]byte   // Inference provider commitment
    Deposited    uint64     // CU deposited into channel
    Spent        uint64     // CU spent so far
    Nonce        uint64     // Monotonically increasing
    Signature    []byte     // Latest state signed by both parties
}
```

Channels work as follows:
1. Requester opens channel with N compute units from credit balance
2. Each inference increments the spent counter; both parties co-sign
3. Either party can settle on-chain at any time with latest co-signed state
4. Channels auto-close after configurable timeout with no activity

### Staking Credit Generation

veASHA stakers generate compute credits passively:
- Rate: 1 CU per 1000 veASHA per epoch (governance-adjustable)
- Credits accumulate and must be claimed
- Unclaimed credits expire after 30 epochs
- Staking credits are non-transferable

## Rationale

### Why Not Direct ASHA Payment?

Direct ASHA payment per inference would require on-chain transactions for every query, creating high gas costs and a complete usage trail. Payment channels with compute credits solve both problems.

### Why Standardized Compute Units?

Different models and operations have different costs. Standardized units let users budget without understanding hardware specifics, while letting providers price their services competitively.

### Why Staking-Based Credits?

Staking credits align long-term holders with network usage. Users who stake ASHA demonstrate commitment to the network and receive ongoing compute access, creating a sustainable demand-supply loop.

## Security Considerations

- **Double-spending**: Payment channel state is co-signed; settlement uses latest nonce; fraud proofs enable dispute resolution
- **Credit inflation**: CU exchange rate is governance-controlled with supply caps per epoch
- **Channel griefing**: Timeout-based auto-settlement prevents indefinite channel locks
- **Privacy leakage**: On-chain observers see credit purchases but not individual inference usage; channel settlements reveal only aggregate consumption

## References

- [PIP-0400: Decentralized Inference Protocol](./pip-0400-decentralized-inference-protocol.md)
- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)
- [PIP-7008: Liquid Staking](./pip-7008-liquid-staking.md)
- [PIP-0008: Pars Economics](./pip-0008-pars-economics.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
