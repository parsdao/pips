---
pip: 213
title: "Organization Identity"
description: "DAO and organization identity framework for Pars Network entities"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Identity
created: 2026-01-23
tags: [identity, organization, dao, multi-sig, governance]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines an identity framework for organizations, DAOs, businesses, and community groups operating on Pars Network. Organization identities support multi-signer governance, role-based access control, public metadata, and verifiable credential issuance. They bridge the gap between individual identity (PIP-0200) and collective action.

## Motivation

Diaspora communities organize through collective entities:

1. **Community organizations** -- cultural centers, mutual aid groups, and advocacy organizations need on-chain identity
2. **Businesses** -- diaspora-owned businesses need verifiable identity for commerce and trust
3. **DAOs** -- decentralized governance structures need formal identity for interacting with external systems
4. **Cultural institutions** -- museums, libraries, and educational institutions need identity for credential issuance

Individual DIDs are insufficient for representing collective entities with shared governance and rotating membership.

## Specification

### Organization DID

```
did:pars:org:<organization-id>
```

### Organization Document

```json
{
  "@context": ["https://www.w3.org/ns/did/v1", "https://pars.network/ns/org/v1"],
  "id": "did:pars:org:pars-cultural-center-la",
  "type": "Organization",
  "name": "Pars Cultural Center Los Angeles",
  "description": "Cultural preservation and community events",
  "verificationMethod": [
    {
      "id": "#multisig-1",
      "type": "ThresholdSignatureKey",
      "threshold": 3,
      "signers": ["did:pars:mainnet:0xA...", "did:pars:mainnet:0xB...", "did:pars:mainnet:0xC...", "did:pars:mainnet:0xD...", "did:pars:mainnet:0xE..."]
    }
  ],
  "service": [
    {"id": "#session", "type": "ParsSession", "serviceEndpoint": "pars://session/ORG_SESSION_ID"},
    {"id": "#website", "type": "Website", "serviceEndpoint": "https://parsculture.la"}
  ]
}
```

### Organization Registry Contract

```solidity
interface IOrganizationRegistry {
    function createOrganization(
        string memory name,
        address[] memory initialSigners,
        uint256 threshold,
        bytes memory metadata
    ) external returns (bytes32 orgId);

    function addMember(bytes32 orgId, address member, uint8 role) external;
    function removeMember(bytes32 orgId, address member) external;
    function updateThreshold(bytes32 orgId, uint256 newThreshold) external;
    function executeAsOrg(bytes32 orgId, bytes memory calldata_, bytes[] memory signatures) external;
    function getOrganization(bytes32 orgId) external view returns (Organization memory);
}
```

### Role-Based Access

| Role | Permissions |
|:-----|:-----------|
| Owner | Full control, can add/remove admins |
| Admin | Manage members, issue credentials, manage treasury |
| Member | Vote on proposals, access org resources |
| Contributor | Submit proposals, limited resource access |
| Observer | View-only access to public org data |

### Organization Actions

All organization actions require multi-sig approval according to the configured threshold:

```solidity
struct OrgAction {
    bytes32 orgId;
    bytes4 actionType;      // "trsf", "memb", "cred", "vote"
    bytes payload;
    uint256 requiredSigs;
    mapping(address => bool) approvals;
    uint256 approvalCount;
    uint256 expiresAt;
}
```

### Session Layer Presence

Organizations have a session identity for receiving messages, participating in group chats, and broadcasting announcements. The session key is managed by the multi-sig -- key rotation requires threshold approval.

## Rationale

- **Multi-sig governance** ensures no single individual controls the organization's identity
- **Role-based access** provides granular permissions without exposing the full multi-sig to every member
- **W3C DID compatibility** allows organization identities to interoperate with external systems
- **Session layer integration** enables organizations to communicate pseudonymously on the session network
- **Threshold flexibility** allows organizations to balance security (high threshold) with operational efficiency (low threshold)

## Security Considerations

- **Signer compromise**: If signers below the threshold are compromised, the organization remains secure; the threshold SHOULD be set to at least `ceil(n/2) + 1`
- **Rogue admin**: Admin actions are logged on-chain; removal requires owner or multi-sig approval
- **Organization squatting**: Organization names are not unique identifiers; the `orgId` is a content-addressed hash of the creation parameters
- **Key rotation**: When a signer leaves the organization, remaining signers MUST rotate the organization's session key to maintain forward secrecy
- **Ghost organizations**: Inactive organizations SHOULD be flagged after extended inactivity; community governance can propose deregistration

## References

- [EIP-4824: Common Interfaces for DAOs](https://eips.ethereum.org/EIPS/eip-4824)
- [PIP-0200: Decentralized Identity Standard](./pip-0200-decentralized-identity-standard.md)
- [PIP-0206: Delegated Authentication](./pip-0206-delegated-authentication.md)
- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
