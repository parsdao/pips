---
pip: 207
title: "Identity Portability"
description: "Cross-chain identity migration standard for Pars Network DIDs"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Identity
created: 2026-01-23
tags: [identity, portability, cross-chain, migration, interop]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a standard for migrating Pars Network identities to and from other blockchain networks. Users can port their DID, credentials, reputation proofs, and social graph references across chains without losing history or trust. The protocol uses cryptographic anchors and verifiable proofs of identity equivalence.

## Motivation

Diaspora communities are inherently multi-chain:

1. **Diverse ecosystems** -- community members use Ethereum, Lux, Solana, and other networks for different purposes
2. **Vendor lock-in** -- identity trapped on one chain creates dependency and fragility
3. **Cross-chain DeFi** -- bridging identity enables trust-based lending and reputation-gated access across networks
4. **Refugee portability** -- displaced individuals must be able to carry their digital identity regardless of infrastructure availability

## Specification

### Identity Anchor

Each Pars DID can register cross-chain anchors:

```solidity
interface IIdentityPortability {
    function registerAnchor(
        uint256 targetChainId,
        bytes memory targetAddress,
        bytes memory proofOfOwnership
    ) external;

    function verifyAnchor(
        bytes32 parsDID,
        uint256 targetChainId
    ) external view returns (bytes memory targetAddress, bool verified);

    function revokeAnchor(uint256 targetChainId) external;
    function getAnchors(bytes32 parsDID) external view returns (Anchor[] memory);
}

struct Anchor {
    uint256 chainId;
    bytes targetAddress;
    uint256 registeredAt;
    bool active;
}
```

### Migration Protocol

1. User exports identity package (DID Document, credential hashes, reputation ZK proofs, social graph references)
2. Package signed with PQ key
3. Submitted to target chain with Pars DID anchor proof
4. Target chain verifies signature, anchor registration, and revocation status
5. Bidirectional link established -- both chains reference each other

### Export Package Format

```json
{
  "version": "1.0",
  "sourceDID": "did:pars:mainnet:0x...",
  "exportTimestamp": 1706000000,
  "didDocument": { "...W3C DID Document..." },
  "credentialProofs": [
    {
      "credentialType": "DiasporaMembership",
      "issuerDID": "did:pars:mainnet:0xISSUER",
      "proofHash": "0xABC...",
      "zkProof": "0x..."
    }
  ],
  "reputationProofs": [
    {
      "domain": "governance",
      "threshold": 500,
      "zkProof": "0x..."
    }
  ],
  "signature": "0xMLDSA..."
}
```

### Supported Target Chains

The protocol defines adapter interfaces for:

| Chain | Method | Anchor Contract |
|:------|:-------|:----------------|
| Ethereum | EVM-compatible | Deploy Pars anchor contract |
| Lux | Native subnet | Cross-subnet message |
| Solana | Program | Pars anchor program |
| Cosmos | IBC | IBC identity module |

### Bidirectional Verification

Both chains maintain references to each other. A verifier on either chain confirms identity equivalence by querying the local anchor registry and optionally verifying the cross-chain anchor via a light client or oracle.

## Rationale

- **W3C DID format** ensures the exported identity is interpretable by any standards-compliant system
- **ZK proofs for credentials and reputation** allow porting trust without revealing underlying data
- **Bidirectional anchors** prevent identity squatting (claiming someone else's identity on a target chain)
- **Adapter pattern** accommodates diverse chain architectures without a one-size-fits-all approach
- **PQ signatures** ensure export packages remain tamper-proof against quantum adversaries

## Security Considerations

- **Anchor squatting**: Registration requires a valid signature from the Pars DID owner; squatting is cryptographically infeasible
- **Stale anchors**: Users MUST revoke anchors on chains they no longer use; orphaned anchors could be exploited if the target chain key is compromised
- **Cross-chain replay**: Export packages include chain-specific nonces and timestamps to prevent replay on unintended chains
- **Oracle trust**: Cross-chain verification via oracles introduces trust assumptions; light client verification is preferred where available
- **Identity fragmentation**: The protocol does not prevent a user from intentionally creating divergent identities; this is a feature for privacy but requires care in reputation-sensitive contexts

## References

- [W3C DID Core Specification](https://www.w3.org/TR/did-core/)
- [PIP-0200: Decentralized Identity Standard](./pip-0200-decentralized-identity-standard.md)
- [PIP-0201: Verifiable Credentials](./pip-0201-verifiable-credentials.md)
- [PIP-0203: Reputation System](./pip-0203-reputation-system.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
