---
pip: 21
title: "Cross-Chain Bridge Standard"
description: "Bridge protocol for ASHA token transfers between Pars and external chains"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Core
created: 2026-01-23
tags: [bridge, cross-chain, asha, interoperability, lux]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a cross-chain bridge standard for transferring ASHA tokens and arbitrary messages between the Pars Network and external blockchains (Lux Network, Ethereum, and other EVM-compatible chains). The bridge uses a threshold signature committee of Pars validators to attest to cross-chain state, with fraud proofs enabling any observer to challenge invalid attestations. The protocol supports both lock-and-mint (for bridging native ASHA out) and burn-and-release (for bridging back) with configurable finality requirements per destination chain.

## Motivation

The Pars Network does not exist in isolation. ASHA must be tradeable on decentralized exchanges, usable in DeFi protocols on other chains, and transferable to family members who may use different blockchain ecosystems. A secure, decentralized bridge is essential for ASHA liquidity and utility. The bridge must resist the Pars threat model where state-level adversaries may attempt to freeze or seize bridged assets by compromising bridge operators.

## Specification

### Bridge Architecture

The bridge consists of three components:

1. **Pars Bridge Contract**: Deployed on Pars L2, handles ASHA locking/releasing and message verification.
2. **Remote Bridge Contract**: Deployed on each supported external chain, handles wrapped ASHA (wASHA) minting/burning.
3. **Bridge Committee**: A rotating subset of Pars validators (PIP-0028) that sign cross-chain attestations.

### Outbound Transfer (Pars -> External)

1. User locks ASHA in the Pars Bridge Contract, specifying the destination chain and recipient address.
2. The Bridge Committee observes the lock event and produces a threshold signature (t-of-n, where t = 2n/3 + 1) over the transfer details.
3. A relayer submits the signed attestation to the Remote Bridge Contract on the destination chain.
4. The Remote Bridge Contract verifies the threshold signature and mints equivalent wASHA to the recipient.

### Inbound Transfer (External -> Pars)

1. User burns wASHA on the external chain's Remote Bridge Contract.
2. The Bridge Committee observes the burn event on the external chain and produces a threshold signature.
3. A relayer submits the signed attestation to the Pars Bridge Contract.
4. The Pars Bridge Contract verifies the signature and releases locked ASHA to the recipient.

### Fraud Proofs

Any observer can submit a fraud proof if the Bridge Committee signs an invalid attestation (e.g., attesting to a lock event that did not occur). A valid fraud proof slashes the signing committee members' stakes and reverses the fraudulent mint/release. The fraud proof window is 7 days for non-emergency transfers.

### Rate Limiting

To contain damage from a potential bridge compromise, transfers are rate-limited:

- Maximum 100,000 ASHA per single transfer.
- Maximum 1,000,000 ASHA per 24-hour period per direction.
- Transfers exceeding limits enter a 48-hour delay queue, during which they can be challenged.

### Supported Chains

Initial support targets:

- **Lux Network**: Native integration via Lux subnet messaging.
- **Ethereum**: Via threshold-signed attestations verified on-chain.
- **EVM L2s**: Supported through the Ethereum bridge with L2-specific optimizations.

## Rationale

A threshold signature committee is chosen over a single multisig because it distributes trust across the validator set and rotates with validator rotation (PIP-0028). Fraud proofs provide a second layer of security: even if the committee is compromised, the 7-day window allows the community to detect and reverse fraud. Rate limiting bounds the maximum loss from any single compromise event. The lock-and-mint model is simpler and more auditable than liquidity pool-based bridges.

## Security Considerations

- **Committee compromise**: If >2/3 of the bridge committee is compromised, fraudulent attestations can be signed. Mitigation: fraud proofs, rate limiting, and committee rotation every 24 hours.
- **External chain reorgs**: A reorg on the external chain could reverse a burn event after ASHA is released on Pars. Mitigation: the bridge waits for sufficient finality on the external chain (e.g., 64 blocks on Ethereum) before processing.
- **Censorship of fraud proofs**: An adversary could censor fraud proof transactions on Pars. Mitigation: fraud proofs can be submitted via multiple paths including mesh network (PIP-0001).
- **Key management**: Bridge committee members must secure their signing keys. Compromise of individual keys reduces the effective threshold.

## References

- [PIP-0001: Mesh Network](./pip-0001-mesh-network.md)
- [PIP-0028: Validator Rotation Protocol](./pip-0028-validator-rotation-protocol.md)
- [PIP-0008: Pars Economics](./pip-0008-pars-economics.md)
- [Lux Network Bridge Specification](https://docs.lux.network/bridge)
- [Optimistic Bridge Design](https://ethresear.ch/t/optimistic-bridge-design/12345)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
