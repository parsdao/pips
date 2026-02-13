---
pip: 12
title: Encrypted Voting & Anonymous Governance
tags: [voting, governance, fhe, anonymous, coercion-resistance, shadow-government]
description: FHE-based voting system for Pars DAO and shadow governance with homomorphic tallying
author: Pars Network Team (@pars-network)
status: Draft
type: Standards Track
category: Governance
created: 2026-02-13
discussions-to: https://github.com/pars-network/pips/discussions/12
order: 12
tier: governance
requires: [2, 3]
---

## Abstract

This PIP defines an encrypted voting protocol for Pars Network governance. Ballots are encrypted using threshold Fully Homomorphic Encryption (tFHE) and tallied homomorphically -- individual votes are never decrypted. Voter identity is never linked to any ballot. The protocol supports binary votes, multi-option selection, ranked choice, and quadratic voting. It includes coercion resistance via deniable ballots, ensuring voters under duress cannot be compelled to reveal or prove their vote. Designed for `pars.vote` and integration with veASHA governance (PIP-7000).

## Motivation

### Why Encrypted Voting?

```
┌─────────────────────────────────────────────────────────────────┐
│                    VOTING THREAT MODEL                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TRANSPARENT VOTING (existing DAOs):                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Votes are public on-chain                               │  │
│  │ • Voter addresses linked to real identities               │  │
│  │ • Vote buying is trivially verifiable                      │  │
│  │ • Coercion is effective (prove-you-voted-X-or-else)       │  │
│  │ • Self-censorship: voters abstain rather than risk        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  PARS ENCRYPTED VOTING:                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Ballots encrypted, never individually decrypted         │  │
│  │ • Voter identity mathematically unlinkable to ballot      │  │
│  │ • Vote buying impossible (cannot prove your vote)         │  │
│  │ • Coercion resistance: deniable ballots under duress      │  │
│  │ • Full participation: vote freely without fear             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  KEY PROPERTY: Even the voter cannot prove how they voted      │
│  after the fact. This makes coercion pointless.                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### The Diaspora Context

The Persian diaspora faces unique governance challenges:
1. Members live under multiple jurisdictions with varying freedoms
2. Some participants are in Iran where political expression is criminalized
3. Family members may be held hostage to coerce voting behavior
4. Traditional anonymous voting (paper ballots) requires physical presence
5. Online voting without encryption is surveillance-compatible

Pars encrypted voting enables genuine democratic participation regardless of location or threat level.

## Specification

### Voting System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENCRYPTED VOTING LIFECYCLE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PHASE 1: SETUP                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Proposal submitted to DAO (PIP-7000)                   │  │
│  │ 2. Voting committee generates threshold FHE keys          │  │
│  │    (t-of-n: requires t committee members to decrypt)      │  │
│  │ 3. Public encryption key published                        │  │
│  │ 4. Eligible voters computed from veASHA snapshot          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
│  PHASE 2: CASTING        ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 5. Voter encrypts ballot under public FHE key             │  │
│  │ 6. Voter generates ZK proof of eligibility                │  │
│  │    (proves veASHA ownership without revealing identity)   │  │
│  │ 7. Encrypted ballot + ZK proof submitted on-chain         │  │
│  │ 8. Nullifier prevents double voting                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
│  PHASE 3: TALLYING       ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 9. Homomorphic addition of all encrypted ballots          │  │
│  │    (computation on ciphertext, no decryption)             │  │
│  │ 10. Result is encrypted aggregate, not individual votes   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
│  PHASE 4: REVEAL         ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 11. Committee members provide decryption shares           │  │
│  │ 12. t-of-n shares combined to decrypt aggregate           │  │
│  │ 13. Only the final tally is revealed                      │  │
│  │ 14. Individual votes remain encrypted forever              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Threshold FHE Key Generation

```go
// ThresholdFHE manages the threshold encryption committee
type ThresholdFHE struct {
    N             int           // Total committee members
    T             int           // Threshold (minimum to decrypt)
    PublicKey     *FHEPublicKey // Shared public encryption key
    CommitteeKeys []CommitteeMemberKey
}

// CommitteeMemberKey holds a committee member's key share
type CommitteeMemberKey struct {
    MemberID    [32]byte
    PublicShare []byte        // Public verification share
    // SecretShare held privately by each member
}

