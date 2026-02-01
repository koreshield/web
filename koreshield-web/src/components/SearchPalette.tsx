import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SearchPalette() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const handleSelect = (path: string) => {
        navigate(path);
        setOpen(false);
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted/50 hover:bg-muted border border-border rounded-md text-sm text-muted-foreground transition-all group"
            >
                <Search className="w-4 h-4 group-hover:text-primary transition-colors" />
                <span>Search docs...</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">Cmd</span>K
                </kbd>
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm">
                    <Command className="w-full max-w-lg rounded-lg border border-border bg-popover shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center border-b border-border px-3" cmdk-input-wrapper="">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <Command.Input
                                placeholder="Type a command or search..."
                                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        <Command.List className="max-h-[300px] overflow-y-auto p-2">
                            <Command.Empty className="py-6 text-center text-sm">No results found.</Command.Empty>

                            <Command.Group heading="Pages">
                                <Command.Item onSelect={() => handleSelect('/')} className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm">
                                    <FileText className="w-4 h-4" /> Home
                                </Command.Item>
                                <Command.Item onSelect={() => handleSelect('/status')} className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm">
                                    <FileText className="w-4 h-4" /> Status
                                </Command.Item>
                            </Command.Group>

                            <Command.Group heading="Documentation">
                                <Command.Item onSelect={() => handleSelect('/docs/installation')} className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm">
                                    <FileText className="w-4 h-4" /> Installation
                                </Command.Item>
                                <Command.Item onSelect={() => handleSelect('/docs/configuration')} className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm">
                                    <FileText className="w-4 h-4" /> Configuration
                                </Command.Item>
                                <Command.Item onSelect={() => handleSelect('/docs/authentication')} className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm">
                                    <FileText className="w-4 h-4" /> Authentication
                                </Command.Item>
                            </Command.Group>
                        </Command.List>
                    </Command>
                </div>
            )}
        </>
    );
}
