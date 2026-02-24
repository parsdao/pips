---
pip: 507
title: "Educational Content Credentials"
description: "Verifiable credentials for educational content completion and skill attestation on Pars Network"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Content
created: 2026-01-23
tags: [content, education, credentials, verifiable, skills]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a verifiable credential system for educational content on the Pars Network. Learners who complete courses, pass assessments, or demonstrate skills earn on-chain credentials that are portable, verifiable, and privacy-preserving. Credential issuers (educators, institutions, peer assessors) stake veASHA on their attestations. The system supports formal education, vocational training, language learning, and community-taught skills, with special focus on the needs of diaspora members rebuilding careers in new countries.

## Motivation

### Credential Crisis in the Diaspora

Persian diaspora members face severe credential recognition problems:
- University degrees from Iran are often not recognized abroad
- Professional certifications cannot be verified due to sanctions
- Skills learned informally (through community, apprenticeship) have no documentation
- Refugees and asylum seekers frequently lack any documentation at all

### Portable, Verifiable Learning

On-chain credentials solve these problems:
1. **Portable** -- credentials travel with the learner across borders
2. **Verifiable** -- anyone can verify without contacting the issuer
3. **Privacy-preserving** -- learners choose what to reveal (ZK proofs)
4. **Censorship-resistant** -- no authority can revoke or deny credentials

## Specification

### Credential Structure

```go
type EducationalCredential struct {
    CredentialID   [32]byte
    Issuer         [32]byte        // Issuer commitment
    Recipient      [32]byte        // Learner commitment
    Type           CredentialType
    Subject        string          // e.g., "Persian Literature", "Web Development"
    Level          SkillLevel
    Description    string
    Evidence       [32]byte        // Hash of assessment evidence
    IssuedAt       uint64
    ExpiresAt      uint64          // 0 = no expiry
    IssuerStake    uint64          // veASHA staked on this attestation
    Signature      []byte          // ML-DSA signature
}

type CredentialType uint8

const (
    TypeCourseCompletion  CredentialType = iota
    TypeSkillAttestation
    TypeAssessmentPassed
    TypePeerEndorsement
    TypeMicrocredential
    TypeDegreeEquivalent
)

type SkillLevel uint8

const (
    LevelBeginner    SkillLevel = iota
    LevelIntermediate
    LevelAdvanced
    LevelExpert
    LevelMaster
)
```

### Issuer Registration

```go
type CredentialIssuer struct {
    IssuerID     [32]byte
    Name         string        // Institution or educator name
    Type         IssuerType
    Specialties  []string      // Areas of expertise
    Reputation   uint64        // Accumulated reputation
    StakeAmount  uint64        // Total veASHA staked
    Credentials  uint64        // Number issued
    RevokeRate   float64       // Rate of revoked credentials
}

type IssuerType uint8

const (
    IssuerInstitution  IssuerType = iota // University, school
    IssuerEducator                        // Individual teacher
    IssuerPeerGroup                       // Community assessment
    IssuerAutomated                       // AI-graded assessment
)
```

### Selective Disclosure

Learners can prove specific facts without revealing full credentials:

```go
// ProveCredential generates a ZK proof of a specific credential property
func ProveCredential(
    credential *EducationalCredential,
    secret [32]byte,
    property string, // e.g., "level >= Advanced"
) ([]byte, error) {
    switch property {
    case "exists":
        return zk.ProveExistence(credential, secret)
    case "level":
        return zk.ProveLevel(credential, secret)
    case "subject":
        return zk.ProveSubject(credential, secret)
    case "issuer-reputation":
        return zk.ProveIssuerReputation(credential, secret)
    default:
        return nil, fmt.Errorf("unknown property: %s", property)
    }
}
```

Example: "I have an Advanced credential in Web Development from an issuer with reputation > 1000" -- without revealing which credential, which issuer, or any other details.

### On-Chain Registry

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

interface IEducationalCredentials {
    function registerIssuer(
        string calldata metadata,
        uint8 issuerType
    ) external payable returns (bytes32 issuerId);

    function issueCredential(
        bytes32 recipientCommitment,
        uint8 credentialType,
        uint8 level,
        string calldata subject,
        bytes32 evidenceHash
    ) external returns (bytes32 credentialId);

    function verifyCredential(
        bytes32 credentialId
    ) external view returns (bool valid, bytes32 issuer, uint8 level);

    function revokeCredential(
        bytes32 credentialId,
        string calldata reason
    ) external;

    event CredentialIssued(bytes32 indexed credentialId, bytes32 indexed issuer);
    event CredentialRevoked(bytes32 indexed credentialId, string reason);
}
```

### Assessment Framework

Automated assessments for self-paced learning:
- Multiple-choice and coding challenges graded by smart contracts
- AI-assisted evaluation for written and spoken responses (PIP-0400)
- Peer assessment with reputation-weighted scoring
- Practical demonstrations verified by community evaluators

## Rationale

### Why Staked Attestations?

Issuers who stake veASHA on their attestations have skin in the game. Fraudulent credentials damage the issuer's stake and reputation, creating economic alignment between issuers and credential integrity.

### Why ZK Selective Disclosure?

Full credential disclosure reveals personal information (what you studied, when, where). ZK proofs let learners prove relevant facts ("I'm qualified for this job") without revealing irrelevant details ("I studied during political exile").

### Why Support Peer Assessment?

Many valuable skills in the diaspora are learned through community: traditional crafts, cooking, music, language. Peer assessment enables credentialing for these informal learning paths.

## Security Considerations

- **Credential fraud**: Issuer staking with slashing; peer review of suspicious credentials
- **Issuer compromise**: Reputation decay for issuers whose credentials are frequently challenged
- **Privacy of learners**: Only commitment hashes on-chain; ZK proofs for verification
- **Diploma mill issuers**: Minimum stake requirements; community rating of issuers

## References

- [PIP-0003: Coercion Resistance](./pip-0003-coercion-resistance.md)
- [PIP-0400: Decentralized Inference Protocol](./pip-0400-decentralized-inference-protocol.md)
- [PIP-0500: Decentralized Publishing Platform](./pip-0500-decentralized-publishing-platform.md)
- [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
