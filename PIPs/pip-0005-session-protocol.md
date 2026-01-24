---
pip: 5
title: Session Protocol - Private Permissionless Communications
tags: [session, messaging, protocol, privacy]
description: Defines the session daemon protocol for private, permissionless communications
author: Pars Network Team (@pars-network)
status: Draft
type: Standards Track
category: Sessions
created: 2026-01-23
discussions-to: https://github.com/pars-network/pips/discussions/6
order: 5
tier: core
---

## Abstract

This PIP defines the Pars Session Protocol - a native L1 daemon providing private, permissionless communications. Inspired by Session (getsession.org), the Pars session layer provides:

- No phone number or email required
- No metadata collection
- Mandatory post-quantum encryption
- Onion routing for sender/receiver unlinkability
- Decentralized infrastructure (no servers to seize)

## Motivation

### Why a Native Session Layer?

The EVM provides programmable money. But diaspora coordination needs more than financial transactions:

- **Private messaging**: Plan, coordinate, discuss
- **Group communications**: Organize communities
- **File sharing**: Distribute documents, media
- **Voice/video**: Real-time communication (future)

These cannot be built on transparent EVM:
- Every transaction is public
- Metadata reveals who interacts
- No privacy by default

The session layer provides what EVM cannot: **communication without surveillance**.

### Session vs Signal vs Telegram

| Feature | Signal | Telegram | Session | Pars Session |
|:--------|:-------|:---------|:--------|:-------------|
| Phone number required | Yes | Yes | No | **No** |
| Central servers | Yes | Yes | No | **No** |
| E2E encryption | Yes | Optional | Yes | **Mandatory** |
| Post-quantum | No | No | No | **Yes** |
| Metadata protection | Partial | No | Yes | **Yes** |
| Offline operation | No | No | Partial | **Full** |
| Coercion resistance | No | No | Partial | **Full** |

## Specification

### Protocol Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           SESSION PROTOCOL STACK                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  APPLICATION LAYER                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Direct Messages • Group Chats • File Sharing • Voice (future)                │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│  SESSION LAYER                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Session Manager • Key Ratcheting • Message Queuing • Sync                    │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│  ENCRYPTION LAYER                                                                   │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  ML-KEM Key Exchange • ML-DSA Signatures • Double Ratchet • PFS              │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│  ROUTING LAYER                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Onion Routing • Path Selection • Guard Nodes • Exit Handling                 │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                               │
│  NETWORK LAYER                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  DHT Discovery • Gossip Protocol • Service Nodes • Swarm                      │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Identity

#### Session ID

Users identified by cryptographic Session ID:

```go
// Session identity
type SessionID struct {
    // Post-quantum keys
    MLKEM  *MLKEMPublicKey  // For encryption
    MLDSA  *MLDSAPublicKey  // For signatures

    // Classical keys (hybrid mode)
    X25519 *X25519PublicKey
    Ed25519 *Ed25519PublicKey

    // Derived identifier
    ID     [32]byte  // SHA3-256(MLDSA.PublicKey)
}

// Generate new identity
func GenerateSessionID() (*SessionID, *SessionPrivateKey, error) {
    // Generate PQ keys
    mlkemPub, mlkemPriv, _ := mlkem.GenerateKey(mlkem.Level5)
    mldsaPub, mldsaPriv, _ := mldsa.GenerateKey(mldsa.Mode5)

    // Generate classical keys
    x25519Pub, x25519Priv := x25519.GenerateKey()
    ed25519Pub, ed25519Priv := ed25519.GenerateKey()

    // Derive ID
    id := sha3.Sum256(mldsaPub)

    return &SessionID{
        MLKEM:   mlkemPub,
        MLDSA:   mldsaPub,
        X25519:  x25519Pub,
        Ed25519: ed25519Pub,
        ID:      id,
    }, &SessionPrivateKey{
        MLKEM:   mlkemPriv,
        MLDSA:   mldsaPriv,
        X25519:  x25519Priv,
        Ed25519: ed25519Priv,
    }, nil
}
```

#### Display Format

Session IDs displayed as human-readable strings:

```
05a1b2c3d4e5f6...  (66 hex characters)
```

