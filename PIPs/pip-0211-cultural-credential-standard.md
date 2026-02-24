---
pip: 211
title: "Cultural Credential Standard"
description: "Credentials for cultural knowledge and heritage verification on Pars Network"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Identity
created: 2026-01-23
tags: [identity, culture, credentials, heritage, preservation]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a credential standard for attesting cultural knowledge, heritage, and artistic competency within the Pars Network. Cultural credentials allow community elders, educators, and cultural institutions to formally recognize individuals' proficiency in Persian language, calligraphy, music, poetry, history, and other cultural domains. These credentials are verifiable, privacy-preserving, and resistant to institutional gatekeeping.

## Motivation

Cultural preservation is a core mission of the Pars Network:

1. **Knowledge at risk** -- diaspora communities lose cultural knowledge as generations assimilate; formal recognition incentivizes transmission
2. **No central authority** -- there is no single institution that can credential Persian cultural knowledge for a global diaspora
3. **Economic value** -- cultural skills (calligraphy, music, translation) have economic value that formal credentials unlock
4. **Community identity** -- cultural credentials strengthen collective identity and belonging across geographic separation

## Specification

### Cultural Domains

| Domain ID | Domain | Example Credentials |
|:----------|:-------|:-------------------|
| `lang` | Language | Farsi fluency levels (A1-C2), Dari, Tajik |
| `cal` | Calligraphy | Nastaliq, Shekasteh, Naskh mastery levels |
| `mus` | Music | Dastgah system, instrument proficiency, Radif knowledge |
| `lit` | Literature | Poetry recitation, Shahnameh scholarship, modern literature |
| `his` | History | Pre-Islamic, Islamic era, modern, diaspora history |
| `cul` | Culinary | Traditional cuisine, regional specialties |
| `art` | Visual Arts | Miniature painting, tile work, carpet design |
| `crf` | Crafts | Metalwork, pottery, textile arts |

### Credential Structure

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1", "https://pars.network/ns/cultural/v1"],
  "type": ["VerifiableCredential", "CulturalCredential"],
  "issuer": "did:pars:mainnet:0xISSUER...",
  "credentialSubject": {
    "id": "did:pars:mainnet:0xSUBJECT...",
    "domain": "cal",
    "skill": "Nastaliq Calligraphy",
    "level": "Advanced",
    "assessmentMethod": "Portfolio review and oral examination",
    "assessors": 3,
    "culturalContext": "Classical Persian calligraphic tradition"
  },
  "issuanceDate": "2026-01-23T00:00:00Z",
  "proof": {
    "type": "MLDSASignature2024",
    "proofValue": "z5MLdsa..."
  }
}
```

### Issuer Qualification

Cultural credential issuers must themselves hold recognized credentials or community attestations:

```solidity
interface ICulturalCredentialRegistry {
    function registerIssuer(
        bytes32 issuerDID,
        string memory domain,
        bytes memory qualificationProof
    ) external;

    function issueCredential(
        bytes32 subjectDID,
        string memory domain,
        uint8 level,
        bytes memory assessmentProof
    ) external returns (bytes32 credentialId);

    function getIssuerQualifications(bytes32 issuerDID) external view returns (Qualification[] memory);
    function verifyCredential(bytes32 credentialId) external view returns (bool valid, CulturalCredential memory cred);
}
```

### Assessment Methods

| Method | Description | Minimum Assessors |
|:-------|:-----------|:-----------------|
| Portfolio | Review of submitted works | 2 |
| Oral Exam | Live assessment via session layer | 2 |
| Peer Review | Evaluation by recognized practitioners | 3 |
| Community Vote | DAO-based assessment for contested claims | Quorum |
| Institutional | Accredited institution issues directly | 1 (institution) |

### Level Framework

Credentials use a standardized 5-level proficiency scale:

| Level | Name | Description |
|:------|:-----|:-----------|
| 1 | Novice | Basic awareness and introductory skills |
| 2 | Practitioner | Regular practice with guided competency |
| 3 | Advanced | Independent mastery, can teach beginners |
| 4 | Master | Recognized expertise, can assess others |
| 5 | Guardian | Living repository of tradition, shapes the field |

## Rationale

- **Community-governed issuance** ensures cultural authority stays with practitioners, not institutions
- **Multi-assessor requirement** prevents credential inflation from a single biased issuer
- **Domain-specific taxonomy** captures the breadth of Persian cultural heritage
- **Level framework** provides standardized meaning across communities worldwide
- **Privacy-preserving proofs** allow credential holders to demonstrate skills without exposing full identity

## Security Considerations

- **Credential inflation**: Minimum assessor requirements and issuer qualification checks prevent easy credential farming
- **Cultural authority disputes**: The community vote assessment method provides a democratic resolution for contested claims
- **Issuer capture**: No single issuer can monopolize credential issuance; the registry is open to qualified participants
- **Forgery**: ML-DSA signatures and on-chain anchoring make credential forgery computationally infeasible
- **Cultural sensitivity**: Assessment criteria must be defined by domain experts within the community, not by external parties

## References

- [UNESCO Intangible Cultural Heritage Convention](https://ich.unesco.org/)
- [PIP-0200: Decentralized Identity Standard](./pip-0200-decentralized-identity-standard.md)
- [PIP-0201: Verifiable Credentials](./pip-0201-verifiable-credentials.md)
- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
