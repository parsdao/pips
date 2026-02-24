---
pip: 26
title: "Node Discovery Protocol"
description: "DHT-based peer discovery resistant to Sybil attacks and eclipse attacks"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Core
created: 2026-01-23
tags: [discovery, dht, p2p, sybil-resistance, networking]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a node discovery protocol for the Pars Network based on a Kademlia-style distributed hash table (DHT) with Sybil resistance mechanisms. The protocol enables new nodes to discover peers, maintains a healthy routing table, and resists attacks from adversaries who create large numbers of fake identities to partition or eclipse honest nodes. Sybil resistance is achieved through a proof-of-stake bond: nodes must lock a minimum ASHA stake to participate in the DHT, making it economically expensive to flood the network with fake identities.

## Motivation

Peer discovery is the foundation of any peer-to-peer network. Without a robust discovery mechanism, new nodes cannot find peers, and the network fragments. For the Pars Network, discovery must resist state-level adversaries who may deploy thousands of malicious nodes to eclipse specific targets (preventing them from seeing legitimate peers) or partition the network to enable censorship. Traditional DHT protocols (Kademlia, S/Kademlia) are vulnerable to Sybil attacks because creating new identities is free.

## Specification

### Node Identity

Each node's identity in the DHT is derived from its staking address:

```
node_id = SHA-256(staking_address || registration_epoch)
```

This binds node identity to an on-chain stake, preventing free identity creation. The `registration_epoch` component prevents identity grinding (choosing a staking address that produces a favorable node_id).

### Stake Requirement

To participate in the DHT, a node must lock a minimum of 100 ASHA in the discovery staking contract. The stake is slashable if the node is proven to behave maliciously (e.g., returning false routing information).

### Routing Table

Each node maintains a Kademlia-style routing table with k-buckets (k=20). Buckets are populated by nodes whose `node_id` shares a common prefix of a specific length with the local node. When a bucket is full, new entries replace the least-recently-seen entry only if the existing entry fails a liveness probe.

### Lookup Protocol

To find a node or value:

1. The requesting node computes the XOR distance between the target ID and its routing table entries.
2. It queries the alpha (default: 3) closest known nodes.
3. Each queried node responds with the k closest nodes it knows.
4. The process iterates until the closest known nodes stabilize.

### Sybil Resistance Measures

1. **Stake bond**: 100 ASHA per node identity prevents cheap identity creation.
2. **Proof of uptime**: Nodes must respond to periodic liveness probes. Nodes that fail 3 consecutive probes are evicted from routing tables.
3. **Diversity requirement**: A node's routing table must contain peers from at least 5 distinct /16 IP subnets per bucket, preventing a single adversary from filling a bucket with colocated nodes.
4. **Stake-weighted selection**: When a bucket is full, new entries are preferred over existing entries if they have a higher stake, incentivizing honest participation.

### Bootstrap Nodes

A set of hardcoded bootstrap nodes provides initial peer discovery for new nodes. Bootstrap nodes are operated by geographically distributed community members and are subject to DAO governance (PIP-7000). The bootstrap list is updateable via network upgrades (PIP-0018).

### Mesh Network Integration

For nodes operating in mesh mode (PIP-0001), local peer discovery uses mDNS and Bluetooth Low Energy advertisements in addition to the DHT. Mesh-discovered peers are added to the routing table with a flag indicating their discovery path.

## Rationale

Kademlia is chosen as the DHT foundation because it is well-studied, has logarithmic lookup complexity, and is used successfully in production systems (BitTorrent, Ethereum). The stake-based Sybil resistance is simpler than proof-of-work alternatives and integrates naturally with the Pars staking economy. The 100 ASHA minimum balances accessibility (not prohibitively expensive) with Sybil resistance (expensive to create thousands of identities). IP subnet diversity requirements prevent the common attack of flooding routing tables from a single data center.

## Security Considerations

- **Eclipse attacks**: An adversary controlling many nodes could surround a target, controlling all its routing table entries. Mitigation: diversity requirements and stake-weighted selection make this prohibitively expensive.
- **Routing table poisoning**: Malicious nodes returning false routing information. Mitigation: nodes verify that returned node_ids correspond to valid staked identities on-chain.
- **Bootstrap node compromise**: If all bootstrap nodes are compromised, new nodes cannot join. Mitigation: multiple independent bootstrap nodes, plus out-of-band bootstrap via mesh discovery.
- **Stake centralization**: Wealthy entities could stake many identities. The minimum stake is low enough for community participation, and the diversity requirement limits concentration.

## References

- [PIP-0001: Mesh Network](./pip-0001-mesh-network.md)
- [PIP-0018: Network Upgrade Protocol](./pip-0018-network-upgrade-protocol.md)
- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)
- [Kademlia: A Peer-to-Peer Information System](https://pdos.csail.mit.edu/~petar/papers/maymounkov-kademlia-lncs.pdf)
- [S/Kademlia: A Practicable Approach Towards Secure Key-Based Routing](https://telematics.tm.kit.edu/publications/Files/267/SKademlia_2007.pdf)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
