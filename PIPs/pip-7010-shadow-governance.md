---
pip: 7010
title: Shadow Government Protocol
tags: [shadow-government, governance, anonymous, voting, fhe, civic]
description: Anonymous parallel governance system for civic observation, deliberation, and democratic education
author: Pars Network Team (@pars-network)
status: Draft
type: Standards Track
category: Governance
created: 2026-02-13
discussions-to: https://github.com/pars-network/pips/discussions/7010
order: 10
tier: governance
requires: [3, 12]
---

## Abstract

This PIP defines the Shadow Government Protocol -- an anonymous parallel governance system where diaspora members observe, discuss, and vote on real-world government actions without revealing their identity. Participants mirror real government structures (ministries, committees, parliament) as anonymous "shadow" counterparts. All deliberation is FHE-encrypted, all voting uses PIP-0012 encrypted ballots, and all participation is completely anonymous. The protocol is an educational tool for democratic participation, a civic observation mechanism, and a framework for diaspora consensus on policy positions. It runs on `pars.vote` with Pars Session (PIP-0005) for communications.

## Motivation

### The Democratic Deficit

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE DEMOCRATIC DEFICIT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PROBLEM 1: No legitimate representation                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Diaspora has no voice in homeland governance            │  │
│  │ • Elections are not free or fair                            │  │
│  │ • Political participation is criminalized                  │  │
│  │ • Expressing opposition endangers family members           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  PROBLEM 2: Diaspora fragmentation                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • No mechanism for diaspora consensus                      │  │
│  │ • Competing exile groups with no coordination              │  │
│  │ • No way to gauge community opinion on policy              │  │
│  │ • Fear prevents open political discussion                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  PROBLEM 3: Democratic atrophy                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Generations without democratic practice                  │  │
│  │ • No experience with parliamentary procedure               │  │
│  │ • No culture of structured debate and compromise           │  │
│  │ • When opportunity comes, no institutional knowledge       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  THE PARS SHADOW GOVERNMENT:                                    │
│  A completely anonymous, encrypted governance system where      │
│  the diaspora practices democracy today, builds consensus,      │
│  and prepares institutional knowledge for tomorrow.             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### What is a Shadow Government?

In democratic systems, a "shadow government" or "shadow cabinet" is the opposition's alternative government -- ministers who mirror each real government ministry, observe its actions, and prepare alternative policies. This is a standard democratic practice in parliamentary systems (UK, Australia, Canada).

Pars Shadow Government extends this concept:
1. **Fully anonymous** -- no one knows who holds any shadow position
2. **Encrypted deliberation** -- all discussions are FHE-encrypted
3. **Democratic voting** -- positions and policies decided by encrypted ballot
4. **Educational** -- teaches democratic practice to a diaspora that has been denied it
5. **Non-violent** -- purely observational and deliberative; no operational authority

## Specification

### Shadow Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHADOW GOVERNMENT STRUCTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SHADOW PARLIAMENT                                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Open to all veASHA holders                              │  │
│  │ • Anonymous participation (PIP-0003)                      │  │
│  │ • Votes on resolutions and policy positions               │  │
│  │ • Encrypted voting (PIP-0012)                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
│                          ▼                                       │
│  SHADOW CABINET                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Shadow ministers for each government ministry            │  │
│  │ • Elected anonymously by shadow parliament                │  │
│  │ • Prepare alternative policy briefs                       │  │
│  │ • Observe and critique real government actions             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
│                          ▼                                       │
│  SHADOW COMMITTEES                                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Issue-specific working groups                           │  │
│  │ • Open membership (any veASHA holder)                     │  │
│  │ • Produce reports and recommendations                     │  │
│  │ • Feed into parliamentary resolutions                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
│                          ▼                                       │
│  ISSUE TRACKER                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Community submits issues anonymously                    │  │
│  │ • Issues categorized by ministry/committee                │  │
│  │ • Community votes on priority                             │  │
│  │ • Committees produce responses                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Anonymous Identity System

Participants in the shadow government use anonymous identities that are:
- Unlinkable to any real-world identity
- Persistent within the shadow system (same pseudonym across sessions)
- Backed by veASHA stake (Sybil resistance)
- Revocable only by the participant themselves

