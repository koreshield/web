import { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MDXProvider } from '@mdx-js/react';
import { Menu, X, Search, ChevronRight, ExternalLink, Github, Loader2 } from 'lucide-react';
import { Cards, Card } from '../components/mdx/Cards';
import { Pre } from '../components/mdx/CodeBlock';
import { Callout } from '../components/mdx/Callout';
import { Accordion, AccordionGroup } from '../components/mdx/Accordion';
import { Table } from '../components/mdx/Table';


// Types
interface MDXModule {
    default: React.ComponentType;
    frontmatter: Record<string, string>;
}

interface Meta {
    pages: string[];
    title?: string;
}

// Function to normalize slugs to relative paths (e.g. 'intro/index')
const normalizeSlug = (path: string) => {
    // Remove /content/docs/ prefix and .mdx extension
    return path
        .replace('/content/docs/', '')
        .replace('/src/content/docs/', '') // Handle potential vite path differences
        .replace('.mdx', '');
};

// Lazy load MDX files
const mdxModules = import.meta.glob('/content/docs/**/*.mdx');
const metaFiles = import.meta.glob('/content/docs/**/meta.json', { eager: true });

// Build slug map for lazy loaders
const slugToPathMap: Record<string, string> = {};
Object.keys(mdxModules).forEach((path) => {
    const slug = normalizeSlug(path);
    slugToPathMap[slug] = path;
});

// Navigation Architecture
interface NavSection {
    title: string;
    items: NavItem[];
}

interface NavItem {
    title: string;
    slug: string;
}

function buildNavigation(): NavSection[] {
    const sections: NavSection[] = [];
    const rootMeta = metaFiles['/content/docs/meta.json'] as Meta;

    // Fallback if no meta.json (shouldn't happen in prod)
    if (!rootMeta) return [];

    let currentSection: NavSection = { title: 'Overview', items: [] };

    // This logic adapts the existing meta.json format to the new nested UI
    rootMeta.pages.forEach((page: string) => {
        if (page.startsWith('---')) {
            // Push previous section if it has items
            if (currentSection.items.length > 0) {
                sections.push(currentSection);
            }
            // Start new section
            currentSection = {
                title: page.replace(/---/g, ''),
                items: []
            };
        } else if (page.startsWith('...')) {
            // Handle subgroups (folders)
            const groupName = page.replace('...', '').replace(/[()]/g, '');
            const groupMetaPath = `/content/docs/${groupName}/meta.json`;
            const groupMeta = metaFiles[groupMetaPath] as Meta;

            if (groupMeta && groupMeta.pages) {
                groupMeta.pages.forEach((subPage: string) => {
                    // Skip separators in sub-menus for now, or handle them if needed
                    if (!subPage.startsWith('---')) {
                        // Construct full slug: "group/page"
                        const fullSlug = `${groupName}/${subPage}`;
                        currentSection.items.push({
                            title: formatTitle(subPage),
                            slug: fullSlug
                        });
                    }
                });
            }
        } else {
            // Top level pages
            currentSection.items.push({
                title: page === 'index' ? 'Introduction' : formatTitle(page),
                slug: page
            });
        }
    });

    // Push the last section
    if (currentSection.items.length > 0) {
        sections.push(currentSection);
    }

    return sections;
}

