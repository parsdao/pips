---
pip: 24
title: "Account Abstraction"
description: "Smart contract wallets as first-class citizens on Pars Network"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Core
created: 2026-01-23
tags: [account-abstraction, wallets, smart-contracts, ux, social-recovery]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP introduces native account abstraction on the Pars Network, elevating smart contract wallets to first-class citizens alongside externally owned accounts (EOAs). Account abstraction allows wallets to define custom signature verification logic, gas payment strategies, and transaction batching. This enables social recovery wallets, multi-signature accounts, session keys for dApps, and gasless transactions where a third party sponsors the fee. For the Pars diaspora, account abstraction removes the requirement to hold ASHA for gas before using the network, dramatically lowering onboarding friction.

## Motivation

Traditional EOAs require users to manage private keys and hold native tokens for gas. This creates significant onboarding barriers: a new user cannot receive ASHA and immediately use the network because they need ASHA to pay gas for their first transaction. For the Persian diaspora, many potential users are non-technical and accustomed to Web2 experiences where account recovery is possible. Losing a private key means permanently losing access to funds, which is unacceptable for a network targeting mainstream adoption.

Account abstraction solves these problems by allowing wallets to define arbitrary validation logic. A wallet can require social recovery (approval from trusted contacts), biometric authentication, or session keys that limit spending without exposing the master key.

## Specification

### UserOperation

Instead of submitting raw transactions, users submit `UserOperation` objects to a mempool:

```solidity
struct UserOperation {
    address sender;           // Smart contract wallet address
    uint256 nonce;            // Replay protection
    bytes callData;           // Encoded wallet operation
    uint256 callGasLimit;     // Gas for the main execution
    uint256 verificationGas;  // Gas for signature verification
    uint256 preVerificationGas;
    uint256 maxFeePerGas;     // EIP-1559 fee (PIP-0023)
    uint256 maxPriorityFee;
    bytes paymasterData;      // Optional: paymaster sponsorship info
    bytes signature;          // Wallet-specific signature
}
```

### Wallet Contract Interface

Smart contract wallets implement:

```solidity
interface IWallet {
    /// Validate the UserOperation signature
    function validateUserOp(
        UserOperation calldata op,
        bytes32 opHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData);

    /// Execute the operation
    function executeUserOp(
        UserOperation calldata op
    ) external;
}
```

### Paymasters

Paymasters are contracts that sponsor gas fees on behalf of users. A paymaster validates that it is willing to pay for a UserOperation and is charged the gas cost instead of the wallet. Use cases include:

- **Onboarding paymaster**: Sponsors the first N transactions for new users.
- **Subscription paymaster**: dApps pay gas for their users.
- **Token paymaster**: Users pay gas in ERC-20 tokens instead of ASHA.

### Entry Point

A singleton `EntryPoint` contract processes UserOperations:

1. Validates the wallet's signature via `validateUserOp`.
2. If a paymaster is specified, validates paymaster willingness via `validatePaymasterOp`.
3. Executes the wallet's `executeUserOp`.
4. Charges gas to the wallet or paymaster.

### Social Recovery

The standard Pars wallet implementation includes social recovery:

- The wallet owner designates 3-5 guardians (trusted contacts).
- If the owner loses their key, guardians approve a key rotation.
- Guardian approvals are threshold-based (e.g., 3-of-5).
- A 48-hour timelock on recovery prevents instant hostile takeover.

## Rationale

Native account abstraction (protocol-level, not application-level) is chosen because it allows all wallets to benefit from the same infrastructure without requiring per-dApp integration. The UserOperation mempool is separate from the standard transaction mempool to allow specialized validation rules. Paymasters eliminate the chicken-and-egg problem of needing tokens to pay gas before you can receive tokens. Social recovery addresses the key management problem that is the single largest barrier to mainstream cryptocurrency adoption.

## Security Considerations

- **Validation gas griefing**: Malicious UserOperations could waste bundler gas during validation. Mitigation: validation gas is bounded and pre-paid by a stake deposit.
- **Paymaster abuse**: A paymaster could accept a UserOperation during validation then reject during execution. Mitigation: paymasters must stake ASHA as collateral.
- **Social recovery attacks**: An attacker who compromises a majority of guardians can steal the wallet. Mitigation: the 48-hour timelock allows the owner to cancel recovery if they still have their key.
- **Replay protection**: The nonce field in UserOperation prevents replay. Wallets may implement two-dimensional nonces for parallel transaction submission.

## References

- [PIP-0023: Fee Market Mechanism](./pip-0023-fee-market-mechanism.md)
- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)
- [EIP-4337: Account Abstraction Using Alt Mempool](https://eips.ethereum.org/EIPS/eip-4337)
- [EIP-7702: Set EOA Account Code](https://eips.ethereum.org/EIPS/eip-7702)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
