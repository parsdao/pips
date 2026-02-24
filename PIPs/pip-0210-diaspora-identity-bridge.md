---
pip: 210
title: "Diaspora Identity Bridge"
description: "Identity bridge connecting Persian diaspora communities across global platforms"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Identity
created: 2026-01-23
tags: [identity, diaspora, bridge, federation, community]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines the Diaspora Identity Bridge, a protocol for connecting Pars Network identities with diaspora communities across other platforms and networks. The bridge enables mutual discovery, credential sharing, and trust transfer between geographically dispersed Persian communities without centralizing identity data in any single system.

## Motivation

The Persian diaspora spans over 70 countries. Communities organize on different platforms:

1. **Fragmented presence** -- Los Angeles, London, Toronto, Sydney, Berlin each have distinct community infrastructure
2. **Trust silos** -- reputation earned in one community is invisible to another
3. **Discovery difficulty** -- finding and verifying fellow diaspora members in a new city is unreliable
4. **Platform dependency** -- communities built on centralized platforms can be disrupted overnight

The Diaspora Identity Bridge creates a trust-preserving, privacy-respecting interconnection layer.

## Specification

### Bridge Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  LA Community │    │ London Comm  │    │ Toronto Comm │
│  (Pars Node)  │    │ (Pars Node)  │    │ (Pars Node)  │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                ┌──────────▼──────────┐
                │  Diaspora Bridge     │
                │  Protocol (DBP)      │
                │  ┌────────────────┐  │
                │  │ Trust Registry │  │
                │  │ Discovery DHT  │  │
                │  │ Credential Relay│  │
                │  └────────────────┘  │
                └──────────────────────┘
```

### Community Registration

```solidity
interface IDiasporaBridge {
    function registerCommunity(
        bytes32 communityId,
        string memory name,
        string memory region,
        bytes memory adminDID,
        bytes memory metadata
    ) external;

    function discoverCommunities(string memory region) external view returns (Community[] memory);
    function requestTrustLink(bytes32 sourceCommunity, bytes32 targetCommunity) external;
    function acceptTrustLink(bytes32 linkId, bytes memory proof) external;
    function transferCredential(bytes32 credentialHash, bytes32 targetCommunity) external;
}
```

### Trust Links

Communities establish bilateral trust links through a mutual verification process:

1. Community A admin proposes trust link to Community B
2. Community B admin verifies Community A's legitimacy (video call, shared contacts, etc.)
3. Both admins sign the trust link on-chain
4. Credentials and reputation from linked communities carry weighted trust

### Trust Decay by Distance

```
trust_weight(A, B) = 1.0          // Direct trust link
trust_weight(A, C) = 0.7          // One hop (A trusts B, B trusts C)
trust_weight(A, D) = 0.49         // Two hops
trust_weight(A, X) = 0.0          // Beyond 3 hops (no transitive trust)
```

### Discovery Protocol

Diaspora members in a new location can discover local communities via the DHT:

```go
type CommunityDiscovery struct {
    Region      string     // Geographic region
    Language    string     // Primary language
    CommunityID [32]byte
    NodeEndpoint string    // Session layer endpoint
    TrustScore  uint16     // Aggregate trust from linked communities
}
```

Discovery results are ranked by trust distance from the user's home community.

### Credential Relay

When a user moves between communities, their credentials can be relayed:

1. User presents credential to new community's bridge endpoint
2. Bridge verifies credential signature and issuer community's trust link
3. Bridge issues a locally-weighted credential referencing the original
4. Local community can set its own acceptance threshold for bridged credentials

## Rationale

- **Community-level trust** rather than individual-level prevents the need to verify every single diaspora member
- **Trust decay** ensures distant communities cannot leverage deep transitive chains to bypass verification
- **Bilateral verification** prevents unilateral trust claims by bad actors
- **DHT-based discovery** works without a central directory that could be censored or seized
- **Credential relay** enables portable trust without requiring every community to use identical infrastructure

## Security Considerations

- **Fraudulent communities**: Trust links require bilateral admin verification; a single malicious community cannot inject itself into the trust graph unilaterally
- **Admin compromise**: Community admin keys should use multi-sig (PIP-0213) to prevent single-point takeover
- **Privacy in discovery**: Discovery queries reveal the user's approximate location; users SHOULD query via onion routing
- **Trust graph analysis**: The public trust link graph reveals community structure; sensitive communities can use private trust links verified via ZK proofs
- **Credential laundering**: Bridged credentials carry provenance metadata; a credential that has been relayed through multiple communities receives diminishing trust weight

## References

- [PIP-0200: Decentralized Identity Standard](./pip-0200-decentralized-identity-standard.md)
- [PIP-0201: Verifiable Credentials](./pip-0201-verifiable-credentials.md)
- [PIP-0203: Reputation System](./pip-0203-reputation-system.md)
- [PIP-0213: Organization Identity](./pip-0213-organization-identity.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
