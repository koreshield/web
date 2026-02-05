import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Minus, ExternalLink, Shield, DollarSign, Code } from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';

export default function VsLakeraPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <SEOMeta
        title="KoreShield vs Lakera Guard"
        description="Compare KoreShield and Lakera Guard: features, pricing, open-source vs closed-source, and which LLM security solution is right for your needs."
      />

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              KoreShield vs Lakera Guard
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              An honest comparison of two leading LLM security solutions
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        {/* Quick Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-2 gap-8"
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">KoreShield</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Open-source LLM security with enterprise features, 95% detection accuracy, and multi-provider support.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>Open-source & transparent</span>
              </div>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>50-70% lower cost</span>
              </div>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>Self-hosted option</span>
              </div>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>Community-driven innovation</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lakera Guard</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Closed-source enterprise LLM security platform with Fortune 500 customers and proven track record.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>First-mover advantage</span>
              </div>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>Enterprise-focused</span>
              </div>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>Strong marketing presence</span>
              </div>
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <XCircle className="w-5 h-5" />
                <span>Closed-source (no transparency)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
        >
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Feature Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="text-left py-4 px-4 text-gray-900 dark:text-white font-semibold">Feature</th>
                    <th className="text-center py-4 px-4 text-blue-600 dark:text-blue-400 font-semibold">KoreShield</th>
                    <th className="text-center py-4 px-4 text-purple-600 dark:text-purple-400 font-semibold">Lakera Guard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  <tr>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">Open Source</td>
                    <td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><XCircle className="w-6 h-6 text-red-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">Detection Accuracy</td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white">95%+</td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white">~90%</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">Multi-Provider Support</td>
                    <td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Minus className="w-6 h-6 text-yellow-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">Self-Hosted Option</td>
                    <td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><XCircle className="w-6 h-6 text-red-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">Multi-Tenancy</td>
                    <td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">RBAC</td>
                    <td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">Custom Rules</td>
                    <td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Minus className="w-6 h-6 text-yellow-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">RAG Protection</td>
                    <td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Minus className="w-6 h-6 text-yellow-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">Starting Price</td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white font-semibold">$299/mo</td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white font-semibold">$999/mo</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">Community Support</td>
                    <td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><XCircle className="w-6 h-6 text-red-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Pricing Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Pricing Comparison</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4">KoreShield</h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li>• <strong>Free:</strong> Open-source community edition</li>
                <li>• <strong>$299/mo:</strong> Cloud Starter (10K requests/mo)</li>
                <li>• <strong>$999/mo:</strong> Cloud Pro (100K requests/mo)</li>
                <li>• <strong>$50K+/year:</strong> Enterprise self-hosted</li>
                <li>• <strong>50-70% cost savings</strong> vs competitors</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-4">Lakera Guard</h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li>• <strong>No free tier</strong></li>
                <li>• <strong>$999/mo:</strong> Starting plan</li>
                <li>• <strong>$5K+/mo:</strong> Professional</li>
                <li>• <strong>$50K+/year:</strong> Enterprise (cloud only)</li>
                <li>• <strong>Premium pricing</strong> for enterprise features</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Pros and Cons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-2 gap-8"
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6">KoreShield Advantages</h3>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-gray-900 dark:text-white"><strong>Open Source:</strong> Full transparency, no vendor lock-in</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-gray-900 dark:text-white"><strong>Cost:</strong> 50-70% cheaper for similar features</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-gray-900 dark:text-white"><strong>Flexibility:</strong> Self-hosted or cloud deployment</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-gray-900 dark:text-white"><strong>Multi-Provider:</strong> Works with all major LLMs</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-gray-900 dark:text-white"><strong>Community:</strong> Active contributors and support</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-gray-900 dark:text-white"><strong>Accuracy:</strong> 95%+ detection rate</span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
            <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-6">Lakera Guard Advantages</h3>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-gray-900 dark:text-white"><strong>First-Mover:</strong> Established market presence</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-gray-900 dark:text-white"><strong>Enterprise Customers:</strong> Fortune 500 validation</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-gray-900 dark:text-white"><strong>Managed Service:</strong> Fully managed platform</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-gray-900 dark:text-white"><strong>Marketing:</strong> Strong brand recognition</span>
              </li>
              <li className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                <span className="text-gray-900 dark:text-white"><strong>Closed Source:</strong> No code transparency</span>
              </li>
              <li className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                <span className="text-gray-900 dark:text-white"><strong>Expensive:</strong> Premium pricing tier</span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* When to Choose */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Which Should You Choose?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">Choose KoreShield if:</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>✓ You value open-source transparency</li>
                <li>✓ You want cost-effective enterprise security</li>
                <li>✓ You need self-hosted/air-gapped deployment</li>
                <li>✓ You use multiple LLM providers</li>
                <li>✓ You want to customize detection rules</li>
                <li>✓ You're building a startup or mid-market product</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-4">Choose Lakera Guard if:</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>✓ You prefer fully managed solutions</li>
                <li>✓ You have a large enterprise budget</li>
                <li>✓ You want proven Fortune 500 validation</li>
                <li>✓ You prioritize brand recognition</li>
                <li>✓ You don't need source code access</li>
                <li>✓ You're okay with cloud-only deployment</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-blue-600 dark:bg-blue-900 rounded-xl p-8 text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-4">Try KoreShield Free</h2>
          <p className="text-xl mb-6 text-blue-100">
            Start with our open-source edition or get a free trial of our cloud platform
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/docs/getting-started/installation"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              <Code className="w-5 h-5" />
              Quick Start Guide
            </a>
            <a
              href="/playground"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-colors"
            >
              Try Interactive Demo
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
