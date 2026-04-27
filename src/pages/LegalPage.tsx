import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

function canonicalPathname(pathname: string): string {
	switch (pathname) {
		case '/privacy':
			return '/privacy-policy';
		case '/terms':
			return '/terms-of-service';
		case '/cookies':
			return '/cookie-policy';
		default:
			return pathname;
	}
}

const pages: Record<string, { title: string; effective: string; sections: { heading: string; body: string }[] }> = {
	'/privacy-policy': {
		title: 'Privacy Policy',
		effective: '17 April 2026',
		sections: [
			{
				heading: 'Who we are',
				body: 'Koreshield Labs Ltd ("KoreShield", "we", "us", "our") is a company incorporated in England and Wales (Company Number: 17057784), with a registered office at 3rd Floor, 86-90 Paul Street, London, EC2A 4NE. We provide AI security infrastructure: a runtime proxy and detection engine that protects AI applications from prompt injection, RAG poisoning, jailbreaks, PII leakage, and related LLM security threats. Developers and businesses ("Customers" or "Developers") integrate our API and SDK into their AI applications.\n\nFor the purposes of UK GDPR and the Data Protection Act 2018, we act as a data processor when we process personal data on behalf of our Customers as part of the security scanning service, and as a data controller when we process personal data for our own purposes including account management, billing, security operations, and product analytics. This Privacy Policy covers our data controller activities. Our processing of Customer Data as a data processor is governed by our Data Processing Agreement (DPA), at <a href="https://koreshield.com/dpa" class="underline">koreshield.com/dpa</a>',
			},
			{
				heading: 'The most important thing: zero-log architecture',
				body: 'KoreShield does not log or store raw prompt content in the default hosted configuration. Prompts, system messages, and conversation history submitted to the API are processed in working memory for the duration of the security scan and are not written to persistent storage by default. The threat classification metadata stored in the monitoring dashboard does not include the raw text of the prompt that was scanned.\n\nThe exception is where additional audit capture is explicitly enabled for a customer deployment or self-hosted environment. In that case, the retention and control model for that data is governed by the customer configuration or contract.',
			},
			{
				heading: 'Personal data we collect: what you provide',
				body: 'When you register for an account, use the Platform, or contact us, we collect: your name, email address, and company name provided at registration; your password, stored as a bcrypt hash and never in plaintext; billing data processed and stored by Polar, our PCI-compliant payment processor (we do not store full card numbers); the content of support requests, emails, and other communications with us; and any additional profile data you choose to provide.',
			},
			{
				heading: 'Personal data we collect: from your use of the platform',
				body: 'When you use the KoreShield API and Platform, we collect: API keys, stored as SHA-256 hashes (we do not retain the plaintext after creation); threat classification metadata including threat type, attack category, block decision, severity score, timestamp, and a per-request UUID associated with your customer account identifier (not with individual end users); usage and analytics data including API request volume, scan counts, dashboard activity, and product usage metrics; and security and audit logs including authentication events, administrative access logs, and system security telemetry including IP address at country level.',
			},
			{
				heading: 'How and why we use your data',
				body: 'Account creation and management: to create and maintain your account, authenticate you, and manage API keys (legal basis: performance of contract). Providing and operating the Services: to run the security scanning service and monitoring dashboard (contract). Billing and payment processing: to process subscription payments and issue invoices (contract). Customer support: to respond to support requests and product communications (contract / legitimate interests). Security operations: to detect and respond to security incidents and monitor platform integrity (legitimate interests: protecting our systems and your data). Product analytics: to understand how the Platform is used and improve it (legitimate interests: expected by developers integrating a security product). Threat intelligence improvement: to improve detection models using anonymised aggregated threat pattern data, only where you have opted in (consent). Legal compliance: to meet our obligations under Companies Act, HMRC, and data protection law (legal obligation). Marketing: to send product updates to opted-in subscribers (consent).\n\nWhere we rely on legitimate interests we have assessed that our interests do not override your rights and freedoms. You have the right to object to processing based on legitimate interests. See the Your Rights section below.',
			},
			{
				heading: 'Prompt content and your end users',
				body: 'When the KoreShield proxy processes prompts from your AI application, those prompts may contain personal data entered by your end users. In this context KoreShield acts as a data processor, processing personal data on your behalf. You are responsible for ensuring you have a lawful basis for sharing your end users\' personal data with KoreShield, obtaining any necessary consents, and disclosing KoreShield\'s role as a sub-processor in your own privacy policy.\n\nEven in our processor role, our zero-log architecture means raw prompt content is not retained after the scan completes. End users\' personal data contained in prompts is processed in memory only and is not stored by KoreShield.',
			},
			{
				heading: 'Threat intelligence and the data flywheel',
				body: 'Our detection engine improves over time through three sources: internal red team datasets and adversarial test cases generated by the KoreShield team; publicly available research, academic literature, and security community datasets on LLM attack techniques including OWASP publications; and optionally, aggregated and anonymised threat pattern data from customer scan activity.\n\nThe default position for all Service Tiers is that your Customer Data does not contribute to our detection models without your explicit opt-in. We will not use your scan data for model improvement unless you have actively consented. If you opt in: only anonymised and aggregated threat pattern data is used: attack technique categories, injection pattern signatures, and detection confidence distributions; raw prompt content is never used for model training; your data is never shared with other customers; and you can withdraw consent at any time via Platform settings without affecting prior processing.\n\nEnterprise Customers can contractually exclude their data from any aggregation as a standard term of the Enterprise Agreement.',
			},
			{
				heading: 'Who we share your data with',
				body: 'We use a limited set of infrastructure, billing, communications, and model providers to operate KoreShield. Our current public sub-processor list is at <a href="https://koreshield.com/legal/sub-processors" class="underline">koreshield.com/legal/sub-processors</a>.\n\nThat list includes core hosting, delivery, billing, documentation, email, and model-analysis providers used by the service. We do not sell your personal data to third parties and do not operate an advertising model.',
			},
			{
				heading: 'International data transfers',
				body: 'KoreShield\'s primary hosted infrastructure is operated from the EEA. Some supporting providers and model-analysis providers may process limited service data outside the UK or EEA depending on the deployment and provider configuration. Our current transfer guidance is published at <a href="https://koreshield.com/legal/transfer-policy" class="underline">koreshield.com/legal/transfer-policy</a>.\n\nWhen cross-border processing is required, we rely on the safeguards and contractual terms made available for the relevant service providers, together with our vendor review process and any customer-specific contractual terms where applicable.',
			},
			{
				heading: 'Data retention',
				body: 'Raw prompt content: not retained. Prompts are processed in memory and discarded after each scan. Threat classification metadata: 7 days (Free), 30 days (Growth), 90 days (Scale), custom (Enterprise). Deleted within 30 days of account closure. Account data (name, email, company): duration of account plus 12 months post-closure. API keys: until revoked or account closure (SHA-256 hash only, plaintext never retained). Billing records: 7 years from transaction date (Companies Act / HMRC legal obligation). Support communications: 3 years from last interaction. Security and authentication logs: 12 months. Marketing consent records: until withdrawal plus 12 months. Anonymised flywheel data (opt-in only): indefinite, as anonymised data is not subject to retention limits.\n\nOn account closure we will delete or anonymise your personal data within 30 days, except where retention is required by law.',
			},
			{
				heading: 'Your rights under UK GDPR',
				body: 'You have the following rights in relation to personal data we hold about you as data controller. To exercise any of these rights, email hello@koreshield.com. We will respond within one calendar month.\n\nRight of access (Art. 15): request a copy of the personal data we hold about you. Right to rectification (Art. 16): ask us to correct inaccurate or incomplete data. Right to erasure (Art. 17): ask us to delete your data in certain circumstances. Right to restrict processing (Art. 18): ask us to pause processing while a complaint is investigated. Right to data portability (Art. 20): request your data in a structured machine-readable format where processing is automated and based on consent or contract. Right to object (Art. 21): object to processing based on legitimate interests. We will stop unless we have compelling legitimate grounds. Right to withdraw consent (Art. 7(3)): where we rely on consent, you can withdraw it at any time without affecting prior processing.\n\nNote on prompt data: given our zero-log architecture, DSARs relating to prompt content will receive a response confirming that data is not held. Account information, billing records, and support communications can be provided on request.\n\nIf you are not satisfied with how we have handled a privacy concern you can complain to the Information Commissioner\'s Office (ICO) at <a href="https://ico.org.uk" class="underline">ico.org.uk</a> or call 0303 123 1113.',
			},
			{
				heading: 'Security',
				body: 'We implement appropriate technical and organisational security measures to protect your personal data, including TLS encryption for data in transit, hashed passwords and API keys, tenant-scoped access controls, and restricted administrative access to production systems. Our hosted infrastructure is operated through managed cloud providers and protected by operational logging and access controls appropriate to the service.\n\nIf a personal data breach occurs, we will respond in line with applicable law and any contractual commitments in place with the affected customer.',
			},
			{
				heading: 'Cookies',
				body: 'We use strictly necessary cookies for authentication and platform security and may use limited analytics or preference cookies where configured. See our Cookie Policy at <a href="https://koreshield.com/cookies" class="underline">koreshield.com/cookies</a> for the current description of categories we use and how to manage them.',
			},
			{
				heading: 'Changes to this policy',
				body: 'We may update this Privacy Policy from time to time. For material changes we will notify you by email and/or a prominent notice on the Platform at least 30 days before the change takes effect. The version number and date at the top of this document always reflect the most recent update. Your continued use of the Services after the effective date constitutes acceptance of the changes, except where we are required by law to obtain your explicit consent.',
			},
			{
				heading: 'Contact',
				body: 'Privacy enquiries, Data Subject Access Requests, security enquiries, and breach notifications: hello@koreshield.com. Post: Koreshield Labs Ltd, 3rd Floor, 86-90 Paul Street, London, EC2A 4NE. ICO: <a href="https://ico.org.uk" class="underline">ico.org.uk</a> · 0303 123 1113.',
			},
		],
	},

	'/terms-of-service': {
		title: 'Terms of Service',
		effective: '17 April 2026',
		sections: [
			{
				heading: 'Important: please read carefully',
				body: 'These Terms of Service ("Terms") constitute a legally binding agreement between you ("Developer" or "Customer") and Koreshield Labs Ltd governing your access to and use of the KoreShield API, SDK, and related services. By accessing or using the Services, you agree to be bound by these Terms. If you are entering into these Terms on behalf of a company or other legal entity, you represent that you have the authority to bind that entity. If you do not have such authority, or if you do not agree to these Terms, you must not access or use the Services.\n\nKoreShield means Koreshield Labs Ltd, a company incorporated in England and Wales with company number 17057784, whose registered office is at 3rd Floor, 86-90 Paul Street, London, EC2A 4NE.',
			},
			{
				heading: 'The Services',
				body: 'KoreShield provides an AI security inspection layer that operates as a reverse proxy between your application and your chosen LLM provider (OpenAI, Anthropic, Google, Azure, or any OpenAI-compatible endpoint). You change the base URL of your LLM API calls to the KoreShield proxy endpoint. No other code change is required. Every API request including the prompt, system message, and conversation history passes through the KoreShield inspection layer before forwarding to the LLM provider. The Services inspect requests and responses in real time, apply your configured detection policies, and either pass the request through or return a structured policy violation response.\n\nCurrent detection coverage includes: direct prompt injection; indirect and RAG-poisoning attacks; PII and credential leakage in both requests and responses; agent tool-call policy enforcement in agentic pipelines; response filtering for data exfiltration attempts; and custom policy rule enforcement. Known coverage gaps are documented in the OWASP LLM Top 10 mapping in the <a href="/docs" class="underline">Documentation</a>.\n\nBy design the Services fail closed: if KoreShield is unavailable, requests do not reach the LLM provider. No unscanned prompt passes through on service failure. Implement appropriate retry logic and fallback handling at your application layer.',
			},
			{
				heading: 'Service tiers',
				body: 'KoreShield offers hosted and enterprise plans with different request allowances, retention windows, support channels, and administrative features. Current public pricing and feature summaries are published at <a href="https://koreshield.com/pricing" class="underline">koreshield.com/pricing</a>.\n\nEnterprise deployments may also be governed by an Order Form, statement of work, or separate commercial agreement covering deployment model, support expectations, retention, and any additional security or compliance commitments.',
			},
			{
				heading: 'Account and API key security',
				body: 'You are responsible for maintaining the confidentiality of your account credentials and API keys, all activities that occur under your account whether or not authorised, and promptly notifying us at hello@koreshield.com of any unauthorised access. API keys must be stored securely and must not be embedded in client-side code, committed to public repositories, or shared with unauthorised parties. API keys are prefixed with ks_ and shown once at creation. Store them securely. If you lose one, generate a new key from the dashboard.',
			},
			{
				heading: 'Acceptable use: what you may not do',
				body: 'You must not, and must not permit any third party to: use the Services to build offensive attack tools, adversarial prompt injection generation tooling, or any capability designed to attack AI systems or other systems without authorisation; train, fine-tune, or develop a competing LLM security model using our detection outputs, threat classifications, or any data derived from the Services; resell, sub-licence, or white-label the Services without a separate written OEM agreement with KoreShield; reverse-engineer, decompile, or attempt to derive the source code, detection logic, model weights, or proprietary rules of the Services; interfere with or attempt to gain unauthorised access to the Services or connected systems; use the Services to process illegal content or content designed to harm individuals, including CSAM or CBRN-enabling content; use the Services in violation of applicable export control laws or sanctions administered by OFSI, OFAC, or the European Commission; or circumvent rate limits, authentication mechanisms, or the fail-closed proxy architecture.',
			},
			{
				heading: 'Your responsibilities as a developer',
				body: 'You are responsible for: ensuring your use of the Services complies with all applicable laws and regulations; disclosing in your own privacy policy and terms of service that prompts submitted to your application may be processed by KoreShield as a security sub-processor; obtaining all necessary consents from your end users for the processing of their data by the Services; including KoreShield in your sub-processor list if you operate under a DPA with your own customers; and ensuring the security of your integration including the secure storage of API keys. You are also solely responsible for ensuring your use of the Services complies with the terms of service of your chosen LLM provider.',
			},
			{
				heading: 'Intellectual property',
				body: 'All intellectual property rights in the Services, Platform, SDK, Documentation, detection engine, detection models, and threat classification logic are and remain the exclusive property of Koreshield Labs Ltd. Subject to these Terms and payment of applicable fees, we grant you a limited, non-exclusive, non-transferable, revocable licence to access and use the API and Platform for the permitted purpose of protecting your AI applications; integrate and use the SDK in your applications; and use the Documentation in connection with your authorised use of the Services. You retain all intellectual property rights in your own applications and Customer Data. You may not remove or alter any proprietary notices on the Services or SDK, use KoreShield\'s name or trade marks without prior written consent, or represent that your application is developed or endorsed by KoreShield.',
			},
			{
				heading: 'Data processing and privacy',
				body: 'To the extent the Services involve KoreShield processing personal data on your behalf, the parties are bound by the KoreShield Data Processing Agreement (DPA), at <a href="https://koreshield.com/dpa" class="underline">koreshield.com/dpa</a> and incorporated into these Terms by reference. If there is any conflict between these Terms and the DPA regarding the processing of personal data, the DPA prevails.\n\nKoreShield operates a zero-log default architecture for raw prompt content in the hosted product. Threat metadata retention and any model-improvement or audit-capture options depend on your plan, deployment, and configuration. Our Privacy Policy is at <a href="https://koreshield.com/privacy" class="underline">koreshield.com/privacy</a>.',
			},
			{
				heading: 'Billing and payment',
				body: 'Fees for paid tiers are as set out at <a href="https://koreshield.com/pricing" class="underline">koreshield.com/pricing</a> or in an Order Form, and are stated exclusive of VAT which will be applied where applicable. Fees are due in advance of the billing period and are processed by Polar, our PCI-DSS compliant payment processor. You may upgrade your tier at any time with immediate effect; downgrades take effect at the end of the current billing period. We may update our pricing with 30 days\' notice; continued use of the Services after a price change constitutes acceptance.',
			},
			{
				heading: 'Service levels and credits',
				body: 'Unless we expressly agree otherwise in writing, the Services are provided without a separate contractual service level agreement or service credit regime. Where service levels, response targets, or service credits are offered, they are set out in the applicable pricing page, plan terms, or enterprise agreement and apply only to the customer and service scope described there.',
			},
			{
				heading: 'Warranties and security disclaimer',
				body: 'We warrant that we have the right to grant the licences in these Terms, the Services will perform materially in accordance with the Documentation, and we will provide the Services with reasonable skill and care. Except as expressly stated, the Services are provided "as is" and "as available".\n\nNo security product provides complete protection against all threats. The Services may not detect all prompt injection, RAG poisoning, jailbreak, or other LLM attack techniques, particularly novel attacks. KoreShield makes no warranty that the Services will prevent all security incidents in your AI application. We are not liable for harm caused by attacks that bypass detection (false negatives). Known detection coverage limitations are documented in the OWASP LLM Top 10 mapping in our Documentation.',
			},
			{
				heading: 'Limitation of liability',
				body: 'To the maximum extent permitted by applicable law, KoreShield\'s total aggregate liability for any claim arising from or in connection with these Terms shall not exceed the greater of: (a) total fees paid by you in the 12 months immediately preceding the event giving rise to the claim; or (b) £1,000.\n\nKoreShield shall not be liable for loss of profits, revenue, business, data, anticipated savings, or goodwill; or for any indirect, special, incidental, punitive, or consequential loss or damage.\n\nNothing in these Terms limits or excludes KoreShield\'s liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation, or any other liability that cannot be limited by applicable law.',
			},
			{
				heading: 'Confidentiality',
				body: 'Each party agrees to hold the other\'s confidential information in strict confidence, not to use it for any purpose other than performing obligations under these Terms, and to restrict disclosure to those who need to know and are bound by equivalent confidentiality obligations. Confidential information does not include information that is or becomes publicly known through no act of the receiving party, was rightfully in the receiving party\'s possession before disclosure, or is required to be disclosed by law with notice where legally permitted.\n\nKoreShield\'s detection engine logic, model weights, and proprietary rules are and remain KoreShield\'s confidential information. Your application architecture and Customer Data are your confidential information.',
			},
			{
				heading: 'Term and termination',
				body: 'These Terms commence when you first access the Services and continue until terminated. You may cancel at any time by cancelling your subscription in the Platform or emailing hello@koreshield.com; cancellation takes effect at the end of the current billing period.\n\nWe may suspend or terminate your access: immediately if you materially breach the acceptable use or confidentiality provisions; with 30 days\' notice for any other material breach uncured after 14 days\' notice; immediately on your insolvency; or with 30 days\' notice for convenience.\n\nOn termination all licences cease immediately, you must stop using the Services, API, and SDK, and you have 30 days to export your detection log data before account deletion. Accrued payment obligations survive termination, as do the clauses on intellectual property, confidentiality, warranties, limitation of liability, and governing law.',
			},
			{
				heading: 'General',
				body: 'These Terms, together with the DPA, Privacy Policy, Acceptable Use Policy, and any Order Form, constitute the entire agreement between the parties. If any provision is held invalid it will be modified to the minimum extent necessary to make it enforceable; the remainder continues in full force. No failure or delay in exercising any right constitutes a waiver. You may not assign or transfer rights under these Terms without our prior written consent. We may assign these Terms in connection with a merger, acquisition, or sale of assets. Neither party is liable for failure caused by circumstances beyond its reasonable control including LLM provider outages. A person who is not a party to these Terms has no rights under the Contracts (Rights of Third Parties) Act 1999 to enforce any term.',
			},
			{
				heading: 'Governing law',
				body: 'These Terms are governed by the laws of England and Wales. The parties irrevocably submit to the exclusive jurisdiction of the courts of England and Wales, provided that KoreShield may seek injunctive or other equitable relief in any court of competent jurisdiction to protect its intellectual property rights or confidential information.',
			},
			{
				heading: 'Contact',
				body: 'Legal enquiries, security and vulnerability disclosure, and support: hello@koreshield.com. Post: Koreshield Labs Ltd, 3rd Floor, 86-90 Paul Street, London, EC2A 4NE.',
			},
		],
	},

	'/cookie-policy': {
		title: 'Cookie Policy',
		effective: '17 April 2026',
		sections: [
			{
				heading: 'What are cookies?',
				body: 'Cookies are small text files stored on your device when you visit a website. They help us recognise your session, remember preferences, and understand how the site is used.',
			},
			{
				heading: 'Strictly necessary cookies',
				body: 'These cookies are required for the platform to function. They include session tokens (to keep you logged in) and CSRF protection tokens. These cannot be disabled.',
			},
			{
				heading: 'Analytics cookies',
				body: 'We use privacy-respecting analytics (no cross-site tracking, IP anonymisation enabled) to understand which features are most used and where users encounter friction. These are optional.',
			},
			{
				heading: 'Managing cookies',
				body: 'You can disable optional cookies in your browser settings. Disabling strictly necessary cookies will prevent you from logging in to the dashboard.',
			},
			{
				heading: 'Contact',
				body: 'Questions about our cookie usage: hello@koreshield.com.',
			},
		],
	},

	'/dpa': {
		title: 'Data Processing Agreement',
		effective: '17 April 2026',
		sections: [
			{
				heading: 'What this agreement is',
				body: 'This Data Processing Agreement sets out how KoreShield handles personal data on your behalf when you use our services. It is a legal document required by UK GDPR Article 28 whenever a company processes personal data on behalf of another company.\n\nIn plain terms: you are the Controller (you decide what data gets processed and why). We are the Processor (we handle data on your instructions). This agreement sets out what each of us is responsible for.\n\nThis agreement is part of our Terms of Service. If there is a conflict between the two on anything related to personal data, this agreement takes precedence.\n\nKoreShield Labs Ltd, 3rd Floor, 86-90 Paul Street, London, EC2A 4NE (Company No. 17057784). Questions: hello@koreshield.com.',
			},
			{
				heading: 'Key terms explained',
				body: 'Controller: you. You decide what personal data is processed and why.\n\nProcessor: us (KoreShield). We process personal data on your behalf and on your instructions only.\n\nYour personal data: any personal data we handle on your behalf through the services, primarily the threat classification metadata we store, and transiently the prompt content we scan.\n\nData Subject: any individual whose personal data we process, typically your end users.\n\nPersonal Data Breach: any accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to your personal data.\n\nSub-processor: any third party we bring in to help deliver the services who also handles your data. These are listed in the sub-processors section below.\n\nApplicable law: UK GDPR and the Data Protection Act 2018, plus EU GDPR where it applies.',
			},
			{
				heading: 'What we actually process',
				body: 'What we do: we sit as a security proxy between your application and your LLM provider. Every API request passes through our inspection layer in real time. We check it for threats, block or pass it through, and do the same on the way back.\n\nPrompt content: the actual text of the prompts your users send is processed in working memory for the duration of the scan and is not persisted by default in the hosted configuration. There is nothing to return, delete, or hand over where raw prompt content was never stored.\n\nWhat we do store: threat classification records. When something is flagged or blocked, we record the threat type, block decision, timestamp, and an identifier for your account and the request. We do not store the prompt text alongside these records by default.\n\nPurpose: to detect and block prompt injection, RAG poisoning, jailbreaks, PII leakage, credential exposure, and other LLM security threats in your application.\n\nWho it affects: your end users, whose prompts pass through our system.\n\nHow long we keep it: retention depends on your plan, deployment, and account lifecycle. Public plan summaries are available on the pricing page, and customer-specific retention may be governed by contract or configuration.',
			},
			{
				heading: 'What we will and will not do',
				body: 'We will only process your data on your instructions. We will not use it for anything else.\n\nIf a law ever required us to process your data in a way that contradicts your instructions, we would tell you before doing so (where the law allows us to say so).\n\nEveryone at KoreShield who has access to your data is bound by confidentiality obligations.\n\nWe will not hand your data to anyone, including law enforcement, without your consent unless the law requires it. Where it does, we will tell you first if we are permitted to.\n\nIf we ever think an instruction you give us would break data protection law, we will flag it to you straight away and may pause processing until it is resolved.\n\nWe will help you respond to your end users when they exercise their rights under UK GDPR. Because we do not store prompt content, most data subject access requests will result in us confirming we hold nothing. We will do that within 10 business days.\n\nWe will help you meet your own GDPR obligations around security, breach notification, data protection impact assessments, and ICO consultation.',
			},
			{
				heading: 'Your responsibilities',
				body: 'You are responsible for having a lawful basis under UK GDPR for sharing personal data with us and asking us to process it.\n\nYou must tell your end users in your own privacy policy that their prompts may pass through KoreShield as a security sub-processor.\n\nWhere possible, avoid sending us personal data that is not necessary for the security scan. The less you send, the less risk there is.\n\nYou remain responsible for your own GDPR compliance: keeping your own records of processing, running your own data protection impact assessments where required, and naming KoreShield as a sub-processor in any DPAs you have with your own customers.',
			},
			{
				heading: 'Audit logging',
				body: 'By default, we do not store prompt content. If you are on the Growth or Enterprise tier, you can optionally enable audit logging of flagged prompts within your own environment. In the on-premise deployment model, this data never leaves your infrastructure at all. Where you enable audit logging, you are the controller of that data and you are responsible for it.',
			},
			{
				heading: 'Sub-processors',
				body: 'These are the categories of third-party providers we use to deliver the service: hosting and infrastructure, network delivery and TLS termination, subscription billing, documentation and website tooling, transactional email, and model-analysis providers used by the detection engine.\n\nOur current public sub-processor list identifies the providers we use at the time of publication. We may update that list as the service evolves and will handle customer notice obligations through the applicable contract, account communications, or customer success process where required.\n\nOne important distinction: the LLM your application connects to directly remains your provider relationship. KoreShield may also use separate model-analysis providers within the detection engine depending on service configuration.',
			},
			{
				heading: 'International data transfers',
				body: 'Hosted customer account data and threat records are operated primarily from the EEA. Depending on your deployment and the providers enabled for analysis or support functions, limited service data may also be processed outside the UK or EEA.\n\nWhen such processing occurs, KoreShield uses the contractual and operational safeguards available for the relevant providers and reviews those relationships as part of vendor management. Customers with stricter residency or deployment requirements should contact hello@koreshield.com before enabling the relevant provider configuration.',
			},
			{
				heading: 'Security',
				body: 'We implement technical and organisational measures to protect your data. In practice this includes request inspection before provider forwarding, tenant-scoped access controls, hashed credentials, encrypted transport, restricted administrative access, and automated testing in the development workflow.\n\nKoreShield records operational and threat metadata needed to run the service and investigate issues, but the exact retention and mutability characteristics of those records depend on the storage system, deployment model, and customer configuration.\n\nIf KoreShield becomes unavailable, requests may fail or be rejected rather than being processed normally through the service. Customers are responsible for implementing the retry and fallback behavior appropriate for their own application architecture.',
			},
			{
				heading: 'If there is a data breach',
				body: 'If we discover a personal data breach affecting your data, we will notify the affected customer without undue delay after becoming aware of it, together with the information reasonably available at the time. Follow-up updates may be provided as the investigation continues.\n\nYou are responsible for deciding whether to notify regulators or your end users where the law requires it, and we will provide reasonable cooperation required under applicable law or contract.\n\nOur notice of a breach does not by itself constitute an admission of liability.',
			},
			{
				heading: 'Your data when you leave',
				body: 'Your threat records are available in the dashboard throughout your subscription. You can export them at any time.\n\nWhen you cancel or your account closes, you have 30 days to export your data. After that we delete it. We will confirm deletion in writing within 30 days of your account closing.\n\nWe may keep some data longer where the law requires it (billing records, for example) but it stays protected under this agreement until it is deleted.\n\nBecause we never stored prompt content in the first place, there is nothing to return or delete there.',
			},
			{
				heading: 'Auditing us',
				body: 'You have the right to check that we are meeting our obligations. You can ask us for documentation, or request a formal audit carried out by you or someone you appoint.\n\nFor an audit: give us at least 30 days written notice, audits happen during business hours, and no more than once a year unless you have good reason to think something has gone wrong. We may decline to share information that would expose other customers\' confidential data.\n\nIn many cases we can satisfy your request by sharing our security certifications, completed security questionnaire, or a VAPT report summary without the need for a full on-site audit.\n\nYou cover the cost of the audit. If it turns up a real breach on our part, we cover our own remediation costs.',
			},
			{
				heading: 'Liability',
				body: 'Each party\'s liability under this agreement follows the limits set out in the Terms of Service. If either of us causes a regulatory fine or third-party claim through our own breach of data protection law, we are each responsible for our own actions.',
			},
			{
				heading: 'How long this lasts',
				body: 'This agreement starts when you first use the services and runs alongside the Terms of Service. It ends automatically when the Terms of Service end. The sections on data breaches, returning your data, audits, and liability continue to apply after it ends.',
			},
			{
				heading: 'Governing law',
				body: 'This agreement is governed by the laws of England and Wales. Any disputes go to the courts of England and Wales.',
			},
		],
	},

	'/legal/sub-processors': {
		title: 'Sub-Processor List',
		effective: '21 April 2026',
		sections: [
			{
				heading: 'About this list',
				body: 'This page identifies the third-party providers KoreShield uses to operate the hosted service at the time of publication. It is a public summary for customer review and does not replace any customer-specific DPA, Order Form, or enterprise security schedule.',
			},
			{
				heading: 'Infrastructure and delivery',
				body: 'Hetzner Online GmbH is used for primary hosted infrastructure. Cloudflare is used for CDN, TLS termination, and edge delivery functions. These providers support availability, traffic routing, and service delivery for the hosted platform.',
			},
			{
				heading: 'Billing and communications',
				body: 'Polar is used for hosted billing and subscription management. EmailJS is used for transactional email delivery. Sanity is used for blog and documentation content management. These providers support customer communications and commercial operations rather than prompt scanning itself.',
			},
			{
				heading: 'Detection and model-analysis providers',
				body: 'Depending on service configuration, KoreShield may use model-analysis providers such as OpenAI, Google Gemini or Vertex AI, Microsoft Azure OpenAI, and DeepSeek as part of the detection engine. Provider availability depends on configuration, enabled integrations, and customer deployment choices.',
			},
			{
				heading: 'Updates',
				body: 'We may update this list from time to time as the service evolves. Where a customer contract requires notice or objection handling for sub-processor changes, those obligations are managed through the applicable contract or customer communication channel.',
			},
		],
	},

	'/legal/transfer-policy': {
		title: 'Cross-Border Transfer Policy',
		effective: '21 April 2026',
		sections: [
			{
				heading: 'Hosted service footprint',
				body: 'KoreShield operates its primary hosted service footprint from the EEA. Customer account records, operational metadata, and threat metadata are intended to remain within that hosted footprint unless a supporting provider or customer-selected configuration requires otherwise.',
			},
			{
				heading: 'When cross-border processing can occur',
				body: 'Cross-border processing can arise when customers enable third-party analysis providers, use globally distributed delivery services, or contract for support and communications workflows that involve providers outside the UK or EEA. The exact data involved depends on the provider and workflow in use.',
			},
			{
				heading: 'How we approach safeguards',
				body: 'KoreShield reviews provider terms, available contractual safeguards, and deployment implications as part of vendor onboarding and ongoing service operation. Customers with stricter residency or sovereignty requirements should request a deployment review before enabling the relevant provider configuration.',
			},
			{
				heading: 'Customer options',
				body: 'Enterprise and customer-specific deployments may support different provider selections, retention controls, or private deployment models. If your organisation needs stricter residency boundaries, contact hello@koreshield.com before rollout so the available options can be scoped appropriately.',
			},
		],
	},

};

export default function LegalPage() {
	const { pathname } = useLocation();
	const page = pages[canonicalPathname(pathname)];

	if (!page) return null;

	return (
		<div className="min-h-screen bg-background text-foreground transition-colors">
			<SEOMeta title={page.title} description={`KoreShield ${page.title}`} />

			<div className="max-w-3xl mx-auto px-6 py-20">
				<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
					<Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
						<ArrowLeft className="w-4 h-4" />
						Back to home
					</Link>

					<h1 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">{page.title}</h1>
					<p className="text-sm text-muted-foreground mb-12">Effective {page.effective} · Koreshield Labs Ltd</p>

					<div className="space-y-10">
						{page.sections.map((s) => (
							<div key={s.heading}>
								<h2 className="text-lg font-semibold text-foreground mb-3">{s.heading}</h2>
								<p className="text-muted-foreground leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: s.body }} />
							</div>
						))}
					</div>

					<div className="mt-16 pt-8 border-t border-border text-xs text-muted-foreground">
						Questions? Email{' '}
						<a href="mailto:hello@koreshield.com" className="text-primary hover:underline">hello@koreshield.com</a>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
