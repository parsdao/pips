// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title EncryptedCRDT - Offline-First Privacy (PIP-0013)
/// @notice FHE-encrypted CRDTs for mesh network collaboration.
///         Relay nodes merge encrypted state without decrypting.
///         Works offline via Bluetooth, WiFi, USB sneakernet.
///         Based on Lux LP-6500 (fheCRDT Architecture).
/// @dev FHE operations are pseudocode; real deployment uses luxfi/fhe precompiles.
contract EncryptedCRDT is Ownable, ReentrancyGuard {

    /// @notice LWW-Register: Last-Writer-Wins register with FHE-encrypted value.
    struct LWWRegister {
        bytes32 documentId;
        bytes32 encryptedValue;    // FHE: Enc(plaintext_value, group_pk)
        bytes32 encryptedTimestamp; // FHE: Enc(lamport_clock, group_pk)
        bytes32 nodeId;            // Pseudonymous node identifier
        uint64  anchorTimestamp;   // On-chain anchor time (not the CRDT clock)
        bool    exists;
    }

    /// @notice OR-Set entry: Observed-Remove Set with tag-based add/remove.
    struct ORSetEntry {
        bytes32 setId;
        bytes32 encryptedElement;  // FHE: Enc(element, group_pk)
        bytes32 uniqueTag;         // Random tag for add; same tag for remove
        bool    isAdd;             // true = add, false = remove
        uint64  anchorTimestamp;
    }

    /// @notice Merge receipt: proof that an off-chain merge was anchored.
    struct MergeReceipt {
        bytes32 documentId;
        bytes32 mergeHash;         // Poseidon2(state_before, state_after, merge_ops)
        bytes32 nodeA;
        bytes32 nodeB;
        uint64  timestamp;
    }

    /// @notice documentId => latest LWW-Register state
    mapping(bytes32 => LWWRegister) public registers;

    /// @notice setId => tag => ORSetEntry
    mapping(bytes32 => mapping(bytes32 => ORSetEntry)) public orSets;

    /// @notice receiptId => MergeReceipt
    mapping(bytes32 => MergeReceipt) public mergeReceipts;

    uint256 public receiptCount;

    event RegisterUpdated(bytes32 indexed documentId, bytes32 nodeId, uint64 anchorTimestamp);
    event ORSetModified(bytes32 indexed setId, bytes32 uniqueTag, bool isAdd);
    event MergeAnchored(bytes32 indexed receiptId, bytes32 documentId, bytes32 nodeA, bytes32 nodeB);

    constructor() Ownable(msg.sender) {}

    /// @notice Update a LWW-Register with a new encrypted value.
    ///         Conflict resolution: FHE comparison of encrypted Lamport timestamps.
    ///         The contract stores the update; actual conflict resolution happens
    ///         off-chain via homomorphic timestamp comparison.
    /// @param documentId        Unique document identifier
    /// @param encryptedValue    FHE.encrypt(new_value, group_pk)
    /// @param encryptedTimestamp FHE.encrypt(lamport_clock, group_pk)
    /// @param nodeId            Pseudonymous identifier of the writing node
    function updateRegister(
        bytes32 documentId,
        bytes32 encryptedValue,
        bytes32 encryptedTimestamp,
        bytes32 nodeId
    ) external nonReentrant {
        require(documentId != bytes32(0), "CRDT: empty document ID");

        // FHE: Conflict resolution on ciphertext:
        //   isNewer = tFHE.gt(encryptedTimestamp, registers[documentId].encryptedTimestamp)
        //   registers[documentId].encryptedValue = tFHE.select(isNewer, encryptedValue, old_value)
        //
        // Relay nodes perform this comparison WITHOUT seeing timestamps or values.
        // The "winning" write is determined homomorphically.

        registers[documentId] = LWWRegister({
            documentId: documentId,
            encryptedValue: encryptedValue,
            encryptedTimestamp: encryptedTimestamp,
            nodeId: nodeId,
            anchorTimestamp: uint64(block.timestamp),
            exists: true
        });

        emit RegisterUpdated(documentId, nodeId, uint64(block.timestamp));
    }

    /// @notice Add or remove an element from an OR-Set.
    ///         Each add creates a unique tag. Remove references the same tag.
    /// @param setId            Set identifier
    /// @param encryptedElement FHE.encrypt(element, group_pk)
    /// @param uniqueTag        Random tag (add) or existing tag (remove)
    /// @param isAdd            true for add, false for remove
    function modifyORSet(
        bytes32 setId,
        bytes32 encryptedElement,
        bytes32 uniqueTag,
        bool isAdd
    ) external nonReentrant {
        require(setId != bytes32(0), "CRDT: empty set ID");

        // FHE: The element is encrypted. Relay nodes see only the tag structure.
        //       Membership is computed homomorphically:
        //       element IN set iff EXISTS tag: adds[tag] AND NOT removes[tag]

        orSets[setId][uniqueTag] = ORSetEntry({
            setId: setId,
            encryptedElement: encryptedElement,
            uniqueTag: uniqueTag,
            isAdd: isAdd,
            anchorTimestamp: uint64(block.timestamp)
        });

        emit ORSetModified(setId, uniqueTag, isAdd);
    }

    /// @notice Anchor a merge receipt on-chain.
    ///         Two mesh nodes merged their CRDT state off-chain (possibly via Bluetooth
    ///         or USB sneakernet). This anchors proof of the merge for consistency.
    /// @param documentId  Document that was merged
    /// @param mergeHash   Poseidon2(state_before, state_after, merge_operations)
    /// @param nodeA       First merge participant (pseudonymous)
    /// @param nodeB       Second merge participant (pseudonymous)
    function anchorMerge(
        bytes32 documentId,
        bytes32 mergeHash,
        bytes32 nodeA,
        bytes32 nodeB
    ) external nonReentrant returns (bytes32 receiptId) {
        receiptId = keccak256(abi.encodePacked(documentId, mergeHash, receiptCount++));

        mergeReceipts[receiptId] = MergeReceipt({
            documentId: documentId,
            mergeHash: mergeHash,
            nodeA: nodeA,
            nodeB: nodeB,
            timestamp: uint64(block.timestamp)
        });

        emit MergeAnchored(receiptId, documentId, nodeA, nodeB);
    }
}
