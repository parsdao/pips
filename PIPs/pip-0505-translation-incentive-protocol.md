---
pip: 505
title: "Translation Incentive Protocol"
description: "Token incentives for translating content to and from Farsi with quality verification"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Content
created: 2026-01-23
tags: [content, translation, farsi, incentive, localization]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a token incentive protocol for translating content to and from Farsi on the Pars Network. Translators earn ASHA by completing translation bounties posted by content creators, organizations, or the community treasury. Quality is verified through peer review, AI-assisted scoring (PIP-0403), and reputation tracking. The protocol prioritizes bidirectional translation between Farsi and major world languages, with special support for Dari and Tajik dialects.

## Motivation

### The Language Barrier

The Persian diaspora spans dozens of countries, and a significant portion of the community is bilingual or multilingual. Yet:
- Critical information (legal guides, health resources, news) often exists only in English
- Persian cultural content is inaccessible to the global audience
- Academic research about Iran is rarely available in Farsi
- Second-generation diaspora members are losing Farsi fluency

Translation bridges these gaps, and token incentives make it economically sustainable.

### Community-Powered Localization

Professional translation is expensive and slow. Community translation with quality incentives produces faster, more culturally aware translations at lower cost, while compensating translators fairly.

## Specification

### Translation Bounty

```go
type TranslationBounty struct {
    BountyID      [32]byte
    SourceContent [32]byte     // Hash of source content
    SourceLang    string       // ISO 639-1 source language
    TargetLang    string       // ISO 639-1 target language
    ContentType   ContentType  // article, legal, medical, literary, etc.
    WordCount     uint32       // Approximate word count
    Reward        uint64       // ASHA reward
    Deadline      uint64       // Completion deadline epoch
    Poster        [32]byte     // Anonymous bounty poster
    Status        BountyStatus
    Requirements  TranslationReqs
}

type ContentType uint8

const (
    ContentGeneral   ContentType = iota
    ContentLegal
    ContentMedical
    ContentTechnical
    ContentLiterary
    ContentNews
    ContentAcademic
    ContentGovernance
)

type TranslationReqs struct {
    MinReputation   uint64   // Minimum translator reputation
    SpecialtyReq    string   // Required domain expertise
    PeerReviewCount uint8    // Number of peer reviews required
    AIScoreMin      float64  // Minimum AI quality score
}
```

### Translation Submission

```go
type TranslationSubmission struct {
    SubmissionID   [32]byte
    BountyID       [32]byte
    Translator     [32]byte     // Anonymous translator commitment
    TranslatedHash [32]byte     // Hash of translated content
    SourceHash     [32]byte     // Hash of source (proves same content)
    Timestamp      uint64
    Signature      []byte
}
```

### Quality Verification

Three-tier verification:

1. **AI Scoring**: Automated quality check using Persian NLP models (PIP-0403)
   - Fluency score
   - Adequacy score (meaning preservation)
   - ZWNJ correctness
   - Terminology consistency

2. **Peer Review**: Human reviewers score translations
   - Minimum 2 peer reviews per submission
   - Reviewers earn ASHA for reviews
   - Reviewers stake reputation on their scores

3. **Community Rating**: Published translations receive community feedback
   - Long-term quality signal
   - Feeds into translator reputation

### Reward Distribution

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

interface ITranslationIncentive {
    function postBounty(
        bytes32 sourceHash,
        string calldata sourceLang,
        string calldata targetLang,
        uint8 contentType,
        uint32 wordCount,
        uint64 deadline
    ) external payable returns (bytes32 bountyId);

    function submitTranslation(
        bytes32 bountyId,
        bytes32 translatedHash
    ) external returns (bytes32 submissionId);

    function submitReview(
        bytes32 submissionId,
        uint8 fluencyScore,
        uint8 adequacyScore,
        bytes calldata feedback
    ) external;

    function claimReward(bytes32 submissionId) external returns (uint256 amount);

    event BountyPosted(bytes32 indexed bountyId, string sourceLang, string targetLang);
    event TranslationSubmitted(bytes32 indexed bountyId, bytes32 indexed submissionId);
    event RewardClaimed(bytes32 indexed submissionId, uint256 amount);
}
```

### Reward Calculation

```
translator_reward = base_reward * quality_multiplier * speed_bonus
reviewer_reward = base_reward * 0.1 * review_accuracy

quality_multiplier:
  - AI score >= 0.9 AND peer avg >= 4.5: 1.3x
  - AI score >= 0.8 AND peer avg >= 4.0: 1.0x
  - AI score >= 0.7 AND peer avg >= 3.5: 0.8x
  - Below thresholds: rejected, no payment

speed_bonus:
  - Completed within 25% of deadline: 1.2x
  - Completed within 50% of deadline: 1.1x
  - Completed within deadline: 1.0x
```

### Priority Languages

| Language Pair | Priority | Treasury Subsidy |
|:-------------|:---------|:----------------|
| Farsi <-> English | Highest | 50% subsidy on bounties |
| Farsi <-> Arabic | High | 30% subsidy |
| Farsi <-> French | Medium | 20% subsidy |
| Farsi <-> German | Medium | 20% subsidy |
| Farsi <-> Turkish | Medium | 20% subsidy |
| Dari <-> Farsi | High | 40% subsidy (dialect preservation) |
| Tajik <-> Farsi | High | 40% subsidy (dialect preservation) |

## Rationale

### Why Token Incentives Over Volunteer Translation?

Volunteer translation is inconsistent and slow. Token incentives attract skilled translators, ensure timely delivery, and create a sustainable translation ecosystem. The Pars treasury subsidizes high-priority pairs to ensure essential content is always translated.

### Why AI + Human Review?

AI catches systematic errors (grammar, terminology) efficiently. Human reviewers catch nuance, cultural appropriateness, and stylistic quality that AI misses. The combination provides fast, reliable quality assurance.

### Why Dialect Support?

Dari (Afghanistan) and Tajik (Tajikistan) speakers are part of the broader Persian-speaking community. Including dialect-to-dialect translation preserves linguistic diversity within the community.

## Security Considerations

- **Translation fraud**: AI scoring catches machine-translated submissions; peer review catches subtle errors
- **Review collusion**: Reviewer-translator collusion detected by statistical analysis of review patterns
- **Bounty spam**: Posting bounties requires ASHA deposit; unclaimed deposits return after timeout
- **Quality gaming**: Reputation decay penalizes translators whose past work is later downrated

## References

- [PIP-0403: Persian NLP Model Standard](./pip-0403-persian-nlp-model-standard.md)
- [PIP-0500: Decentralized Publishing Platform](./pip-0500-decentralized-publishing-platform.md)
- [PIP-0502: Creator Monetization Protocol](./pip-0502-creator-monetization-protocol.md)
- [PIP-7002: Treasury Management](./pip-7002-treasury-management.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
