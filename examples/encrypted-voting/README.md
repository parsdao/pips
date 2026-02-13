# Encrypted Voting Example

**PIP**: [PIP-0012 -- Encrypted Voting & Anonymous Governance](../../PIPs/pip-0012-encrypted-voting.md)
**Platform**: [pars.vote](https://pars.vote)

## Purpose

Diaspora democratic exercises where voters face real coercion.
Ballots are FHE-encrypted and tallied homomorphically -- individual votes
are never decrypted. Even the voter cannot prove how they voted after the fact,
making coercion pointless.

## Threat Model

- Family members held hostage to coerce voting behavior
- Voters in Iran where political expression is criminalized
- Vote buying requires verifiable proof of vote (impossible here)
- State surveillance monitors on-chain activity for dissident identification

Key property: **coercion resistance through deniable ballots**.
Under duress, a voter produces a fake receipt that verifies but does not
correspond to their actual encrypted ballot.

## Contract Overview

`EncryptedVoting.sol` implements the PIP-0012 voting lifecycle:

| Phase | Description |
|-------|-------------|
| **Setup** | Voting committee generates threshold FHE keys |
| **Voting** | Encrypted ballots submitted with ZK well-formedness proofs |
| **Tallying** | Homomorphic sum computed on ciphertext |
| **Finalized** | Threshold decryption reveals only aggregate totals |

### Key Functions

- `createProposal()` -- Initialize election with threshold FHE key
- `castBallot()` -- Submit encrypted vote with nullifier and ZK proof
- `finalizeTally()` -- Record decrypted aggregates after threshold ceremony
- `advanceState()` -- Progress through voting lifecycle

### Nullifier-Based Double-Vote Prevention

Each voter computes `nullifier = Poseidon2(voter_secret, proposalId)`.
The nullifier is deterministic per voter per proposal but reveals nothing
about voter identity. The contract rejects duplicate nullifiers.

## FHE Integration

- Ballot: `tFHE.encrypt(choice, proposal_encryption_key)` where choice in {0, 1}
- Tally: `tFHE.add(running_tally, encrypted_ballot)` -- addition on ciphertext
- Finalize: Threshold decryption requires t-of-n committee members

See: `luxfi/fhe/cmd/vote` for the CLI voting tool.

## Related Repositories

- [luxfhe/examples/confidential-voting](https://github.com/luxfi/fhe/tree/main/examples/confidential-voting) -- FHE voting circuits
- [luxfi/fhe/cmd/vote](https://github.com/luxfi/fhe/tree/main/cmd/vote) -- CLI voting tool
- [PIP-0003](../../PIPs/pip-0003-coercion-resistance.md) -- Coercion resistance framework
- [PIP-7010](../../PIPs/pip-7010-shadow-governance.md) -- Shadow government (uses this voting system)

## Build

```bash
forge build
```

## License

MIT
