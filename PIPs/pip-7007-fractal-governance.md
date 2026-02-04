---
pip: 7007
title: Fractal Governance Architecture
tags: [governance, dao, fractal, veto, sanction, hierarchy]
description: Defines hierarchical DAO structure with parent oversight and community sovereignty
author: Pars DAO (@parsdao)
status: Draft
type: Standards Track
category: Governance
created: 2026-01-30
discussions-to: https://github.com/pars-network/pips/discussions/7007
order: 7
tier: governance
---

## Abstract

This PIP defines the fractal governance architecture for Pars Protocol, enabling hierarchical DAO structures where parent DAOs can create Committees, Working Groups, and Sub-DAOs with delegated authority. The architecture preserves community sovereignty over bonded funds while giving parents oversight over allocated capital.

## Motivation

Pars Protocol requires governance that:

1. **Scales fractally** — Same patterns work at every level
2. **Preserves sovereignty** — Communities keep their bonded funds
3. **Enables oversight** — Parents can recall allocated capital
4. **Supports forking** — Disagreement leads to new experiments, not deadlock
5. **Provides safety** — Veto and sanctions protect against rogue DAOs

The Decent DAO framework provides proven fractal governance patterns that align with Pars values.

## Specification

### Fractal Structure

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                         FRACTAL GOVERNANCE                                      │
│                      "As Above, So Below"                                       │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  L1 DAO (Sovereign)                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Pars DAO (پارس داو)                                                    │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                    │   │
│  │  │ Council │  │ Charter │  │  Safe   │  │ veASHA  │                    │   │
│  │  │ (شورا)  │  │ (منشور) │  │ (خزانه) │  │Identity │                    │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘                    │   │
│  └────────────────────────────────┬────────────────────────────────────────┘   │
│                                   │                                             │
│          ┌────────────────────────┼────────────────────────┐                   │
│          │                        │                        │                   │
│          ▼                        ▼                        ▼                   │
│  L2 COMMITTEES (Standing)   L2 WORKING GROUPS       L2 SUB-DAOs               │
│  ┌─────────────────────┐   ┌─────────────────┐    ┌─────────────────┐         │
│  │ Full structure:     │   │ Light structure: │    │ Independent:    │         │
│  │ • Council           │   │ • Safe + Multisig│    │ • Full DAO      │         │
│  │ • Charter           │   │ • Fixed budget   │    │ • Own community │         │
│  │ • Safe              │   │ • Time-limited   │    │ • Own treasury  │         │
│  │ • Identity Token    │   │                  │    │ • Own token     │         │
│  │                     │   │ ALL funds        │    │                 │         │
│  │ ALLOCATED: Recall ✓ │   │ recallable       │    │ BONDED funds    │         │
│  │ BONDED: No recall   │   │                  │    │ NOT recallable  │         │
│  └─────────────────────┘   └─────────────────┘    └─────────────────┘         │
│                                                                                 │
│  Each L2 can create L3 → L4 → L5 → ... (infinite recursion)                    │
│                                                                                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Module Types

#### Council Module

The Council module attaches to a Safe and provides proposal lifecycle management:

```solidity
interface ICouncil {
    // ═══════════════════════════════════════════════════════════════════════════════
    //                              PROPOSAL MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Submit a proposal
    /// @param targets Contract addresses to call
    /// @param values ETH values for each call
    /// @param calldatas Encoded function calls
    /// @param description Proposal description
    /// @return proposalId The created proposal ID
    function submitProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256 proposalId);

    /// @notice Cast a vote on a proposal
    /// @param proposalId The proposal to vote on
    /// @param support 0=Against, 1=For, 2=Abstain
    function castVote(uint256 proposalId, uint8 support) external;

    /// @notice Execute an approved proposal
    /// @param proposalId The proposal to execute
    function executeProposal(uint256 proposalId) external;

    /// @notice Get proposal state
    /// @param proposalId The proposal to query
    function getProposalState(uint256 proposalId) external view returns (ProposalState);

    // ═══════════════════════════════════════════════════════════════════════════════
    //                              STATES
    // ═══════════════════════════════════════════════════════════════════════════════

    enum ProposalState {
        ACTIVE,       // Voting in progress
        TIMELOCKED,   // Passed, waiting for timelock
        EXECUTABLE,   // Ready to execute
        EXECUTED,     // Successfully executed
        EXPIRED,      // Not executed in time
        FAILED,       // Did not pass vote
        REJECTED,     // Superseded by newer proposal
        TIMELOCKABLE, // Quorum reached, can be timelocked
        VETOED        // Vetoed by parent DAO
    }
}
```

