import { Link } from 'react-router-dom';

export function Cards({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid md:grid-cols-2 gap-4 my-8">
            {children}
        </div>
    );
}

export function Card({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
    return (
        <Link
            to={href}
            className="block p-6 bg-slate-900 border border-slate-700 rounded-lg hover:border-electric-green transition-colors no-underline"
        >
            <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
            <p className="text-gray-400 m-0">{children}</p>
        </Link>
    );
}
