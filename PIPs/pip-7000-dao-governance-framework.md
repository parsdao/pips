---
pip: 7000
title: Pars DAO Governance Framework
tags: [governance, dao, safe, azorius, voting]
description: Defines the DAO governance framework for Pars Network using vePARS and Safe multisig
author: Pars Network Team (@pars-network)
status: Draft
type: Standards Track
category: Governance
created: 2026-01-28
discussions-to: https://github.com/pars-network/pips/discussions/7000
order: 0
tier: governance
---

## Abstract

This PIP defines the DAO governance framework for Pars Network. It establishes the rules, mechanisms, and lifecycle for on-chain governance using vote-escrowed PARS (vePARS) tokens, Safe multisig execution, and the Azorius module for proposal management. The framework is designed to be censorship-resistant, coercion-proof, and post-quantum secure.

## Motivation

Pars Network requires a governance system that:

1. **Cannot be censored** - No central authority can block proposals or votes
2. **Cannot be coerced** - Voters cannot be forced to vote against their will
3. **Is transparent** - All governance actions are verifiable on-chain
4. **Is inclusive** - All vePARS holders can participate regardless of location
5. **Is secure** - Resistant to quantum attacks and Sybil manipulation

Existing DAO frameworks fail for the Pars diaspora because:
- Standard token voting is vulnerable to vote-buying and coercion
- Centralized governance portals can be blocked by nation-state firewalls
- Classical cryptographic signatures are vulnerable to quantum adversaries
- Most systems lack anonymous participation options for at-risk voters

## Specification

### Governance Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           PARS DAO GOVERNANCE                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  TOKEN LAYER                                                                        │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  PARS Token ──► Lock ──► vePARS (vote-escrowed)                              │  │
│  │                                                                               │  │
│  │  Lock Duration     Weight Multiplier                                          │  │
│  │  ─────────────     ─────────────────                                          │  │
│  │  1 month           0.25x                                                      │  │
│  │  6 months          0.50x                                                      │  │
│  │  1 year            0.75x                                                      │  │
│  │  4 years           1.00x (maximum)                                            │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│                                      ▼                                               │
│  PROPOSAL LAYER (Azorius Module)                                                    │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                               │  │
│  │  Draft ──► Active (7 days) ──► Queued (48h timelock) ──► Executed            │  │
│  │    │                │                                        │                │  │
│  │    │           Vote Period                              Safe Multisig         │  │
│  │    │         (vePARS weighted)                          (3-of-5 execute)      │  │
│  │    │                                                                          │  │
│  │    └──► Cancelled                                                             │  │
│  │                                                                               │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│                                      ▼                                               │
│  EXECUTION LAYER (Safe + Multisig)                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Safe 3-of-5 Multisig                                                         │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │  │
│  │  │ Signer1 │ │ Signer2 │ │ Signer3 │ │ Signer4 │ │ Signer5 │               │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘               │  │
│  │                                                                               │  │
│  │  Azorius module enforces: quorum met + approval threshold + timelock elapsed  │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### vePARS Token

vePARS is a non-transferable governance token obtained by locking PARS tokens:

```solidity
interface IVePARS {
    /// @notice Lock PARS tokens to receive vePARS
    /// @param amount Amount of PARS to lock
    /// @param duration Lock duration in seconds (min 30 days, max 4 years)
    function lock(uint256 amount, uint256 duration) external;

    /// @notice Extend an existing lock duration
    /// @param lockId ID of the existing lock
    /// @param newDuration New lock duration from current timestamp
    function extendLock(uint256 lockId, uint256 newDuration) external;

    /// @notice Withdraw PARS after lock expires
    /// @param lockId ID of the expired lock
    function withdraw(uint256 lockId) external;

    /// @notice Get voting power for an account
    /// @param account The address to query
    /// @return Voting power (decays linearly as lock approaches expiry)
    function votingPower(address account) external view returns (uint256);
}
```

Voting power decays linearly as the lock approaches expiry. A 4-year lock with 1000 PARS starts at 1000 vePARS and decreases to 0 at expiry.

### Safe Multisig Execution Layer

The DAO treasury and execution are managed by a Gnosis Safe with:

- **Threshold**: 3-of-5 signers required for standard operations
- **Signers**: Elected by vePARS holders via governance vote
- **Term**: 6-month terms with staggered rotation
- **Removal**: Any signer can be removed by governance vote (standard quorum)

### Azorius Module

The Azorius module connects vePARS voting to Safe execution:

