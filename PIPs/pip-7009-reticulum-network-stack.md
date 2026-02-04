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

## Security Considerations

1. **Validator Identity**: RNS identity is separate from validator signing key
2. **Key Isolation**: RNS keys stored in separate file from validator keys
3. **Forward Secrecy**: Each link uses ephemeral keys
4. **Replay Protection**: Timestamps prevent announcement replay
5. **Sybil Resistance**: Existing stake requirements apply regardless of transport

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
