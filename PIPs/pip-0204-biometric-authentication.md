---
pip: 204
title: "Biometric Authentication"
description: "Optional biometric binding for high-security Pars Network accounts"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Identity
created: 2026-01-23
tags: [identity, biometric, authentication, security, fido]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines an optional biometric authentication layer for Pars Network accounts. Users may bind device-local biometric verification (fingerprint, face recognition) to transaction signing via the FIDO2/WebAuthn standard. Biometric data never leaves the device, never touches the blockchain, and cannot be extracted by any party including Pars Network validators.

## Motivation

High-value operations (large transfers, guardian changes, governance votes) benefit from stronger authentication than password or key possession alone:

1. **Theft resistance** -- a stolen device or extracted key cannot authorize transactions without the owner's biometric
2. **Usability** -- biometric unlock is faster and more intuitive than password entry for everyday operations
3. **Non-repudiation** -- biometric binding provides stronger evidence that the account owner authorized an action
4. **Optional by design** -- users in high-risk environments may choose NOT to enable biometrics to avoid forced biometric coercion

## Specification

### Architecture

```
┌──────────────────────────────────────────────────┐
│  User Device                                      │
│  ┌────────────┐    ┌─────────────────────────┐   │
│  │  Biometric │───►│  Secure Enclave / TEE    │   │
│  │  Sensor    │    │  ┌───────────────────┐   │   │
│  │            │    │  │  Private Key Store │   │   │
│  └────────────┘    │  │  (never exported)  │   │   │
│                    │  └───────────────────┘   │   │
│                    │  Signs tx on bio match   │   │
│                    └──────────┬──────────────┘   │
│                               │                   │
│                    ┌──────────▼──────────┐        │
│                    │  FIDO2 Assertion    │        │
│                    │  (signature only)   │        │
│                    └──────────┬──────────┘        │
└───────────────────────────────┼───────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │  Pars Network EVM     │
                    │  Verify FIDO2 sig     │
                    │  Execute transaction  │
                    └───────────────────────┘
```

### Registration

```solidity
interface IBiometricAuth {
    function registerCredential(
        bytes memory credentialId,
        bytes memory publicKey,
        uint8 authLevel
    ) external;

    function verifyAndExecute(
        bytes memory credentialId,
        bytes memory authenticatorData,
        bytes memory clientDataJSON,
        bytes memory signature,
        bytes memory calldata_
    ) external;

    function removeCredential(bytes memory credentialId) external;
    function getCredentials(address user) external view returns (Credential[] memory);
}
```

### Authentication Levels

| Level | Requirement | Use Case |
|:------|:-----------|:---------|
| 0 | Key only | Low-value transactions |
| 1 | Key + biometric | Standard transactions |
| 2 | Key + biometric + PIN | High-value transfers |
| 3 | Key + biometric + guardian co-sign | Critical operations (key rotation) |

### Biometric Policy Contract

Users configure which operations require biometric verification:

```solidity
struct BiometricPolicy {
    uint256 transferThreshold;    // ASHA amount requiring biometric
    bool governanceRequiresBio;   // Require biometric for votes
    bool guardianChangeRequires;  // Require biometric for guardian updates
    uint256 dailyLimitWithoutBio; // Max daily spend without biometric
}
```

### Anti-Coercion Measures

- **Duress biometric**: Users can register a secondary biometric (e.g., left thumb vs right thumb) that triggers a duress signal, sending funds to a pre-configured safe address
- **Cooldown**: Biometric failures trigger exponential backoff (1min, 5min, 30min, 24hr)
- **Liveness detection**: FIDO2 attestation must include liveness verification to prevent replay of captured biometric data

## Rationale

- **FIDO2/WebAuthn** is an industry standard supported by all major operating systems and browsers
- **Device-local biometrics** means no biometric database exists to be breached
- **Optional enrollment** respects users who face biometric coercion risks
- **Tiered authentication** balances security with usability for different operation types
- **Duress biometric** provides coercion resistance unique to the diaspora threat model

## Security Considerations

- **Biometric coercion**: In jurisdictions where forced biometric unlock is legal or practiced, users SHOULD NOT enable biometric auth; the duress biometric provides a mitigation but is not foolproof
- **Device compromise**: If the secure enclave is compromised, biometric auth provides no additional security; this is a defense-in-depth measure, not a sole control
- **Biometric spoofing**: FIDO2 liveness detection mitigates but does not eliminate spoofing; users should combine biometric auth with other factors for critical operations
- **No biometric storage**: The protocol MUST NOT store biometric templates on-chain, off-chain, or anywhere outside the device secure enclave
- **Revocation**: Lost or compromised devices must be deregistered via guardian-assisted credential removal

## References

- [FIDO2/WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [PIP-0003: Coercion Resistance](./pip-0003-coercion-resistance.md)
- [PIP-0200: Decentralized Identity Standard](./pip-0200-decentralized-identity-standard.md)
- [PIP-0202: Social Recovery Wallets](./pip-0202-social-recovery-wallets.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
