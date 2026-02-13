# DataSeal Example

**PIP**: [PIP-0010 -- Verifiable Data Integrity Seal](../../PIPs/pip-0010-data-integrity-seal.md)
**Lux LP**: [LP-0535 -- Receipt Registry](https://github.com/luxfi/lps/blob/main/LPs/lp-0530-receipt-registry.md)

## Purpose

Whistleblowers and citizen journalists seal evidence on-chain without revealing content.
A seal is a 256-byte cryptographic fingerprint that proves data existed at a specific time.
Evidence survives device confiscation, internet blackouts, and regime cover-ups.

## Threat Model

- Devices are confiscated within hours of an incident
- Internet is cut to prevent uploads
- State actors rewrite the official narrative within 24 hours
- Witnesses are intimidated, detained, or disappeared

A seal propagated to even one mesh node cannot be erased.

## Contract Overview

`DataSeal.sol` implements three sealing modes:

| Mode | Integrity Tag | Privacy | Use Case |
|------|--------------|---------|----------|
| **Public** | Raw hash | Document hash visible | Public records, court filings |
| **ZK** | ZK commitment | Hash hidden, validity provable | Selective disclosure to trusted parties |
| **Private** | FHE ciphertext hash | Fully encrypted | Maximum deniability under coercion |

### Key Functions

- `seal()` -- Seal a single document with nullifier-based deduplication
- `batchSeal()` -- Seal up to 256 documents atomically (protest documentation)
- `verifySeal()` -- Verify existence and timestamp (court-admissible)
- `isSealed()` -- Check if a nullifier has been consumed

## FHE Integration

Private mode seals use threshold FHE. The integrity tag is encrypted under the network
public key. Only a quorum of threshold key holders can decrypt. Individual validators,
relay nodes, and the sealer's device never hold the decryption key.

See: `luxfi/fhe/cmd/seal` for the CLI sealing tool.

## Related Repositories

- [luxfhe/examples/data-seal](https://github.com/luxfi/fhe/tree/main/examples/data-seal) -- FHE circuit for seal encryption
- [luxfi/fhe/cmd/seal](https://github.com/luxfi/fhe/tree/main/cmd/seal) -- CLI tool for offline sealing
- [PIP-0003](../../PIPs/pip-0003-coercion-resistance.md) -- Coercion resistance framework

## Build

This is a specification example. To compile:

```bash
forge build
```

## License

MIT
