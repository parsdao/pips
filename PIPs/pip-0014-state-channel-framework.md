---
pip: 14
title: "State Channel Framework"
description: "State channels for off-chain computation with on-chain settlement"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Core
created: 2026-01-23
tags: [state-channels, scalability, off-chain, settlement]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a state channel framework for the Pars Network that enables off-chain computation with on-chain settlement. Participants open a channel by locking ASHA on-chain, exchange signed state updates off-chain at arbitrary speed, and close the channel by submitting the final state for on-chain verification. The framework supports generalized state channels capable of running arbitrary smart contract logic off-chain, with dispute resolution enforced by the Pars EVM L2.

## Motivation

On-chain transactions on Pars L2 provide strong finality but incur gas costs and block latency. For high-frequency interactions such as micropayments, gaming, or real-time messaging settlement, state channels offer near-instant finality with zero gas cost per update. This is critical for the Pars diaspora use case where users may exchange many small ASHA transfers (remittances, tipping, commerce) and need sub-second confirmation without waiting for block production.

State channels also reduce on-chain footprint, which improves privacy by keeping intermediate states invisible to chain observers. Only the opening and closing transactions appear on-chain, consistent with the Pars privacy-first design philosophy.

## Specification

### Channel Lifecycle

1. **Open**: Participants deposit ASHA into a `StateChannelManager` contract, creating a channel with an agreed initial state.
2. **Update**: Participants exchange signed state transitions off-chain. Each state carries a monotonically increasing nonce.
3. **Close (cooperative)**: All participants sign the final state and submit it on-chain. Deposits are redistributed per the final state.
4. **Close (unilateral)**: Any participant submits the latest signed state on-chain, starting a dispute period.
5. **Dispute**: During the dispute window (default 24 hours), any participant may submit a state with a higher nonce. The highest-nonce valid state wins.
6. **Finalize**: After the dispute period, the contract distributes funds per the winning state.

### State Structure

```solidity
struct ChannelState {
    bytes32 channelId;
    uint256 nonce;
    address[] participants;
    uint256[] balances;
    bytes32 appStateHash;  // Hash of application-specific state
    uint256 timeout;       // Dispute window in seconds
}
```

### Signature Requirements

Every state update must be signed by all channel participants using ML-DSA-65 (PIP-0002) for post-quantum security. A state is valid if and only if it carries valid signatures from every participant and has a nonce strictly greater than any previously submitted state.

### Generalized State Channels

Beyond simple payment channels, the framework supports generalized state transitions by referencing an `appDefinition` contract. The app contract defines:

- `validTransition(bytes oldState, bytes newState, uint256 signerIndex) returns (bool)` -- validates off-chain state transitions.
- `resolve(bytes finalState) returns (uint256[] balances)` -- computes final balance distribution from the terminal app state.

### Dispute Resolution

If a participant submits a stale state, any other participant may respond with a higher-nonce state during the dispute window. The contract accepts the state with the highest valid nonce. Submitting a provably stale state (nonce lower than a previously seen state) results in the disputer's deposit being slashed.

### Virtual Channels

Two participants who share a common intermediary can open a virtual channel without an additional on-chain transaction. The intermediary's existing channels serve as collateral. This enables hub-and-spoke topologies for ASHA payment networks.

## Rationale

The design follows the Nitro protocol pattern adapted for post-quantum signatures and the Pars threat model. Using ML-DSA signatures instead of ECDSA ensures state channel security against quantum adversaries. The 24-hour default dispute window balances security (time for mobile nodes to come online and dispute) against usability (reasonable settlement delay). Virtual channels reduce the on-chain footprint further, critical for users in censored regions who may have intermittent chain access.

## Security Considerations

- **Liveness**: At least one honest participant must be online during the dispute window to prevent stale state finalization. Watchtower services can monitor channels on behalf of offline users.
- **Collateral lockup**: ASHA locked in channels is unavailable for staking. The protocol should recommend channel sizes proportional to expected usage.
- **Intermediary risk**: Virtual channel intermediaries must maintain sufficient collateral. If an intermediary disappears, participants fall back to on-chain dispute.
- **Privacy**: Only channel open/close transactions are visible on-chain. Intermediate states remain private between participants.

## References

- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)
- [PIP-0008: Pars Economics](./pip-0008-pars-economics.md)
- [Nitro Protocol Specification](https://docs.statechannels.org/)
- [Generalized State Channels](https://l4.ventures/papers/statechannels.pdf)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