#### Charter Module

The Charter defines voting rules and constitutional text:

```solidity
interface ICharter {
    // ═══════════════════════════════════════════════════════════════════════════════
    //                              VOTING MECHANICS
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Duration of voting period
    function votingPeriod() external view returns (uint256);

    /// @notice Quorum percentage (basis points)
    function quorumNumerator() external view returns (uint256);

    /// @notice Minimum tokens to submit proposal
    function proposalThreshold() external view returns (uint256);

    /// @notice Timelock delay before execution
    function timelockPeriod() external view returns (uint256);

    /// @notice Window to execute after timelock
    function executionPeriod() external view returns (uint256);

    // ═══════════════════════════════════════════════════════════════════════════════
    //                              CONSTITUTION
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice On-chain or IPFS constitution text
    function constitution() external view returns (string memory);

    /// @notice Update constitution (governance only)
    function setConstitution(string calldata ipfsHash) external;

    // ═══════════════════════════════════════════════════════════════════════════════
    //                              DIRECTIVES
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice Get governance directive by key
    function getDirective(bytes32 key) external view returns (bytes memory);

    /// @notice Set governance directive (governance only)
    function setDirective(bytes32 key, bytes calldata value) external;
}
```

#### Veto Module

Parent DAOs can veto child proposals during timelock:

```solidity
interface IVeto {
    /// @notice Cast a veto vote against a child DAO proposal
    /// @param childDAO Address of the child DAO
    /// @param proposalId Proposal ID in child DAO
    function castVetoVote(address childDAO, uint256 proposalId) external;

    /// @notice Get veto vote count for a proposal
    /// @param childDAO Address of the child DAO
    /// @param proposalId Proposal ID in child DAO
    function getVetoVotes(address childDAO, uint256 proposalId) external view returns (uint256);

    /// @notice Check if proposal is vetoed
    /// @param childDAO Address of the child DAO
    /// @param proposalId Proposal ID in child DAO
    function isVetoed(address childDAO, uint256 proposalId) external view returns (bool);

    /// @notice Veto threshold (veASHA required)
    function vetoThreshold() external view returns (uint256);

    /// @notice Veto period duration
    function vetoPeriod() external view returns (uint256);
}
```

#### Sanction Guard

The Sanction guard enforces veto decisions on the child Safe:

```solidity
interface ISanction {
    /// @notice Check if transaction is sanctioned (blocks execution)
    /// @param to Target address
    /// @param value ETH value
    /// @param data Call data
    /// @return allowed Whether transaction is allowed
    function checkTransaction(
        address to,
        uint256 value,
        bytes memory data,
        // ... other Safe tx params
    ) external view returns (bool allowed);

    /// @notice Check if specific transaction hash is sanctioned
    function isSanctioned(bytes32 txHash) external view returns (bool);

    /// @notice Current sanction status
    function isFrozen() external view returns (bool);

    /// @notice Freeze period remaining
    function freezePeriodRemaining() external view returns (uint256);
}
```

### Fund Source Tracking

All funds are classified by source for recall eligibility:

```solidity
interface IFundSourceRegistry {
    enum FundSource {
        ALLOCATED,  // From parent budget - recallable
        BONDED      // From community bonds - NOT recallable
    }

    /// @notice Record funding received
    /// @param token Asset token address
    /// @param amount Amount received
    /// @param source Fund source classification
    function recordFunding(
        address token,
        uint256 amount,
        FundSource source
    ) external;

    /// @notice Get allocated (recallable) balance
    function getAllocatedBalance(address token) external view returns (uint256);

    /// @notice Get bonded (non-recallable) balance
    function getBondedBalance(address token) external view returns (uint256);

    /// @notice Initiate recall of allocated funds
    /// @param childSafe Child DAO's Safe address
    /// @param token Token to recall
    /// @param amount Amount to recall
    function initiateRecall(
        address childSafe,
        address token,
        uint256 amount
    ) external;

    /// @notice Execute recall after grace period
    function executeRecall(address childSafe, address token) external;

    /// @notice Recall grace period (30 days default)
    function recallGracePeriod() external view returns (uint256);
}
```

### Rogue DAO Scenario