```go
// ShadowIdentity represents an anonymous participant in the shadow government
type ShadowIdentity struct {
    // Pseudonym: a human-readable anonymous identifier
    // Generated deterministically from secret; same across sessions
    Pseudonym     string     // e.g., "Delegate-7F3A" or a random Persian name

    // Cryptographic identity
    Commitment    [32]byte   // Poseidon2(secret || "shadow-gov-v1")
    Nullifier     [32]byte   // Prevents duplicate registration

    // Eligibility
    StakeProof    []byte     // ZK proof of veASHA ownership
    MinimumStake  uint64     // Minimum veASHA required for participation

    // Communication
    SessionKey    []byte     // Pars Session ephemeral key for this identity
    FHEPublicKey  []byte     // FHE key for encrypted deliberation
}

// CreateShadowIdentity generates a new anonymous identity for shadow government
func CreateShadowIdentity(
    voterSecret [32]byte,
    veASHAProof *MerkleProof,
    minStake uint64,
) (*ShadowIdentity, error) {
    // 1. Derive commitment (anonymous but consistent)
    commitment := poseidon2.Hash(voterSecret[:], []byte("shadow-gov-v1"))

    // 2. Derive nullifier (prevents duplicate registration)
    nullifier := poseidon2.Hash(voterSecret[:], []byte("shadow-reg-nullifier"))

    // 3. Generate pseudonym from commitment (deterministic, human-readable)
    pseudonym := generatePseudonym(commitment)

    // 4. Generate ZK proof of veASHA eligibility
    stakeProof, err := zk.ProveStake(voterSecret, veASHAProof, minStake)
    if err != nil {
        return nil, fmt.Errorf("stake proof: %w", err)
    }

    // 5. Create session key for encrypted communication
    sessionKey, err := mlkem.GenerateKey(mlkem.Level5)
    if err != nil {
        return nil, err
    }

    return &ShadowIdentity{
        Pseudonym:    pseudonym,
        Commitment:   commitment,
        Nullifier:    nullifier,
        StakeProof:   stakeProof,
        MinimumStake: minStake,
        SessionKey:   sessionKey.Public,
    }, nil
}
```

### Shadow Ministry Structure

```go
// ShadowMinistry represents a shadow ministry mirroring a real government ministry
type ShadowMinistry struct {
    ID          [32]byte
    Name        string          // e.g., "Shadow Ministry of Education"
    RealMinistry string         // The real ministry being shadowed
    Minister    *ShadowIdentity // Elected shadow minister
    Deputies    []*ShadowIdentity
    Members     []*ShadowIdentity

    // Encrypted deliberation channel
    Channel     *EncryptedChannel

    // Issue tracker
    Issues      []*ShadowIssue

    // Policy briefs
    Briefs      []*PolicyBrief
}

// ShadowIssue represents a community-submitted issue
type ShadowIssue struct {
    ID          [32]byte
    Title       []byte          // FHE-encrypted title
    Description []byte          // FHE-encrypted description
    Submitter   [32]byte        // Anonymous commitment (not identity)
    Ministry    [32]byte        // Which ministry should address this
    Priority    []byte          // FHE-encrypted priority score (from votes)
    Status      IssueStatus     // Open, InDiscussion, Resolved, Archived
    Responses   []*IssueResponse
    CreatedAt   uint64
}

type IssueStatus uint8

const (
    IssueOpen         IssueStatus = iota
    IssueInDiscussion
    IssueResolved
    IssueArchived
)
```

### Encrypted Deliberation

All discussions within the shadow government use FHE-encrypted channels:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENCRYPTED DELIBERATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Shadow Committee Meeting on Education Policy                   │
│                                                                  │
│  All messages are FHE-encrypted. Relay nodes see nothing.       │
│                                                                  │
│  Delegate-7F3A: [encrypted message]                             │
│  Delegate-A2B1: [encrypted reply]                               │
│  Delegate-C9E4: [encrypted amendment proposal]                  │
│                                                                  │
│  Only committee members with the group FHE key can decrypt.     │
│                                                                  │
│  PROPERTIES:                                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Messages are end-to-end encrypted (PIP-0005)            │  │
│  │ • Metadata (who spoke, when) is FHE-encrypted             │  │
│  │ • Discussion archives are encrypted CRDTs (PIP-0013)      │  │
│  │ • Offline participants sync via mesh (PIP-0001)            │  │
│  │ • No one outside the group can read discussions            │  │
│  │ • Even within the group, pseudonyms hide real identity     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  THRESHOLD REVEAL (optional):                                   │
│  Committee can vote to publish a summary of deliberations.     │
│  Only the summary is revealed; individual contributions        │
│  remain anonymous and encrypted.                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```go
// EncryptedChannel manages FHE-encrypted group communication
type EncryptedChannel struct {
    ChannelID   [32]byte
    GroupKey    *FHEPublicKey       // Shared group encryption key
    Members     []ShadowIdentity   // Anonymous members
    Messages    *EncryptedRGAList  // Ordered message list (PIP-0013 eCRDT)
    Session     *GroupSession       // Pars Session group (PIP-0005)
}

// PostMessage posts an encrypted message to the channel
func (c *EncryptedChannel) PostMessage(
    author *ShadowIdentity,
    content []byte,
) error {
    // 1. Encrypt message content
    encContent := fhe.Encrypt(c.GroupKey, content)

    // 2. Encrypt author pseudonym
    encAuthor := fhe.Encrypt(c.GroupKey, []byte(author.Pseudonym))

    // 3. Encrypt timestamp
    encTimestamp := fhe.Encrypt(c.GroupKey, encodeUint64(uint64(time.Now().UnixMilli())))

    // 4. Create message entry
    msg := &ChannelMessage{
        EncryptedContent:  encContent,
        EncryptedAuthor:   encAuthor,
        EncryptedTimestamp: encTimestamp,
    }

    // 5. Append to eCRDT message list
    return c.Messages.InsertAfter(
        c.Messages.LastPosition(),
        msg.Marshal(),
        uint64(time.Now().UnixMilli()),
        author.Commitment,
        c.GroupKey,
    )
}
```

