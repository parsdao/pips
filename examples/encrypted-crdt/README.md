# Encrypted CRDT Example

**PIP**: [PIP-0013 -- Encrypted CRDT for Offline-First Privacy](../../PIPs/pip-0013-encrypted-crdt.md)
**Lux LP**: [LP-6500 -- fheCRDT Architecture](https://github.com/luxfi/lps/blob/main/LPs/lp-6500-fhecrdt-architecture.md)

## Purpose

Encrypted, offline-first collaboration for mesh networks under surveillance.
Relay nodes merge encrypted state without ever decrypting it.
Works over Bluetooth, WiFi, USB sneakernet -- any transport.

## Threat Model

- Internet blackouts are routine during protests and civil unrest
- Central servers can be seized or compelled to reveal data
- Relay nodes may be operated by state agents
- Mesh participants may be detained and devices inspected

Key property: **merge on ciphertext**. Relay nodes perform CRDT merge operations
homomorphically. They see only ciphertext and cannot read any content.

## Contract Overview

`EncryptedCRDT.sol` implements three CRDT primitives under FHE:

| Primitive | Purpose | Conflict Resolution |
|-----------|---------|---------------------|
| **LWW-Register** | Key-value store | FHE comparison of encrypted Lamport timestamps |
| **OR-Set** | Add/remove set | Tag-based observed-remove semantics |
| **Merge Receipt** | Consistency anchor | Poseidon2 hash of merge operations |

### Key Functions

- `updateRegister()` -- Write encrypted value with Lamport timestamp
- `modifyORSet()` -- Add or remove encrypted elements with unique tags
- `anchorMerge()` -- Record proof of off-chain mesh merge

### Offline Workflow

1. Node A edits locally (encrypted state in SQLite)
2. Node B edits independently (no connection needed)
3. Nodes meet via Bluetooth or USB
4. CRDT merge runs on ciphertext -- no decryption
5. Merged state anchored on-chain when connectivity returns

Step 4 is the critical innovation: relay nodes merge state they cannot read.

## FHE Integration

- Values: `tFHE.encrypt(plaintext, group_public_key)`
- Timestamps: `tFHE.encrypt(lamport_clock, group_public_key)`
- Conflict resolution: `tFHE.gt(ts_a, ts_b)` on ciphertext
- Selection: `tFHE.select(condition, value_a, value_b)` -- conditional on ciphertext

See: `luxfi/fhe/cmd/crdt` for the CLI CRDT tool.

## Related Repositories

- [luxfhe/examples/encrypted-crdt](https://github.com/luxfi/fhe/tree/main/examples/encrypted-crdt) -- FHE CRDT circuits
- [luxfi/fhe/cmd/crdt](https://github.com/luxfi/fhe/tree/main/cmd/crdt) -- CLI CRDT tool
- [PIP-0001](../../PIPs/pip-0001-mesh-network.md) -- Mesh network transport
- [PIP-0010](../../PIPs/pip-0010-data-integrity-seal.md) -- Data seal (anchoring)

## Build

```bash
forge build
```

## License

MIT
