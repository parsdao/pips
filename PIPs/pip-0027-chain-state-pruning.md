---
pip: 27
title: "Chain State Pruning"
description: "State pruning strategies for mobile node sustainability and storage efficiency"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Core
created: 2026-01-23
tags: [pruning, state, mobile, storage, sustainability]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines state pruning strategies for the Pars Network that enable nodes to discard historical state data no longer needed for consensus or verification. Pruning is essential for mobile nodes (PIP-0004) that operate under severe storage constraints. The protocol defines three pruning levels: archive (no pruning), full (retain recent state only), and light (retain headers and proofs only). Pruning is backward-compatible: pruned nodes can still validate new blocks and serve recent state proofs, while archive nodes preserve the complete history for auditability.

## Motivation

Blockchain state grows monotonically. Without pruning, the Pars Network's state will eventually exceed the storage capacity of consumer devices, forcing node operation to expensive dedicated hardware. This undermines the network's mission of broad participation by the diaspora. A mobile phone with 64 GB of available storage cannot sustain a full node if the chain state grows to 100+ GB. Pruning enables sustainable node operation on resource-constrained devices while maintaining the security properties needed for trustless verification.

## Specification

### Pruning Levels

| Level | Headers | Recent State | Historical State | State Proofs | Storage Est. |
|:------|:--------|:-------------|:-----------------|:-------------|:-------------|
| Archive | All | All | All | All | Unbounded |
| Full | All | Last 128 epochs | Pruned | Last 128 epochs | ~10 GB |
| Light | All | None | None | On-demand | ~500 MB |

### State Trie Pruning

Full nodes prune the state trie by:

1. After each epoch boundary (1 epoch = 1024 blocks), marking the previous epoch's state trie nodes for deletion.
2. Retaining state trie nodes referenced by the last 128 epoch boundaries.
3. Deleting marked nodes after a 24-hour grace period (allowing neighboring nodes to sync if needed).

The current state trie (latest block) is always fully retained. Pruning applies only to historical snapshots.

### Receipt and Transaction Pruning

Full nodes may additionally prune:

- **Transaction bodies**: Replaced by transaction hashes after 128 epochs. Full transaction data is available from archive nodes.
- **Receipts**: Replaced by receipt hashes after 128 epochs.
- **Event logs**: Retained for 128 epochs, then pruned. Applications requiring long-term event history should use archive node APIs or blob storage (PIP-0025).

### Epoch Checkpoints

At each epoch boundary, nodes compute and store a state checkpoint:

```
EpochCheckpoint {
    epoch:       uint64
    blockNumber: uint64
    stateRoot:   bytes32
    receiptRoot: bytes32
    validatorSet: bytes32
    timestamp:   uint64
}
```

Checkpoints are never pruned and serve as trust anchors for light client sync (PIP-0016) and state reconstruction.

### Archive Node Incentives

Archive nodes that retain full history are incentivized through the storage mechanism (PIP-0017). They register as archive providers and receive ASHA rewards for serving historical state queries. The network maintains a minimum of 10 archive nodes via staking incentives.

### Pruning Safety

A node must not prune state that it is the sole provider of. Before pruning, nodes check that at least `redundancy_threshold` (default: 3) other nodes in the network advertise the same state range. This check is performed via the DHT (PIP-0026).

## Rationale

The 128-epoch retention period (approximately 128 days at 1 epoch/day) provides sufficient history for dispute resolution (bridge fraud proofs per PIP-0021 require 7 days), while keeping storage bounded. The three-tier pruning model serves different node profiles: archive for infrastructure operators, full for desktop/server nodes, and light for mobile. Epoch checkpoints enable efficient sync without requiring the full historical trie, critical for mobile nodes that may go offline for extended periods.

## Security Considerations

- **State availability**: If all copies of historical state are pruned, it becomes impossible to verify old transactions or resolve old disputes. Mitigation: archive node incentives ensure minimum redundancy.
- **Pruning race**: Multiple nodes pruning simultaneously could leave no copies of a state range. Mitigation: the redundancy check before pruning prevents this.
- **Light node trust**: Light nodes rely on full/archive nodes for state proofs. A malicious full node could provide false proofs. Mitigation: light clients verify proofs against on-chain state roots (PIP-0016).
- **Reorg safety**: Pruning state for blocks that may be reorged is dangerous. The 128-epoch retention far exceeds the maximum expected reorg depth.

## References

- [PIP-0004: Mobile Embedded Node](./pip-0004-mobile-embedded-node.md)
- [PIP-0016: Light Client Protocol](./pip-0016-light-client-protocol.md)
- [PIP-0017: Storage Incentive Mechanism](./pip-0017-storage-incentive-mechanism.md)
- [PIP-0025: Blob Storage Protocol](./pip-0025-blob-storage-protocol.md)
- [PIP-0026: Node Discovery Protocol](./pip-0026-node-discovery-protocol.md)
- [Ethereum State Pruning](https://geth.ethereum.org/docs/fundamentals/pruning)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
