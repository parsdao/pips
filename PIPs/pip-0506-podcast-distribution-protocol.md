---
pip: 506
title: "Podcast Distribution Protocol"
description: "Decentralized podcast hosting and distribution with censorship-resistant audio delivery"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: Content
created: 2026-01-23
tags: [content, podcast, audio, distribution, censorship-resistance]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a decentralized podcast distribution protocol for the Pars Network. Podcasters publish episodes to the mesh DAG where they are replicated and served without centralized hosting. The protocol supports RSS-compatible feeds for integration with existing podcast apps, progressive audio streaming over the mesh network, and creator monetization (PIP-0502) through ASHA micropayments. Episode provenance (PIP-0011) ensures authenticity.

## Motivation

### Persian Podcasting Under Threat

Persian-language podcasts are among the most important independent media for the diaspora:
- Radio Farda, BBC Persian, and independent podcasters reach millions
- Centralized platforms (Apple Podcasts, Spotify) can be pressured to remove content
- Hosting providers can terminate accounts under sanctions pressure
- RSS feeds hosted on centralized servers can be blocked by DNS or IP filtering

### Unstoppable Audio Distribution

A podcast published to the Pars mesh cannot be removed. Episodes are content-addressed and replicated across nodes worldwide. Even if every centralized platform delists a podcast, it remains available through the mesh network.

## Specification

### Podcast Feed

```go
type PodcastFeed struct {
    FeedID       [32]byte
    Title        string        // Podcast title (Farsi/English)
    Description  string
    Author       [32]byte      // Anonymous host commitment
    Language     string        // ISO 639-1
    Category     []string      // Podcast categories
    CoverArt     [32]byte      // Mesh hash of cover image
    Episodes     []Episode
    Monetization MonetizationConfig
    CreatedAt    uint64
    UpdatedAt    uint64
    Signature    []byte
}

type Episode struct {
    EpisodeID    [32]byte
    Title        string
    Description  string
    AudioHash    [32]byte      // Mesh hash of audio file
    Duration     uint32        // Seconds
    FileSize     uint64        // Bytes
    Format       string        // "audio/mp3", "audio/opus", "audio/flac"
    Chapters     []Chapter     // Episode chapters
    Transcript   [32]byte      // Optional: mesh hash of transcript
    ProvenanceID [32]byte      // PIP-0011 content provenance
    PublishedAt  uint64
    SealID       [32]byte      // PIP-0010 data integrity seal
}

type Chapter struct {
    Title     string
    StartTime uint32   // Seconds from start
    EndTime   uint32
    ImageHash [32]byte // Optional chapter art
}
```

### Audio Streaming

Progressive audio streaming over the mesh:

```go
type AudioStream struct {
    EpisodeID   [32]byte
    Chunks      []AudioChunk
    TotalChunks uint32
    Bitrate     uint32     // Bits per second
    Codec       string     // "opus", "mp3", "aac"
}

type AudioChunk struct {
    Index       uint32
    ChunkHash   [32]byte
    StartTime   float64    // Seconds
    EndTime     float64
    Size        uint32     // Bytes
}
```

Audio is chunked into 10-second segments:
1. Client requests first chunk from nearest mesh node
2. Playback begins immediately (progressive streaming)
3. Subsequent chunks are prefetched from multiple nodes
4. Adaptive bitrate: quality adjusts based on mesh throughput
5. Offline caching: downloaded chunks persist for offline replay

### RSS Bridge

For compatibility with existing podcast apps:

```go
type RSSBridge struct {
    FeedID    [32]byte
    RSSEndpoint string       // Gateway URL that serves RSS XML
    Enclosures  []RSSEnclosure
}

// GenerateRSS creates an RSS 2.0 feed from a PodcastFeed
func GenerateRSS(feed *PodcastFeed, gatewayURL string) ([]byte, error) {
    // Generate standard RSS 2.0 XML
    // Audio enclosure URLs point to mesh gateway for streaming
    // Compatible with Apple Podcasts, Spotify, etc.
    // ...
}
```

### On-Chain Feed Registry

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

interface IPodcastDistribution {
    function registerFeed(
        bytes32 feedHash,
        string calldata metadata
    ) external returns (bytes32 feedId);

    function publishEpisode(
        bytes32 feedId,
        bytes32 audioHash,
        string calldata metadata,
        bytes32 sealId
    ) external returns (bytes32 episodeId);

    function subscribeToPodcast(
        bytes32 feedId
    ) external payable returns (bytes32 subscriptionId);

    function tipEpisode(
        bytes32 episodeId
    ) external payable;

    event FeedRegistered(bytes32 indexed feedId);
    event EpisodePublished(bytes32 indexed feedId, bytes32 indexed episodeId);
    event SubscriptionCreated(bytes32 indexed feedId, bytes32 indexed subscriber);
}
```

### Monetization

Podcasters monetize through PIP-0502:
- Per-episode tips
- Subscriber-only bonus content
- Micropayment streaming (pay per minute listened)
- Patronage tiers with exclusive feed access

## Rationale

### Why Chunked Audio?

Chunked audio enables progressive streaming over the mesh network, where individual node connections may be slow or intermittent. Fetching chunks from multiple nodes in parallel provides faster streaming than single-source download.

### Why RSS Compatibility?

RSS is the universal podcast standard. Providing RSS bridge feeds ensures Pars podcasts are available in every existing podcast app while the mesh provides censorship resistance.

### Why Audio Provenance?

In an era of AI-generated audio deepfakes, provenance (PIP-0011) proves that an episode was actually recorded by the claimed host, not synthesized by an adversary.

## Security Considerations

- **Audio deepfakes**: Episode provenance with PIP-0011 seals; AI detection (PIP-0405) for suspicious content
- **Feed hijacking**: Feeds are signed with ML-DSA; only the creator's key can publish episodes
- **Bandwidth abuse**: Streaming requires minimal veASHA stake to prevent DDoS via excessive streaming
- **Content takedown**: By design, content on the mesh cannot be removed; RSS bridge gateways can be rotated if blocked

## References

- [PIP-0001: Mesh Network](./pip-0001-mesh-network.md)
- [PIP-0011: Content Provenance](./pip-0011-content-provenance.md)
- [PIP-0500: Decentralized Publishing Platform](./pip-0500-decentralized-publishing-platform.md)
- [PIP-0502: Creator Monetization Protocol](./pip-0502-creator-monetization-protocol.md)
- [RSS 2.0 Specification](https://www.rssboard.org/rss-specification)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
