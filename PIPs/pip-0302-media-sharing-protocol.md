---
pip: 302
title: "Media Sharing Protocol"
description: "Encrypted media sharing with IPFS backend for Pars Network"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Communication
created: 2026-01-23
tags: [communication, media, ipfs, encryption, file-sharing]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a protocol for encrypted media sharing over Pars Network. Media files (images, video, audio, documents) are encrypted client-side, chunked, and distributed across IPFS and the session-layer swarm. Only intended recipients can decrypt the content. The protocol supports progressive loading, thumbnail previews, and bandwidth-constrained delivery for users in censored or throttled environments.

## Motivation

Media sharing is essential for diaspora community life:

1. **Cultural media** -- music, poetry recordings, calligraphy images, and educational materials must flow freely
2. **Evidence documentation** -- human rights documentation requires tamper-proof, encrypted media distribution
3. **Family connections** -- photos and videos maintain bonds across geographic separation
4. **Censorship resistance** -- media uploads to centralized platforms can be removed or blocked; decentralized storage persists

## Specification

### Media Pipeline

```
1. Client selects media file
2. Generate random symmetric key (AES-256)
3. Create encrypted thumbnail (if image/video)
4. Chunk file into 256KB segments
5. Encrypt each chunk with key + chunk index as nonce
6. Upload chunks to IPFS / session swarm
7. Create media manifest (encrypted)
8. Send manifest to recipient via session message
```

### Media Manifest

```json
{
  "mediaId": "0xABC123...",
  "mimeType": "image/jpeg",
  "originalSize": 2048576,
  "encryptedSize": 2049024,
  "chunkSize": 262144,
  "chunkCount": 8,
  "chunks": [
    {"index": 0, "cid": "QmChunk0...", "hash": "0x..."},
    {"index": 1, "cid": "QmChunk1...", "hash": "0x..."}
  ],
  "thumbnail": {
    "cid": "QmThumb...",
    "size": 4096
  },
  "encryptionKey": "0xKEY...",
  "hashOriginal": "0xSHA3ofOriginal..."
}
```

The manifest is sent via the encrypted session channel. The encryption key in the manifest allows the recipient to decrypt all chunks.

### Storage Backends

| Backend | Use Case | Persistence | Speed |
|:--------|:---------|:-----------|:------|
| Session Swarm | Small files (<1MB), ephemeral | 14 days | Fast |
| IPFS | Medium files (1MB-100MB) | Pinned by uploader | Medium |
| Pars Storage Nodes | Large files, long-term | Incentivized pinning | Variable |

### Progressive Loading

For bandwidth-constrained users:

```go
type ProgressiveMedia struct {
    // Level 0: Blurhash placeholder (32 bytes)
    Blurhash string

    // Level 1: Encrypted thumbnail (4-16 KB)
    ThumbnailCID string

    // Level 2: Low-res version (50-200 KB)
    LowResCID string

    // Level 3: Full resolution (original)
    FullChunks []ChunkRef
}
```

Clients render each level as it becomes available, providing immediate visual feedback even on slow connections.

### Media Types and Limits

| Type | Max Size | Thumbnail | Progressive |
|:-----|:---------|:----------|:-----------|
| Image | 50 MB | Yes | Yes |
| Video | 500 MB | Yes (keyframe) | Yes |
| Audio | 100 MB | No | No |
| Document | 25 MB | First page | No |
| Archive | 100 MB | No | No |

### Expiring Media

Media can be configured to expire:

```go
type MediaExpiry struct {
    ExpiresAt    int64   // Unix timestamp
    MaxViews     uint32  // Maximum view count (0 = unlimited)
    DeleteOnRead bool    // Delete after first view
}
```

Expiry is enforced client-side. Storage nodes delete expired content during garbage collection, but enforcement is best-effort.

## Rationale

- **Client-side encryption** ensures storage backends never see plaintext media
- **IPFS integration** provides content-addressed, deduplicated, globally accessible storage
- **Progressive loading** accommodates the bandwidth constraints common in censored regions
- **Chunk-based architecture** enables parallel downloads and resume capability
- **Multiple storage backends** let users trade off between persistence, speed, and cost

## Security Considerations

- **Metadata in media files** -- EXIF data, GPS coordinates, and device identifiers MUST be stripped before encryption; the client SHOULD strip metadata by default
- **Storage node analysis** -- encrypted chunks reveal file sizes and access patterns; padding to fixed chunk sizes mitigates size analysis
- **Thumbnail leakage** -- thumbnails are encrypted with the same key but are smaller and could be brute-forced more easily; thumbnails SHOULD use a separate key derivation
- **Link sharing** -- sharing a media manifest outside the session layer bypasses encryption; manifests MUST only be transmitted via encrypted sessions
- **Persistence guarantees** -- IPFS content may be garbage collected if not pinned; critical media SHOULD use Pars Storage Nodes with incentivized pinning

## References

- [IPFS Specification](https://specs.ipfs.tech/)
- [PIP-0005: Session Protocol](./pip-0005-session-protocol.md)
- [PIP-0300: Encrypted Messaging Protocol](./pip-0300-encrypted-messaging-protocol.md)
- [PIP-0306: Message Relay Incentive](./pip-0306-message-relay-incentive.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