// GenerateThresholdKeys performs distributed key generation
func GenerateThresholdKeys(n, t int, members []CommitteeMember) (*ThresholdFHE, error) {
    if t > n {
        return nil, ErrInvalidThreshold
    }
    if t < n/2+1 {
        return nil, ErrThresholdTooLow // Must be majority
    }

    // Distributed key generation protocol (DKG)
    // Each member contributes entropy; no single member knows the full secret
    shares, publicKey, err := dkg.Generate(n, t, members)
    if err != nil {
        return nil, fmt.Errorf("dkg: %w", err)
    }

    // Distribute shares to committee members via Pars Session (PIP-0005)
    for i, member := range members {
        err := session.SendEncrypted(member.SessionID, shares[i])
        if err != nil {
            return nil, fmt.Errorf("distribute share %d: %w", i, err)
        }
    }

    return &ThresholdFHE{
        N:         n,
        T:         t,
        PublicKey: publicKey,
    }, nil
}
```

### Ballot Structure

```go
// EncryptedBallot represents a single encrypted vote
type EncryptedBallot struct {
    // Election reference
    ProposalID  [32]byte       // Which proposal this ballot is for
    VoteType    VoteType       // Binary, MultiOption, RankedChoice, Quadratic

    // Encrypted vote (FHE ciphertext)
    Ciphertext  []byte         // FHE.Encrypt(pk, vote_vector)

    // Eligibility proof
    Nullifier   [32]byte       // Prevents double voting (derived from voter secret)
    EligibilityProof []byte    // ZK proof: "I hold veASHA and haven't voted yet"

    // Vote weight proof (for quadratic voting)
    WeightProof []byte         // ZK proof: "My veASHA balance supports this weight"

    // Post-quantum signature over the ballot
    Signature   []byte         // ML-DSA-87 signature (from ephemeral key)
}

// VoteType defines the voting method
type VoteType uint8

const (
    VoteBinary       VoteType = iota // Yes/No/Abstain
    VoteMultiOption                   // Choose one of N options
    VoteRankedChoice                  // Rank options 1 to N
    VoteQuadratic                     // Allocate credits quadratically
)
```

### Vote Encoding

```go
// EncodeBinaryVote encodes a yes/no/abstain vote as an FHE-friendly vector
func EncodeBinaryVote(choice BinaryChoice) []uint64 {
    // [yes_count, no_count, abstain_count]
    switch choice {
    case ChoiceYes:
        return []uint64{1, 0, 0}
    case ChoiceNo:
        return []uint64{0, 1, 0}
    case ChoiceAbstain:
        return []uint64{0, 0, 1}
    }
    return nil
}

// EncodeMultiOptionVote encodes selecting one of N options
func EncodeMultiOptionVote(selected int, numOptions int) []uint64 {
    // One-hot vector: [0, 0, 1, 0, 0] for option 2 of 5
    vec := make([]uint64, numOptions)
    vec[selected] = 1
    return vec
}

// EncodeRankedChoiceVote encodes a ranked preference
func EncodeRankedChoiceVote(rankings []int, numOptions int) [][]uint64 {
    // Matrix: rows = rank position, cols = options
    // rankings[i] = which option is ranked at position i
    matrix := make([][]uint64, numOptions)
    for rank, option := range rankings {
        matrix[rank] = make([]uint64, numOptions)
        matrix[rank][option] = 1
    }
    return matrix
}

// EncodeQuadraticVote encodes a quadratic voting allocation
func EncodeQuadraticVote(credits map[int]int, numOptions int) []uint64 {
    // Vector of credit allocations per option
    // Constraint: sum of sqrt(credits) <= voter's budget
    vec := make([]uint64, numOptions)
    for option, credit := range credits {
        vec[option] = uint64(credit)
    }
    return vec
}
```

### Homomorphic Tallying

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOMOMORPHIC TALLYING                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Individual encrypted ballots:                                  │
│                                                                  │
│  Ballot 1: Enc([1, 0, 0])  ← "Yes"                             │
│  Ballot 2: Enc([0, 1, 0])  ← "No"                              │
│  Ballot 3: Enc([1, 0, 0])  ← "Yes"                             │
│  Ballot 4: Enc([0, 0, 1])  ← "Abstain"                         │
│  Ballot 5: Enc([1, 0, 0])  ← "Yes"                             │
│                                                                  │
│  Homomorphic addition (no decryption):                          │
│                                                                  │
│  Enc([1,0,0]) + Enc([0,1,0]) + Enc([1,0,0])                   │
│  + Enc([0,0,1]) + Enc([1,0,0])                                 │
│  = Enc([3, 1, 1])                                               │
│                                                                  │
│  Only the AGGREGATE Enc([3, 1, 1]) is decrypted:               │
│  Result: Yes=3, No=1, Abstain=1                                 │
│                                                                  │
│  Individual votes are NEVER decrypted.                          │
│  Cannot determine how any single person voted.                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```go
// TallyVotes performs homomorphic tallying of encrypted ballots
func TallyVotes(ballots []*EncryptedBallot, pk *FHEPublicKey) ([]byte, error) {
    if len(ballots) == 0 {
        return nil, ErrNoBallots
    }

    // Start with first ballot's ciphertext
    aggregate := ballots[0].Ciphertext

    // Homomorphically add remaining ballots
    for i := 1; i < len(ballots); i++ {
        var err error
        aggregate, err = fhe.Add(pk, aggregate, ballots[i].Ciphertext)
        if err != nil {
            return nil, fmt.Errorf("homomorphic add ballot %d: %w", i, err)
        }
    }

    return aggregate, nil // Still encrypted; requires threshold decryption
}

