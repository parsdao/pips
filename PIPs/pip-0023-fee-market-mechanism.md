---
pip: 23
title: "Fee Market Mechanism"
description: "EIP-1559 style adaptive fee market with ASHA base fee burning"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Core
created: 2026-01-23
tags: [fees, economics, asha, eip-1559, base-fee]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines an adaptive fee market mechanism for the Pars Network, inspired by Ethereum's EIP-1559 but adapted for the Pars dual-layer architecture and privacy requirements. Each block has a dynamically adjusted base fee that is burned, plus an optional priority fee paid to the block proposer. The base fee adjusts algorithmically based on block utilization, targeting 50% block capacity. This provides predictable fees, reduces fee volatility, and creates deflationary pressure on ASHA supply through burning.

## Motivation

First-price auction fee markets (used by pre-EIP-1559 Ethereum and Bitcoin) produce volatile and unpredictable fees. Users overpay during congestion and struggle to estimate appropriate fees. For the Pars diaspora, many of whom use the network for small remittances and cultural transactions, fee predictability is essential. A base fee mechanism ensures that users pay a fair market rate without needing sophisticated gas estimation tools.

The base fee burn also creates a direct link between network usage and ASHA tokenomics: as the network is more heavily used, more ASHA is burned, benefiting all token holders. This aligns the incentives of users (who want low fees) with token holders (who benefit from usage-driven deflation).

## Specification

### Base Fee Calculation

The base fee adjusts per block based on the parent block's gas usage relative to the target:

```
if parent_gas_used == target_gas:
    base_fee = parent_base_fee
elif parent_gas_used > target_gas:
    base_fee = parent_base_fee * (1 + delta)
elif parent_gas_used < target_gas:
    base_fee = parent_base_fee * (1 - delta)

where:
    target_gas = max_gas / 2
    delta = (|parent_gas_used - target_gas| / target_gas) * adjustment_rate
    adjustment_rate = 1/8 (12.5% max adjustment per block)
    minimum_base_fee = 1 gwei (floor)
```

### Transaction Format

```
ParsTransaction {
    type:           uint8     // 2 = EIP-1559 style
    maxFeePerGas:   uint256   // Maximum total fee per gas unit
    maxPriorityFee: uint256   // Maximum priority fee per gas unit
    gasLimit:       uint256   // Gas limit for execution
    // ... other standard fields
}

effective_gas_price = min(maxFeePerGas, base_fee + maxPriorityFee)
priority_fee = effective_gas_price - base_fee
```

### Fee Distribution

- **Base fee**: Burned (removed from circulation permanently).
- **Priority fee**: Paid to the block proposer.
- **Unused gas**: Refunded to the sender at the effective gas price.

### Privacy Considerations

In confidential transactions (PIP-0019), the fee is the only public value. The fee market mechanism operates on this public fee. To minimize information leakage:

- Standard fee tiers are defined (low, medium, high) corresponding to percentiles of recent base fees.
- Wallets default to the medium tier, so most transactions have identical fee values.
- Custom fees are discouraged by wallet UIs to reduce fingerprinting.

### Mesh Network Fee Exemption

Transactions relayed through the mesh network (PIP-0001) that carry a valid mesh relay proof receive a 50% base fee discount. This incentivizes mesh usage in censored environments where direct chain access is unavailable.

## Rationale

The 12.5% maximum adjustment rate per block prevents rapid fee spikes while allowing the base fee to adapt to sustained demand changes within minutes. The minimum base fee of 1 gwei prevents the base fee from reaching zero during low-usage periods, maintaining a minimum cost for spam prevention. The mesh relay discount reflects the network's core mission of censorship resistance: users who must route through mesh relays face additional latency and complexity, and should not also bear higher fees.

## Security Considerations

- **Base fee manipulation**: A validator could produce empty blocks to drive down the base fee, then fill blocks with their own transactions at low cost. Mitigation: block proposer selection is independent of base fee, and empty blocks still cost the proposer opportunity cost.
- **Fee market convergence**: The mechanism assumes rational fee bidding. In practice, wallet software handles bidding, and most users accept defaults.
- **Deflationary spiral**: If ASHA burn exceeds issuance, the token could become deflationary. This is a feature: moderate deflation increases token value and incentivizes holding.
- **Privacy correlation**: Unusual fee values can fingerprint transactions. The standard fee tier system mitigates this.

## References

- [PIP-0008: Pars Economics](./pip-0008-pars-economics.md)
- [PIP-0019: Transaction Privacy Layer](./pip-0019-transaction-privacy-layer.md)
- [PIP-0001: Mesh Network](./pip-0001-mesh-network.md)
- [EIP-1559: Fee Market Change for ETH 1.0 Chain](https://eips.ethereum.org/EIPS/eip-1559)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
