export interface PublishedPaper {
	type: string;
	title: string;
	date: string;
	authors: string;
	affiliation: string;
	tags: string[];
	href: string;
	abstract: string;
}

export interface ResearchSection {
	heading: string;
	paragraphs: string[];
}

export interface ResearchArticle {
	slug: string;
	type: 'Threat Report' | 'Technical Paper' | 'Security Advisory' | 'Research Note';
	title: string;
	date: string;
	authors: string;
	affiliation: string;
	tags: string[];
	summary: string;
	description: string;
	readTime: string;
	sections: ResearchSection[];
}

export const publishedPapers: PublishedPaper[] = [
	{
		type: 'Research Paper',
		title: 'LLM-Firewall: A Lightweight Middleware Architecture for Real-Time Detection of Indirect Prompt Injection in Enterprise RAG Systems',
		date: 'January 2026',
		authors: 'Isaac Emmanuel, Teslim O. Kazeem',
		affiliation: 'KoreShield',
		tags: ['Middleware Architecture', 'Real-Time Detection', 'Cross-Document Correlation', 'Production AI'],
		href: 'https://www.academia.edu/164690692/LLM_Firewall_A_Lightweight_Middleware_Architecture_for_Real_Time_Detection_of_Indirect_Prompt_Injection_in_Enterprise_RAG_Systems',
		abstract: 'This paper presents LLM-Firewall, a middleware architecture for real-time detection of indirect prompt injection in enterprise retrieval-augmented generation systems. The design places inspection between retrieval and inference so that retrieved context can be evaluated before prompt assembly. Its central contribution is a cross-document correlation engine that identifies fragmented attack payloads distributed across multiple retrieved chunks, a failure mode that single-document inspection often misses. The evaluation covers 5,000 adversarial scenarios across five attack dimensions and compares the architecture against static blocklist baselines and secondary-model judging approaches, showing that strong detection can be achieved without introducing impractical latency at production scale.',
	},
	{
		type: 'Preprint',
		title: 'LLM-Firewall: A Novel Taxonomy of Indirect Prompt Injection Attacks in Enterprise RAG Systems',
		date: 'December 2025',
		authors: 'Isaac Emmanuel, Teslim O. Kazeem',
		affiliation: 'KoreShield',
		tags: ['Prompt Injection', 'RAG Security', 'Taxonomy', 'Enterprise AI'],
		href: 'https://www.academia.edu/145685538/_Preprint_LLM_Firewall_A_Novel_Taxonomy_of_Indirect_Prompt_Injection_Attacks_in_Enterprise_RAG_Systems',
		abstract: 'This preprint introduces a five-dimensional taxonomy for classifying indirect prompt injection attacks against enterprise RAG deployments. It addresses a gap in prior work, which has focused more heavily on direct user-supplied injection while giving less attention to the retrieval layer. The taxonomy classifies attacks by injection vector, operational target, persistence mechanism, enterprise context, and detection complexity. Together, these dimensions provide a structured way to reason about attacks in which adversarial instructions embedded in retrieved content shape model behavior without requiring direct interaction with the application. The paper also motivates LLM-Firewall as a middleware architecture placed at the retrieval-to-inference boundary and establishes the threat model later implemented in the companion architecture paper.',
	},
];

