import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { MDXProvider } from '@mdx-js/react';
import { Menu, X, ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import { Cards, Card } from '../components/mdx/Cards';
import { Pre } from '../components/mdx/CodeBlock';
import { Callout } from '../components/mdx/Callout';
import { Accordion, AccordionGroup } from '../components/mdx/Accordion';

// Types
interface MDXModule {
    default: React.ComponentType;
    frontmatter: Record<string, string>;
}

interface Meta {
    pages: string[];
}

// Function to normalize slugs
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
const slugMap: Record<string, MDXModule> = {};
Object.entries(modules).forEach(([path, mod]) => {
    const slug = normalizeSlug(path);
    slugMap[slug] = mod as MDXModule;
});

// Build Sidebar Navigation
interface NavItem {
    type: 'header' | 'link';
    title: string;
    slug?: string;
    group?: string; // Parent group for breadcrumbs
}

function buildNavigation() {
    const nav: NavItem[] = [];
    const rootMeta = metaFiles['/content/docs/meta.json'] as Meta;
    if (!rootMeta) return nav;

    rootMeta.pages.forEach((page: string) => {
        if (page.startsWith('---')) {
            nav.push({ type: 'header', title: page.replace(/---/g, '') });
        } else if (page.startsWith('...')) {
            const groupName = page.replace('...', '').replace(/[()]/g, ''); // Fix: remove parens
            const groupMetaPath = `/content/docs/${groupName}/meta.json`;
            const groupMeta = metaFiles[groupMetaPath] as Meta;

            if (groupMeta && groupMeta.pages) {
                // Determine group title from meta.json title or fallback to folder name
                // @ts-ignore
                const groupTitle = groupMeta.title || formatTitle(groupName);

                // Add group header if not strictly "features" etc. to avoid dupes if header exists
                // But typically ...group follows a header.

                groupMeta.pages.forEach((subPage: string) => {
                    // Check if subPage is a header inside the group (nested headers)
                    if (subPage.startsWith('---')) {
                        nav.push({ type: 'header', title: subPage.replace(/---/g, '') });
                    } else {
                        nav.push({ type: 'link', slug: subPage, title: formatTitle(subPage), group: groupTitle });
                    }
                });
            }
        } else {
            nav.push({ type: 'link', slug: page, title: page === 'index' ? 'Introduction' : formatTitle(page) });
        }
    });

    return nav;
}

function formatTitle(slug: string) {
    if (slug === 'api') return 'API';
    if (slug === 'sdk') return 'SDK';
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Table of Contents Component
function TableOfContents() {
    const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        const elements = Array.from(document.querySelectorAll('h2, h3'));

        // Add IDs if missing
        const extracted = elements.map((elem, index) => {
            if (!elem.id) {
                elem.id = `heading-${index}`;
            }
            return {
                id: elem.id,
                text: elem.textContent || '',
                level: Number(elem.tagName.substring(1))
            };
        });
        setHeadings(extracted);

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '-20% 0px -35% 0px' }
        );

        elements.forEach((elem) => observer.observe(elem));
        return () => observer.disconnect();
    }, [window.location.pathname]); // Re-run on route change

    if (headings.length === 0) return null;

    return (
        <div className="hidden xl:block w-64 shrink-0 pl-8 border-l border-slate-800 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto">
            <h4 className="text-sm font-semibold text-white mb-4">On this page</h4>
            <ul className="space-y-2 text-sm">
                {headings.map((heading) => (
                    <li key={heading.id} style={{ paddingLeft: (heading.level - 2) * 12 }}>
                        <a
                            href={`#${heading.id}`}
                            className={`block transition-colors hover:text-white ${activeId === heading.id ? 'text-electric-green' : 'text-gray-500'
                                }`}
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' });
                                setActiveId(heading.id);
                            }}
                        >
                            {heading.text}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function DocsPage() {
    const { slug } = useParams();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const { pathname } = useLocation();

    const currentSlug = slug || 'index';
    const Content = slugMap[currentSlug]?.default;
    const meta = slugMap[currentSlug]?.frontmatter || {};

    const navigation = useMemo(() => buildNavigation(), []);

    const currentIndex = navigation.findIndex(item => item.slug === currentSlug);
    const currentItem = navigation[currentIndex];

    // Calculate Prev/Next
    // Filter only links for indexing
    const linkItems = navigation.filter(item => item.type === 'link');
    const linkIndex = linkItems.findIndex(item => item.slug === currentSlug);

    const prevItem = linkIndex > 0 ? linkItems[linkIndex - 1] : null;
    const nextItem = linkIndex < linkItems.length - 1 ? linkItems[linkIndex + 1] : null;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

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
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden p-2 hover:bg-slate-800 rounded"
                            aria-label="Toggle Menu"
                        >
                            {isSidebarOpen ? <X /> : <Menu />}
                        </button>
                        <Link to="/" className="text-xl font-bold flex items-center gap-2">
                            <img src="/logo/SVG/White.svg" alt="KoreShield Logo" className="w-8 h-8" />
                            <span>Kore<span className="text-electric-green">Shield</span> <span className="text-sm text-gray-500 font-normal">Docs</span></span>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="flex-1 max-w-[1600px] mx-auto w-full flex">
                {/* Sidebar */}
                <aside className={`
                    fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-black border-r border-slate-800 pl-6 pr-2 py-6 overflow-y-auto transform transition-transform z-40 ease-in-out duration-300
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    <nav className="space-y-1 pb-10">
                        {navigation.map((item, i) => (
                            item.type === 'header' ? (
                                <div key={i} className="mt-8 mb-3 text-xs font-bold text-gray-500 uppercase tracking-wider px-3">
                                    {item.title}
                                </div>
                            ) : (
                                <Link
                                    key={i}
                                    to={item.slug === 'index' ? '/docs' : `/docs/${item.slug}`}
                                    className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${currentSlug === item.slug
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

                {/* Main Content Area */}
                <main className="flex-1 min-w-0 px-6 py-12 lg:px-12 flex gap-12">
                    <div className="flex-1 min-w-0 max-w-4xl mx-auto">
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8 overflow-x-auto whitespace-nowrap">
                            <Link to="/docs" className="hover:text-white">Docs</Link>
                            {currentItem?.group && (
                                <>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                    <span>{currentItem.group}</span>
                                </>
                            )}
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span className="text-gray-300 font-medium truncate">{meta.title || formatTitle(currentSlug)}</span>
                        </div>

                        <div className="prose prose-invert prose-emerald max-w-none">
                            <h1 className="text-4xl font-bold mb-4">{meta.title}</h1>
                            {meta.description && <p className="text-xl text-gray-400 mb-12 pb-8 border-b border-slate-800 leading-relaxed">{meta.description}</p>}

                            <MDXProvider components={{ Cards, Card, pre: Pre, Callout, Accordion, AccordionGroup }}>
                                <Content />
                            </MDXProvider>
                        </div>

                        {/* Prev/Next Navigation */}
                        <div className="mt-20 pt-8 border-t border-slate-800 grid sm:grid-cols-2 gap-4">
                            {prevItem ? (
                                <Link to={prevItem.slug === 'index' ? '/docs' : `/docs/${prevItem.slug}`} className="group border border-slate-800 rounded-lg p-4 hover:border-electric-green transition-colors text-left bg-slate-900/50">
                                    <div className="text-xs text-gray-500 mb-1 group-hover:text-electric-green transition-colors">Previous</div>
                                    <div className="font-semibold text-white flex items-center gap-2">
                                        <ArrowLeft className="w-4 h-4" />
                                        {prevItem.title}
                                    </div>
                                </Link>
                            ) : <div />}

                            {nextItem && (
                                <Link to={`/docs/${nextItem.slug}`} className="group border border-slate-800 rounded-lg p-4 hover:border-electric-green transition-colors text-right bg-slate-900/50">
                                    <div className="text-xs text-gray-500 mb-1 group-hover:text-electric-green transition-colors">Next</div>
                                    <div className="font-semibold text-white flex items-center justify-end gap-2">
                                        {nextItem.title}
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Table of Contents */}
                    <TableOfContents />
                </main>
            </div>
        </div>
    );
}

export default DocsPage;