### Shadow Elections

Shadow government positions are filled through anonymous encrypted elections:

```go
// ShadowElection manages elections for shadow government positions
type ShadowElection struct {
    ElectionID    [32]byte
    Position      string         // e.g., "Shadow Minister of Education"
    MinistryID    [32]byte
    Candidates    []ShadowCandidate
    VotingSystem  *EncryptedVoting // PIP-0012
    StartTime     uint64
    EndTime       uint64
    Status        ElectionStatus
}

type ShadowCandidate struct {
    Commitment       [32]byte   // Anonymous commitment
    Pseudonym        string     // Public pseudonym
    Platform         []byte     // FHE-encrypted platform statement
    Endorsements     uint64     // Number of endorsements (encrypted tally)
}

type ElectionStatus uint8

const (
    ElectionNomination ElectionStatus = iota
    ElectionCampaign
    ElectionVoting
    ElectionTallying
    ElectionComplete
)

// NominateCandidate allows a shadow identity to nominate themselves
func NominateCandidate(
    identity *ShadowIdentity,
    election *ShadowElection,
    platform []byte,
    fhePK *FHEPublicKey,
) (*ShadowCandidate, error) {
    // Encrypt platform statement
    encPlatform := fhe.Encrypt(fhePK, platform)

    candidate := &ShadowCandidate{
        Commitment: identity.Commitment,
        Pseudonym:  identity.Pseudonym,
        Platform:   encPlatform,
    }

    // Generate ZK proof of eligibility
    proof, err := zk.ProveCandidateEligibility(identity)
    if err != nil {
        return nil, err
    }

    // Submit nomination on-chain
    return candidate, submitNomination(election.ElectionID, candidate, proof)
}

// RunShadowElection executes a full shadow election using PIP-0012
func RunShadowElection(election *ShadowElection) (*ElectionResult, error) {
    // 1. Create encrypted election (PIP-0012)
    votingSystem, err := CreateElection(
        election.ElectionID,
        VoteRankedChoice,
        uint8(len(election.Candidates)),
    )
    if err != nil {
        return nil, err
    }

    // 2. Voting phase: each eligible member casts encrypted ballot
    // (handled by PIP-0012 protocol)

    // 3. Tallying phase: homomorphic aggregation
    aggregate, err := TallyVotes(votingSystem.Ballots, votingSystem.FHEPublicKey)
    if err != nil {
        return nil, err
    }

    // 4. Threshold decryption of aggregate result
    result, err := DecryptTally(aggregate, votingSystem.DecryptionShares, votingSystem.Threshold)
    if err != nil {
        return nil, err
    }

    // 5. Announce winner (only aggregate revealed)
    return &ElectionResult{
        ElectionID: election.ElectionID,
        Winner:     election.Candidates[result.WinnerIndex],
        Tally:      result.Counts,
    }, nil
}
```

### Issue Tracking and Voting

