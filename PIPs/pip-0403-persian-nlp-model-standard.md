---
pip: 403
title: "Persian NLP Model Standard"
description: "Standard interface and quality requirements for Persian/Farsi language models on Pars Network"
author: "Pars Network Team (@pars-network)"
status: Draft
type: Standards Track
category: AI
created: 2026-01-23
tags: [ai, nlp, persian, farsi, language-model, standard]
discussions-to: https://github.com/parsdao/pips/discussions
---

## Abstract

This PIP defines a standard for Persian/Farsi natural language processing models deployed on the Pars Network. It specifies required interfaces, tokenizer requirements, benchmark suites, and quality thresholds that models must meet to be listed as PIP-0403 compliant on the model marketplace (PIP-0401). The standard ensures that Persian language AI on Pars is high quality, culturally aware, and interoperable across inference providers.

## Motivation

### The Persian Language Gap

Persian (Farsi) is spoken by over 110 million people, yet AI language support is severely lacking:

- Major LLMs treat Persian as an afterthought, with 2-5x higher error rates than English
- Tokenizers waste 3-4x more tokens on Persian text due to poor subword vocabulary
- Cultural context, idioms, and historical references are frequently mishandled
- Dari and Tajik dialects are almost entirely unsupported
- Right-to-left text handling remains buggy in many systems

### Standardization Need

Without standards, the marketplace would fill with low-quality models that claim Persian support but fail on basic tasks. PIP-0403 defines what "Persian NLP support" means in concrete, measurable terms.

## Specification

### Required Interfaces

Every PIP-0403 compliant model must implement:

```go
type PersianNLPModel interface {
    // Core generation
    Generate(prompt []byte, params GenerationParams) ([]byte, error)

    // Tokenization
    Tokenize(text []byte) ([]TokenID, error)
    Detokenize(tokens []TokenID) ([]byte, error)

    // Capabilities
    Capabilities() ModelCapabilities

    // Metadata
    Metadata() PersianModelMetadata
}

type ModelCapabilities struct {
    TextGeneration   bool
    TextCompletion   bool
    Translation      bool   // Farsi <-> other languages
    Summarization    bool
    SentimentAnalysis bool
    NamedEntityRecog bool
    QuestionAnswering bool
    Poetry           bool   // Classical Persian poetry understanding
}
```

### Tokenizer Requirements

PIP-0403 tokenizers must satisfy:

| Requirement | Threshold |
|:-----------|:----------|
| Persian token efficiency | <= 1.5x English for equivalent meaning |
| Unicode support | Full UTF-8 with ZWNJ handling |
| Script coverage | Persian, Arabic, Dari, Tajik (Cyrillic) |
| Subword vocabulary | >= 10,000 Persian subwords |
| Number handling | Both Persian (۰-۹) and Arabic (0-9) numerals |
| ZWNJ handling | Correct zero-width non-joiner placement |

### Benchmark Suite

Models must pass the Pars Persian Benchmark (PPB):

```go
type ParsianBenchmark struct {
    // Reading comprehension
    ReadingComp    BenchmarkResult  // ParsiQA dataset
    // Text generation quality
    GenerationQual BenchmarkResult  // Human evaluation on fluency/coherence
    // Translation accuracy
    TranslationEN  BenchmarkResult  // BLEU score on Farsi->English
    TranslationFA  BenchmarkResult  // BLEU score on English->Farsi
    // Cultural knowledge
    CulturalKnow   BenchmarkResult  // Persian history, literature, customs
    // Poetry understanding
    PoetryComp     BenchmarkResult  // Hafez, Rumi, Ferdowsi comprehension
    // Dialect handling
    DariSupport    BenchmarkResult  // Dari dialect comprehension
    TajikSupport   BenchmarkResult  // Tajik dialect comprehension
}
```

### Minimum Quality Thresholds

| Benchmark | Minimum Score | Notes |
|:----------|:-------------|:------|
| Reading comprehension | 70% accuracy | ParsiQA test set |
| Generation fluency | 3.5/5.0 | Human evaluation |
| Translation (FA->EN) | 25.0 BLEU | Standard test set |
| Translation (EN->FA) | 22.0 BLEU | Standard test set |
| Cultural knowledge | 60% accuracy | Custom Pars quiz |
| ZWNJ accuracy | 95% | Correct placement rate |

### Model Metadata

```go
type PersianModelMetadata struct {
    ModelName       string
    Version         string
    ParameterCount  uint64
    Architecture    string     // e.g., "transformer-decoder"
    TrainingData    [32]byte   // PIP-0407 provenance reference
    Dialects        []string   // Supported: "farsi", "dari", "tajik"
    ContextLength   uint32     // Maximum context window in tokens
    Quantization    string     // e.g., "fp16", "int8", "int4"
    HardwareReqs    HardwareRequirements
    BenchmarkResults ParsianBenchmark
}
```

## Rationale

### Why a Separate Standard for Persian?

Generic model standards do not address Persian-specific challenges: ZWNJ handling, ezafe construction, right-to-left rendering, classical poetry structure, and dialect variation. A dedicated standard ensures these are first-class requirements.

### Why Strict Tokenizer Requirements?

Poor tokenization is the root cause of most Persian language model failures. A Persian word that takes 1 token in English but 6 tokens in Persian degrades quality and increases cost. The 1.5x efficiency requirement forces proper vocabulary design.

### Why Include Poetry?

Persian poetry (Hafez, Rumi, Ferdowsi, Khayyam) is central to Persian culture. A model that cannot understand or discuss classical poetry fails the community it serves. Poetry comprehension also tests deep language understanding.

## Security Considerations

- **Biased models**: Benchmark suite includes bias detection for political, ethnic, and gender bias in Persian context
- **Censored models**: Models that refuse culturally or politically relevant topics are flagged as non-compliant
- **Data poisoning**: Training data provenance (PIP-0407) enables tracing of contaminated datasets
- **Model substitution**: Inference providers must serve the exact model hash listed; TEE attestation (PIP-0006) verifies this

## References

- [PIP-0400: Decentralized Inference Protocol](./pip-0400-decentralized-inference-protocol.md)
- [PIP-0401: Model Marketplace](./pip-0401-model-marketplace.md)
- [PIP-0407: Training Data Provenance](./pip-0407-training-data-provenance.md)
- [ParsiNLU Benchmark](https://github.com/persiannlp/parsinlu)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
