---
pip: 20
title: "Smart Contract Sandbox"
description: "Isolated execution environment for untrusted smart contracts"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Core
created: 2026-01-23
tags: [sandbox, security, smart-contracts, isolation, evm]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a sandboxed execution environment for untrusted smart contracts on the Pars EVM L2. Sandboxed contracts execute in an isolated context with restricted access to global state, bounded resource consumption, and no ability to call outside the sandbox without explicit permission. The sandbox enables users to interact with unaudited contracts safely, reducing the attack surface for malicious code that could drain funds or exploit reentrancy vulnerabilities. This is critical for a censorship-resistant network where contract deployment is permissionless and code auditing cannot be mandated.

## Motivation

On permissionless blockchains, anyone can deploy smart contracts, including malicious ones designed to steal funds through reentrancy, phishing, or logic exploits. Traditional EVM execution provides no isolation: a contract call can trigger arbitrary state changes across the entire network state. For the Pars Network, where users may interact with community-deployed contracts for cultural applications (archives, voting, marketplaces), a sandbox provides defense-in-depth without requiring centralized contract curation.

## Specification

### Sandbox Invocation

A user invokes a sandboxed call by setting a `sandbox` flag in the transaction:

```solidity
// Standard call (full access)
target.call{value: 1 ether}(data);

// Sandboxed call (isolated)
target.sandboxCall{value: 1 ether, gasLimit: 100000}(data);
```

### Isolation Guarantees

Within a sandbox:

1. **State isolation**: The sandboxed contract operates on a copy of the relevant state. Changes are committed only if the caller explicitly approves after execution.
2. **Call restriction**: External calls from within the sandbox are prohibited unless the caller has whitelisted specific target addresses.
3. **Value cap**: The sandbox cannot transfer more ASHA than the caller explicitly authorized.
4. **Gas bound**: Execution is bounded by a caller-specified gas limit, independent of the transaction gas limit.
5. **Storage isolation**: The sandbox cannot read storage of contracts outside its scope unless explicitly granted.

### Commit/Rollback

After sandboxed execution completes, the caller receives the execution result (return data, logs, state diff) and decides whether to commit the state changes or rollback. This two-phase pattern allows the caller (or a wallet UI) to inspect the effects before they become permanent.

### Precompile Interface

The sandbox is implemented as a system precompile at address `0x0720`:

```solidity
interface ISandbox {
    /// Execute a call in sandbox mode
    /// Returns the execution result and state diff
    function execute(
        address target,
        bytes calldata data,
        uint256 value,
        uint256 gasLimit,
        address[] calldata allowedCalls
    ) external returns (
        bool success,
        bytes memory returnData,
        StateDiff memory diff
    );

    /// Commit a previously executed sandbox result
    function commit(bytes32 executionId) external;
}
```

### Resource Metering

Sandboxed execution consumes gas at a 1.2x multiplier relative to standard execution, reflecting the overhead of state copying and isolation. The multiplier is configurable via governance.

## Rationale

The commit/rollback pattern is inspired by database transactions and provides a clean separation between execution and state commitment. This is preferable to static analysis or formal verification approaches, which cannot catch all vulnerabilities and impose high barriers on contract developers. The 1.2x gas multiplier makes sandbox usage slightly more expensive than standard calls, discouraging unnecessary use while remaining affordable for security-sensitive interactions. The whitelist-based external call permission avoids blanket restrictions while preventing unexpected cross-contract interactions.

## Security Considerations

- **Sandbox escape**: The isolation must be enforced at the EVM interpreter level. A bug in the sandbox implementation could allow escape. Mitigation: the sandbox precompile is implemented in the node's core EVM, not as a Solidity contract, and is subject to formal verification.
- **State copy overhead**: Copying state for isolation consumes memory. Large contracts with extensive storage may cause out-of-memory conditions. Mitigation: the state copy is lazy (copy-on-read) and bounded by the gas limit.
- **Denial of service**: An attacker could submit many sandboxed transactions to exhaust node resources. Mitigation: the 1.2x gas multiplier and standard gas limits apply.
- **Time-of-check vs time-of-commit**: State may change between sandbox execution and commit. The commit operation re-validates the state diff against the current state and fails if conflicts are detected.

## References

- [PIP-0000: Network Architecture](./pip-0000-network-architecture.md)
- [PIP-0024: Account Abstraction](./pip-0024-account-abstraction.md)
- [EVM Object Format (EOF)](https://eips.ethereum.org/EIPS/eip-3540)
- [Ethereum Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
