# Shadow Governance Example

**PIP**: [PIP-7010 -- Shadow Government Protocol](../../PIPs/pip-7010-shadow-governance.md)
**Voting**: [PIP-0012 -- Encrypted Voting](../../PIPs/pip-0012-encrypted-voting.md)
**Platform**: [pars.vote](https://pars.vote)

## Purpose

Anonymous parallel governance for the Persian diaspora. Shadow ministries
mirror real government structures -- participants observe, deliberate, and
vote on policy without revealing identity. The protocol is a democratic
education tool, a civic observation mechanism, and a framework for diaspora
consensus. Purely observational and deliberative; no operational authority.

## Threat Model

- Political participation is criminalized in the homeland
- Family members held hostage to coerce political behavior
- Diaspora fragmented across jurisdictions with varying freedoms
- State intelligence monitors exile political organizations
- Generations without democratic practice atrophy institutional knowledge

Key property: **total anonymity**. No one knows who leads any ministry,
who proposed any policy, or how any individual voted. Even other ministry
members cannot identify each other.

## Contract Overview

`ShadowGovernance.sol` implements the PIP-7010 shadow structure:

| Function | Purpose |
|----------|---------|
| `createMinistry()` | Create anonymous shadow ministry with FHE-encrypted leader |
| `joinMinistry()` | Join via nullifier + ZK eligibility proof |
| `submitProposal()` | Submit encrypted proposal with quorum requirement |
| `castBallot()` | PIP-0012 encrypted vote with nullifier anti-fraud |
| `resolveProposal()` | Finalize after threshold decryption of tallies |

### Anonymity Layers

1. **Ministry leadership**: Leader identity is FHE-encrypted
2. **Membership**: Nullifier-based -- no link between member and address
3. **Proposals**: Title and body are FHE-encrypted
4. **Voting**: PIP-0012 encrypted ballots with coercion resistance
5. **Deliberation**: Pars Session (PIP-0005) end-to-end encryption

### Quorum Enforcement

Each proposal requires a minimum ballot count. If quorum is not met,
the proposal expires without revealing any vote tallies -- protecting
minority positions from identification.

## FHE Integration

- Ministry leader: `tFHE.encrypt(leader_identity, network_pk)`
- Proposal content: `tFHE.encrypt(title, network_pk)`
- Ballots: `tFHE.encrypt(vote, network_pk)` with homomorphic tallying
- Leadership proof: ZK proof of knowledge of encrypted identity

## Related Repositories

- [luxfhe/examples/shadow-governance](https://github.com/luxfi/fhe/tree/main/examples/shadow-governance) -- FHE governance circuits
- [PIP-0012](../../PIPs/pip-0012-encrypted-voting.md) -- Encrypted voting system
- [PIP-0003](../../PIPs/pip-0003-coercion-resistance.md) -- Coercion resistance framework
- [PIP-7000](../../PIPs/pip-7000-dao-governance-framework.md) -- DAO governance framework

## Build

```bash
forge build
```

## License

MIT
