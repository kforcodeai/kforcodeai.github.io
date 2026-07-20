import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { AUTHOR, PAPERS, SITE_DESCRIPTION } from '../consts';

export const GET: APIRoute = async () => {
	const posts = (await getCollection('blog')).sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
	);

	const postLines = posts
		.map(
			(p) =>
				`- [${p.data.title}](${AUTHOR.site}/blog/${p.id}/): ${p.data.description}`,
		)
		.join('\n');

	const paperLines = PAPERS.map(
		(p) => `- [${p.title}](${p.url}) — ${p.venue}, ${p.year}: ${p.abstract}`,
	).join('\n');

	const body = `# ${AUTHOR.name}

> ${SITE_DESCRIPTION}

${AUTHOR.name} (${AUTHOR.handle}) is a ${AUTHOR.role} who builds the system layer behind production AI — agent runtimes, harnesses, evals, and MCP developer platforms. Published at EMNLP 2024 and Elsevier ASOC.

## Links
- Site: ${AUTHOR.site}
- Writing: ${AUTHOR.site}/blog
- Papers: ${AUTHOR.site}/research
- About: ${AUTHOR.site}/about
- GitHub: ${AUTHOR.github}
- LinkedIn: ${AUTHOR.linkedin}
- Email: ${AUTHOR.email}

## Writing
${postLines}

## Selected Zania AI work
- Enterprise compliance agents: Built autonomous agents and document Q&A systems for SOC 2, NIST, third-party risk assessments, and security questionnaire automation.
- Evidence retrieval: Improved F1@10 from 86% to 97%, directly preventing churn of Zania's largest enterprise client.
- LLM orchestration: Designed asynchronous, high-concurrency job processing with Azure Service Bus, Redis, global rate limiting, and Azure API Management.
- Cybersecurity documentation: Built a multi-agent system for Netflix that reduced delivery SLA from days to hours.

## Selected Intellect AI work
- Underwriting CoPilot: Commercialized a multi-agent RAG system for contextual document understanding and dynamic risk summaries.
- Document ingestion: Built layout-aware chunking and ingestion microservices processing 6M+ PDFs while reducing AWS Textract costs by 70%.
- Domain adaptation: Fine-tuned 7B-parameter LLMs and improved zero-shot generalization F1 on unseen document types from 73% to 79%.
- Knowledge graphs: Built meeting-transcript NLP, Neo4j graph population, natural-language-to-Cypher analytics, and GraphRAG fraud detection over title chains and claims.
- Query routing: Routed Boolean, full-text, vector, and LLM requests to the appropriate engine to avoid unnecessary premium-model and vector-database calls.
- Intelligent document processing: Replaced 23+ legacy ML pipelines with one layout-aware extraction model, enabled 4× sales growth and six new enterprise clients, and reduced HITL annotation and retraining cycles by 60%.
- OCR routing: Built modular, document-aware pipelines that selected the most suitable OCR backend.

## Selected First American / Eagle Labs work
- Customized OCR Pipeline: Built scanned-PDF text detection and recognition with 2% CER on VINs; benchmarked Tesseract, PaddleOCR, and AWS Textract; received GEM of the Year.
- Financial Document Understanding Platform: Classified 2M+ financial and legal documents across 1,400+ categories using layout analysis, BERT, and LayoutLM; reduced document-processing SLA by 70% and escrow staffing and service costs by 34%.
- Exploring Variations in Large Document Corpus: Evaluated embeddings and clustering approaches to discover distinct document-layout families at corpus scale.
- E-Signing & Notarization: Built signature and notary detection, extraction, and state-law verification; raised precision from 64% to 87% and reduced verification SLA by 70%.
- Property Risk Profiling: Built geospatial ETL, regression, GIS visualization, and claims integrations; improved model performance from 73% to 81% and reduced title-insurance claims by 19%.
- Data Security Inspector: Built configurable, profile-aware NPI and PII detection and redaction workflows.
- Customer Segmentation: Built clustering, outlier detection, visualization, and natural-language insight generation over First American transaction data.

## Peer-reviewed publications
${paperLines}
`;

	return new Response(body, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
