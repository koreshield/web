import { CheckCircle, FileCheck, Lock, ShieldCheck } from 'lucide-react';

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
        <section className="py-16 md:py-20 border-t border-border bg-muted/50 transition-colors">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {badges.map((badge, index) => (
                        <div key={index} className="flex flex-col items-center text-center gap-2 group">
                            <div className="p-3 rounded-full bg-card border border-border group-hover:border-electric-green/50 transition-colors shadow-sm">
                                <badge.icon className="w-5 h-5 text-muted-foreground group-hover:text-electric-green" />
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground text-sm">{badge.title}</h4>
                                <p className="text-xs text-muted-foreground uppercase tracking-widest">{badge.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
