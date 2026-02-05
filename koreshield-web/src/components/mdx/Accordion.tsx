import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface AccordionProps {
    title: string;
    children: React.ReactNode;
}

export function Accordion({ title, children }: AccordionProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-slate-800 rounded-lg my-4 bg-slate-900/20 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-200 hover:bg-slate-800/50 transition-colors"
            >
                {title}
                <ChevronDown
                    className={clsx('w-4 h-4 text-gray-500 transition-transform duration-200', {
                        'rotate-180': isOpen,
                    })}
                />
            </button>
            <div
                className={clsx('overflow-hidden transition-all duration-300 ease-in-out', {
                    'max-h-0 opacity-0': !isOpen,
                    'max-h-[500px] opacity-100': isOpen,
                })}
            >
                <div className="p-4 pt-0 text-gray-400 text-sm border-t border-slate-800/50 bg-black/20">
                    {children}
                </div>
            </div>
        </div>
    );
}

export function AccordionGroup({ children }: { children: React.ReactNode }) {
    return <div className="space-y-2 my-6">{children}</div>;
}