export const researchArticles: ResearchArticle[] = [
	{
		slug: 'state-of-prompt-injection-in-production-llm-systems',
		type: 'Threat Report',
		title: 'The State of Prompt Injection in Production LLM Systems',
		date: 'April 2025',
		authors: 'Isaac Emmanuel',
		affiliation: 'KoreShield',
		tags: ['Prompt Injection', 'RAG', 'Production Data', 'Threat Intelligence'],
		summary: 'This threat report analyses prompt injection activity observed across production LLM deployments integrated with KoreShield during Q1 2025. Drawing on a corpus of more than two million intercepted requests, it characterises prevalent attack patterns by frequency, detection rate, and target model family, and documents a clear shift in the threat landscape. Indirect injection through retrieval-augmented generation pipelines emerges as the dominant attack vector in enterprise deployments, overtaking direct user-input injection. The report attributes this shift to the widespread adoption of RAG architectures for enterprise knowledge retrieval, which introduces a document-layer attack surface that many deployed defenses do not adequately inspect. Detection rates by attack class, common evasion patterns, and recommendations for layered defensive controls are included.',
		description: 'A production threat report on prompt injection patterns, retrieval-layer abuse, and the changing attack mix in deployed LLM systems.',
		readTime: '10 min read',
		sections: [
			{
				heading: 'Abstract',
				paragraphs: [
					'This report examines prompt injection activity observed in production LLM deployments protected by KoreShield during the first quarter of 2025. The underlying dataset contains more than two million intercepted requests across hosted and self-managed enterprise environments. The purpose of the report is not to provide a broad survey of hypothetical attack classes, but to identify which forms of abuse appear repeatedly in operational systems and how their frequency changes as deployment patterns change.',
					'The principal finding is that indirect prompt injection, especially through retrieval-augmented generation pipelines, has become the dominant attack vector in enterprise environments. This marks a practical change in the security posture of deployed AI systems. Where earlier deployments were mostly exposed to direct user-supplied override prompts, current deployments inherit a larger and less visible attack surface from retrieved documents, tool outputs, and external context sources.',
				],
			},
			{
				heading: 'Dataset and Scope',
				paragraphs: [
					'The corpus used in this report was derived from requests processed through production KoreShield deployments during Q1 2025. Records were grouped by attack family, model family, routing path, and application surface. To reduce distortion, duplicate replay traffic, test fixtures, and synthetic benchmark runs were excluded from the final analysis set. The resulting dataset reflects genuine operational traffic rather than laboratory-only attack examples.',
					'The report is limited to prompt injection and closely related instruction-manipulation attacks. It does not attempt to model all classes of LLM abuse, nor does it treat every unsafe prompt as equivalent. Instead, the focus is on attempts to redirect system behavior, override task boundaries, exfiltrate sensitive context, or alter tool execution through natural-language manipulation.',
				],
			},
			{
				heading: 'Observed Attack Distribution',
				paragraphs: [
					'The most important distributional result is the shift from direct override attempts to retrieval-layer abuse. In enterprise settings that adopted RAG for internal knowledge retrieval, malicious or malformed source documents became a persistent carrier of adversarial instructions. These instructions were often framed as hidden policy updates, administrative directives, or formatting guidance embedded inside otherwise plausible business content.',
					'Direct user-input injection remained common, but it was no longer the majority class in environments with mature retrieval workflows. The dominant indirect patterns included document poisoning, instruction embedding within semi-structured content, and cross-document chaining, where a complete adversarial instruction was reconstructed only when multiple retrieved passages were presented together to the model.',
					'Tool-mediated attacks also increased in frequency, particularly in agentic workflows where the model treated tool output as trusted operational context. Although smaller in total volume than RAG-borne attacks, these incidents were disproportionately severe because successful compromise could redirect downstream actions rather than only alter a text response.',
				],
			},
			{
				heading: 'Operational Implications',
				paragraphs: [
					'The shift in attack distribution has direct consequences for system design. Security controls that assume all adversarial intent originates in the user prompt now fail to inspect one of the largest contemporary attack surfaces. System-prompt hardening and user-input filtering retain value, but they do not address the structural problem created when retrieved content and trusted instructions occupy the same effective context window.',
					'This observation supports a design principle that emerged repeatedly in the production data: inspection must occur at the boundaries where trust changes. In retrieval workflows, that boundary lies between document retrieval and prompt assembly. In tool-driven workflows, it lies between tool output and agent action. Controls applied only at the user interface or only at the final model output are too late to prevent certain classes of misuse.',
				],
			},
			{
				heading: 'Conclusion',
				paragraphs: [
					'Prompt injection in production systems is no longer best understood as an isolated prompt-crafting problem. It is increasingly an architectural problem shaped by retrieval systems, orchestration layers, and context composition. The empirical record from Q1 2025 indicates that defenders should prioritize retrieval-aware inspection, tool-aware policy enforcement, and logging systems that preserve evidence at the point where untrusted content is introduced.',
					'Future work should refine severity modelling by relating attack class to downstream capability, not only to classifier confidence. Production operators do not only need to know whether a prompt appears malicious. They need to know what the attack could cause if allowed to proceed.',
				],
			},
		],
	},
	{
		slug: 'indirect-prompt-injection-via-retrieved-documents',
		type: 'Technical Paper',
		title: 'Indirect Prompt Injection via Retrieved Documents: Attack Taxonomy and Mitigations',
		date: 'March 2025',
		authors: 'Isaac Emmanuel',
		affiliation: 'KoreShield',
		tags: ['RAG Security', 'Taxonomy', 'Mitigations', 'Indirect Injection'],
		summary: 'This paper introduces a structured taxonomy of indirect prompt injection attacks targeting retrieval-augmented generation pipelines. Observed attack patterns are organised into four classes: instruction embedding, role impersonation, context poisoning, and cross-document chaining. For each class, the paper evaluates detection efficacy across representative attack instances and finds that static blocklist approaches remain adequate for straightforward instruction embedding but degrade substantially on role impersonation and context poisoning. The paper concludes that a proxy-layer mitigation architecture at the retrieval boundary is the most operationally tractable point for consistent cross-class defense.',
		description: 'A technical paper defining a practical taxonomy for indirect prompt injection in RAG pipelines and outlining mitigation strategies that hold in deployed systems.',
		readTime: '9 min read',
		sections: [
			{
				heading: 'Problem Statement',
				paragraphs: [
					'Indirect prompt injection arises when the adversarial instruction does not originate in the user request but in material later introduced into the model context. In RAG systems, the most common carrier is the retrieved document itself. This attack pattern is operationally important because it bypasses controls that are scoped only to the user prompt while exploiting the same instruction-following tendencies in the model.',
					'The central challenge is categorical rather than incidental. Retrieved content is often treated as informational evidence, but large language models do not maintain a strict boundary between data and instruction. Once malicious text is concatenated into the final context, it can compete with system messages, developer instructions, and user intent for behavioral control.',
				],
			},
			{
				heading: 'Taxonomy',
				paragraphs: [
					'The first class, instruction embedding, covers cases where explicit adversarial directives are inserted directly into a document body. These directives are often simple to detect because they resemble ordinary prompt injection phrases and preserve obvious lexical markers.',
					'The second class, role impersonation, includes attacks that attempt to borrow authority by presenting document content as though it were a system instruction, policy note, or administrator message. These attacks are materially more difficult because they exploit the model tendency to privilege authority claims even when they appear in untrusted context.',
					'The third class, context poisoning, includes manipulations that reshape task interpretation without issuing a direct command. A poisoned document may redefine the objective, misstate provenance, or recast the meaning of surrounding material so that the model reaches an unsafe conclusion while appearing to follow the stated task.',
					'The fourth class, cross-document chaining, captures attacks in which no single retrieved passage contains a complete adversarial payload. Instead, the instruction emerges only when multiple passages are combined during inference. This class is especially relevant to enterprise retrieval, where chunking and ranking often separate related fragments across documents.',
				],
			},
			{
				heading: 'Detection Behavior',
				paragraphs: [
					'Static pattern matching performs adequately on instruction embedding because the attack preserves recognizable lexical structure. The same approach degrades quickly on role impersonation and context poisoning, where the threat lies less in the surface phrase and more in the relationship between the text and its claimed authority.',
					'Cross-document chaining exposes an additional limitation of document-local inspection. A detector that evaluates each chunk independently can certify every fragment as benign while missing the harmful instruction that is reconstructed by the model only after prompt assembly. This observation argues for inspection systems that retain retrieval context and reason across multiple returned passages.',
				],
			},
			{
				heading: 'Mitigation Architecture',
				paragraphs: [
					'The most reliable mitigation point is the retrieval boundary, immediately before prompt assembly. At this stage, retrieved content is available for structured inspection, and the system still retains the metadata necessary to understand source, rank, and adjacency. Once the prompt is assembled and sent to the model, many of these distinctions become harder to recover with sufficient certainty for enforcement.',
					'In practice, retrieval-boundary controls should combine rule-based inspection, semantic scoring, cross-document correlation, and policy-driven enforcement. The design goal is not merely to classify text as malicious or benign, but to identify when a piece of retrieved material is attempting to alter authority, redirect task intent, or manipulate downstream system behavior.',
				],
			},
			{
				heading: 'Conclusion',
				paragraphs: [
					'Indirect prompt injection in RAG systems is best treated as a first-order security problem, not as an edge case of user prompt filtering. The proposed taxonomy is useful because it separates classes that fail for different reasons and therefore require different defensive strategies.',
					'Future evaluation work should measure detectors against retrieval-specific distortions such as chunking, ranking variance, and multilingual document corpora. These operational conditions materially change what successful defense looks like in practice.',
				],
			},
		],
	},
	{
		slug: 'tool-call-hijacking-in-agentic-pipelines',
		type: 'Security Advisory',
		title: 'Tool Call Hijacking in Agentic Pipelines: A Practical Demonstration',
		date: 'February 2025',
		authors: 'Isaac Emmanuel',
		affiliation: 'KoreShield',
		tags: ['AI Agents', 'Tool Abuse', 'Agentic Security', 'Proof of Concept'],
		summary: 'This advisory demonstrates a class of attack in which malicious instructions embedded in tool outputs redirect an autonomous LLM agent to execute actions outside its intended scope. Agentic systems that invoke tools and act on their results are structurally exposed to this pattern because tool responses are commonly treated as trusted context. An attacker who can influence a tool response, whether through a compromised API, a manipulated retrieved document, or a web page processed by a browsing agent, can redirect subsequent agent behavior without direct user-level access. Proof-of-concept scenarios are documented across LangChain, AutoGen, and Claude Tools, supporting the claim that the weakness is architectural rather than framework-specific. The advisory closes with a discussion of proxy-layer enforcement for tool inputs and outputs as a practical way to reduce the blast radius of successful injection attempts.',
		description: 'A security advisory on agentic tool-call hijacking and the architectural reasons the pattern appears across frameworks.',
		readTime: '8 min read',
		sections: [
			{
				heading: 'Advisory Summary',
				paragraphs: [
					'This advisory documents a class of agentic-system failure in which a model follows malicious instructions carried inside tool output. The attack does not require direct compromise of the user prompt. Instead, it relies on the architectural fact that many agent frameworks treat tool responses as trusted context and feed them back into the model with limited separation between observation and instruction.',
					'The significance of this pattern lies in capability escalation. A compromised or manipulated tool output can do more than alter a textual answer. It can redirect an agent into unsafe follow-up actions, including privileged calls, external communications, or the retrieval of additional sensitive data.',
				],
			},
			{
				heading: 'Attack Model',
				paragraphs: [
					'The attack begins when an adversary gains influence over a tool-accessible source. In practice this source may be a compromised API, a poisoned search result, a retrieved file, or a web page opened by a browsing tool. The malicious content is written so that it appears to be part of the tool result while embedding instructions intended for the agent itself.',
					'Once the tool output is reintroduced into the model context, the agent may reinterpret the tool response as procedural guidance. The attack therefore succeeds not because the model cannot parse the source, but because the orchestration layer has not preserved a reliable distinction between tool observation and executable instruction.',
				],
			},
			{
				heading: 'Practical Demonstration',
				paragraphs: [
					'Proof-of-concept demonstrations were reproduced across multiple orchestration stacks, including LangChain, AutoGen, and Claude Tools. The specific APIs and callback patterns differed, but the failure mode remained consistent. Whenever tool output re-entered the conversational state without strong policy mediation, the model could be redirected into behavior outside the intended task boundary.',
					'The practical implication is that this is not a single-framework defect. It is a recurrent property of architectures in which the model both interprets tool results and decides subsequent actions without an independent enforcement layer.',
				],
			},
			{
				heading: 'Mitigation Guidance',
				paragraphs: [
					'The first defensive requirement is to inspect tool output before it is returned to the model. This inspection should treat tool responses as untrusted input, regardless of whether the tool is internal or external. The second requirement is to apply policy checks to the transition between model reasoning and executable action. An agent should not be permitted to transform arbitrary textual instructions into privileged tool calls without a separate enforcement decision.',
					'In high-trust workflows, human review should be introduced at capability boundaries, especially where the downstream action affects identity systems, messaging systems, deployment surfaces, or customer data stores. The goal is not to eliminate autonomous reasoning, but to prevent a single compromised observation from becoming a high-consequence operational action.',
				],
			},
			{
				heading: 'Closing Note',
				paragraphs: [
					'Tool-call hijacking should be treated as a predictable risk in agentic systems rather than as a surprising edge case. Any deployment that grants an LLM both observation and action privileges should assume that tool outputs may become adversarial carriers.',
					'Security architecture should therefore be built around enforcement points, provenance, and explicit capability checks. Trust in the tool chain cannot be assumed simply because the tool invocation itself was authorized.',
				],
			},
		],
	},
	{
		slug: 'jailbreak-technique-drift',
		type: 'Research Note',
		title: 'Jailbreak Technique Drift: How Attack Patterns Evolve Month-Over-Month',
		date: 'February 2025',
		authors: 'Isaac Emmanuel',
		affiliation: 'KoreShield',
		tags: ['Jailbreaks', 'Technique Drift', 'Attack Evolution'],
		summary: 'Jailbreak techniques observed in production LLM deployments do not remain static. Analysis of requests processed through KoreShield over successive months shows iterative adaptation, with attack variants clustering around recently disclosed techniques before drifting toward new formulations as detection coverage matures. This note characterises the lifecycle of a jailbreak technique and outlines what that lifecycle means for classifiers trained on historical attack distributions.',
		description: 'A research note on how jailbreak techniques evolve after disclosure and why detection systems must account for distribution drift.',
		readTime: '6 min read',
		sections: [
			{
				heading: 'Observation',
				paragraphs: [
					'Jailbreak techniques in production traffic exhibit drift rather than stability. After a successful pattern becomes widely circulated, attack traffic initially concentrates around direct reuse. Over time, as detection coverage improves and platform operators harden known phrases, the same technique reappears in paraphrased, fragmented, or structurally altered forms.',
					'This pattern resembles adaptation in other adversarial settings. The relevant unit is not the literal prompt template but the underlying evasion strategy. Once that distinction is made, the apparent novelty of many jailbreak variants becomes easier to understand.',
				],
			},
			{
				heading: 'Lifecycle of a Technique',
				paragraphs: [
					'The first phase is disclosure and rapid imitation, where the attack appears in near-identical form across unrelated environments. The second phase is saturation, where defensive coverage begins to catch the original phrasing at high rates. The third phase is divergence, where the core strategy is preserved but lexical form begins to vary in order to evade learned signatures.',
					'By the time a fourth phase is reached, the attack often appears under a new framing and may no longer be recognized as part of the same lineage by systems that rely primarily on exact phrase or template reuse.',
				],
			},
			{
				heading: 'Implications for Detection',
				paragraphs: [
					'Classifiers trained heavily on historical snapshots are vulnerable to overfitting the surface form of yesterday\'s attacks. The practical consequence is not only reduced recall. It is also a false sense of maturity, because the detector appears strong on benchmark sets that overrepresent already-understood phrasing.',
					'Detection systems should therefore be evaluated against mutation families, paraphrase sets, and technique clusters rather than against isolated prompt exemplars. What matters operationally is whether the defensive logic tracks the strategy as it changes form.',
				],
			},
			{
				heading: 'Conclusion',
				paragraphs: [
					'Jailbreak drift is a predictable property of adversarial interaction with deployed language systems. Defenders should expect technique evolution after public disclosure and should design update loops, evaluation sets, and telemetry reviews accordingly.',
				],
			},
		],
	},
	{
		slug: 'pii-exfiltration-via-llm-output',
		type: 'Research Note',
		title: 'PII Exfiltration via LLM Output: Common Patterns and Detection Signals',
		date: 'February 2025',
		authors: 'Isaac Emmanuel',
		affiliation: 'KoreShield',
		tags: ['PII', 'Exfiltration', 'Output Security'],
		summary: 'A class of prompt injection attacks aims not to alter model behavior but to extract sensitive data present in the model context window. Common patterns include instruction sequences that ask the model to summarise, reformat, or translate content containing personally identifiable information, thereby embedding exfiltration inside what appears to be a legitimate output transformation. This note documents recurring attack structures observed in production and identifies output-layer signals that correlate reliably with exfiltration intent.',
		description: 'A research note on output-layer exfiltration patterns and the signals that distinguish legitimate transformation from sensitive-data extraction.',
		readTime: '6 min read',
		sections: [
			{
				heading: 'Scope',
				paragraphs: [
					'Not all prompt injection attempts seek behavioral override. A materially important subset is designed to recover sensitive context already present in the model window. In these cases, the adversary often frames the request as a benign transformation task, such as summarisation, translation, or reformatting, while the real objective is disclosure.',
					'This distinction matters because the harmfulness of the request is not always captured by instruction intent alone. The same linguistic form can be legitimate in one context and clearly exfiltrative in another, depending on the sensitivity of the material being transformed.',
				],
			},
			{
				heading: 'Observed Patterns',
				paragraphs: [
					'Recurring patterns include requests to extract contact details, convert raw records into tabular form, produce executive summaries that preserve identifying fields, or rewrite sensitive content in a supposedly more usable format. The adversarial advantage lies in hiding the disclosure objective inside a familiar productivity task.',
					'In production traffic, the most reliable warning signs were not always the request phrases themselves. Instead, they appeared in the relationship between prompt, context, and requested output granularity. Requests that narrowed attention toward fields such as names, account identifiers, or direct contact details were consistently higher risk than generic summarisation tasks.',
				],
			},
			{
				heading: 'Detection Signals',
				paragraphs: [
					'Useful output-layer signals include structured extraction intent, requests for direct quoting of sensitive records, repeated reference to identifying fields, and transformations that preserve exact values while changing presentation. These features are especially informative when combined with knowledge of what data classes are present in the active context.',
					'This suggests that output security cannot be treated as a pure text classification problem. It is a joint reasoning problem involving requested action, contextual sensitivity, and the granularity of disclosure.',
				],
			},
			{
				heading: 'Conclusion',
				paragraphs: [
					'Exfiltration-oriented prompt injection is best detected through context-aware output policy rather than by looking only for direct override phrases. The operational question is whether the requested output would disclose sensitive information that should not leave the current workflow in that form.',
				],
			},
		],
	},
	{
		slug: 'evaluating-confidence-thresholds-for-prompt-injection-classifiers',
		type: 'Research Note',
		title: 'Evaluating Confidence Thresholds for Prompt Injection Classifiers',
		date: 'January 2025',
		authors: 'Isaac Emmanuel',
		affiliation: 'KoreShield',
		tags: ['Classifiers', 'Thresholds', 'Evaluation'],
		summary: 'Binary classification of prompt injection attacks requires a threshold decision: at what confidence score should a request be blocked rather than allowed to proceed? This note examines the precision-recall tradeoff across threshold configurations on a held-out evaluation set and characterises how false positive rate and over-blocking risk vary across deployment contexts with different tolerances for incorrect blocks and missed attacks.',
		description: 'A research note on threshold selection for prompt injection classifiers in production environments with different risk tolerances.',
		readTime: '5 min read',
		sections: [
			{
				heading: 'Thresholds as Policy',
				paragraphs: [
					'Classifier thresholds are often discussed as purely statistical parameters, but in production systems they function as policy decisions. A blocking threshold sets the line at which the system is willing to interrupt user intent in order to reduce security risk. That line cannot be chosen meaningfully without reference to the operational context in which the model is deployed.',
					'An internal assistant with limited capability can tolerate a different false positive profile than an agent with access to privileged tools or sensitive customer data. The threshold question is therefore inseparable from capability and consequence.',
				],
			},
			{
				heading: 'Evaluation Considerations',
				paragraphs: [
					'On held-out evaluation sets, lower thresholds generally increase recall while also increasing over-blocking of benign edge cases. Higher thresholds reduce interruption but allow more borderline attacks to proceed. Neither result is surprising. The useful question is where the marginal gain in recall ceases to justify the operational cost of additional false positives.',
					'This inflection point varied by deployment surface in our evaluation. User-facing chat interfaces and internal analyst tools tolerated slightly lower thresholds than orchestrated action systems, where missed attacks had higher downstream cost.',
				],
			},
			{
				heading: 'Practical Recommendation',
				paragraphs: [
					'Threshold selection should be capability-aware and environment-specific. A single global threshold is easy to configure but rarely optimal. Production systems should support at least separate thresholds for observation-only flows, retrieval flows, and agentic action flows.',
					'The most defensible approach is to treat classifier confidence as one input into a broader policy engine that also considers capability, provenance, and context sensitivity.',
				],
			},
		],
	},
	{
		slug: 'bypass-resistance-of-system-prompt-hardening-alone',
		type: 'Research Note',
		title: 'Bypass Resistance of System-Prompt Hardening Alone',
		date: 'January 2025',
		authors: 'Isaac Emmanuel',
		affiliation: 'KoreShield',
		tags: ['System Prompts', 'Defense', 'Bypass Analysis'],
		summary: 'Embedding defensive instructions directly in a model system context is a widely recommended mitigation for prompt injection. This note evaluates the bypass resistance of hardened system prompts against role impersonation, authority override phrasing, and context poisoning. The consistent finding is that instruction-level defenses are bypassed when retrieved context carries adversarial authority signals, making proxy-layer enforcement a necessary complement rather than an alternative.',
		description: 'A research note assessing how far system-prompt hardening can go on its own before architectural controls become necessary.',
		readTime: '5 min read',
		sections: [
			{
				heading: 'System Prompts and Their Limits',
				paragraphs: [
					'System-prompt hardening remains one of the most common defensive recommendations in LLM security guidance. The appeal is obvious: it is simple, local, and often effective against naive override attempts. The problem is that it operates within the same instruction-following space that the attacker is attempting to manipulate.',
					'As a result, its effectiveness depends on the model consistently preserving the intended authority hierarchy across all downstream context. This assumption does not always hold, especially when untrusted retrieved text is written in a style that mimics high-authority instructions.',
				],
			},
			{
				heading: 'Observed Failure Modes',
				paragraphs: [
					'The strongest failures appeared under role impersonation and context poisoning. In both cases, the system prompt remained present, but the model still incorporated the adversarial framing into its behavioral interpretation. The failure was not necessarily explicit disobedience. In many cases, the model appeared to reconcile the conflicting instructions in a way that still advanced the attacker objective.',
					'This matters because defenders sometimes interpret the presence of a well-written system prompt as a complete mitigation. The evidence suggests otherwise. It is a helpful constraint, but not a reliable boundary when adversarial material is introduced elsewhere in the context.',
				],
			},
			{
				heading: 'Conclusion',
				paragraphs: [
					'System-prompt hardening should be retained as a layer, but it should not be treated as the main enforcement mechanism for hostile-context scenarios. Where retrieval, tools, or external content are involved, architectural inspection and policy enforcement remain necessary.',
				],
			},
		],
	},
	{
		slug: 'multi-turn-injection-building-attack-context-across-conversation-rounds',
		type: 'Research Note',
		title: 'Multi-Turn Injection: Building Attack Context Across Conversation Rounds',
		date: 'January 2025',
		authors: 'Isaac Emmanuel',
		affiliation: 'KoreShield',
		tags: ['Multi-Turn', 'Conversation Security', 'Session Awareness'],
		summary: 'Some injection attacks are not self-contained within a single request. This note documents a class of multi-turn attacks in which the adversary incrementally establishes context across successive conversation rounds, ultimately steering the model toward a target behavior that would likely have been blocked if attempted in a single turn. The pattern exploits the limited attention that request-level safety classifiers often allocate to historical context and therefore requires session-aware inspection to detect reliably.',
		description: 'A research note on how adversaries build unsafe context gradually across conversations and why session-aware controls matter.',
		readTime: '6 min read',
		sections: [
			{
				heading: 'Why Multi-Turn Attacks Matter',
				paragraphs: [
					'Many defensive systems evaluate requests as isolated events. This is administratively convenient, but it creates blind spots for attacks that accumulate meaning over time. A sequence of individually unremarkable prompts can produce a harmful context state when interpreted together.',
					'The attacker advantage in this setting is gradualism. Rather than issuing a single overt override, the adversary incrementally introduces framing, assumptions, or authority cues that become salient only after multiple turns have passed.',
				],
			},
			{
				heading: 'Observed Pattern',
				paragraphs: [
					'In observed multi-turn patterns, the early steps often establish legitimacy or redefine terms in a way that seems harmless when read locally. Later turns rely on the model having preserved those earlier premises. By the final stage, the requested unsafe action appears as a continuation of a context the attacker has already shaped.',
					'This makes the attack difficult for request-local detectors, because the final turn may contain no obvious injection phrase and the earlier turns may contain no explicit harmful command.',
				],
			},
			{
				heading: 'Detection Implications',
				paragraphs: [
					'Reliable detection requires session-aware inspection or at least summary features derived from conversation history. Defensive systems need not preserve every token of past interaction, but they do need a representation of prior authority claims, role shifts, and intent drift.',
					'Without that history, the system evaluates only the final visible move and misses the staged construction that made the move effective.',
				],
			},
		],
	},
	{
		slug: 'false-positive-rates-semantic-vs-rule-based-detectors-at-scale',
		type: 'Research Note',
		title: 'False Positive Rates in Semantic vs. Rule-Based Detectors at Scale',
		date: 'January 2025',
		authors: 'Isaac Emmanuel',
		affiliation: 'KoreShield',
		tags: ['False Positives', 'Semantic Detection', 'Rule-Based Detection'],
		summary: 'Production LLM deployments handle a significant volume of legitimate requests that superficially resemble injection attempts. This note benchmarks false positive rates for semantic embedding-based detectors against rule-based pattern-matching classifiers across a large production request set. Semantic classifiers achieve lower false positive rates on paraphrased and obfuscated content, while rule-based systems continue to perform well on structured attack signatures. Hybrid pipelines that combine both methods reduce false positives across both categories.',
		description: 'A research note comparing false positive behavior in semantic and rule-based prompt-injection detectors at production scale.',
		readTime: '6 min read',
		sections: [
			{
				heading: 'Motivation',
				paragraphs: [
					'False positives are not a secondary concern in production security systems. When detectors block benign requests at scale, operators lose confidence, users route around controls, and security becomes administratively expensive. This is especially true for LLM systems, where many legitimate prompts naturally resemble instruction-like text.',
					'The question is therefore not which detector class is strongest in the abstract, but which detector class preserves acceptable precision under the lexical and operational variation of real traffic.',
				],
			},
			{
				heading: 'Comparative Behavior',
				paragraphs: [
					'Rule-based systems remain highly effective on structured signatures, repeated override phrases, and explicit attack templates. Their advantage lies in precision on cases that preserve recognizable structure. Their weakness appears when the harmful strategy survives but the wording changes materially.',
					'Semantic detectors behave differently. They are more resilient to paraphrase and obfuscation, and they often reduce false positives where benign prompts contain a small number of suspicious lexical markers without matching the broader intent pattern of an attack. Their weakness is that they can blur distinctions between harmful similarity and legitimate semantic overlap if deployed without policy context.',
				],
			},
			{
				heading: 'Operational Recommendation',
				paragraphs: [
					'The evidence supports hybrid pipelines rather than exclusive reliance on either approach. Rule-based detectors provide strong precision on well-understood attack forms, while semantic detectors improve robustness against linguistic variation. Combined carefully, they reduce false positives while preserving recall across a wider range of traffic conditions.',
					'The design problem then becomes orchestration: how scores are combined, how disagreements are resolved, and which classes of request are eligible for automatic block versus escalation or review.',
				],
			},
		],
	},
];

export const reportArticles = researchArticles.filter((entry) => entry.type !== 'Research Note');
export const researchNotes = researchArticles.filter((entry) => entry.type === 'Research Note');

export function getResearchArticleBySlug(slug: string) {
	return researchArticles.find((entry) => entry.slug === slug) ?? null;
}
