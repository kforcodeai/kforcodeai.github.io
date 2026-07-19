---
title: 'One model instead of 23: consolidating a Document AI stack'
description: 'A model per document type does not scale. Here is how a single layout-aware extraction architecture replaced 23+ document-specific models, cut OCR spend 70%, and made new document types cheap to add.'
pubDate: '2026-07-07'
heroImage: '../../assets/blog-placeholder-3.jpg'
tags: ['document-ai', 'ocr', 'ml-systems', 'cost', 'architecture']
---

Document AI teams tend to grow the same way: a customer needs invoices extracted, so you train an invoice model. Then loss runs, so you train a loss-run model. Then policies, ACORD forms, endorsements — and one day you're maintaining 23 document-specific models and services, each with its own training pipeline, its own drift, its own on-call surprise. Every new document type is a new project. That doesn't scale, and at Intellect it's the trap I set out to dismantle.

## The problem with a-model-per-document

The per-document approach feels productive early — each model is simple and accurate on its niche. The cost is hidden and compounding:

- **Maintenance is linear in document types.** 23 models is 23 things that can break.
- **No transfer.** Everything the invoice model learned about "find the total near the bottom right" is unavailable to the receipt model.
- **Onboarding is slow.** A new enterprise client with a new form meant a new training cycle before you could sell to them.

## The consolidation: layout-aware extraction

The insight is that most business documents share the same underlying signal — **text plus its position on the page**. A total isn't identified by the word "total"; it's identified by where it sits, what it's near, and how the layout is structured. Encode that directly and you stop needing a model per format.

The single architecture used:

- **OCR tokens with bounding boxes** as input — every token carries its 2D position, so the model reads layout, not just a flattened string.
- **Schema-aware decoding** — the model extracts *into* a target schema rather than emitting free text, so adding a new document type means describing its schema, not training a new network.
- **Task-specific losses** — tuned for the extraction objective rather than generic language modeling.

Adding a document type went from "train and deploy a new model" to "define a schema and add examples." That's the whole game: making the marginal cost of the 24th document type close to zero.

## Cutting OCR spend 70%

OCR itself was the other cost center. Scaling layout-based chunking and OCR microservices across 6M+ PDFs — and being deliberate about *when* to pay for premium OCR versus a cheaper path — cut AWS Textract spend by 70% while handling more volume. Cost engineering in ML systems is rarely about the model; it's about the expensive service the model depends on.

## Making it robust with less data

Consolidation only holds if the single model generalizes. Zero-shot extraction F1 went from 73% to 79%, and retraining iterations dropped 60%, through:

- **Instruction tuning** so the model follows extraction directions for unseen schemas.
- **PEFT / LoRA adapters** to specialize cheaply without full fine-tunes.
- **Synthetic document generation** to cover formats we didn't yet have real data for.
- **Schema-constrained decoding** so outputs are always valid against the target structure.

## The lesson

Twenty-three models wasn't a modeling problem; it was an architecture problem wearing a modeling costume. The fix wasn't a better invoice model — it was refusing to think per-document and instead building one system around the signal all documents share. The payoff shows up everywhere afterward: less to maintain, faster onboarding, lower spend, and a stack that gets *cheaper* to extend over time instead of more expensive.

*I'm [Kaushal Prajapati](/about), a Staff AI/ML Engineer. I write about ML systems and applied AI — [more posts](/blog), or say hi on [LinkedIn](https://www.linkedin.com/in/kforcode/).*
