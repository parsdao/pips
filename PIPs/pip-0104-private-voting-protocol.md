---
pip: 104
title: "Private Voting Protocol"
description: "zk-SNARK based private on-chain voting with universal verifiability"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Privacy
created: 2026-01-23
tags: [voting, zk-snarks, privacy, governance, democracy]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a lightweight private voting protocol using zk-SNARKs for the Pars Network governance system. Unlike the threshold FHE voting protocol in PIP-0012 (which provides homomorphic tallying), this protocol uses a simpler zk-SNARK approach where each voter proves in zero knowledge that their vote is valid and their identity is eligible, without revealing their vote choice. Votes are committed on-chain as encrypted values and tallied after the voting period by a designated tallying authority or through a multi-party computation. This protocol is designed for lower-stakes governance decisions where the full FHE machinery of PIP-0012 is unnecessary.

## Motivation

PIP-0012 provides maximum privacy through threshold FHE, but FHE is computationally expensive and requires a threshold decryption committee. For frequent, lower-stakes governance decisions (parameter adjustments, grant approvals, community polls), a lighter-weight protocol reduces voter friction and infrastructure requirements. The zk-SNARK approach provides ballot privacy and eligibility verification while being 100x cheaper in gas costs than FHE-based voting. This makes private voting accessible for everyday governance, not just major protocol decisions.

## Specification

### Voter Registration

Eligible voters are identified by their veASHA balance at a snapshot block. The snapshot produces a Merkle tree of eligible voters:

```
VoterLeaf {
    commitment: bytes32  // Poseidon2(identitySecret, identityNullifier)
    weight:     uint256  // veASHA balance at snapshot
}
```

The Merkle root is published on-chain when a vote is created.

### Vote Casting

To cast a vote, a user generates a zk-SNARK proof demonstrating:

1. They know a `(identitySecret, identityNullifier)` pair whose commitment is in the voter Merkle tree.
2. Their vote is a valid option (e.g., 0 for No, 1 for Yes).
3. Their nullifier (derived from `identityNullifier` and the vote ID) has not been used.

The proof reveals nothing about the voter's identity or vote choice to any observer.

### On-Chain Submission

```solidity
struct Ballot {
    bytes32 voteId;           // Which vote this ballot is for
    bytes32 nullifierHash;    // Prevents double voting
    bytes32 voteCommitment;   // Pedersen commitment to the vote choice
    bytes   proof;            // zk-SNARK proof
}
```

The smart contract verifies the proof, checks the nullifier has not been used, and stores the vote commitment.

### Tallying

After the voting period ends, vote commitments are decrypted using one of two methods:

1. **Delayed reveal**: Each voter reveals their vote commitment opening (randomness + choice) after the period ends. A zk proof ensures the opening matches the commitment.
2. **Threshold decryption**: If voter participation in reveal is insufficient, a threshold committee decrypts the commitments.

The tally is computed from the revealed/decrypted votes and published on-chain.

### Circuit Specification

The zk-SNARK circuit verifies:

```
Public inputs:
    - voterMerkleRoot: bytes32
    - nullifierHash: bytes32
    - voteCommitment: bytes32
    - voteId: bytes32

Private inputs (witness):
    - identitySecret: bytes32
    - identityNullifier: bytes32
    - merklePath: bytes32[]
    - merklePathIndices: uint[]
    - voteChoice: uint8
    - commitmentRandomness: bytes32

Constraints:
    1. commitment = Poseidon2(identitySecret, identityNullifier)
    2. MerkleProof(commitment, merklePath, merklePathIndices) == voterMerkleRoot
    3. nullifierHash = Poseidon2(identityNullifier, voteId)
    4. voteCommitment = PedersenCommit(voteChoice, commitmentRandomness)
    5. voteChoice IN {0, 1, ..., numOptions-1}
```

### Gas Costs

| Operation | Gas Cost |
|:----------|:---------|
| Proof verification (Groth16) | ~250,000 |
| Nullifier check | ~20,000 |
| Commitment storage | ~20,000 |
| Total per ballot | ~290,000 |

This is approximately 100x cheaper than FHE-based ballot submission (PIP-0012).

## Rationale

The Semaphore-inspired approach (identity commitments + nullifiers + Merkle proofs) provides a well-audited, battle-tested pattern for anonymous signaling. Groth16 proofs are compact (128 bytes) and cheap to verify on-chain. The two-phase approach (commit during voting, reveal after) prevents vote-buying since voters cannot prove their choice during the voting period. The delayed reveal mechanism avoids the need for a permanent decryption committee, further reducing trust assumptions.

## Security Considerations

- **Voter coercion**: During the reveal phase, a voter could be coerced to reveal a specific choice. Mitigation: the reveal can use PIP-0003 deniable encryption to provide plausible deniability.
- **Front-running reveals**: Observers could see early reveals and change their vote. Mitigation: all votes are committed before any reveals begin.
- **Nullifier correlation**: Nullifier hashes are deterministic per voter per vote. This is by design (double-vote prevention) and does not reveal voter identity.
- **Proof generation cost**: zk-SNARK proof generation requires approximately 5 seconds on a modern mobile device. This is acceptable for governance voting.

## References

- [PIP-0003: Coercion Resistance](./pip-0003-coercion-resistance.md)
- [PIP-0012: Encrypted Voting](./pip-0012-encrypted-voting.md)
- [PIP-0100: Zero-Knowledge Identity](./pip-0100-zero-knowledge-identity.md)
- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)
- [Semaphore Protocol](https://semaphore.pse.dev/)
- [Groth16](https://eprint.iacr.org/2016/260)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