```go
// SubmitIssue allows any veASHA holder to submit an issue anonymously
func SubmitIssue(
    identity *ShadowIdentity,
    title, description []byte,
    ministryID [32]byte,
    fhePK *FHEPublicKey,
) (*ShadowIssue, error) {
    issue := &ShadowIssue{
        ID:          randomID(),
        Title:       fhe.Encrypt(fhePK, title),
        Description: fhe.Encrypt(fhePK, description),
        Submitter:   identity.Commitment,
        Ministry:    ministryID,
        Status:      IssueOpen,
        CreatedAt:   uint64(time.Now().UnixMilli()),
    }

    // Submit to mesh DAG
    return issue, dag.AddVertex(issue.Marshal())
}

// PrioritizeIssues uses quadratic voting to rank issues by community priority
func PrioritizeIssues(
    issues []*ShadowIssue,
    voters []*ShadowIdentity,
    fhePK *FHEPublicKey,
) ([]*ShadowIssue, error) {
    // Create quadratic voting election for issue prioritization
    election, err := CreateElection(
        randomID(),
        VoteQuadratic,
        uint8(len(issues)),
    )
    if err != nil {
        return nil, err
    }

    // Voting handled by PIP-0012
    // After tallying, sort issues by vote count

    // Return issues sorted by priority (highest votes first)
    return sortByPriority(issues, election), nil
}
```

### Policy Brief Publication

```
┌─────────────────────────────────────────────────────────────────┐
│                    POLICY BRIEF LIFECYCLE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. OBSERVATION                                                 │
│     Shadow ministry observes real government action              │
│     e.g., "Ministry of Education bans philosophy courses"       │
│                                                                  │
│  2. COMMITTEE DELIBERATION                                      │
│     Shadow committee discusses in encrypted channel              │
│     Members contribute analysis anonymously                     │
│                                                                  │
│  3. DRAFT                                                       │
│     Committee produces policy brief using eCRDTs (PIP-0013)     │
│     Collaborative editing, all encrypted                        │
│                                                                  │
│  4. INTERNAL VOTE                                               │
│     Committee votes on final brief text (PIP-0012)              │
│     Majority approval required                                  │
│                                                                  │
│  5. PARLIAMENTARY VOTE                                          │
│     Shadow parliament votes on adopting the brief               │
│     as an official shadow government position                   │
│                                                                  │
│  6. PUBLICATION (optional)                                      │
│     If parliament votes to publish:                             │
│     - Brief text is threshold-decrypted                         │
│     - Published on pars.vote for public consumption             │
│     - Sealed with data integrity seal (PIP-0010)                │
│     - No individual contributions are attributed                │
│                                                                  │
│  At no point is any participant's identity revealed.            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```go
// PolicyBrief represents a shadow government policy position
type PolicyBrief struct {
    ID            [32]byte
    Title         []byte          // FHE-encrypted until publication
    Content       []byte          // FHE-encrypted eCRDT document
    Ministry      [32]byte        // Originating shadow ministry
    Committee     [32]byte        // Originating committee
    Status        BriefStatus
    CommitteeVote [32]byte        // Reference to PIP-0012 election
    ParliamentVote [32]byte       // Reference to PIP-0012 election
    SealID        [32]byte        // PIP-0010 data integrity seal (after publication)
    PublishedAt   uint64
}

type BriefStatus uint8

const (
    BriefDraft     BriefStatus = iota
    BriefInReview
    BriefApproved
    BriefPublished
    BriefArchived
)
```

### Precompile Interface

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

/// @title IShadowGovernment - Pars Shadow Government Precompile
/// @notice Precompile at address 0x0720 on Pars EVM
interface IShadowGovernment {
    /// @notice Register a shadow identity
    /// @param commitment Anonymous identity commitment
    /// @param nullifier Registration nullifier
    /// @param stakeProof ZK proof of veASHA stake
    /// @return success Whether registration succeeded
    function registerIdentity(
        bytes32 commitment,
        bytes32 nullifier,
        bytes calldata stakeProof
    ) external returns (bool success);

    /// @notice Submit an issue for community consideration
    /// @param encryptedTitle FHE-encrypted issue title
    /// @param encryptedDescription FHE-encrypted description
    /// @param ministryId Target shadow ministry
    /// @return issueId The unique issue identifier
    function submitIssue(
        bytes calldata encryptedTitle,
        bytes calldata encryptedDescription,
        bytes32 ministryId
    ) external returns (bytes32 issueId);

    /// @notice Create a shadow election for a position
    /// @param position The position being elected
    /// @param ministryId The ministry the position belongs to
    /// @param duration Voting duration in seconds
    /// @return electionId The election identifier
    function createElection(
        string calldata position,
        bytes32 ministryId,
        uint64 duration
    ) external returns (bytes32 electionId);

    /// @notice Publish a policy brief (after parliamentary approval)
    /// @param briefId The brief to publish
    /// @param decryptedContent The threshold-decrypted brief content
    /// @param parliamentVote Reference to the approving vote
    /// @return sealId PIP-0010 data integrity seal for the publication
    function publishBrief(
        bytes32 briefId,
        bytes calldata decryptedContent,
        bytes32 parliamentVote
    ) external returns (bytes32 sealId);

    /// @notice Emitted when a new shadow identity is registered
    event IdentityRegistered(bytes32 indexed commitment);

    /// @notice Emitted when an issue is submitted
    event IssueSubmitted(bytes32 indexed issueId, bytes32 indexed ministryId);

    /// @notice Emitted when a policy brief is published
    event BriefPublished(bytes32 indexed briefId, bytes32 indexed sealId);
}
```

