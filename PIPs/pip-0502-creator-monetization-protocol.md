---
pip: 502
title: "Creator Monetization Protocol"
description: "Direct creator-to-audience monetization without intermediaries using ASHA micropayments"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Content
created: 2026-01-23
tags: [content, monetization, creators, micropayments, asha]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a creator monetization protocol for the Pars Network that enables direct value transfer from audiences to creators without intermediaries. The protocol supports micropayments, subscriptions, tipping, pay-per-view, and patronage models -- all settled in ASHA with minimal fees. Payment channels enable sub-cent transactions that would be uneconomical on-chain, while maintaining full privacy for both creators and audiences.

## Motivation

### The Intermediary Problem

Persian content creators face a hostile intermediary landscape:
- Payment processors block transactions involving sanctioned countries
- Platform fees consume 30-50% of creator revenue
- Ad networks refuse to serve content in Farsi or from Iranian IPs
- Crowdfunding platforms close accounts associated with Iran
- Bank transfers to/from diaspora members are routinely blocked

### Direct Value Transfer

ASHA micropayments bypass all intermediaries. A reader in Tehran can pay a journalist in Los Angeles 0.01 ASHA for an article without any bank, payment processor, or platform taking a cut or blocking the transaction.

## Specification

### Monetization Models

```go
type MonetizationModel uint8

const (
    ModelTipping       MonetizationModel = iota // Voluntary tips
    ModelPayPerView                              // Pay to access content
    ModelSubscription                            // Recurring payments
    ModelPatronage                               // Ongoing support tiers
    ModelMicropayment                            // Per-second/per-page streaming
    ModelDonation                                // One-time donations
)
```

### Creator Profile

```go
type CreatorProfile struct {
    CreatorID      [32]byte       // Anonymous commitment
    DisplayName    string         // Pseudonym (supports Farsi)
    Bio            string
    Models         []MonetizationModel
    Subscriptions  []SubscriptionTier
    PaymentChannel [32]byte       // Active payment channel
    TotalEarned    uint64         // Lifetime ASHA earned
    SupporterCount uint64         // Unique supporters
}

type SubscriptionTier struct {
    TierID     [32]byte
    Name       string
    PriceASHA  uint64     // ASHA per epoch
    Benefits   []string   // Description of tier benefits
    MaxSlots   uint32     // Maximum subscribers (0 = unlimited)
    Current    uint32     // Current subscriber count
}
```

### Payment Channel

Micropayments use off-chain payment channels for efficiency:

```go
type CreatorChannel struct {
    ChannelID   [32]byte
    Creator     [32]byte     // Creator commitment
    Supporter   [32]byte     // Supporter commitment
    Deposited   uint64       // ASHA deposited by supporter
    Paid        uint64       // ASHA claimed by creator
    Nonce       uint64       // State counter
    CoSignature []byte       // Both parties sign latest state
}
```

Channel lifecycle:
1. Supporter opens channel with ASHA deposit
2. Each content interaction increments `Paid` counter
3. Both parties co-sign each state update
4. Either party can settle on-chain at any time
5. Unclaimed deposits return to supporter after timeout

### Smart Contract

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

interface ICreatorMonetization {
    function registerCreator(
        string calldata metadata,
        bytes calldata subscriptionTiers
    ) external returns (bytes32 creatorId);

    function openChannel(
        bytes32 creatorId
    ) external payable returns (bytes32 channelId);

    function settleChannel(
        bytes32 channelId,
        uint256 amountPaid,
        uint64 nonce,
        bytes calldata coSignature
    ) external;

    function subscribe(
        bytes32 creatorId,
        bytes32 tierId
    ) external payable returns (bytes32 subscriptionId);

    function tip(bytes32 creatorId) external payable;

    event ChannelOpened(bytes32 indexed channelId, bytes32 indexed creatorId);
    event ChannelSettled(bytes32 indexed channelId, uint256 amount);
    event SubscriptionCreated(bytes32 indexed creatorId, bytes32 indexed tierId);
    event TipReceived(bytes32 indexed creatorId, uint256 amount);
}
```

### Revenue Split

For collaborative works:

```go
type RevenueSplit struct {
    Recipients []SplitRecipient
    Immutable  bool    // If true, split cannot be changed
}

type SplitRecipient struct {
    Commitment [32]byte
    ShareBPS   uint16   // Basis points (total must = 10000)
    Role       string   // e.g., "author", "editor", "translator"
}
```

### Fee Structure

| Operation | Fee |
|:----------|:----|
| Tipping | 0% (direct transfer) |
| Pay-per-view | 1% protocol fee |
| Subscription | 1% protocol fee |
| Channel settlement | Gas only |
| Revenue split | 0.5% protocol fee per split |

Protocol fees flow to the Pars treasury (PIP-7002).

## Rationale

### Why Payment Channels?

On-chain transactions cost gas and create permanent records. Payment channels enable sub-cent micropayments (pay 0.001 ASHA per page read) that are economically impossible on-chain, while settling only the aggregate.

### Why Multiple Models?

Different creators need different monetization. A journalist needs pay-per-view. A poet needs patronage. A musician needs micropayment streaming. A single protocol supporting all models avoids fragmenting the ecosystem.

### Why 1% Fee?

The 1% protocol fee funds network development and treasury while being dramatically lower than any centralized alternative (30% App Store, 20% Patreon). Zero-fee tipping ensures the simplest use case is completely free.

## Security Considerations

- **Channel disputes**: On-chain settlement with latest co-signed state resolves disputes automatically
- **Payment privacy**: Channel states are off-chain; on-chain observers see only opening and settlement amounts
- **Creator impersonation**: Creator profiles are tied to anonymous commitments with ML-DSA signatures
- **Subscription fraud**: Subscription NFTs are non-transferable; sharing is prevented by on-chain enforcement

## References

- [PIP-0500: Decentralized Publishing Platform](./pip-0500-decentralized-publishing-platform.md)
- [PIP-0008: Pars Economics](./pip-0008-pars-economics.md)
- [PIP-7002: Treasury Management](./pip-7002-treasury-management.md)
- [PIP-7003: Fee Routing](./pip-7003-fee-routing.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
