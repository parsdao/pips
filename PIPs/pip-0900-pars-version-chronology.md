---
pip: 900
title: Pars Version Chronology --- 1.0 / 2.0
description: Canonical version timeline for the Pars Network from the 2025 dual-layer messaging substrate through the GPU-native sovereign L1 activation on 2026-02-14.
author: Zach Kelling
status: Final
type: Informational
category: Meta
created: 2026-02-14
tags: [chronology, version-history, meta, gpu-native, sovereign-l1, trifecta]
---

## Abstract

This PIP is the canonical chronology of the Pars Network: the two
locked version milestones, their activation dates, the consensus and
execution stack at each step, and what the trifecta (DEX + EVM + FHE)
came to mean for Pars on 2026-02-14. It exists so that any future
contributor can answer the question "what was Pars at version N?"
with one authoritative source.

## Motivation

Pars 1.0 was a private-messaging substrate; Pars 2.0 is a sovereign L1.
The version transition is large enough that downstream integrators
need a single document explaining the evolution and the strict
additivity guarantees.

## Chronology Table

| Version | Active from | Theme | Defining changes | Reference paper |
|---|---|---|---|---|
| 1.0 | 2025 | Dual-layer messaging substrate | EVM-compatible Layer 2 rollup posting state roots to Lux for security inheritance; Session daemon layer for end-to-end encrypted messaging with forward secrecy and deniability; mesh transport over LoRa/Bluetooth/IP; federated-learning fabric for Persian-language model training; ML-DSA-87 / ML-KEM-1024 / SPHINCS+ post-quantum migration plan. 2,400 TPS, 1.2-s confirmation. | `pars-whitepaper` (1.0), `pars-dual-layer`, `pars-session-protocol` |
| 2.0 | 2026-02-14 | GPU-native sovereign L1 with DEX+EVM+FHE trifecta | Graduation from rollup to sovereign L1 on the Lux-family primary chain template (LP-134); Quasar 4.0 consensus; QuasarSTM 4.0 execution; GPU-Residency invariant (LP-137); native PARSWAP DEX over Lux LXBook/LXPool; FHE substrate at 0x0700 with CKKS/TFHE hybrid; Pars-specific precompiles 0x0c01--0x0c03 (calendar, PNS, Persian-NLP); Liquidity Protocol onboarding wave 2026-04-20. | `pars-2-0-launch` |

## 2.0 Trifecta

A Lux-family L1 is trifecta-complete when it carries three first-class
subsystems. Pars 2.0 specialises each one for the diaspora use case:

1. **DEX --- PARSWAP.** A constant-function AMM over the canonical
   Lux LXBook/LXPool primitives, with pools tuned for IRT-pegged
   stablecoin flows, tokenised real-asset baskets, and PARS pairs.
   Cross-listed with Lux D-Chain, Hanzo HMM, and Zoo DEX via
   Liquidity Protocol (LP-310). Genesis pools registered at
   `h_0 + 12`; cross-chain settlement live from the 2026-04-20
   Liquidity Protocol wave.
2. **EVM --- Cancun-equivalent + Pars precompiles.** Reuses the
   canonical Lux precompile ranges (0x0600--0x07FF, 0x2000--0x23FF)
   and adds three diaspora-specific precompiles at 0x0c01--0x0c03:
   `CALENDAR_CONVERT` (Jalali ↔ Gregorian), `PNS_RESOLVE` (Pars
   Name Service), `PERSIAN_NLP_TOKENIZE`. All GPU-resident.
3. **FHE --- Confidential transactions and private voting.** CKKS /
   TFHE hybrid substrate at 0x0700. Three application patterns: (i)
   confidential transfers (amount-hiding); (ii) TFHE-encrypted ballots
   tallied homomorphically (PIP-0104); (iii) encrypted federated-learning
   gradient aggregation, removing the honest-aggregator assumption from
   1.0.

## Strict Additivity

Pars 2.0 is **strictly additive**. Every 1.0 primitive remains
operational with identical on-wire formats:

- Session protocol (PIP-0005)
- Mesh transport (PIP-0001)
- Persian-NLP precompile (PIP-0008)
- Federated-learning fabric (PIP-0014)
- Post-quantum suite (PIP-0007)

Every Pars DID issued under PIP-0006 verifies unchanged against the
2.0 PDS resolver. Every account from 1.0 has identical balance, nonce,
deployed code, and storage trie root in 2.0 (see `pars-2-0-launch`
Algorithm 1).

## Tokenomics Continuity

PARS supply ($10^9$, fixed) and ASHA reserve / VeASHA staking
mechanics from 1.0 are preserved unchanged. Two extensions, both
funded from the previously-allocated ecosystem-incentives bucket:

- DEX fee routing: 0.30% (50/30/15/5 split, mirroring the canonical
  Lux-family routing).
- FHE relay rewards: capped at 0.5% annualised, paid to validators
  performing FHE bootstrapping.

No new emission.

## Activation Receipts (2.0)

- Activation block: `h_0 = 14,000,000` on Pars main DAG.
- Activation timestamp: 2026-02-14T00:00:00Z.
- C-Chain ID: 7070 (mainnet), 7071 (testnet).
- FHE threshold key DKG: `t = 67`, `n = 100` (at `h_0 + 24`).
- PARSWAP genesis pools: 7 stable, 4 weighted, 9 concentrated
  (at `h_0 + 12`).
- First confidential transfer: `h_0 + 91`.
- First private vote tally: `h_0 + 720`.

## References

- PIP-0001 Mesh networking
- PIP-0002 Post-quantum
- PIP-0005 Session protocol
- PIP-0006 DID standard
- PIP-0007 Pars architecture
- PIP-0008 Pars economics
- PIP-0104 Private voting protocol
- PIP-0014 State channel framework / federated learning
- LP-009 GPU-Native EVM
- LP-010 v4 QuasarSTM 4.0
- LP-013 v2 F-Chain FHE Service
- LP-105 Quasar 3.0 Consensus
- LP-134 Canonical 9-Chain Topology and Primary Chain Templates
- LP-137 GPU-Residency Invariant for Lux-Family L1s
- LP-310 Liquidity Protocol Common Settlement API
- `pars-whitepaper` (1.0 flagship)
- `pars-2-0-launch` (2.0 launch retrospective)
- `pars-fhe-privacy`, `pars-tokenomics-staking`, `pars-asha-reserve`,
  `pars-veasha-tokenomics` (papers repo)

## Status

**Final** --- as of 2026-02-14, this chronology is locked.