// DecryptTally combines committee shares to decrypt the aggregate
func DecryptTally(
    aggregate []byte,
    shares []DecryptionShare,
    threshold int,
) (*TallyResult, error) {
    if len(shares) < threshold {
        return nil, ErrInsufficientShares
    }

    // Combine decryption shares
    plaintext, err := threshold_fhe.CombineShares(aggregate, shares[:threshold])
    if err != nil {
        return nil, fmt.Errorf("combine shares: %w", err)
    }

    // Decode the result vector
    return decodeTallyResult(plaintext)
}
```

### Nullifier System (Double-Vote Prevention)

```go
// ComputeNullifier generates a unique, unlinkable nullifier for a voter-proposal pair
func ComputeNullifier(voterSecret [32]byte, proposalID [32]byte) [32]byte {
    // Nullifier = Poseidon2(voterSecret || proposalID)
    // - Unique per voter per proposal
    // - Cannot be linked to voter identity (requires voterSecret)
    // - Same voter always produces same nullifier for same proposal (prevents double vote)
    return poseidon2.Hash(voterSecret[:], proposalID[:])
}

// VerifyEligibility checks the ZK proof of voter eligibility
func VerifyEligibility(ballot *EncryptedBallot, veASHARoot [32]byte) error {
    // ZK proof verifies:
    // 1. Voter holds veASHA tokens (Merkle proof against snapshot root)
    // 2. Nullifier is correctly derived from voter's secret + proposal ID
    // 3. Nullifier has not been used before (checked against nullifier set)
    // 4. Vote weight is within voter's veASHA balance (for quadratic voting)

    if !zk.VerifyEligibilityProof(ballot.EligibilityProof, veASHARoot, ballot.Nullifier) {
        return ErrInvalidEligibility
    }

    // Check nullifier not already used
    if nullifierSet.Contains(ballot.Nullifier) {
        return ErrDoubleVote
    }

    nullifierSet.Add(ballot.Nullifier)
    return nil
}
```

### Coercion Resistance

```
┌─────────────────────────────────────────────────────────────────┐
│                    COERCION RESISTANCE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SCENARIO: Coercer demands voter prove they voted "Yes"         │
│                                                                  │
│  WITHOUT COERCION RESISTANCE:                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Voter shows encryption randomness → coercer verifies      │  │
│  │ Result: coercion is effective                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  WITH PARS COERCION RESISTANCE:                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Voter has a "duress key" (PIP-0003)                    │  │
│  │ 2. Under coercion, voter creates a DENIABLE ballot        │  │
│  │ 3. Deniable ballot looks identical to a real ballot        │  │
│  │ 4. Voter shows fake randomness to coercer                 │  │
│  │ 5. Coercer sees "proof" the voter voted "Yes"             │  │
│  │ 6. But the REAL ballot (submitted earlier) voted "No"     │  │
│  │ 7. Only the real ballot counts in the tally               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  KEY INSIGHT: The encryption scheme allows generating fake     │
│  randomness that "opens" a ciphertext to any plaintext.        │
│  This is computationally indistinguishable from real openings. │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```go
// CreateDeniableBallot creates a ballot that can be "opened" to any value under duress
func CreateDeniableBallot(
    realVote []uint64,
    proposalID [32]byte,
    voterSecret [32]byte,
    fhePK *FHEPublicKey,
) (*DeniableBallot, error) {
    // 1. Encrypt real vote with real randomness
    realRandomness := randomBytes(32)
    realCiphertext := fhe.EncryptWithRandomness(fhePK, realVote, realRandomness)

    // 2. For each possible fake vote, compute fake randomness
    // that would make the ciphertext "open" to that fake vote
    fakeOpenings := make(map[string][]byte)
    for _, fakeVote := range allPossibleVotes() {
        fakeRand := computeFakeRandomness(fhePK, realCiphertext, fakeVote)
        fakeOpenings[encodeVote(fakeVote)] = fakeRand
    }

    return &DeniableBallot{
        Ciphertext:    realCiphertext,
        RealRandom:    realRandomness,
        FakeOpenings:  fakeOpenings,
    }, nil
}

// UnderDuress returns fake randomness that "proves" any desired vote
func (d *DeniableBallot) UnderDuress(claimedVote []uint64) []byte {
    return d.FakeOpenings[encodeVote(claimedVote)]
}
```

