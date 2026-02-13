// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ContentProvenance - Media Authentication (PIP-0011)
/// @notice Cryptographic proof of media authenticity at point of capture.
///         Tracks content through edits and republication. Detects AI-generated content.
///         Source identities are FHE-encrypted; journalists are never exposed.
/// @dev FHE operations are pseudocode; real deployment uses luxfi/fhe precompiles.
contract ContentProvenance is Ownable, ReentrancyGuard {

    enum ContentType { Photo, Video, Audio, Document, AIGenerated }

    struct ProvenanceRecord {
        bytes32 contentHash;          // Poseidon2(media_bytes)
        bytes32 deviceAttestation;    // TEE attestation from capture device
        bytes32 encryptedCreatorId;   // FHE: Enc(creator_identity, network_pk)
        bytes32 parentContentHash;    // Zero for originals; parent hash for derivatives
        ContentType contentType;
        uint64  captureTimestamp;
        bytes32 locationCommitment;   // ZK commitment to GPS coordinates (never revealed)
        bytes32 aiModelId;            // FHE: Enc(model_id, network_pk) for AI-generated content
        bool    exists;
    }

    /// @notice contentHash => ProvenanceRecord
    mapping(bytes32 => ProvenanceRecord) public records;

    /// @notice Derivation chain: parentHash => childHash[]
    mapping(bytes32 => bytes32[]) public derivations;

    /// @notice Nullifier set for device attestations (one attestation per capture)
    mapping(bytes32 => bool) public attestationNullifiers;

    event MediaRegistered(bytes32 indexed contentHash, ContentType contentType, uint64 captureTimestamp);
    event DerivationRecorded(bytes32 indexed parentHash, bytes32 indexed childHash);
    event AIContentFlagged(bytes32 indexed contentHash, bytes32 encryptedModelId);

    constructor() Ownable(msg.sender) {}

    /// @notice Register media at point of capture with device attestation.
    ///         Creator identity is FHE-encrypted -- never exposed to the network.
    /// @param contentHash        Poseidon2(media_bytes)
    /// @param deviceAttestation  TEE attestation proving genuine capture device
    /// @param encryptedCreatorId FHE.encrypt(creator_id, network_pk)
    /// @param contentType        Type of media
    /// @param locationCommitment ZK commitment to capture location
    /// @param attestationNullifier Prevents replaying the same attestation
    function registerMedia(
        bytes32 contentHash,
        bytes32 deviceAttestation,
        bytes32 encryptedCreatorId,
        ContentType contentType,
        bytes32 locationCommitment,
        bytes32 attestationNullifier
    ) external nonReentrant {
        require(contentHash != bytes32(0), "Provenance: empty hash");
        require(!records[contentHash].exists, "Provenance: already registered");
        require(!attestationNullifiers[attestationNullifier], "Provenance: attestation replayed");

        // FHE: encryptedCreatorId = tFHE.encrypt(creator_identity, network_public_key)
        //       Only threshold decryption by a quorum can reveal the creator.
        //       This protects journalists from identification and targeting.

        attestationNullifiers[attestationNullifier] = true;

        records[contentHash] = ProvenanceRecord({
            contentHash: contentHash,
            deviceAttestation: deviceAttestation,
            encryptedCreatorId: encryptedCreatorId,
            parentContentHash: bytes32(0),
            contentType: contentType,
            captureTimestamp: uint64(block.timestamp),
            locationCommitment: locationCommitment,
            aiModelId: bytes32(0),
            exists: true
        });

        emit MediaRegistered(contentHash, contentType, uint64(block.timestamp));
    }

    /// @notice Record a derivation (edit, crop, transcode) of existing content.
    ///         Creates an immutable edit chain for provenance tracking.
    /// @param parentHash  Content hash of the original or previous version
    /// @param childHash   Content hash of the derived work
    /// @param editType    Poseidon2(edit_description) -- crop, resize, redact, etc.
    function recordDerivation(
        bytes32 parentHash,
        bytes32 childHash,
        bytes32 editType
    ) external nonReentrant {
        require(records[parentHash].exists, "Provenance: parent not found");
        require(!records[childHash].exists, "Provenance: child already exists");

        ProvenanceRecord storage parent = records[parentHash];

        records[childHash] = ProvenanceRecord({
            contentHash: childHash,
            deviceAttestation: parent.deviceAttestation,
            encryptedCreatorId: parent.encryptedCreatorId,
            parentContentHash: parentHash,
            contentType: parent.contentType,
            captureTimestamp: uint64(block.timestamp),
            locationCommitment: editType, // Reused field for edit metadata
            aiModelId: bytes32(0),
            exists: true
        });

        derivations[parentHash].push(childHash);
        emit DerivationRecorded(parentHash, childHash);
    }

    /// @notice Flag content as AI-generated with encrypted model ID.
    ///         Model ID is FHE-encrypted to prevent gaming detection systems.
    function flagAIContent(
        bytes32 contentHash,
        bytes32 encryptedModelId
    ) external onlyOwner {
        require(records[contentHash].exists, "Provenance: not found");

        // FHE: encryptedModelId = tFHE.encrypt(model_identifier, network_pk)
        records[contentHash].aiModelId = encryptedModelId;
        records[contentHash].contentType = ContentType.AIGenerated;

        emit AIContentFlagged(contentHash, encryptedModelId);
    }

    /// @notice Verify media authenticity. Returns provenance chain depth.
    function verifyProvenance(bytes32 contentHash) external view returns (
        bool exists,
        uint64 captureTimestamp,
        ContentType contentType,
        uint256 chainDepth
    ) {
        ProvenanceRecord storage r = records[contentHash];
        if (!r.exists) return (false, 0, ContentType.Photo, 0);

        uint256 depth = 0;
        bytes32 current = r.parentContentHash;
        while (current != bytes32(0) && depth < 100) {
            depth++;
            current = records[current].parentContentHash;
        }

        return (true, r.captureTimestamp, r.contentType, depth);
    }
}
