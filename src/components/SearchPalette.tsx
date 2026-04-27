import { useEffect, useState, useMemo } from 'react';
import { Command } from 'cmdk';
import { Search, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import { buildDocsSearchIndex } from '../docs/loader';

interface SearchItem {
  title: string;
  path: string;
  content: string;
  category: string;
  tags?: string[];
}

const staticPages: SearchItem[] = [
  { title: 'Home', path: '/', content: 'KoreShield LLM security platform', category: 'Pages' },
  { title: 'Pricing', path: '/pricing', content: 'Plans and pricing', category: 'Pages' },
  { title: 'Status', path: '/status', content: 'System status', category: 'Pages' },
  { title: 'Playground', path: '/playground', content: 'Test KoreShield', category: 'Pages' },
  { title: 'Why KoreShield', path: '/why-koreshield', content: 'Benefits', category: 'Pages' },
];

const searchIndex: SearchItem[] = [...staticPages, ...buildDocsSearchIndex()];

interface SearchPaletteProps {
  mobile?: boolean;
}

export function SearchPalette({ mobile }: SearchPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const fuse = useMemo(
    () =>
      new Fuse(searchIndex, {
        keys: [
          { name: 'title', weight: 3 },
          { name: 'content', weight: 2 },
          { name: 'tags', weight: 1 },
        ],
        threshold: 0.4,
        minMatchCharLength: 2,
      }),
    []
  );

  const results = useMemo(() => {
    if (!query.trim()) return searchIndex.slice(0, 10);
    return fuse.search(query).map((result) => result.item);
  }, [query, fuse]);

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {};
    results.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [results]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      {mobile ? (
        <button
          onClick={() => setOpen(true)}
          className="flex md:hidden items-center justify-center p-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted/50 hover:bg-muted border border-border rounded-md text-sm text-muted-foreground transition-all group"
        >
          <Search className="w-4 h-4 group-hover:text-primary transition-colors" />
          <span>Search docs...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <Command
            className="w-full max-w-2xl rounded-lg border border-border bg-popover shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center border-b border-border px-3" cmdk-input-wrapper="">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search documentation..."
                className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Command.List className="max-h-[400px] overflow-y-auto p-2">
              {results.length === 0 ? (
                <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                  No results found
                </Command.Empty>
              ) : (
                Object.entries(groupedResults).map(([category, items]) => (
                  <Command.Group key={category} heading={category}>
                    {items.map((item) => (
                      <Command.Item
                        key={item.path}
                        value={item.title}
                        onSelect={() => handleSelect(item.path)}
                        className="flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm group"
                      >
                        <FileText className="w-4 h-4 mt-0.5 shrink-0" />
                        <div className="flex-1 overflow-hidden">
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{item.path}</div>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))
              )}
            </Command.List>
            <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
              <div className="flex gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>ESC Close</span>
              </div>
              <span>{results.length} results</span>
            </div>
          </Command>
        </div>
      )}
    </>
  );
}
