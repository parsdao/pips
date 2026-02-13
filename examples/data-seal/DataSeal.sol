// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title DataSeal - Verifiable Data Integrity Seal (PIP-0010)
/// @notice Privacy-preserving document sealing for evidence preservation.
///         Whistleblowers seal document hashes without revealing content.
///         Three modes: Public (hash only), ZK (with validity proof), Private (FHE-encrypted tag).
/// @dev FHE operations are pseudocode; real deployment uses luxfi/fhe precompiles.
contract DataSeal is Ownable, ReentrancyGuard {

    enum SealMode { Public, ZK, Private }

    struct Seal {
        bytes32 documentHash;     // Poseidon2 hash of document content
        bytes32 integrityTag;     // Public: raw tag, ZK: commitment, Private: FHE ciphertext hash
        SealMode mode;
        uint64  timestamp;
        address sealer;           // Zero address for anonymous seals
        bool    exists;
    }

    /// @notice Monotonic seal counter. Each seal gets a unique ID.
    uint256 public sealCount;

    /// @notice sealId => Seal
    mapping(uint256 => Seal) public seals;

    /// @notice Nullifier set prevents duplicate seals of the same document.
    mapping(bytes32 => bool) public nullifiers;

    event Sealed(uint256 indexed sealId, bytes32 indexed documentHash, SealMode mode, uint64 timestamp);
    event BatchSealed(uint256 startId, uint256 count, uint64 timestamp);

    constructor() Ownable(msg.sender) {}

    /// @notice Seal a single document hash with an integrity tag.
    /// @param documentHash  Poseidon2(document_content)
    /// @param integrityTag  Mode-dependent tag (see spec)
    /// @param mode          Public, ZK, or Private
    /// @param nullifier     Unique nullifier to prevent double-sealing
    /// @param anonymous     If true, sealer address is not recorded
    function seal(
        bytes32 documentHash,
        bytes32 integrityTag,
        SealMode mode,
        bytes32 nullifier,
        bool anonymous
    ) external nonReentrant returns (uint256 sealId) {
        require(documentHash != bytes32(0), "DataSeal: empty hash");
        require(!nullifiers[nullifier], "DataSeal: duplicate nullifier");

        nullifiers[nullifier] = true;
        sealId = sealCount++;

        // FHE: If mode == Private, integrityTag is FHE.encrypt(raw_tag, network_pk).
        //       The ciphertext is stored; only threshold decryption can reveal it.
        //       Relay nodes and validators never see plaintext.

        seals[sealId] = Seal({
            documentHash: documentHash,
            integrityTag: integrityTag,
            mode: mode,
            timestamp: uint64(block.timestamp),
            sealer: anonymous ? address(0) : msg.sender,
            exists: true
        });

        emit Sealed(sealId, documentHash, mode, uint64(block.timestamp));
    }

    /// @notice Batch-seal multiple documents in one transaction.
    ///         Optimized for high-volume evidence preservation (e.g., protest documentation).
    /// @param documentHashes Array of Poseidon2 hashes
    /// @param integrityTags  Corresponding integrity tags
    /// @param mode           Seal mode (applied to all in batch)
    /// @param nullifierSet   Nullifiers for each document
    function batchSeal(
        bytes32[] calldata documentHashes,
        bytes32[] calldata integrityTags,
        SealMode mode,
        bytes32[] calldata nullifierSet
    ) external nonReentrant returns (uint256 startId) {
        uint256 len = documentHashes.length;
        require(len > 0 && len == integrityTags.length && len == nullifierSet.length, "DataSeal: length mismatch");
        require(len <= 256, "DataSeal: batch too large");

        startId = sealCount;

        for (uint256 i = 0; i < len; i++) {
            require(!nullifiers[nullifierSet[i]], "DataSeal: duplicate in batch");
            nullifiers[nullifierSet[i]] = true;

            seals[sealCount++] = Seal({
                documentHash: documentHashes[i],
                integrityTag: integrityTags[i],
                mode: mode,
                timestamp: uint64(block.timestamp),
                sealer: address(0), // Batch seals are always anonymous
                exists: true
            });
        }

        emit BatchSealed(startId, len, uint64(block.timestamp));
    }

    /// @notice Verify a seal exists and return its timestamp.
    ///         Used by courts, journalists, and human rights organizations.
    function verifySeal(uint256 sealId) external view returns (
        bytes32 documentHash,
        SealMode mode,
        uint64 timestamp,
        bool exists
    ) {
        Seal storage s = seals[sealId];
        return (s.documentHash, s.mode, s.timestamp, s.exists);
    }

    /// @notice Check if a document hash has been sealed (by nullifier).
    function isSealed(bytes32 nullifier) external view returns (bool) {
        return nullifiers[nullifier];
    }
}
