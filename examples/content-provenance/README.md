# Content Provenance Example

**PIP**: [PIP-0011 -- Content Provenance & Media Authentication](../../PIPs/pip-0011-content-provenance.md)
**Lux LP**: [LP-7110 -- Content Provenance](https://github.com/luxfi/lps)

## Purpose

Citizen journalists document human rights abuses under life-threatening conditions.
This contract provides cryptographic proof of media authenticity at the point of capture,
tracks content through edits, and detects AI-generated disinformation -- all without
ever exposing the creator's identity.

## Threat Model

- State media fabricates deepfake "confessions" of dissidents
- Authentic footage is dismissed as AI-generated (liar's dividend)
- Real footage is edited to change the narrative
- Journalists are identified and targeted via image metadata

## Contract Overview

`ContentProvenance.sol` implements the PIP-0011 provenance chain:

| Function | Purpose |
|----------|---------|
| `registerMedia()` | Seal media at capture with device attestation |
| `recordDerivation()` | Track edits as immutable derivation chain |
| `flagAIContent()` | Mark AI-generated content with encrypted model ID |
| `verifyProvenance()` | Verify authenticity and chain depth |

### Source Protection

The creator identity is FHE-encrypted under the network threshold key.
No single node, validator, or relay can identify the journalist.
Only a quorum of threshold key holders can decrypt -- and only under
protocol-defined conditions (e.g., court order from a legitimate judiciary).

### C2PA Interoperability

Provenance records export to C2PA format for verification by international
media organizations (AP, Reuters, BBC) without requiring Pars infrastructure.

## FHE Integration

- `encryptedCreatorId`: tFHE.encrypt(creator_identity, network_pk)
- `aiModelId`: tFHE.encrypt(model_identifier, network_pk)
- Location is a ZK commitment -- proves "in country X" without revealing GPS

See: `luxfi/fhe/cmd/provenance` and `luxfi/fhe/cmd/mediaseal` for CLI tools.

## Related Repositories

- [luxfhe/examples/content-provenance](https://github.com/luxfi/fhe/tree/main/examples/content-provenance) -- FHE provenance circuits
- [luxfi/fhe/cmd/provenance](https://github.com/luxfi/fhe/tree/main/cmd/provenance) -- CLI provenance tool
- [luxfi/fhe/cmd/mediaseal](https://github.com/luxfi/fhe/tree/main/cmd/mediaseal) -- Media sealing CLI
- [PIP-0010](../../PIPs/pip-0010-data-integrity-seal.md) -- Data integrity seal (prerequisite)

## Build

```bash
forge build
```

## License

MIT