When a child DAO acts against parent interests:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ROGUE DAO RESPONSE                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Security Committee Goes Rogue                                                   │
│  ─────────────────────────────                                                   │
│                                                                                  │
│  CURRENT BALANCES:                                                               │
│  ├── ALLOCATED: $50,000 (from Pars DAO budget)                                  │
│  └── BONDED: $200,000 (from SECURITY token purchasers)                          │
│                                                                                  │
│  PARENT (PARS DAO) CAN:                                                          │
│  ├── ✓ Halt future budget allocations                                           │
│  ├── ✓ Veto pending proposals during timelock                                   │
│  ├── ✓ Recall $50,000 allocated funds (30-day grace period)                     │
│  └── ✗ CANNOT recall $200,000 bonded funds                                      │
│                                                                                  │
│  SECURITY DAO CONTINUES WITH:                                                    │
│  ├── $200,000 bonded funds (community owned)                                    │
│  ├── Full governance over own assets                                            │
│  └── Community can: fork / exit / reform governance                             │
│                                                                                  │
│  THIS PRESERVES:                                                                 │
│  ├── Community sovereignty over their capital                                   │
│  ├── Parent oversight over delegated capital                                    │
│  └── Exit liquidity for disagreeing members                                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Hierarchy Types

| Type | Structure | Allocated Recall | Bonded Recall |
|:-----|:----------|:-----------------|:--------------|
| **Committee** | Council + Charter + Safe + Identity | Yes | No |
| **Working Group** | Safe + Multisig (no Council) | Yes | N/A (no bonds) |
| **Sub-DAO** | Full independent DAO | Yes | No |

### Fork Freedom

Any DAO can be forked:

1. **Deploy new DAO** — Same contracts, new addresses
2. **Issue new identity tokens** — Community decides who joins
3. **Fund new Safe** — Via bonds or external funding
4. **Operate independently** — No permission from original

This enables governance evolution through parallel experimentation.

### Proposal Lifecycle with Veto

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    PROPOSAL LIFECYCLE (WITH VETO)                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  CHILD DAO (e.g., Security Committee)                                            │
│  ──────────────────────────────────────                                          │
│                                                                                  │
│  1. DRAFT → 2. ACTIVE (voting) → 3. PASSED                                       │
│                                        │                                         │
│                                        ▼                                         │
│                               4. TIMELOCKED (48h)                                │
│                                        │                                         │
│                    ┌───────────────────┼───────────────────┐                    │
│                    │                   │                   │                    │
│                    ▼                   │                   ▼                    │
│           Parent Veto Period           │          No Veto                       │
│           (within timelock)            │          (normal)                      │
│                    │                   │                   │                    │
│         ┌─────────┴─────────┐          │                   │                    │
│         │                   │          │                   │                    │
│         ▼                   ▼          ▼                   ▼                    │
│      VETOED              NOT       EXECUTABLE ←───────────┘                     │
│   (Blocked)            VETOED          │                                        │
│                           │            ▼                                        │
│                           └────► 5. EXECUTED                                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Freeze Guard

The Freeze Guard enables parent DAOs to temporarily halt child operations:

```solidity
interface IFreezeGuard {
    /// @notice Current freeze vote count
    function freezeProposalVoteCount() external view returns (uint256);

    /// @notice Votes required to freeze
    function freezeVotesThreshold() external view returns (uint256);

    /// @notice Time remaining in freeze period
    function freezePeriodRemaining() external view returns (uint256);

    /// @notice Whether DAO is currently frozen
    function isFrozen() external view returns (bool);

    /// @notice Cast vote to freeze child DAO
    function castFreezeVote() external;

    /// @notice Unfreeze after period expires
    function unfreeze() external;
}
```

### Governance Parameters

| Parameter | Default | Description |
|:----------|:--------|:------------|
| `votingPeriod` | 7 days | Duration of voting |
| `quorumNumerator` | 10% | Minimum participation |
| `timelockPeriod` | 48 hours | Delay before execution |
| `executionPeriod` | 7 days | Window to execute |
| `vetoPeriod` | 48 hours | Parent veto window |
| `freezePeriod` | 7 days | Maximum freeze duration |
| `recallGracePeriod` | 30 days | Time before recall executes |

## Security Considerations

### Veto Abuse

- Veto requires threshold of parent veASHA holders
- Veto only works during timelock period
- Parent must provide public rationale
- Repeated vetoes may trigger fork

### Fund Classification

- All fund sources recorded on-chain
- Immutable once classified
- Auditable by anyone
- Cannot reclassify bonded as allocated

### Infinite Recursion

- Gas limits naturally prevent infinite depth
- Each level requires real capital commitment
- Governance overhead increases with depth

## References

- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)
- [PIP-7006: ASHA Reserve Token](./pip-7006-asha-reserve-token.md)
- [LIP-7001: Lux DAO Governance Standard](https://github.com/luxfi/lips/blob/main/LIPs/lip-7001.md)
- [Decent DAO Documentation](https://docs.decentdao.org/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