## Rationale

### Why Anonymous Positions?

In traditional shadow governments, shadow ministers are public figures. In the Pars context, this is impossible:
1. Publicly identifying as a "shadow minister" would endanger the person and their family
2. State actors would target shadow government participants
3. Anonymity enables participation from inside Iran, not just the diaspora abroad
4. The focus is on ideas and policies, not personalities

### Why Not Just a Forum?

A forum (even encrypted) lacks:
1. **Structure** -- shadow government provides parliamentary procedure and institutional knowledge
2. **Decision-making** -- encrypted voting produces binding community positions
3. **Accountability** -- shadow ministers are elected and can be replaced by anonymous vote
4. **Education** -- participants learn democratic governance by practicing it

### Why Pseudonyms?

Anonymous pseudonyms (e.g., "Delegate-7F3A") provide:
1. **Continuity** -- the same pseudonym across sessions builds reputation
2. **Accountability** -- poor performance can lead to electoral defeat
3. **Discussion** -- structured debate requires addressable participants
4. **No linkability** -- pseudonym cannot be linked to any real identity

### Democratic Education Value

For a diaspora that has lived under authoritarian rule for decades:
- Practicing parliamentary procedure builds institutional memory
- Debating policy positions develops civic skills
- Voting exercises teach democratic participation
- Committee work builds consensus-building skills
- When political change comes, the diaspora will have practiced governance

## Security Considerations

### Complete Anonymity

The shadow government protocol provides the strongest anonymity guarantees in the Pars ecosystem:

| Property | Guarantee |
|:---------|:----------|
| Identity linkage | Impossible (ZK proofs, anonymous commitments) |
| Vote attribution | Impossible (PIP-0012 encrypted voting) |
| Discussion attribution | Impossible (FHE-encrypted channels) |
| Participation detection | Impossible (mesh network, no central server) |
| Cross-session correlation | Pseudonyms are consistent but unlinkable to identity |

### State-Level Adversary Model

The shadow government is designed to resist state-level adversaries who can:
- Monitor all internet traffic (mitigated by mesh network, PIP-0001)
- Compel disclosure of keys (mitigated by coercion resistance, PIP-0003)
- Infiltrate the system with agents (mitigated by anonymous pseudonyms; agents gain nothing)
- Attempt to disrupt governance (mitigated by threshold encryption; t-of-n resilience)
- Confiscate devices (mitigated by ephemeral sessions; no persistent plaintext)

### Sybil Resistance

veASHA staking prevents Sybil attacks:
- Each shadow identity requires minimum veASHA stake
- ZK proofs verify stake without revealing the staker's address
- One identity per veASHA position (nullifier prevents duplicates)
- Economic cost of creating many identities deters manipulation

### Infiltration Resistance

Even if a state agent joins the shadow government:
- They see only encrypted deliberations (FHE)
- They cannot identify other participants (anonymous pseudonyms)
- Their vote is one among many (encrypted, no outsized influence)
- They cannot disrupt elections (threshold encryption requires t-of-n)
- Their presence does not compromise anyone else's anonymity

### Legal Considerations

The shadow government is:
- An educational and civic observation tool
- Not an operational government or competing state entity
- Comparable to student government, model UN, or parliamentary simulation
- Protected expression in most jurisdictions where diaspora members reside
- Designed to be non-threatening: it observes, discusses, and expresses opinions

## References

- [PIP-0003: Coercion Resistance](./pip-0003-coercion-resistance.md)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [PIP-0010: Data Integrity Seal](./pip-0010-data-integrity-seal.md)
- [PIP-0012: Encrypted Voting](./pip-0012-encrypted-voting.md)
- [PIP-0013: Encrypted CRDT](./pip-0013-encrypted-crdt.md)
- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)
- [Shadow Cabinet (Wikipedia)](https://en.wikipedia.org/wiki/Shadow_cabinet)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
