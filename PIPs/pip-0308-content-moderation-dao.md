---
pip: 308
title: "Content Moderation DAO"
description: "Decentralized content moderation governance for Pars Network communications"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Communication
created: 2026-01-23
tags: [communication, moderation, dao, governance, safety]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a decentralized content moderation framework for Pars Network. Instead of centralized censorship, community-elected moderation jurors review reported content and apply graduated consequences. The system balances free expression with community safety, operates transparently, and cannot be captured by any single faction.

## Motivation

Censorship resistance does not mean consequence-free communication:

1. **Illegal content** -- CSAM, doxing, and credible threats of violence must be actionable
2. **Community standards** -- diaspora communities have cultural norms that merit enforcement
3. **No central censor** -- a single moderation authority is a censorship bottleneck and a target for capture
4. **Transparency** -- moderation decisions must be auditable and appealable
5. **Cultural sensitivity** -- content acceptable in one context may be harmful in another; moderation must be context-aware

## Specification

### Moderation Structure

```solidity
interface IContentModerationDAO {
    function reportContent(
        bytes32 contentHash,
        uint8 category,
        bytes memory evidence
    ) external returns (bytes32 reportId);

    function assignJurors(bytes32 reportId) external;
    function submitVerdict(bytes32 reportId, uint8 verdict, bytes memory rationale) external;
    function appealVerdict(bytes32 reportId, bytes memory newEvidence) external;
    function executeVerdict(bytes32 reportId) external;
    function getReport(bytes32 reportId) external view returns (Report memory);
}
```

### Report Categories

| Category | Severity | Response Time |
|:---------|:---------|:-------------|
| CSAM | Critical | 1 hour |
| Credible violence threat | Critical | 1 hour |
| Doxing (personal info exposure) | High | 4 hours |
| Harassment / targeted abuse | High | 24 hours |
| Scam / fraud | Medium | 48 hours |
| Spam (escalated from PIP-0307) | Medium | 48 hours |
| Misinformation | Low | 7 days |
| Community standards violation | Low | 7 days |

### Juror Selection

Jurors are selected from a pool of staked, reputable community members:

| Requirement | Value |
|:-----------|:------|
| Minimum stake | 500 ASHA |
| Minimum reputation | 500/1000 |
| Minimum account age | 90 days |
| Panel size | 5 jurors (critical: 9) |
| Supermajority | 4/5 or 7/9 |

Jurors are randomly assigned with conflict-of-interest exclusions. Juror identities are hidden from each other and from the reported party during deliberation.

### Verdict Options

| Verdict | Effect | Duration |
|:--------|:-------|:---------|
| No action | Report dismissed | Permanent |
| Warning | Formal warning recorded on-chain | Permanent record |
| Content removal | Content hash blocklisted from relay | Permanent |
| Temporary mute | Sender rate-limited for N days | 1-30 days |
| Session suspension | Sender's sessions frozen | 1-90 days |
| Identity flag | Identity flagged in reputation system | Until appeal |
| Permanent ban | Identity permanently blocklisted from relay | Permanent (appealable) |

### Content Removal Mechanism

Since messages are E2E encrypted and stored in swarms, "removal" means:

1. Content hash added to a distributed blocklist
2. Relay nodes refuse to store or forward blocklisted content
3. Existing copies on recipient devices are not affected (cannot be remotely deleted)
4. Relay nodes that continue serving blocklisted content face slashing

### Appeal Process

1. Moderated party submits appeal with new evidence or argument
2. Larger juror panel (9 members) assigned, excluding original jurors
3. Appeal panel reviews original evidence plus new submissions
4. Appeal verdict is final (no further appeals)
5. Unsuccessful appeals forfeit a small ASHA bond (25 ASHA)

### Transparency

All moderation actions are logged on-chain:

```solidity
event ContentReported(bytes32 indexed reportId, uint8 category, uint256 timestamp);
event VerdictReached(bytes32 indexed reportId, uint8 verdict, uint256 jurorVotes);
event AppealFiled(bytes32 indexed reportId, uint256 timestamp);
event VerdictExecuted(bytes32 indexed reportId, uint8 finalVerdict);
```

Community members can audit the moderation history, identify patterns, and propose governance changes to moderation policies.

## Rationale

- **Juror-based moderation** distributes power across the community rather than concentrating it
- **Graduated consequences** allow proportional responses to different severity levels
- **Transparency** ensures the moderation system itself is accountable
- **Appeal mechanism** provides recourse for incorrect or biased decisions
- **Relay-level enforcement** is the only practical enforcement point in an E2E encrypted system
- **Cultural context** -- jurors from the community understand cultural norms that external moderators would miss

## Security Considerations

- **Juror bribery**: Hidden juror identities and stake-based slashing for minority verdicts increase the cost of corruption
- **Weaponized reporting**: Frivolous reports waste juror time; repeat false reporters face escalating penalties
- **Censorship by moderation**: The supermajority requirement and appeal mechanism prevent faction-based censorship
- **Critical content response time**: 1-hour SLA for CSAM and violence threats requires an always-available juror rotation
- **Relay node compliance**: Nodes that ignore the blocklist face slashing; measurement committee (PIP-0306) verifies compliance

## References

- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [PIP-0203: Reputation System](./pip-0203-reputation-system.md)
- [PIP-0307: Anti-Spam Framework](./pip-0307-anti-spam-framework.md)
- [PIP-7000: DAO Governance Framework](./pip-7000-dao-governance-framework.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
