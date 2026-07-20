// Global site metadata + structured data. Imported anywhere via `import`.

export const SITE_TITLE = 'Kaushal Prajapati';
export const SITE_TAGLINE = 'Production AI systems, from first principles.';
export const SITE_DESCRIPTION =
	'Kaushal Prajapati writes about production AI engineering, agentic systems, software engineering, deep-learning papers, evals, retrieval, and LLM platforms.';

export const AUTHOR = {
	name: 'Kaushal Kumar Prajapati',
	handle: 'kforcode',
	role: 'Staff AI/ML Engineer',
	email: 'kaushalcse07@gmail.com',
	github: 'https://github.com/kforcodeai',
	linkedin: 'https://www.linkedin.com/in/kforcode/',
	twitter: '', // add if/when you create one, e.g. https://x.com/kforcode
	site: 'https://kforcode.dev',
};

// Comma-free keyword list used for meta keywords + structured data.
export const SITE_KEYWORDS = [
	'AI engineer',
	'ML engineer',
	'Staff AI Engineer',
	'agent runtime',
	'agent harness',
	'agentic systems',
	'MCP',
	'LLM engineering',
	'applied AI',
	'RAG',
	'evals',
	'deep learning',
	'post-training',
	'LoRA',
	'Document AI',
	'Kaushal Prajapati',
	'kforcode',
];

// Instrument readouts on the homepage. [value, unit-label, description]
export const HIGHLIGHTS: [string, string, string][] = [
	['15M+', 'conv / quarter', 'Conversations & 800B+ tokens per quarter on the AI runtime I architected at HighLevel'],
	['600+', 'operations', 'Exposed over MCP in the headless developer platform I built — mcp · sdk · cli · plugins'],
	['4.7M+', 'voice calls', 'Real-time voice conversations served at 99.9%+ success'],
	['3', 'publications', 'Peer-reviewed: EMNLP 2024 · Elsevier ASOC ×2'],
];

// Topic taxonomy — the "modules" of the system. Each maps to a tag used in posts.
// slug matches tags in post frontmatter; label + blurb power the topic map & tag pages.
export const TOPICS: { slug: string; label: string; blurb: string; net: string }[] = [
	{ slug: 'agents', label: 'Agentic Systems', blurb: 'Agent runtimes, harnesses, tool calling, memory, and orchestration.', net: 'MOD::AGENTS' },
	{ slug: 'evals', label: 'Evals & Reliability', blurb: 'Release gates, faithfulness, and the reliability engineering that keeps AI up.', net: 'MOD::EVALS' },
	{ slug: 'rag', label: 'Retrieval & RAG', blurb: 'Hybrid retrieval, reranking, and citation-grounded answers.', net: 'MOD::RAG' },
	{ slug: 'ml-systems', label: 'ML Systems', blurb: 'Model routing, serving, cost engineering, and Document AI at scale.', net: 'MOD::SYSTEMS' },
	{ slug: 'papers', label: 'Papers & Research', blurb: 'Notes on deep-learning research and my own peer-reviewed work.', net: 'MOD::PAPERS' },
];

// Peer-reviewed publications — power the /research page + ScholarlyArticle schema.
export const PAPERS: {
	title: string;
	venue: string;
	year: number;
	url: string;
	authors: string;
	abstract: string;
	tags: string[];
}[] = [
	{
		title: 'De-Identification of Sensitive Personal Data in IIT-CDIP-Derived Datasets',
		venue: 'EMNLP 2024 (Main)',
		year: 2024,
		url: 'https://aclanthology.org/2024.emnlp-main.1198/',
		authors: 'Kaushal Prajapati et al.',
		abstract:
			'A pipeline for detecting and redacting sensitive personal data in large document-image corpora derived from IIT-CDIP, enabling privacy-preserving research on real-world Document AI at scale.',
		tags: ['nlp', 'document-ai', 'privacy'],
	},
	{
		title: 'Parameter-Efficient Fine-Tuning for Hospital Discharge Summarization',
		venue: 'Elsevier — Applied Soft Computing',
		year: 2024,
		url: 'https://www.sciencedirect.com/science/article/pii/S1568494624003053',
		authors: 'Kaushal Prajapati et al.',
		abstract:
			'PEFT methods applied to clinical summarization, matching full fine-tuning quality on hospital discharge summaries at a fraction of the trainable parameters and compute.',
		tags: ['peft', 'llm', 'healthcare'],
	},
	{
		title: 'DoRA+: Enhancing Weight-Decomposed Low-Rank Adaptation',
		venue: 'Elsevier — Applied Soft Computing',
		year: 2025,
		url: 'https://www.sciencedirect.com/science/article/pii/S1568494626013098',
		authors: 'Kaushal Prajapati et al.',
		abstract:
			'An extension to weight-decomposed low-rank adaptation (DoRA) that improves the magnitude/direction decomposition for more effective and stable parameter-efficient fine-tuning.',
		tags: ['lora', 'peft', 'deep-learning'],
	},
];
