# PIP-7009: Reticulum Network Stack (RNS) Transport Support

| Field | Value |
|-------|-------|
| PIP | 7009 |
| Title | Reticulum Network Stack (RNS) Transport Support |
| Author | Pars Core Team |
| Status | Implemented |
| Type | Standards Track |
| Category | Networking |
| Created | 2026-02-04 |
| Requires | LP-9701 |

## Abstract

This proposal enables Pars network validators to operate over Reticulum Network Stack (RNS), supporting mesh networking, LoRa connectivity, and offline-first operation for the MIGA Protocol infrastructure.

## Motivation

Pars network serves the MIGA Protocol which requires robust, censorship-resistant infrastructure. Traditional TCP/IP connectivity creates single points of failure and geographic constraints. RNS enables:

- **Sovereign Infrastructure**: Validators in jurisdictions with internet restrictions
- **Disaster Resilience**: Mesh networks that operate during infrastructure outages
- **Remote Deployment**: LoRa-connected validators in areas without internet
- **Mobile Validators**: Maritime, aviation, and vehicular validator nodes
- **Air-Gapped Security**: High-security validators with controlled connectivity

## Specification

Pars inherits the full RNS implementation from Lux (LP-9701) with Pars-specific configuration:

### Network Configuration

| Network | Chain ID | RNS Gateway |
|---------|----------|-------------|
| Pars Mainnet | 18071 | `rns.pars.network:9631` |
| Pars Testnet | 18072 | `rns-testnet.pars.network:9641` |

### Default Configuration

```yaml
# ~/.pars/config.yaml
rns:
  enabled: true
  configPath: ~/.pars/reticulum
  announceInterval: 5m
  interfaces:
    - AutoInterface
    - TCPClientInterface
  linkTimeout: 30s
```

### Endpoint Addressing

Pars validators can advertise any combination of endpoints:

```go
// Traditional IP
endpoint := ips.NewIPEndpoint(netip.MustParseAddrPort("203.0.113.50:9631"))

// Hostname (for dynamic IPs)
endpoint, _ := ips.NewHostnameEndpoint("validator.example.com", 9631)

// RNS destination (for mesh/LoRa)
endpoint, _ := ips.NewRNSEndpointFromHex("rns://a5f72c3d4e5f60718293a4b5c6d7e8f9")
```

### Identity Management

Pars validators generate RNS identities automatically on first start:

```
~/.pars/reticulum/identity  # 40-byte identity file
```

Identity contains:
- Ed25519 signing keypair (for validator signatures)
- X25519 encryption keypair (for secure links)
- 128-bit destination hash (network address)

### Link Security

All RNS links use:
- X25519 ECDH key exchange
- HKDF-SHA256 key derivation
- AES-256-GCM authenticated encryption
- Counter-based nonces (no reuse)

### Announce Integration

Pars validators include MIGA-specific app data in announcements:

```go
type ParsAnnounceData struct {
    ValidatorID   [20]byte // Validator address
    StakeAmount   uint64   // Current stake
    NetworkID     uint32   // Chain ID (18071/18072)
    Capabilities  uint16   // Supported features
}
```

## Rationale

### Why RNS for MIGA Protocol?

1. **Censorship Resistance**: MIGA Protocol requires validators that cannot be easily blocked
2. **Geographic Distribution**: LoRa enables validators in remote locations
3. **Network Resilience**: Mesh topology survives infrastructure failures
4. **Sovereignty**: Nations can run validators without external internet dependencies

### Why Not Just TCP/IP?

TCP/IP requires:
- Stable internet connectivity
- Public IP or NAT traversal
- DNS resolution (centralized)
- BGP routing (can be hijacked)

RNS provides:
- Works over any byte transport
- Cryptographic addressing (no DNS)
- Mesh routing (no single path)
- Works offline with store-and-forward

## Post-Quantum Security (Hybrid Mode)

Pars inherits hybrid post-quantum cryptography from LP-9701, with additional considerations specific to MIGA Protocol sovereign infrastructure requirements.

### Why Post-Quantum Matters for MIGA

1. **Long-Term Data Protection**: Sovereign infrastructure handles sensitive national data with multi-decade retention requirements. Harvest-now-decrypt-later attacks are a real threat.

2. **Regulatory Compliance**: Many jurisdictions are mandating quantum-resistant cryptography for critical infrastructure. NIST requires federal systems to transition by 2035.

3. **Forward Secrecy Duration**: MIGA validators may operate for decades. Cryptographic keys protecting historical transactions must resist future quantum computers.

4. **Sovereignty Requirements**: Nations cannot rely on cryptographic protections that may fail within the operational lifetime of their infrastructure.

### Hybrid Cryptographic Suite

Pars uses the same hybrid approach as LP-9701:

| Purpose | Classical | Post-Quantum | Combined |
|---------|-----------|--------------|----------|
| Identity Signing | Ed25519 | ML-DSA-65 | Hybrid (AND) |
| Key Exchange | X25519 | ML-KEM-768 | Hybrid KEM |
| Session Encryption | AES-256-GCM | - | Same |
| Key Derivation | HKDF-SHA256 | - | Same |

Both ML-KEM-768 and ML-DSA-65 provide NIST Level 3 security (~192-bit classical equivalent).

### Wire Format Impact

| Component | Classical | Hybrid | Delta |
|-----------|-----------|--------|-------|
| Public Identity | 64 bytes | ~3.2 KB | +3.1 KB |
| Signature | 64 bytes | ~2.5 KB | +2.4 KB |
| Key Exchange | 64 bytes | ~1.2 KB | +1.1 KB |
| Handshake Total | ~256 bytes | ~7.5 KB | +7.2 KB |

### Performance Impact for Low-Bandwidth Links

MIGA deployments often use constrained networks (LoRa, satellite, rural cellular). Performance assessment:

| Link Type | Bandwidth | Classical Handshake | Hybrid Handshake | Acceptable? |
|-----------|-----------|---------------------|------------------|-------------|
| LoRa SF7 | 5.5 kbps | 370 ms | 11 sec | Marginal |
| LoRa SF12 | 250 bps | 8 sec | 4 min | Poor |
| Satellite | 64 kbps | 32 ms | 940 ms | Yes |
| Rural 3G | 384 kbps | 5 ms | 156 ms | Yes |
| TCP/IP | 100 Mbps | <1 ms | <1 ms | Yes |

**Recommendation**: For LoRa SF12 deployments, use classical-only mode with periodic key rotation, or pre-establish long-lived sessions with infrequent re-keying.

### Regulatory Alignment

| Jurisdiction | Requirement | Status |
|--------------|-------------|--------|
| NIST (US) | Federal PQC migration by 2035 | Compliant |
| ANSSI (France) | Hybrid mode recommended | Compliant |
| BSI (Germany) | Level 3+ required for sovereign | Compliant |
| NCSC (UK) | PQC transition planning required | Compliant |

### Configuration

```yaml
# ~/.pars/config.yaml
rns:
  enabled: true
  postQuantum: true           # Enable hybrid PQ mode (default)
  requirePostQuantum: false   # Allow classical-only peers
  # For constrained links:
  # postQuantum: false        # Disable for LoRa SF12
```

### Backward Compatibility with Classical Peers

Pars validators can interoperate with classical-only peers:

1. **Capability Exchange**: Handshake advertises PQ support
2. **Graceful Degradation**: Falls back to classical if peer lacks PQ
3. **Policy Enforcement**: `requirePostQuantum: true` rejects classical peers
4. **Mixed Networks**: PQ and classical validators coexist

### References

- [NIST FIPS 203](https://csrc.nist.gov/pubs/fips/203/final) - ML-KEM specification
- [NIST FIPS 204](https://csrc.nist.gov/pubs/fips/204/final) - ML-DSA specification
- [LP-4316](../../../../lux/lps/lp-4316-ml-dsa.md) - Lux ML-DSA implementation
- [LP-4318](../../../../lux/lps/lp-4318-ml-kem.md) - Lux ML-KEM implementation
- [LP-9701](../../../lux/lps/LPs/lp-9701-reticulum-network-stack.md) - Base RNS transport specification

## Security Considerations

1. **Validator Identity**: RNS identity is separate from validator signing key
2. **Key Isolation**: RNS keys stored in separate file from validator keys
3. **Forward Secrecy**: Each link uses ephemeral keys
4. **Replay Protection**: Timestamps prevent announcement replay
5. **Sybil Resistance**: Existing stake requirements apply regardless of transport
6. **Quantum Resistance**: Hybrid PQ mode protects sovereign infrastructure against future quantum threats
7. **Harvest-Now-Decrypt-Later Defense**: Long-term session confidentiality via ML-KEM-768
8. **Regulatory Compliance**: NIST Level 3 satisfies current sovereign infrastructure requirements

## Backwards Compatibility

Fully backwards compatible:
- Existing TCP/IP validators continue working
- RNS is opt-in via configuration
- Mixed networks (some RNS, some TCP) function normally
- Peer discovery works across transport types

## Test Cases

All LP-9701 tests apply. Additional Pars-specific tests:
- MIGA app data serialization
- Cross-transport peer discovery
- Gateway failover
- Stake-weighted announcement priority

## Implementation

Implemented via LP-9701 inheritance. Pars-specific configuration in `pars-node` v1.5.0.

## References

- [LP-9701: Reticulum Network Stack Transport Support](../../../lux/lps/LPs/lp-9701-reticulum-network-stack.md)
- [Reticulum Network Stack Manual](https://markqvist.github.io/Reticulum/manual/)
- [MIGA Protocol Specification](https://pars.network/miga)

## Copyright

Copyright 2026 Pars Network. All rights reserved.
