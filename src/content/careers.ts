export type CareerRole = {
	slug: string;
	title: string;
	team: string;
	location: string;
	type: string;
	summary: string;
	hero: string;
	overview: string[];
	responsibilities: string[];
	profile: string[];
	niceToHave?: string[];
	notRequired?: string[];
	whatWeOffer: string[];
	recruitmentEmail: string;
	featured?: boolean;
};

const recruitmentEmail = 'hello@koreshield.com';

export const careerRoles: CareerRole[] = [
	{
		slug: 'social-media-operator',
		title: 'Social Media Operator',
		team: 'Growth',
		location: 'Remote',
		type: 'Flexible / Remote',
		summary:
			'Help KoreShield show up where LLM security conversations are already happening. This is a hands-on role for someone who understands X and LinkedIn deeply and knows how to earn attention with sharp, human, technically credible engagement.',
		hero:
			'We are not looking for someone to queue bland posts. We need someone who knows how attention moves on X and LinkedIn, can join fast-moving AI security conversations with confidence, and can help make KoreShield impossible to ignore in the right rooms.',
		overview: [
			'Koreshield is a runtime LLM security proxy. We sit between applications and model providers and stop prompt injection, data leakage, and agent exploits before they complete.',
			'Your job is to be in the room where those conversations are already happening and make sure KoreShield is part of them, with the right tone, timing, and technical credibility.',
		],
		responsibilities: [
			'Monitor X and LinkedIn daily for conversations around AI security, LLM vulnerabilities, prompt injection, and AI risk.',
			'Identify threads and posts worth engaging with and respond quickly with substance, not filler.',
			'Draft replies and comments that sound human, sharp, and informed rather than like a scheduled brand account.',
			'Spot ragebait and debate-worthy posts on X where a well-placed response can pull attention back to KoreShield.',
			'Engage founders, security leads, and developers on LinkedIn through comments, replies, and shares that build credibility.',
			'Grow KoreShield’s presence across both platforms and help the brand earn standing in the developer and AI security community.',
			'Flag fast-moving topics to the founder so we can turn them into stronger content quickly.',
		],
		profile: [
			'You are already on X and LinkedIn multiple times a day by choice.',
			'You understand how reach works on X: timing, threading, reply positioning, quote tweeting, and staying inside a live conversation.',
			'You understand how LinkedIn distribution actually works and how buyer and developer audiences behave differently.',
			'You can write with a sharp, direct voice and shift tone depending on the platform and the audience.',
			'You are comfortable being in the middle of a heated thread when the moment calls for it.',
			'You pick things up fast and are genuinely curious enough to learn the basics of LLM security quickly.',
		],
		niceToHave: [
			'You have grown an account before.',
			'You have run a niche account or community profile.',
			'You have done similar work for a founder, product, or technical brand.',
		],
		notRequired: [
			'A degree',
			'A cybersecurity background',
			'Prior startup experience',
			'Experience running paid social',
		],
		whatWeOffer: [
			'Flexible hours and a fully remote setup.',
			'Direct access to the founder and the real product story.',
			'A role that can expand into broader brand, content, or community ownership as KoreShield grows.',
		],
		recruitmentEmail,
		featured: true,
	},
	{
		slug: 'senior-backend-engineer',
		title: 'Senior Backend Engineer',
		team: 'Platform',
		location: 'London / Remote',
		type: 'Full-time',
		summary:
			"Help us scale the KoreShield detection engine to handle billions of LLM requests. You'll own core infrastructure, shape API design, and work closely with our security research team.",
		hero:
			'This role is for someone who wants to sit close to the security engine, the API edge, and the reliability decisions that determine whether KoreShield holds up under real production pressure.',
		overview: [
			'You will work on the core backend that powers detection, policy enforcement, logging, provider routing, and account-aware controls.',
			'You will help define the technical backbone that allows KoreShield to stay fast while dealing with adversarial traffic and high-volume runtime inspection.',
		],
		responsibilities: [
			'Design and evolve backend services that sit directly in the request path for LLM security enforcement.',
			'Improve API performance, observability, and correctness across core product workflows.',
			'Work closely with research and product to ship new detection and governance capabilities into production.',
			'Strengthen testing, release quality, and operational safety around sensitive security logic.',
			'Contribute to architectural decisions around multi-tenant isolation, quotas, billing, and provider routing.',
		],
		profile: [
			'Strong backend engineering fundamentals with experience shipping and owning production services.',
			'Comfort working in Python backend systems, APIs, async workflows, and real operational environments.',
			'Good judgment around performance, failure handling, and maintainability.',
			'Ability to collaborate closely with product and security-focused teammates without heavy process overhead.',
		],
		niceToHave: [
			'Experience with proxying, gateways, request inspection, or security middleware.',
			'Experience with Postgres, Redis, websockets, or provider integrations.',
			'Interest in AI security, model operations, or platform infrastructure.',
		],
		whatWeOffer: [
			'High ownership over real production systems.',
			'Direct collaboration with the founder and research direction.',
			'The chance to shape the technical spine of a serious AI security product early.',
		],
		recruitmentEmail,
	},
	{
		slug: 'ml-security-researcher',
		title: 'ML Security Researcher',
		team: 'Research',
		location: 'London / Remote',
		type: 'Full-time',
		summary:
			"Discover, analyse, and build defences against new LLM attack vectors. You'll contribute to our detector corpus, publish research, and work alongside the engineering team to ship your findings to production.",
		hero:
			'This is for someone who wants research to leave the lab quickly and become a shipped defensive capability, not a slide deck that never touches production.',
		overview: [
			'You will study practical LLM threats and convert those findings into detectors, heuristics, policies, and product guidance.',
			'The work sits at the intersection of red teaming, taxonomy building, practical evaluation, and production-ready mitigation design.',
		],
		responsibilities: [
			'Investigate emerging prompt injection, data leakage, jailbreak, tool abuse, and agent exploitation patterns.',
			'Build and refine detection logic, corpora, and evaluation datasets.',
			'Partner with engineering to turn research findings into reliable shipped defenses.',
			'Help define how KoreShield measures detection quality, coverage, and false positive tradeoffs.',
			'Contribute to external-facing analysis, explainers, or research artifacts where useful.',
		],
		profile: [
			'Strong curiosity about how LLM systems fail in practice.',
			'Ability to reason carefully about attack patterns and defensive tradeoffs.',
			'Comfort moving between exploratory analysis and concrete shipped mitigations.',
			'Clear writing and communication, especially when explaining complex security behavior.',
		],
		niceToHave: [
			'Hands-on experience with adversarial testing, LLM evaluation, or security research.',
			'Experience building heuristics or classifiers for practical abuse patterns.',
			'Experience publishing, documenting, or teaching technical findings clearly.',
		],
		whatWeOffer: [
			'Research that ships into product quickly.',
			'Real customer and production feedback loops.',
			'A focused product environment where your findings matter immediately.',
		],
		recruitmentEmail,
	},
	{
		slug: 'product-designer',
		title: 'Product Designer',
		team: 'Product',
		location: 'London / Remote',
		type: 'Full-time',
		summary:
			"Own the end-to-end design of KoreShield's dashboard and developer tooling. You care about clarity, motion, and making complex security data feel immediately understandable.",
		hero:
			'This role is about making dense security and operational information feel sharp, trustworthy, and surprisingly usable for both technical and non-technical audiences.',
		overview: [
			'You will shape the experience across onboarding, dashboard workflows, status surfaces, docs, settings, and reporting.',
			'You will help turn KoreShield into a product that feels intentional and credible, not just functional.',
		],
		responsibilities: [
			'Design core product flows across dashboard, policy, analytics, onboarding, and account surfaces.',
			'Improve information hierarchy and visual clarity for security-heavy interfaces.',
			'Work closely with engineering to ship thoughtful, production-quality UI.',
			'Create reusable patterns that keep the product coherent as it grows.',
			'Help refine the relationship between the marketing site, docs, and product experience.',
		],
		profile: [
			'Strong product design fundamentals and a bias toward clarity.',
			'Comfort designing for complex data-heavy workflows.',
			'Ability to think in systems, not only individual screens.',
			'Strong collaboration with engineers and comfort working in a fast, iterative environment.',
		],
		niceToHave: [
			'Experience in developer tools, infrastructure, or security products.',
			'Comfort with motion, prototyping, and interaction detail.',
			'Experience helping early-stage products tighten both UX and visual identity.',
		],
		whatWeOffer: [
			'Broad design ownership over a product with real technical depth.',
			'The chance to shape not just screens, but how the whole company shows up.',
			'Close collaboration with engineering and product direction.',
		],
		recruitmentEmail,
	},
	{
		slug: 'enterprise-account-executive',
		title: 'Enterprise Account Executive',
		team: 'Sales',
		location: 'London',
		type: 'Full-time',
		summary:
			'Build relationships with enterprise security and engineering teams. You understand the AI landscape, can speak credibly to technical buyers, and are driven by helping customers solve real problems.',
		hero:
			'This role is for someone who can translate urgency around AI risk into serious customer conversations without resorting to empty security theater.',
		overview: [
			'You will own customer conversations with technical and security-conscious buyers who are actively trying to control AI risk in production.',
			'You will help shape how KoreShield is sold, positioned, and expanded inside larger organizations.',
		],
		responsibilities: [
			'Run enterprise sales cycles with security, platform, engineering, and leadership stakeholders.',
			'Translate product capability into business and risk-reduction outcomes clearly.',
			'Handle discovery, demos, objection handling, and deal progression with discipline.',
			'Feed market signals back into positioning, roadmap, and collateral.',
			'Help build a repeatable enterprise motion around a fast-moving AI security category.',
		],
		profile: [
			'Strong enterprise selling instincts and good communication with technical buyers.',
			'Comfort operating in a product-led but founder-close environment.',
			'Ability to stay sharp and credible in conversations about AI systems, governance, and security.',
			'Discipline around pipeline, follow-through, and deal ownership.',
		],
		niceToHave: [
			'Experience selling security, infrastructure, or developer tooling.',
			'Experience working with early-stage products or category creation.',
			'Experience navigating long-cycle technical enterprise sales.',
		],
		whatWeOffer: [
			'Direct access to product and founder context.',
			'The chance to help define how a new AI security category is sold.',
			'Room to shape process, messaging, and commercial strategy.',
		],
		recruitmentEmail,
	},
	{
		slug: 'global-sales-manager',
		title: 'Global Sales Manager',
		team: 'Sales',
		location: 'London',
		type: 'Full-time',
		summary:
			'Lead and scale our global sales motion, from pipeline strategy to closing enterprise deals. You bring experience selling security or developer tooling internationally and know how to build and coach high-performing teams.',
		hero:
			'This role is about building the operating rhythm, structure, and global discipline required to turn strong demand into a scalable commercial engine.',
		overview: [
			'You will help define and run the broader sales motion as KoreShield expands across geographies and customer profiles.',
			'You will work closely with leadership to bring more consistency to pipeline quality, forecasting, and execution.',
		],
		responsibilities: [
			'Define and improve pipeline strategy, territory thinking, and outbound priorities.',
			'Support and coach enterprise selling behaviors as the sales function grows.',
			'Help establish forecasting, qualification, and follow-through standards.',
			'Work across product, marketing, and founder-led sales to improve conversion quality.',
			'Bring international commercial judgment to how KoreShield expands and prioritizes opportunities.',
		],
		profile: [
			'Experience leading or shaping B2B sales motions beyond a single rep workflow.',
			'Strong commercial judgment and comfort with technical products.',
			'Ability to build process without creating unnecessary drag.',
			'Confidence operating in an early-stage, high-context environment.',
		],
		niceToHave: [
			'Experience in security, infrastructure, or developer tooling.',
			'Experience selling across multiple regions or market segments.',
			'Experience coaching teams through complex enterprise cycles.',
		],
		whatWeOffer: [
			'A chance to shape how the revenue function matures.',
			'Direct influence on strategy, not just execution.',
			'Serious ownership in a category with real urgency.',
		],
		recruitmentEmail,
	},
	{
		slug: 'ui-engineer',
		title: 'UI Engineer',
		team: 'Engineering',
		location: 'London / Remote',
		type: 'Full-time',
		summary:
			"Craft the interfaces that security teams rely on every day. You care deeply about performance, accessibility, and pixel-perfect execution, turning complex data into clean, intuitive experiences.",
		hero:
			'We need someone who can make a technically serious product feel polished, fast, and deliberate across every important workflow.',
		overview: [
			'You will help build the frontend experience across dashboard, docs, onboarding, status, settings, and product marketing surfaces.',
			'You will work on the details that separate “working” from “feels right.”',
		],
		responsibilities: [
			'Build and refine high-quality frontend experiences across the KoreShield product.',
			'Improve clarity, speed, and interaction quality in data-heavy UI.',
			'Work closely with design and product on the polish that users immediately feel.',
			'Strengthen component quality, consistency, and maintainability.',
			'Help keep the public site and the app feeling like one coherent system.',
		],
		profile: [
			'Strong frontend engineering skills and attention to detail.',
			'Comfort with React, TypeScript, responsive UI, and interaction polish.',
			'Good instincts around accessibility, state handling, and performance.',
			'Care for shipping quality rather than just finishing tickets.',
		],
		niceToHave: [
			'Experience in SaaS dashboards, devtools, or security products.',
			'Strong CSS/layout/motion taste.',
			'Comfort collaborating closely with product design.',
		],
		whatWeOffer: [
			'Visible product ownership and room to shape the UI system.',
			'Close pairing with design and product decisions.',
			'The chance to work on a product where trust and UX both matter deeply.',
		],
		recruitmentEmail,
	},
	{
		slug: 'security-engineer-red-team',
		title: 'Security Engineer (Red Team)',
		team: 'Security',
		location: 'London / Remote',
		type: 'Full-time',
		summary:
			"Attempt to break what we build. You'll simulate adversarial attacks against LLM-powered systems, uncover weaknesses in our detection pipeline, and feed your findings directly into hardening our defences.",
		hero:
			'This role exists to keep KoreShield honest by attacking the product and the assumptions around it before real attackers do.',
		overview: [
			'You will run adversarial thinking directly against the product and customer use cases we care about most.',
			'The work is practical, applied, and meant to produce stronger shipped defenses quickly.',
		],
		responsibilities: [
			'Design and execute realistic adversarial scenarios against LLM security controls and agent workflows.',
			'Identify detector gaps, policy weaknesses, and bypass opportunities.',
			'Work with engineering and research to turn findings into product improvements.',
			'Help define regression suites and attack libraries that keep quality honest over time.',
			'Contribute to KoreShield’s internal understanding of attacker tradecraft around AI systems.',
		],
		profile: [
			'Strong adversarial mindset and practical security instincts.',
			'Comfort reasoning about abuse paths, bypasses, and exploit chains.',
			'Ability to document findings clearly and work constructively with builders.',
			'Interest in LLMs, tools, agents, and runtime abuse patterns.',
		],
		niceToHave: [
			'Experience in red teaming, offensive security, or application security.',
			'Experience with LLM systems, prompt injection, or agent abuse testing.',
			'Experience building security regression suites or internal tooling.',
		],
		whatWeOffer: [
			'Real influence over shipped product defenses.',
			'A tight loop between attack discovery and remediation.',
			'Room to shape a serious AI security practice early.',
		],
		recruitmentEmail,
	},
	{
		slug: 'data-engineer-big-data',
		title: 'Data Engineer (Big Data)',
		team: 'Platform',
		location: 'London / Remote',
		type: 'Full-time',
		summary:
			'Design and operate the data infrastructure that powers KoreShield at scale. You have hands-on experience with large-scale streaming and batch pipelines and a strong bias towards reliability and observability.',
		hero:
			'This role is about building the data foundation that lets KoreShield move from “works now” to “works reliably at large volume with confidence.”',
		overview: [
			'You will work on the ingestion, processing, and reporting pipelines that support product analytics, logs, and operational visibility.',
			'You will help keep data systems reliable enough for customer-facing security and compliance workflows.',
		],
		responsibilities: [
			'Design and operate data flows for security events, analytics, and reporting.',
			'Improve the reliability and observability of batch and streaming systems.',
			'Help shape schemas, retention patterns, and data access strategy for product and operations.',
			'Work closely with backend and analytics-focused teammates on how data is captured and consumed.',
			'Reduce fragility in the systems that sit behind dashboards, reports, and trend views.',
		],
		profile: [
			'Strong fundamentals in data systems and pipeline reliability.',
			'Comfort with structured data modeling, jobs, processing flows, and operational diagnostics.',
			'Good instincts around scale, observability, and failure recovery.',
			'Ability to work pragmatically in a product environment rather than a purely academic data stack.',
		],
		niceToHave: [
			'Experience with event pipelines, usage analytics, or security telemetry.',
			'Experience with Postgres-heavy systems and pragmatic warehouse patterns.',
			'Experience in compliance or audit-oriented reporting environments.',
		],
		whatWeOffer: [
			'Ownership over systems that are central to product trust and scale.',
			'Practical problems with visible downstream impact.',
			'The chance to build data foundations early rather than inherit a mess later.',
		],
		recruitmentEmail,
	},
	{
		slug: 'ai-product-manager',
		title: 'AI Product Manager',
		team: 'Product',
		location: 'London / Remote',
		type: 'Full-time',
		summary:
			"Define the roadmap for KoreShield's AI-powered detection and policy features. You sit at the intersection of security research, engineering, and customer needs, translating signals into a coherent product strategy.",
		hero:
			'This role is about making good decisions in a fast-moving category where the product has to stay credible, practical, and sharp at the same time.',
		overview: [
			'You will work across product, security, engineering, and customer input to turn signals into roadmap and execution choices.',
			'You will help make sure KoreShield grows in a coherent direction rather than as a pile of disconnected security features.',
		],
		responsibilities: [
			'Define priorities across detection, governance, onboarding, reporting, and platform features.',
			'Synthesize customer demand, security reality, and engineering constraints into clear product direction.',
			'Improve product quality through sharper scoping, sequencing, and communication.',
			'Work closely with founder, engineering, and research to keep the roadmap grounded and useful.',
			'Help ensure new features are understandable, commercially relevant, and operationally sane.',
		],
		profile: [
			'Strong product judgment in technical environments.',
			'Ability to work across security, engineering, and customer context without losing clarity.',
			'Good instincts around prioritization and product coherence.',
			'Comfort operating with context and ownership rather than rigid process.',
		],
		niceToHave: [
			'Experience in AI products, security products, or developer tools.',
			'Comfort with technical detail and product writing.',
			'Experience turning noisy signals into clear roadmap choices.',
		],
		whatWeOffer: [
			'Direct influence over a category-defining product.',
			'Founder-level context and fast feedback loops.',
			'A role where product decisions visibly shape the company’s direction.',
		],
		recruitmentEmail,
	},
	{
		slug: 'senior-devops-engineer',
		title: 'Senior DevOps Engineer',
		team: 'Platform',
		location: 'London / Remote',
		type: 'Full-time',
		summary:
			'Own the infrastructure that keeps KoreShield fast, secure, and always-on. You bring deep experience with cloud-native deployments, CI/CD, and operating systems at high availability under real production pressure.',
		hero:
			'This role is for someone who wants to own the platform layer that decides whether product promises survive contact with production reality.',
		overview: [
			'You will work on deployment, runtime health, incident resilience, delivery quality, and the systems that keep KoreShield dependable.',
			'You will be close to the operational edge of the product and help make it calmer, cleaner, and more robust.',
		],
		responsibilities: [
			'Own and improve deployment, runtime, and incident-handling infrastructure.',
			'Strengthen CI/CD, observability, service health, and operational correctness.',
			'Improve reliability around provider integrations, proxy runtime, background monitoring, and public status surfaces.',
			'Reduce operational drift between local, CI, and production environments.',
			'Partner with engineering on safer release patterns and better production hygiene.',
		],
		profile: [
			'Strong production infrastructure instincts and hands-on operating experience.',
			'Comfort with containers, deployment automation, Linux systems, and service reliability.',
			'Ability to balance speed with operational caution.',
			'Ownership mindset and good debugging discipline.',
		],
		niceToHave: [
			'Experience with security-sensitive SaaS or platform products.',
			'Experience with self-hosted runners, reverse proxies, TLS, and production observability.',
			'Experience reducing deployment and configuration drift in growing teams.',
		],
		whatWeOffer: [
			'Serious ownership over the runtime health of the product.',
			'The chance to cleanly shape platform maturity early.',
			'A high-impact role with visible leverage across the whole company.',
		],
		recruitmentEmail,
	},
];

export function getCareerRole(slug: string) {
	return careerRoles.find((role) => role.slug === slug);
}

export function getFeaturedCareerRole() {
	return careerRoles.find((role) => role.featured) ?? careerRoles[0];
}
