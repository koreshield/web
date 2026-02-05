import { SEOMeta } from '../components/SEOMeta';

const RELEASES = [
    {
        version: '0.3.0',
        date: '2024-05-20',
        title: 'RAG Defense Engine',
        description: 'Introducing comprehensive protection for Referral-Augmented Generation systems.',
        changes: [
            'RAG Context Scanning: Detect indirect prompt injection in retrieved documents.',
            'Cross-Document Correlation: Identify attacks split across multiple chunks.',
            'New SDK Methods: `scan_rag_context` (Python) and `scanRAGContext` (JS).',
            'CRM Integrations: Templates for Salesforce, HubSpot, and Zendesk.',
            'Expanded Taxonomy: 5-dimensional classification for RAG threats.'
        ],
        tag: 'Major'
    },
    {
        version: '0.2.1',
        date: '2024-04-10',
        title: 'Performance Optimization',
        description: 'Significant latency improvements for the proxy engine.',
        changes: [
            'Reduced average latency by 40%.',
            'Added persistent connection pooling.',
            'Improved PI removal accuracy.'
        ],
        tag: 'Patch'
    },
    {
        version: '0.2.0',
        date: '2024-03-01',
        title: 'Multi-Provider Support',
        description: 'Added support for Anthropic and DeepSeek models.',
        changes: [
            'Anthropic Claude 3 support.',
            'DeepSeek Coder support.',
            'Unified API interface for all providers.',
            'Customizable rate limiting per provider.'
        ],
        tag: 'Minor'
    }
];

function ChangelogPage() {
    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-20">
            <SEOMeta
                title="Changelog | KoreShield"
                description="Latest updates, releases, and improvements to the KoreShield platform."
            />

            <div className="max-w-4xl mx-auto px-6">
                <div className="mb-16">
                    <h1 className="text-4xl font-bold mb-4">Changelog</h1>
                    <p className="text-xl text-gray-400">Track the evolution of KoreShield.</p>
                </div>

                <div className="space-y-12 relative border-l border-slate-800 ml-3 md:ml-0 pl-8 md:pl-0">
                    {RELEASES.map((release, index) => (
                        <div key={index} className="relative md:grid md:grid-cols-4 md:gap-8">
                            {/* Timeline Date */}
                            <div className="hidden md:block text-right pt-1">
                                <div className="text-sm font-mono text-gray-500">{release.date}</div>
                            </div>

                            {/* Timeline Dot */}
                            <div className="absolute -left-[37px] md:left-[calc(25%-5px)] top-2 w-3 h-3 rounded-full bg-slate-800 border-2 border-slate-900 ring-4 ring-black group-hover:bg-electric-green transition-colors">
                                {index === 0 && <span className="absolute -top-1 -left-1 w-5 h-5 bg-electric-green/20 rounded-full animate-ping"></span>}
                            </div>

                            <div className="md:col-span-3 pb-8 border-b border-slate-900 last:border-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-2xl font-bold text-white">{release.version}</h2>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${release.tag === 'Major'
                                            ? 'bg-electric-green text-black'
                                            : 'bg-slate-800 text-gray-400'
                                        }`}>
                                        {release.tag}
                                    </span>
                                    {/* Mobile Date */}
                                    <span className="md:hidden text-xs font-mono text-gray-500 ml-auto">{release.date}</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-200 mb-3">{release.title}</h3>
                                <p className="text-gray-400 mb-6">{release.description}</p>

                                <ul className="space-y-2">
                                    {release.changes.map((change, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-700 shrink-0"></span>
                                            {change}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ChangelogPage;
