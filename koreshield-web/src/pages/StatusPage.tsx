import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertCircle } from 'lucide-react';

function StatusPage() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <div className="flex-1 max-w-5xl mx-auto px-6 py-20 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="flex items-center gap-4 mb-12">
                        <div className="bg-electric-green/10 p-4 rounded-lg">
                            <Activity className="w-8 h-8 text-electric-green" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold">System Status</h1>
                    </div>

                    <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-4 h-4 bg-electric-green rounded-full animate-pulse"></div>
                            <h2 className="text-2xl font-bold">All Systems Operational</h2>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[
                            { name: 'API Gateway', status: 'operational' },
                            { name: 'Policy Engine', status: 'operational' },
                            { name: 'Dashboard', status: 'operational' },
                            { name: 'Audit Logging', status: 'maintenance' }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-6 border-b border-slate-800">
                                <span className="text-lg font-medium">{item.name}</span>
                                <div className="flex items-center gap-2">
                                    {item.status === 'operational' ? (
                                        <>
                                            <CheckCircle className="w-5 h-5 text-electric-green" />
                                            <span className="text-electric-green capitalize">{item.status}</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                                            <span className="text-yellow-500 capitalize">{item.status}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default StatusPage;
