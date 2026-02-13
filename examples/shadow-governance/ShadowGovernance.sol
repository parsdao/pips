// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ShadowGovernance - Shadow Government Protocol (PIP-7010)
/// @notice Anonymous parallel governance for the Persian diaspora.
///         Shadow ministries mirror real government structures.
///         All participation is anonymous, all deliberation FHE-encrypted,
///         all voting uses PIP-0012 encrypted ballots.
///         Runs on pars.vote.
/// @dev FHE operations are pseudocode; real deployment uses luxfi/fhe precompiles.
contract ShadowGovernance is Ownable, ReentrancyGuard {

    enum MinistryStatus { Active, Suspended, Dissolved }
    enum ProposalStatus { Open, Voting, Passed, Rejected, Expired }

    struct Ministry {
        bytes32 nameHash;              // Poseidon2(ministry_name)
        bytes32 encryptedLeaderId;     // FHE: Enc(leader_identity, network_pk)
        uint256 memberCount;
        MinistryStatus status;
        uint64  createdAt;
        bool    exists;
    }

    struct ShadowProposal {
        bytes32 ministryId;
        bytes32 encryptedTitle;        // FHE: Enc(title, network_pk)
        bytes32 encryptedBody;         // FHE: Enc(body_hash, network_pk)
        bytes32 encryptedTallyFor;     // FHE: Enc(votes_for)
        bytes32 encryptedTallyAgainst; // FHE: Enc(votes_against)
        ProposalStatus status;
        uint64  votingDeadline;
        uint256 ballotCount;
        uint256 quorum;                // Minimum ballots for validity
    }

    /// @notice ministryId => Ministry
    mapping(bytes32 => Ministry) public ministries;

    /// @notice proposalId => ShadowProposal
    mapping(bytes32 => ShadowProposal) public proposals;

    /// @notice Nullifier set for anonymous membership proofs
    mapping(bytes32 => bool) public memberNullifiers;

    /// @notice Nullifier set for voting (one vote per member per proposal)
    mapping(bytes32 => bool) public voteNullifiers;

    uint256 public ministryCount;
    uint256 public proposalCount;

    event MinistryCreated(bytes32 indexed ministryId, uint64 createdAt);
    event MemberJoined(bytes32 indexed ministryId, uint256 newCount);
    event ProposalSubmitted(bytes32 indexed proposalId, bytes32 indexed ministryId, uint64 votingDeadline);
    event BallotCast(bytes32 indexed proposalId, uint256 ballotIndex);
    event ProposalResolved(bytes32 indexed proposalId, ProposalStatus result);

    constructor() Ownable(msg.sender) {}

    /// @notice Create an anonymous shadow ministry.
    ///         The leader identity is FHE-encrypted -- no one knows who leads.
    /// @param nameHash            Poseidon2(ministry_name) e.g. "Shadow Ministry of Education"
    /// @param encryptedLeaderId   FHE.encrypt(leader_identity, network_pk)
    function createMinistry(
        bytes32 nameHash,
        bytes32 encryptedLeaderId
    ) external nonReentrant returns (bytes32 ministryId) {
        ministryId = keccak256(abi.encodePacked(nameHash, ministryCount++));

        // FHE: Leader identity encrypted. Even other ministry members
        //       do not know who the leader is. Leadership is proven via
        //       ZK proofs of knowledge of the encrypted identity.

        ministries[ministryId] = Ministry({
            nameHash: nameHash,
            encryptedLeaderId: encryptedLeaderId,
            memberCount: 1,
            status: MinistryStatus.Active,
            createdAt: uint64(block.timestamp),
            exists: true
        });

        emit MinistryCreated(ministryId, uint64(block.timestamp));
    }

    /// @notice Join a ministry anonymously via nullifier-based membership proof.
    /// @param ministryId      Target ministry
    /// @param memberNullifier Poseidon2(member_secret, ministryId) -- prevents double join
    /// @param zkProof         ZK proof of eligibility (e.g., veASHA stake, identity credential)
    function joinMinistry(
        bytes32 ministryId,
        bytes32 memberNullifier,
        bytes calldata zkProof
    ) external nonReentrant {
        require(ministries[ministryId].exists, "Shadow: ministry not found");
        require(ministries[ministryId].status == MinistryStatus.Active, "Shadow: ministry not active");
        require(!memberNullifiers[memberNullifier], "Shadow: already a member");
        require(zkProof.length > 0, "Shadow: missing eligibility proof");

        memberNullifiers[memberNullifier] = true;
        ministries[ministryId].memberCount++;

        emit MemberJoined(ministryId, ministries[ministryId].memberCount);
    }

    /// @notice Submit an encrypted proposal to a ministry.
    /// @param ministryId      Source ministry
    /// @param encryptedTitle  FHE.encrypt(title, network_pk)
    /// @param encryptedBody   FHE.encrypt(body_hash, network_pk)
    /// @param votingDeadline  Unix timestamp for voting end
    /// @param quorum          Minimum ballots required
    function submitProposal(
        bytes32 ministryId,
        bytes32 encryptedTitle,
        bytes32 encryptedBody,
        uint64 votingDeadline,
        uint256 quorum
    ) external nonReentrant returns (bytes32 proposalId) {
        require(ministries[ministryId].exists, "Shadow: ministry not found");
        require(votingDeadline > block.timestamp, "Shadow: deadline in past");
        require(quorum > 0, "Shadow: zero quorum");

        proposalId = keccak256(abi.encodePacked(ministryId, proposalCount++));

        bytes32 encZero = keccak256(abi.encodePacked(proposalId, uint256(0)));

        proposals[proposalId] = ShadowProposal({
            ministryId: ministryId,
            encryptedTitle: encryptedTitle,
            encryptedBody: encryptedBody,
            encryptedTallyFor: encZero,
            encryptedTallyAgainst: encZero,
            status: ProposalStatus.Voting,
            votingDeadline: votingDeadline,
            ballotCount: 0,
            quorum: quorum
        });

        emit ProposalSubmitted(proposalId, ministryId, votingDeadline);
    }

    /// @notice Cast an encrypted ballot on a shadow proposal.
    ///         Uses PIP-0012 encrypted voting: ballot is FHE-encrypted,
    ///         tallied homomorphically, never individually decrypted.
    /// @param proposalId       Target proposal
    /// @param encryptedBallot  FHE.encrypt(vote, network_pk)
    /// @param voteNullifier    Poseidon2(voter_secret, proposalId)
    function castBallot(
        bytes32 proposalId,
        bytes32 encryptedBallot,
        bytes32 voteNullifier
    ) external nonReentrant {
        ShadowProposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.Voting, "Shadow: not voting");
        require(block.timestamp <= p.votingDeadline, "Shadow: voting ended");
        require(!voteNullifiers[voteNullifier], "Shadow: already voted");

        // FHE: Homomorphic tally update
        //   p.encryptedTallyFor = tFHE.add(p.encryptedTallyFor, encryptedBallot)
        //   Coercion resistance: deniable ballots per PIP-0012

        voteNullifiers[voteNullifier] = true;
        p.ballotCount++;
        p.encryptedTallyFor = keccak256(abi.encodePacked(p.encryptedTallyFor, encryptedBallot));

        emit BallotCast(proposalId, p.ballotCount);
    }

    /// @notice Resolve a proposal after threshold decryption of tallies.
    /// @param proposalId       Target proposal
    /// @param decryptedFor     Decrypted for-vote count
    /// @param decryptedAgainst Decrypted against-vote count
    function resolveProposal(
        bytes32 proposalId,
        uint256 decryptedFor,
        uint256 decryptedAgainst
    ) external onlyOwner {
        ShadowProposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.Voting, "Shadow: not voting");
        require(block.timestamp > p.votingDeadline, "Shadow: voting still open");
        require(decryptedFor + decryptedAgainst == p.ballotCount, "Shadow: count mismatch");

        if (p.ballotCount < p.quorum) {
            p.status = ProposalStatus.Expired;
        } else if (decryptedFor > decryptedAgainst) {
            p.status = ProposalStatus.Passed;
        } else {
            p.status = ProposalStatus.Rejected;
        }

        emit ProposalResolved(proposalId, p.status);
    }
}
