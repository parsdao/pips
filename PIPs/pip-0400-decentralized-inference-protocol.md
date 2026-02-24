---
pip: 400
title: "Decentralized Inference Protocol"
description: "Distributed AI inference across Pars mesh nodes with privacy-preserving request routing"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: AI
created: 2026-01-23
tags: [ai, inference, distributed, privacy, mesh]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines the Decentralized Inference Protocol (DIP) for executing AI inference workloads across Pars mesh nodes. Inference requests are routed through the mesh network (PIP-0001) with encrypted payloads, ensuring neither the requester's identity nor the prompt content is exposed to routing nodes. GPU and NPU providers earn ASHA for serving inference, while requesters pay from compute credit balances (PIP-0402). The protocol supports model sharding across multiple nodes for large models that exceed single-node capacity.

## Motivation

### Censorship-Resistant AI Access

Centralized AI providers can be compelled to:
- Block users from sanctioned regions
- Log and report prompts to authorities
- Deny service based on content policy shaped by geopolitical pressure
- Shut down entirely under government order

The Persian diaspora and residents inside Iran need AI inference that cannot be blocked, surveilled, or censored. DIP routes inference through the Pars mesh where no single node sees both the requester and the full prompt.

### Privacy-Preserving Inference

Even among trusted community nodes, inference privacy matters:
- Medical questions should not be linkable to identities
- Legal queries about asylum or rights must remain confidential
- Creative and political expression must be free from observation

## Specification

### Request Lifecycle

```
Requester -> Mesh Routing (PIP-0001) -> Inference Node(s) -> Mesh Return -> Requester

1. Requester encrypts prompt under inference node's public key
2. Request routed through >= 3 mesh hops (PIP-0001)
3. Inference node decrypts prompt, runs model, encrypts response
4. Response routed back through mesh
5. Payment settled via compute credits (PIP-0402)
```

### Inference Request

```go
type InferenceRequest struct {
    RequestID     [32]byte  // Unique request identifier
    ModelHash     [32]byte  // Target model (PIP-0403 for Persian NLP)
    EncPayload    []byte    // ML-KEM encrypted prompt + parameters
    MaxTokens     uint32    // Maximum response tokens
    ComputeBudget uint64    // Maximum ASHA compute credits to spend
    ReturnRoute   []byte    // Encrypted return path through mesh
    Timestamp     uint64
    Signature     []byte    // ML-DSA signature (anonymous commitment)
}
```

### Model Sharding

For models exceeding single-node VRAM, DIP supports pipeline parallelism:

```go
type ShardedInference struct {
    ModelHash   [32]byte
    ShardCount  uint8
    Shards      []ShardAssignment
    Pipeline    PipelineConfig
}

type ShardAssignment struct {
    ShardIndex  uint8
    NodeID      [32]byte   // Assigned inference node
    LayerStart  uint32     // First transformer layer
    LayerEnd    uint32     // Last transformer layer
    VRAMNeeded  uint64     // Bytes of VRAM required
}
```

### Node Discovery

Inference nodes register capabilities on the mesh DAG:

```go
type InferenceCapability struct {
    NodeCommitment [32]byte   // Anonymous node identity
    Models         [][32]byte // Supported model hashes
    VRAM           uint64     // Available VRAM in bytes
    ThroughputTPS  uint32     // Tokens per second benchmark
    PricePerToken  uint64     // ASHA price per output token
    TEEAttestation []byte     // Hardware attestation (optional)
    Uptime         float64    // Historical uptime percentage
}
```

### Routing Privacy

DIP leverages PIP-0001 mesh routing with additional constraints:
1. Inference nodes never learn requester identity
2. Requesters never learn inference node identity (optional)
3. Routing nodes see only encrypted blobs
4. Payment is settled via anonymous compute credit channels

## Rationale

### Why Not Use Existing Inference APIs?

Existing APIs (OpenAI, Anthropic, etc.) require identity, maintain logs, and operate under jurisdictions that enforce sanctions. DIP provides equivalent functionality without these constraints.

### Why Pipeline Parallelism?

Community GPU nodes typically have 8-24GB VRAM. Large language models (70B+ parameters) require 40-140GB. Pipeline parallelism across multiple nodes enables serving these models without requiring datacenter hardware.

### Why Anonymous Routing?

In the Pars threat model, even metadata about AI usage is sensitive. A query about asylum law, human rights, or political organizing could endanger the requester. Full anonymity is a safety requirement, not a feature.

## Security Considerations

### Inference Node Attacks

| Attack | Mitigation |
|:-------|:-----------|
| Prompt logging | Node sees prompt but not requester; incentive alignment via slashing |
| Result manipulation | Redundant inference across multiple nodes with consensus |
| Denial of service | Automatic failover to alternative nodes; reputation scoring |
| Side-channel timing | Request batching and padding to uniform sizes |

### Model Integrity

- Models are identified by content hash; nodes cannot substitute models
- TEE attestation (where available) provides hardware-backed model integrity
- Periodic challenge-response verification of model correctness

### Payment Privacy

- Compute credits (PIP-0402) are spent via anonymous channels
- No linkage between payment and inference content
- Overpayment is refunded through the same anonymous channel

## References

- [PIP-0001: Mesh Network](./pip-0001-mesh-network.md)
- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)
- [PIP-0006: AI Mining Integration](./pip-0006-ai-mining-integration.md)
- [PIP-0402: Compute Credit System](./pip-0402-compute-credit-system.md)
- [PIP-0403: Persian NLP Model Standard](./pip-0403-persian-nlp-model-standard.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