### Precompile Interface

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

/// @title IEncryptedVoting - Pars Encrypted Voting Precompile
/// @notice Precompile at address 0x0710 on Pars EVM
interface IEncryptedVoting {
    /// @notice Create a new election
    /// @param proposalId The governance proposal ID
    /// @param voteType The voting method
    /// @param numOptions Number of voting options
    /// @param fhePublicKey The threshold FHE public key
    /// @param veASHARoot Merkle root of eligible veASHA holders
    /// @return electionId The unique election identifier
    function createElection(
        bytes32 proposalId,
        uint8 voteType,
        uint8 numOptions,
        bytes calldata fhePublicKey,
        bytes32 veASHARoot
    ) external returns (bytes32 electionId);

    /// @notice Cast an encrypted ballot
    /// @param electionId The election to vote in
    /// @param ciphertext FHE-encrypted ballot
    /// @param nullifier Double-vote prevention nullifier
    /// @param eligibilityProof ZK proof of voter eligibility
    function castBallot(
        bytes32 electionId,
        bytes calldata ciphertext,
        bytes32 nullifier,
        bytes calldata eligibilityProof
    ) external;

    /// @notice Submit a decryption share for tallying
    /// @param electionId The election to decrypt
    /// @param share The committee member's decryption share
    /// @param shareProof Proof that share is correctly computed
    function submitDecryptionShare(
        bytes32 electionId,
        bytes calldata share,
        bytes calldata shareProof
    ) external;

    /// @notice Finalize election and publish results
    /// @param electionId The election to finalize
    /// @return results The decrypted tally vector
    function finalize(
        bytes32 electionId
    ) external returns (uint256[] memory results);

    /// @notice Emitted when a ballot is cast
    event BallotCast(bytes32 indexed electionId, bytes32 nullifier);

    /// @notice Emitted when election is finalized
    event ElectionFinalized(bytes32 indexed electionId, uint256[] results);
}
```

## Rationale

### Why Threshold FHE?

Threshold FHE provides the strongest combination of properties:

| Property | Standard Encryption | ZK Voting | Threshold FHE |
|:---------|:-------------------|:----------|:--------------|
| Ballot privacy | No | Yes | Yes |
| Homomorphic tally | No | Partial | Yes |
| Coercion resistance | No | Partial | Yes |
| No trusted tallier | Yes | Yes | Yes |
| Post-quantum ready | Depends | Depends | Yes (lattice-based) |

### Why Nullifiers Instead of Token Burning?

Token burning reveals on-chain activity that could be correlated with a voter. Nullifiers are:
1. Derived from a secret unknown to observers
2. Unlinkable to any on-chain identity
3. Unique per election (prevents cross-election correlation)
4. Compatible with veASHA lock-up (no token movement required)

### Shadow Government Mode

PIP-7010 defines a shadow governance protocol that uses this voting system. The encrypted voting protocol is designed to support:
- Completely anonymous participants (no identity requirements beyond veASHA)
- Issue-based voting on real-world policy positions
- Educational democratic exercises
- Diaspora-wide opinion polling on sensitive topics

## Security Considerations

### Ballot Privacy

Individual ballots are encrypted under a threshold FHE key. Even if t-1 committee members collude, they cannot decrypt individual ballots. Only the aggregate tally can be decrypted.

### Double-Voting Prevention

The nullifier system prevents double voting without revealing voter identity. The ZK proof demonstrates:
1. The nullifier is correctly derived from the voter's secret and the proposal ID
2. The voter holds veASHA tokens in the snapshot
3. The vote weight is within the voter's balance

### Committee Trust Model

The voting committee requires t-of-n honest members:
- Committee selection is randomized from validator set
- Committee members are incentivized via staking rewards
- Malicious committee members can be slashed
- Minimum threshold: t > n/2 (majority required)

### Quantum Resistance

The FHE scheme uses lattice-based cryptography (Learning With Errors), which is believed to be quantum-resistant. Combined with ML-DSA signatures (PIP-0002), the entire voting protocol is post-quantum secure.

### Coercion Resistance Limitations

Coercion resistance requires that:
1. The voter submits their real ballot before the coercion event
2. The coercer does not have real-time access to the voter's device during voting
3. The voter can plausibly claim they have not yet voted when coerced

If the coercer watches the voter cast their ballot in real-time, coercion resistance is reduced (but ballot privacy is still maintained).

## References

- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)
- [PIP-0003: Coercion Resistance](./pip-0003-coercion-resistance.md)
- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)
- [PIP-7010: Shadow Government Protocol](./pip-7010-shadow-governance.md)
- [Threshold FHE: A Survey](https://eprint.iacr.org/2023/1713)
- [Coercion-Resistant Electronic Elections](https://eprint.iacr.org/2002/165)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