Can be shared via:
- QR code
- Copy/paste
- NFC tap
- Link (pars://session/05a1b2...)

### Session Establishment

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           SESSION ESTABLISHMENT                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Alice                               Network                             Bob        │
│    │                                    │                                  │         │
│    │  1. Alice knows Bob's Session ID   │                                  │         │
│    │                                    │                                  │         │
│    │  2. Generate ephemeral keys        │                                  │         │
│    │     (ML-KEM + X25519)             │                                  │         │
│    │                                    │                                  │         │
│    │  3. Create session request         │                                  │         │
│    │     Encrypt(Bob.PK, request)      │                                  │         │
│    │                                    │                                  │         │
│    │  4. Route through onion network    │                                  │         │
│    │ ─────────────────────────────────► │ ─────────────────────────────► │         │
│    │                                    │                                  │         │
│    │                                    │  5. Bob decrypts request        │         │
│    │                                    │     Verifies Alice's signature  │         │
│    │                                    │                                  │         │
│    │                                    │  6. Bob generates ephemeral     │         │
│    │                                    │     Creates session response    │         │
│    │                                    │                                  │         │
│    │  7. Alice receives response        │                                  │         │
│    │ ◄───────────────────────────────── │ ◄───────────────────────────── │         │
│    │                                    │                                  │         │
│    │  8. Both derive shared secrets     │                                  │         │
│    │     Initialize double ratchet     │                                  │         │
│    │                                    │                                  │         │
│    │  SESSION ESTABLISHED               │               SESSION ESTABLISHED│         │
│    │  (PQ-secure, forward secret)      │                                  │         │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Message Format

```go
// Session message structure
type SessionMessage struct {
    // Header (encrypted with session key)
    Header MessageHeader

    // Body (encrypted with message key)
    Body []byte

    // Signature (over encrypted header + body)
    Signature []byte
}

type MessageHeader struct {
    // Message identification
    MessageID [16]byte  // Random unique ID
    Timestamp int64     // Unix timestamp (coarse for privacy)
    Sequence  uint64    // Sequence number in session

    // Ratchet state
    RatchetPK []byte    // Current ratchet public key
    Counter   uint32    // Message counter in ratchet epoch

    // Metadata
    ContentType ContentType  // Text, file, etc.
    Flags       uint32       // Read receipt, etc.
}
```

### Double Ratchet with PQ Keys

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           PQ DOUBLE RATCHET                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  HYBRID KEY DERIVATION:                                                             │
│                                                                                      │
│  Classical:  X25519(ephemeral_a, ephemeral_b) → ss_classical                       │
│  PQ:         ML-KEM.Decap(ct, sk) → ss_pq                                          │
│  Combined:   HKDF(ss_classical || ss_pq, "pars-ratchet-v1") → shared_secret        │
│                                                                                      │
│  RATCHET OPERATION:                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  Root Key ────────┬─────────────────┬─────────────────┬──────────────►        │  │
│  │                   │                 │                 │                        │  │
│  │                   ▼                 ▼                 ▼                        │  │
│  │              Chain Key_0       Chain Key_1       Chain Key_2                   │  │
│  │                   │                 │                 │                        │  │
│  │         ┌────────┼────────┐  ┌─────┼─────┐    ┌─────┼─────┐                   │  │
│  │         ▼        ▼        ▼  ▼     ▼     ▼    ▼     ▼     ▼                   │  │
│  │       MK_0    MK_1    MK_2  MK_0  MK_1  MK_2  MK_0  MK_1  MK_2               │  │
│  │                                                                                │  │
│  │  Each DH ratchet step generates new chain key                                 │  │
│  │  Each message derives unique message key (MK)                                 │  │
│  │  Keys deleted after use → forward secrecy                                     │  │
│  │                                                                                │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Onion Routing

Messages routed through multiple hops:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           ONION ROUTING                                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  SENDER → HOP 1 → HOP 2 → HOP 3 → RECIPIENT                                        │
│                                                                                      │
│  Message structure (onion layers):                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Layer 3 (outermost): Encrypted with Hop1 key                                 │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  Layer 2: Encrypted with Hop2 key                                       │  │  │
│  │  │  ┌───────────────────────────────────────────────────────────────────┐  │  │  │
│  │  │  │  Layer 1: Encrypted with Hop3 key                                 │  │  │  │
│  │  │  │  ┌─────────────────────────────────────────────────────────────┐  │  │  │  │
│  │  │  │  │  Core: Encrypted with Recipient key                         │  │  │  │  │
│  │  │  │  │  ┌───────────────────────────────────────────────────────┐  │  │  │  │  │
│  │  │  │  │  │  Actual message content                               │  │  │  │  │  │
│  │  │  │  │  └───────────────────────────────────────────────────────┘  │  │  │  │  │
│  │  │  │  └─────────────────────────────────────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  Each hop:                                                                          │
│  1. Decrypts their layer                                                            │
│  2. Learns only next hop address                                                    │
│  3. Cannot see sender, recipient, or content                                        │
│  4. Cannot correlate request/response                                               │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Service Nodes (Swarm)

Service nodes store/forward messages for offline recipients:

```go
// Service node swarm
type Swarm struct {
    nodes    []*ServiceNode
    dht      *DHT
    storage  *MessageStore
}

// Store message for offline recipient
func (s *Swarm) StoreMessage(recipientID SessionID, msg *EncryptedMessage) error {
    // Find swarm responsible for recipient
    swarmNodes := s.dht.FindSwarm(recipientID)

    // Store on multiple nodes for redundancy
    stored := 0
    for _, node := range swarmNodes {
        if err := node.Store(recipientID, msg); err == nil {
            stored++
        }
        if stored >= RequiredCopies {
            break
        }
    }

    if stored < MinCopies {
        return ErrInsufficientStorage
    }
    return nil
}

// Retrieve messages when recipient comes online
func (s *Swarm) RetrieveMessages(recipientID SessionID, since time.Time) ([]*EncryptedMessage, error) {
    swarmNodes := s.dht.FindSwarm(recipientID)

    var messages []*EncryptedMessage
    for _, node := range swarmNodes {
        msgs, err := node.Retrieve(recipientID, since)
        if err == nil {
            messages = append(messages, msgs...)
        }
    }

    // Deduplicate by message ID
    return deduplicate(messages), nil
}
```

### Group Sessions

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           GROUP SESSION                                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  GROUP KEY MANAGEMENT:                                                              │
│                                                                                      │
│  Admin creates group:                                                               │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  1. Generate group keypair (ML-KEM + X25519)                                   │  │
│  │  2. Create member list (encrypted)                                             │  │
│  │  3. Distribute group key to initial members via pairwise session              │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  Adding member:                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  1. Admin sends group key to new member via pairwise session                  │  │
│  │  2. Admin sends "member added" message to group                               │  │
│  │  3. Group key rotated for forward secrecy                                     │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  Removing member:                                                                   │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  1. Admin sends "member removed" message                                       │  │
│  │  2. New group key generated                                                    │  │
│  │  3. New key distributed to remaining members                                  │  │
│  │  4. Removed member cannot decrypt future messages                             │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  MESSAGE FLOW:                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Sender → Encrypt(group_key, message) → Swarm → Members retrieve              │  │
│  │                                                                                │  │
│  │  Single encryption, multiple recipients                                        │  │
│  │  Members poll swarm or receive push notification                              │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### File Sharing

```go
// File transfer via session
type FileTransfer struct {
    FileID      [32]byte  // SHA3-256 of encrypted file
    FileName    string    // Encrypted filename
    MimeType    string    // Content type
    Size        uint64    // Total size
    ChunkCount  uint32    // Number of chunks
    Key         []byte    // Symmetric key for file
}

// Send large file
func (s *Session) SendFile(path string) error {
    // 1. Read and encrypt file
    key := randomKey()
    encryptedData := encrypt(key, readFile(path))

    // 2. Split into chunks
    chunks := splitChunks(encryptedData, ChunkSize)

    // 3. Upload chunks to swarm
    for i, chunk := range chunks {
        s.swarm.StoreChunk(fileID, i, chunk)
    }

    // 4. Send file metadata via session
    return s.SendMessage(&FileTransfer{
        FileID:     hash(encryptedData),
        FileName:   encrypt(s.sessionKey, filepath.Base(path)),
        Size:       uint64(len(encryptedData)),
        ChunkCount: uint32(len(chunks)),
        Key:        key,
    })
}
```

### Daemon Interface

```go
// Session daemon RPC interface
type SessionDaemon interface {
    // Identity
    CreateIdentity() (*SessionID, error)
    GetIdentity() (*SessionID, error)

    // Sessions
    CreateSession(recipient SessionID) (*Session, error)
    GetSessions() ([]*Session, error)
    CloseSession(sessionID [32]byte) error

    // Messages
    SendMessage(sessionID [32]byte, content []byte) error
    GetMessages(sessionID [32]byte, since time.Time) ([]*Message, error)
    MarkRead(sessionID [32]byte, messageID [16]byte) error

    // Groups
    CreateGroup(name string, members []SessionID) (*Group, error)
    JoinGroup(groupID [32]byte, invite []byte) error
    LeaveGroup(groupID [32]byte) error

    // Files
    SendFile(sessionID [32]byte, path string) error
    ReceiveFile(fileID [32]byte, path string) error

    // Status
    GetStatus() (*DaemonStatus, error)
    GetPeers() ([]*PeerInfo, error)
}
```

### Integration with EVM

The session layer can trigger EVM actions:

```solidity
// Session-triggered contract execution
contract SessionTrigger {
    // Validate session signature and execute
    function executeFromSession(
        bytes memory sessionMessage,
        bytes memory mldsaSignature,
        bytes memory mldsaPublicKey
    ) external {
        // Verify PQ signature via precompile
        require(
            IMLDSA(PQ_PRECOMPILE).verify(mldsaPublicKey, sessionMessage, mldsaSignature),
            "Invalid session signature"
        );

        // Decode and execute action
        Action memory action = abi.decode(sessionMessage, (Action));
        _execute(action);
    }
}
```

## Security Considerations

### Metadata Protection

| Metadata | Protection |
|:---------|:-----------|
| **Who sent** | Onion routing hides sender |
| **Who received** | Swarm storage hides recipient |
| **When sent** | Timestamp coarsened |
| **Message size** | Padding to fixed sizes |
| **Communication pattern** | Cover traffic |

### Key Compromise

| Compromise | Impact | Mitigation |
|:-----------|:-------|:-----------|
| **Message key** | One message | Forward secrecy |
| **Session key** | One session | Ratcheting |
| **Identity key** | Identity compromise | Revocation, re-keying |

### Network Attacks

| Attack | Mitigation |
|:-------|:-----------|
| **Traffic analysis** | Onion routing, cover traffic |
| **Sybil on DHT** | Proof-of-stake, reputation |
| **Eclipse** | Diverse peer selection |
| **DoS** | Rate limiting, proof-of-work |

## Implementation

### Running the Daemon

```bash
# Start session daemon
sessiond --datadir ~/.pars/session \
         --network mainnet \
         --listen /ip4/0.0.0.0/tcp/9000

# Generate identity
parsctl session identity create

# Start a session
parsctl session create --recipient 05a1b2c3d4e5f6...

# Send message
parsctl session send --session <id> --message "Hello, world"
```

### Client Libraries

```typescript
// TypeScript client
import { ParsSession } from '@pars/session';

const session = new ParsSession({
  dataDir: '~/.pars/session',
  network: 'mainnet'
});

// Create or load identity
const identity = await session.getOrCreateIdentity();

// Start session with contact
const chat = await session.createSession(recipientID);

// Send message
await chat.sendMessage('Hello from Pars!');

// Receive messages
chat.onMessage((msg) => {
  console.log(`${msg.sender}: ${msg.content}`);
});
```

## References

- [PIP-0000: Network Architecture](./pip-0000-network-architecture.md)
- [PIP-0002: Post-Quantum Encryption](./pip-0002-post-quantum.md)
- [PIP-0003: Coercion Resistance](./pip-0003-coercion-resistance.md)
- [Signal Protocol](https://signal.org/docs/)
- [Session Protocol](https://getsession.org/whitepaper)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
