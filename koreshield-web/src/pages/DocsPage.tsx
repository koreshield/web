import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MDXProvider } from '@mdx-js/react';
import { Menu, X, ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';
import { Cards, Card } from '../components/mdx/Cards';

// Function to normalize slugs (handle group folders)
// /content/docs/(group)/file.mdx -> file
// /content/docs/file.mdx -> file
const normalizeSlug = (path: string) => {
    return path
        .split('/')
        .pop()
        ?.replace('.mdx', '') || '';
};

// Load all MDX files
const modules = import.meta.glob('/content/docs/**/*.mdx', { eager: true });
const metaFiles = import.meta.glob('/content/docs/**/meta.json', { eager: true });

// Build slug map
const slugMap: Record<string, any> = {};
Object.entries(modules).forEach(([path, mod]) => {
    const slug = normalizeSlug(path);
    slugMap[slug] = mod;
});

// Build Sidebar Navigation
// Reads root meta.json and traverses
function buildNavigation() {
    const nav: any[] = [];
    const rootMeta = metaFiles['/content/docs/meta.json'] as any;

    if (!rootMeta) return nav;

    rootMeta.pages.forEach((page: string) => {
        if (page.startsWith('---')) {
            nav.push({ type: 'header', title: page.replace(/---/g, '') });
        } else if (page.startsWith('...')) {
            // Group reference: ...(getting-started)
            const groupName = page.replace('...', '');
            const groupMetaPath = `/content/docs/${groupName}/meta.json`;
            const groupMeta = metaFiles[groupMetaPath] as any;

            if (groupMeta && groupMeta.pages) {
                groupMeta.pages.forEach((subPage: string) => {
                    nav.push({ type: 'link', slug: subPage, title: formatTitle(subPage) });
                });
            }
        } else {
            nav.push({ type: 'link', slug: page, title: page === 'index' ? 'Introduction' : formatTitle(page) });
        }
    });

    return nav;
}

function formatTitle(slug: string) {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function DocsPage() {
    const { slug } = useParams();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const currentSlug = slug || 'index';
    const Content = slugMap[currentSlug]?.default;
    const meta = slugMap[currentSlug]?.frontmatter || {};

    // Navigation Data
    const navigation = buildNavigation();

    if (!Content) {
        return (
            <div className="min-h-screen bg-black text-white p-20 text-center">
                <h1 className="text-4xl mb-4">404 - Doc Not Found</h1>
                <Link to="/docs" className="text-electric-green">Go back to docs</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Header */}
            <header className="border-b border-slate-800 bg-black/50 backdrop-blur sticky top-0 z-50">
                <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden p-2 hover:bg-slate-800 rounded"
                        >
                            {isSidebarOpen ? <X /> : <Menu />}
                        </button>
                        <Link to="/" className="text-xl font-bold flex items-center gap-2">
                            Kore<span className="text-electric-green">Shield</span> <span className="text-sm text-gray-500 font-normal">Docs</span>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="flex-1 max-w-[1400px] mx-auto w-full flex">
                {/* Sidebar */}
                <aside className={`
                    fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-black border-r border-slate-800 p-6 overflow-y-auto transform transition-transform z-40
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    <nav className="space-y-1">
                        {navigation.map((item, i) => (
                            item.type === 'header' ? (
                                <div key={i} className="mt-8 mb-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {item.title}
                                </div>
                            ) : (
                                <Link
                                    key={i}
                                    to={item.slug === 'index' ? '/docs' : `/docs/${item.slug}`}
                                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${currentSlug === item.slug
                                        ? 'bg-electric-green/10 text-electric-green font-medium'
                                        : 'text-gray-400 hover:text-white hover:bg-slate-900'
                                        }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    {item.title}
                                </Link>
                            )
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0 px-6 py-12 lg:px-12">
                    {/* Breadcrumbs / Back */}
                    {currentSlug !== 'index' && (
                        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-8">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                    )}

                    <div className="prose prose-invert prose-emerald max-w-4xl mx-auto">
                        <h1 className="text-4xl font-bold mb-4">{meta.title}</h1>
                        {meta.description && <p className="text-xl text-gray-400 mb-12 border-b border-slate-800 pb-8">{meta.description}</p>}

                        <MDXProvider components={{ Cards, Card }}>
                            <Content />
                        </MDXProvider>
                    </div>
                </main>
            </div>

            <Footer />
        </div>
    );
}

export default DocsPage;