- Proposals are submitted on-chain with encoded transaction data
- vePARS holders vote during the active period
- Approved proposals enter the timelock queue
- After timelock, any Safe signer can execute

### Proposal Lifecycle

| Phase | Duration | Description |
|:------|:---------|:------------|
| **Draft** | Indefinite | Proposal created, not yet submitted on-chain |
| **Active** | 7 days | Voting period, vePARS holders cast votes |
| **Queued** | 48 hours minimum | Timelock before execution |
| **Executed** | - | Transaction executed via Safe |
| **Cancelled** | - | Proposer or governance cancels before execution |
| **Defeated** | - | Quorum not met or approval threshold not reached |

### Voting Parameters

| Parameter | Value | Description |
|:----------|:------|:------------|
| **Quorum** | 10% of circulating vePARS | Minimum participation required |
| **Approval Threshold** | >50% of votes cast | Simple majority to pass |
| **Proposal Threshold** | 100,000 vePARS | Minimum voting power to create proposal |
| **Voting Period** | 7 days | Duration of active voting |
| **Timelock** | 48 hours minimum | Delay before execution |
| **Vote Options** | For / Against / Abstain | Abstain counts toward quorum |

### Post-Quantum Signature Support

All governance signatures support ML-DSA (FIPS 204) in addition to classical ECDSA:

```solidity
interface IPQVoting {
    /// @notice Cast a vote using ML-DSA post-quantum signature
    /// @param proposalId The proposal to vote on
    /// @param support 0=Against, 1=For, 2=Abstain
    /// @param pqPublicKey ML-DSA public key of the voter
    /// @param pqSignature ML-DSA signature over the vote message
    function castVotePQ(
        uint256 proposalId,
        uint8 support,
        bytes memory pqPublicKey,
        bytes memory pqSignature
    ) external;
}
```

This uses the ML-DSA precompile at `0x0601` defined in PIP-0002.

### Coercion-Resistant Voting

For voters in high-risk environments, anonymous voting mode is available:

1. **ZK Proof of Eligibility**: Voter proves they hold sufficient vePARS without revealing their address
2. **Anonymous Ballot**: Vote is cast via ZK proof using the ZK precompile at `0x0900`
3. **Nullifier**: Prevents double-voting without revealing identity
4. **Deniability**: Voter can produce a fake receipt showing any vote direction

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANONYMOUS VOTING FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Voter                    Contract                              │
│     │                         │                                  │
│     │  1. Commit (hash of     │                                  │
│     │     vote + nullifier)   │                                  │
│     │ ───────────────────────►│                                  │
│     │                         │                                  │
│     │  2. ZK Proof:           │                                  │
│     │     - I hold vePARS     │                                  │
│     │     - My vote is valid  │                                  │
│     │     - Nullifier unused  │                                  │
│     │ ───────────────────────►│                                  │
│     │                         │                                  │
│     │  3. Vote recorded       │                                  │
│     │     (anonymous)         │                                  │
│     │ ◄───────────────────────│                                  │
│     │                         │                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Governance Portal

The governance portal is accessible at **pars.vote** and provides:

- Proposal browsing, creation, and voting
- vePARS lock management
- Delegation interface
- Historical voting records
- Accessible via Pars mesh network (PIP-0001) during internet blackouts

## Security Considerations

### Vote Buying

- vePARS is non-transferable, reducing direct vote buying
- Lock duration commitment makes short-term manipulation expensive
- Anonymous voting mode prevents verifiable vote selling

### Governance Attacks

- Proposal threshold (100,000 vePARS) prevents spam
- Timelock allows community review before execution
- Emergency freeze: any 2-of-5 Safe signers can pause execution for 72 hours
- Guardian role can veto malicious proposals within timelock period

### Key Compromise

- ML-DSA signatures protect against quantum key extraction
- Safe signer rotation via governance prevents long-term key compromise
- Multi-sig threshold means compromising a single signer is insufficient

### Censorship Resistance

- Proposals are on-chain and cannot be censored by the portal
- Voting can be done directly via contract interaction
- Mesh network access ensures portal availability during blackouts

## References

- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)
- [PIP-0003: Coercion Resistance](./pip-0003-coercion-resistance.md)
- [Gnosis Safe Documentation](https://docs.safe.global)
- [Azorius Module](https://github.com/decentdao/decent-contracts)
- [FIPS 204: ML-DSA](https://csrc.nist.gov/pubs/fips/204/final)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
