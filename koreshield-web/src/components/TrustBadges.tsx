import { ShieldCheck, Lock, FileCheck, CheckCircle } from 'lucide-react';

const badges = [
    {
        icon: ShieldCheck,
        title: 'SOC 2 Type II',
        description: 'Ready'
    },
    {
        icon: Lock,
        title: 'GDPR / CCPA',
        description: 'Compliant'
    },
    {
        icon: FileCheck,
        title: 'ISO 27001',
        description: 'Aligned'
    },
    {
        icon: CheckCircle,
        title: 'Zero Retention',
        description: 'Privacy First'
    }
];

export function TrustBadges() {
    return (
        <section className="py-12 border-t border-slate-900 bg-slate-950/30">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {badges.map((badge, index) => (
                        <div key={index} className="flex flex-col items-center text-center gap-2 group">
                            <div className="p-3 rounded-full bg-slate-900 border border-slate-800 group-hover:border-electric-green/50 transition-colors">
                                <badge.icon className="w-5 h-5 text-gray-400 group-hover:text-electric-green" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-200 text-sm">{badge.title}</h4>
                                <p className="text-xs text-gray-500 uppercase tracking-widest">{badge.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
