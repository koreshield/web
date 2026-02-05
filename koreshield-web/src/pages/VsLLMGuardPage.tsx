import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ExternalLink, Shield, Code, GitBranch } from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';

export default function VsLLMGuardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <SEOMeta
        title="KoreShield vs LLM Guard"
        description="Compare KoreShield and LLM Guard (open-source): enterprise features, detection accuracy, support options, and when to choose each solution."
      />

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              KoreShield vs LLM Guard
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Comparing two open-source LLM security solutions
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
              Enterprise-ready open-source LLM security with 95% detection accuracy, professional support, and managed cloud option.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>95%+ detection accuracy</span>
              </div>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>Enterprise features (RBAC, multi-tenancy)</span>
              </div>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>Professional support & SLAs</span>
              </div>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>Managed cloud option</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
            <div className="flex items-center gap-3 mb-4">
              <GitBranch className="w-8 h-8 text-green-600 dark:text-green-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">LLM Guard</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Community-driven open-source LLM security toolkit with basic detection capabilities and MIT license.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>100% free and open-source</span>
              </div>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>Active community contributions</span>
              </div>
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <XCircle className="w-5 h-5" />
                <span>~75% detection accuracy</span>
              </div>
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <XCircle className="w-5 h-5" />
                <span>No professional support or SLAs</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Comparison */}
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
                    <th className="text-center py-4 px-4 text-green-600 dark:text-green-400 font-semibold">LLM Guard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  <tr>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">Detection Accuracy</td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white font-semibold">95%+</td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white">~75%</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">Multi-Tenancy</td>
                    <td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><XCircle className="w-6 h-6 text-red-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">RBAC & Policies</td>
                    <td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><XCircle className="w-6 h-6 text-red-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">Audit Logs</td>
                    <td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><XCircle className="w-6 h-6 text-red-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">Professional Support</td>
                    <td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><XCircle className="w-6 h-6 text-red-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">SLA Guarantees</td>
                    <td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><XCircle className="w-6 h-6 text-red-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">Managed Cloud Option</td>
                    <td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><XCircle className="w-6 h-6 text-red-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">Documentation Quality</td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white">Excellent</td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white">Basic</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">Compliance Ready</td>
                    <td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><XCircle className="w-6 h-6 text-red-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">Cost (Self-Hosted)</td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white font-semibold">Free</td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white font-semibold">Free</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Use Case Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 gap-8"
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6">KoreShield Best For:</h3>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <strong className="text-gray-900 dark:text-white">Enterprise Production</strong>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Need SLAs, support, and compliance</p>
                </div>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <strong className="text-gray-900 dark:text-white">Multi-Tenant SaaS</strong>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Require tenant isolation and RBAC</p>
                </div>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <strong className="text-gray-900 dark:text-white">Regulated Industries</strong>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Healthcare, finance, legal requiring audit logs</p>
                </div>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <strong className="text-gray-900 dark:text-white">High Accuracy Needs</strong>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">95%+ detection rate required</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
            <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-6">LLM Guard Best For:</h3>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <strong className="text-gray-900 dark:text-white">Hobby Projects</strong>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Personal projects and learning</p>
                </div>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <strong className="text-gray-900 dark:text-white">Proof of Concept</strong>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Testing and prototyping</p>
                </div>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <strong className="text-gray-900 dark:text-white">Learning LLM Security</strong>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Educational purposes</p>
                </div>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <strong className="text-gray-900 dark:text-white">Basic Detection</strong>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Simple use cases, low-stakes applications</p>
                </div>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Migration Path */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-8 border border-blue-200 dark:border-blue-900"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Easy Migration from LLM Guard</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Already using LLM Guard? KoreShield offers a straightforward migration path with minimal code changes.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">1</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Install KoreShield</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">pip install koreshield-sdk</code>
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">2</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Update Import</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Replace LLM Guard imports with KoreShield SDK
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">3</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Deploy</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enjoy higher accuracy and enterprise features
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-blue-600 dark:bg-blue-900 rounded-xl p-8 text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-4">Upgrade to KoreShield</h2>
          <p className="text-xl mb-6 text-blue-100">
            Get enterprise-ready security with the same open-source values
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
