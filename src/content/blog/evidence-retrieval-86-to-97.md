---
title: 'From 86% to 97%: engineering evidence retrieval for compliance agents'
description: 'Compliance answers are only trustworthy if every claim cites the right evidence. Here is how hybrid retrieval, reranking, control-aware chunking, and citation-span ranking took evidence F1@10 from 86% to 97%.'
pubDate: '2026-07-14'
heroImage: '../../assets/blog-placeholder-2.jpg'
tags: ['rag', 'retrieval', 'evals', 'compliance', 'llm']
---

In a consumer chatbot, a wrong answer is annoying. In a compliance agent answering "does this vendor meet SOC 2 CC6.1?", a wrong answer — or a right answer citing the wrong evidence — is a liability. Auditors don't trust conclusions; they trust conclusions backed by the exact span of the exact document that supports them.

While building Auto Compliance Agents at Zania — covering SOC 2, NIST, HIPAA, and third-party risk assessment — the metric that mattered wasn't answer quality in the abstract. It was **evidence F1@10**: of the evidence we surfaced for a control, how much was both relevant and complete. We moved it from 86% to 97%. Here's what actually moved the needle.

## Why compliance retrieval is hard

Compliance evidence is sparse and control-specific. The passage proving a control is met might be one clause buried in a 60-page policy PDF, phrased nothing like the control text. Generic semantic search over naive chunks fails in two directions at once: it misses the clause (low recall) and it surfaces plausible-but-irrelevant neighbors (low precision). Both wreck auditor trust.

## What worked

### Hybrid retrieval

Dense embeddings capture meaning; sparse (BM25-style) retrieval captures exact terms — control identifiers, standard-specific vocabulary, defined terms that embeddings smear together. Compliance text is full of both. Running dense and sparse in parallel and fusing the results recovered the clauses each method alone dropped.

### Control-aware chunking

The default "split every 500 tokens" destroys the structure that makes a clause meaningful. Chunking that respects document structure — sections, clauses, tables — keeps each candidate self-contained, so a retrieved chunk is actually citable on its own rather than a fragment that starts mid-sentence.

### Reranking

First-stage retrieval optimizes for recall: cast a wide net. A cross-encoder reranker then reads each candidate *against the control* and reorders for precision. This two-stage shape — cheap wide recall, expensive precise rerank — is where most of the precision gain lived.

### Citation-span ranking

Auditors don't want the chunk; they want the sentence. On top of chunk ranking, we ranked the specific spans within a chunk most likely to be the actual evidence, so the generated answer could point at a highlightable span. This is the difference between "here's a document" and "here's the sentence that proves it."

## Measuring it honestly

None of this is trustworthy without a way to measure it that survives contact with reality. We built release gates on synthetic control-evidence pairs with **hard negatives** — passages that look relevant but aren't — plus rejection sampling and a held-out audit QA set. The gates tracked faithfulness, citation accuracy, hallucination rate, and control coverage, and a change shipped only if it cleared the bar. Hard negatives are the unglamorous hero here: without them, a retriever can look great on easy examples and quietly fall apart on the confusable ones that matter most.

## The lesson

The jump from 86% to 97% wasn't one clever trick — it was refusing to treat retrieval as a solved black box. Hybrid recall, structure-aware chunks, a reranker for precision, span-level citations, and an eval harness with hard negatives each closed part of the gap. In domains where a citation is the product, retrieval *is* the product.

*I'm [Kaushal Prajapati](/about), a Staff AI/ML Engineer. More on production AI systems [here](/blog), and I'm on [LinkedIn](https://www.linkedin.com/in/kforcode/).*