function formatTitle(slug: string) {
    if (slug === 'api') return 'API';
    if (slug === 'sdk') return 'SDK';
    if (slug === 'cli') return 'CLI';
    if (slug === 'faq') return 'FAQ';
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Table of Contents Component
function TableOfContents() {
    const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
    const [activeId, setActiveId] = useState<string>('');
    const { pathname } = useLocation();

    useEffect(() => {
        const timer = setTimeout(() => {
            const elements = Array.from(document.querySelectorAll('h2, h3'));
            const extracted = elements.map((elem, index) => {
                if (!elem.id) elem.id = `heading-${index}`;
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
                        if (entry.isIntersecting) setActiveId(entry.target.id);
                    });
                },
                { rootMargin: '-20% 0px -35% 0px' }
            );

            elements.forEach((elem) => observer.observe(elem));
            return () => observer.disconnect();
        }, 500);

        return () => clearTimeout(timer);
    }, [pathname]);

    if (headings.length === 0) return null;

    return (
        <div className="hidden xl:block w-64 shrink-0 border-l border-slate-800 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto p-6">
            <h5 className="mb-4 text-sm font-semibold text-slate-100">On this page</h5>
            <ul className="space-y-2 text-sm">
                {headings.map((heading) => (
                    <li key={heading.id} style={{ paddingLeft: (heading.level - 2) * 12 }}>
                        <a
                            href={`#${heading.id}`}
                            className={`block transition-colors hover:text-electric-green ${activeId === heading.id ? 'text-electric-green' : 'text-slate-500'
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
    // const { slug } = useParams(); // Start utilizing pathname for robustness
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const { pathname } = useLocation();

    // Handle nested routes (react-router v6 "splat" or just capture all in slug if configured)
    // The Route in App.tsx is "/docs/*" which maps to the 'docs' param usually or '*'
    // Let's assume the router passes the full path segment as 'slug' or we need to look at pathname
    // If App.tsx has <Route path="/docs/:slug" ...> it only matches one level.
    // If we want nested, we need <Route path="/docs/*" ...>
    // And useLocation to parse.

    // For now, let's try to reconstruct the slug from pathname if standard params fail for nested.
    // /docs/intro/architecture -> slug might be "intro/architecture" if router is set up right
    // Or we might need to rely on the splat.

    // Let's rely on pathname parsing which is robust:
    const currentSlug = pathname.replace('/docs/', '') || 'index';
    const isRoot = pathname === '/docs' || pathname === '/docs/';
    const effectiveSlug = isRoot ? 'index' : currentSlug;

    // Lazy content loading
    const ContentComponent = useMemo(() => {
        const path = slugToPathMap[effectiveSlug];
        // Try fallback if trailing slash issues
        if (!path) {
            const alternative = slugToPathMap[effectiveSlug.replace(/\/$/, '')];
            if (alternative && mdxModules[alternative]) return lazy(() => mdxModules[alternative]() as Promise<{ default: React.ComponentType }>);
        }

        if (!path || !mdxModules[path]) return null;
        return lazy(() => mdxModules[path]() as Promise<{ default: React.ComponentType }>);
    }, [effectiveSlug]);

    const [meta, setMeta] = useState<{ title: string; description?: string }>({ title: formatTitle(effectiveSlug.split('/').pop() || '') });

    useEffect(() => {
        const loadMeta = async () => {
            const path = slugToPathMap[effectiveSlug];
            if (path && mdxModules[path]) {
                try {
                    const mod = await mdxModules[path]() as MDXModule;
                    setMeta({
                        title: mod.frontmatter?.title || formatTitle(effectiveSlug.split('/').pop() || ''),
                        description: mod.frontmatter?.description
                    });
                } catch (e) {
                    console.error("Failed to load frontmatter", e);
                }
            }
        };
        loadMeta();
    }, [effectiveSlug]);

    const navigation = useMemo(() => buildNavigation(), []);

    // Scroll to top on route change
    useEffect(() => {
        window.scrollTo(0, 0);
        setSidebarOpen(false);
    }, [pathname]);

    if (!ContentComponent) {
        return (
            <div className="min-h-screen bg-[#0B1120] text-white p-20 text-center flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-electric-green mb-4" />
                <h1 className="text-2xl font-bold">Loading Documentation...</h1>
                <p className="text-gray-500 mt-2">Requested: {effectiveSlug}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-300 font-sans selection:bg-electric-green/30">
            {/* Top Navigation Bar */}
            <header className="fixed top-0 z-50 w-full border-b border-slate-800 bg-[#0B1120]/90 backdrop-blur supports-[backdrop-filter]:bg-[#0B1120]/60">
                <div className="max-w-[1600px] mx-auto flex h-16 items-center px-4 md:px-8">
                    <div className="mr-8 hidden md:flex">
                        <Link to="/" className="flex items-center space-x-2 font-bold text-slate-100">
                            <img src="/logo/SVG/White.svg" alt="KoreShield" className="w-8 h-8" />
                            <span>Kore<span className="text-electric-green">Shield</span> Docs</span>
                        </Link>
                    </div>

                    <button
                        className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 focus:outline-none md:hidden"
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                    >
                        <span className="sr-only">Open main menu</span>
                        {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>

                    <div className="flex flex-1 items-center justify-between space-x-4 md:justify-end">
                        <div className="w-full flex-1 md:w-auto md:flex-none">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                <input
                                    type="search"
                                    placeholder="Search docs..."
                                    className="h-9 w-full rounded-md border border-slate-700 bg-slate-900 pl-9 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-electric-green focus:outline-none focus:ring-1 focus:ring-electric-green md:w-64 lg:w-80 transition-all"
                                />
                            </div>
                        </div>

                        <nav className="flex items-center space-x-2">
                            <Link to="/" className="text-sm text-slate-400 hover:text-white hidden sm:block">Home</Link>
                            <a href="https://github.com/koreshield/koreshield" target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-slate-100">
                                <Github className="h-5 w-5" />
                            </a>
                        </nav>
                    </div>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto flex h-[calc(100vh-4rem)] pt-16">
                {/* Left Sidebar - Navigation */}
                <aside
                    className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-slate-800 bg-[#0B1120] pb-10 transition-transform duration-300 ease-in-out md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0 overflow-y-auto ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    <div className="p-4 md:p-6">
                        <nav className="space-y-8">
                            {navigation.map((section, i) => (
                                <div key={i}>
                                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
                                        {section.title}
                                    </h4>
                                    <ul className="space-y-1">
                                        {section.items.map((item, j) => {
                                            const isActive = effectiveSlug === item.slug;
                                            return (
                                                <li key={j}>
                                                    <Link
                                                        to={`/docs/${item.slug}`}
                                                        className={`block rounded-md px-3 py-2 text-sm font-medium transition-all ${isActive
                                                            ? 'bg-electric-green/10 text-electric-green border-l-2 border-electric-green -ml-[2px]'
                                                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                                            }`}
                                                    >
                                                        {item.title}
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="flex flex-1 min-w-0">
                    <main className="w-full px-6 py-10 md:px-12 overflow-y-auto">
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-8 overflow-x-auto whitespace-nowrap">
                            <Link to="/docs" className="hover:text-electric-green transition-colors">Docs</Link>
                            <ChevronRight className="w-3.5 h-3.5" />
                            {/* Try to show group if possible, simplest is just title for now */}
                            <span className="text-slate-300 font-medium truncate">{meta.title}</span>
                        </div>

                        {/* Content Container */}
                        <div className="prose prose-invert prose-slate max-w-4xl mx-auto
                            prose-h1:text-4xl prose-h1:font-bold prose-h1:tracking-tight prose-h1:mb-8 prose-h1:text-white
                            prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-2 prose-h2:border-b prose-h2:border-slate-800 prose-h2:text-slate-100
                            prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-slate-200
                            prose-p:text-slate-300 prose-p:leading-7 prose-p:mb-6
                            prose-li:text-slate-300
                            prose-code:text-electric-green prose-code:bg-slate-900/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                            prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-pre:p-4 prose-pre:rounded-lg
                            prose-a:text-electric-green prose-a:no-underline hover:prose-a:underline
                            prose-blockquote:border-l-electric-green prose-blockquote:bg-slate-900/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r
                            prose-table:border-collapse prose-th:text-slate-200 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-td:px-4 prose-td:py-2 prose-td:border-t prose-td:border-slate-800
                        ">
                            <h1>{meta.title}</h1>
                            {meta.description && <p className="lead text-xl text-slate-400 mb-10">{meta.description}</p>}

                            <Suspense fallback={<div className="py-20 flex justify-center"><Loader2 className="animate-spin text-electric-green w-8 h-8" /></div>}>
                                <MDXProvider components={{ Cards, Card, pre: Pre, Callout, Accordion, AccordionGroup, table: Table }}>
                                    <ContentComponent />
                                </MDXProvider>
                            </Suspense>
                        </div>

                        {/* Docs Footer */}
                        <div className="max-w-4xl mx-auto mt-20 pt-8 border-t border-slate-800 flex justify-between text-sm text-slate-500">
                            <p>© 2026 KoreShield. All rights reserved.</p>
                            <a href={`https://github.com/koreshield/koreshield/tree/main/koreshield-web/content/docs/${effectiveSlug}.mdx`} target="_blank" rel="noreferrer" className="hover:text-electric-green flex items-center gap-1 transition-colors">
                                Edit this page <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </main>

                    {/* Right Sidebar - On This Page */}
                    <TableOfContents />
                </div>
            </div>
        </div>
    );
}

export default DocsPage;
