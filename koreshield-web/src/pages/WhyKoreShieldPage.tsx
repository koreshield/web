import { motion } from 'framer-motion';
import { Shield, Zap, Code, Users, TrendingUp, Lock, Globe, Heart, ExternalLink } from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';

export default function WhyKoreShieldPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <SEOMeta
        title="Why KoreShield"
        description="Discover what makes KoreShield the best LLM security solution: open-source transparency, 95% detection accuracy, enterprise-ready features, and community-driven innovation."
      />

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Why KoreShield?
            </h1>
            <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto">
              The only open-source LLM security platform that combines enterprise-grade features with community-driven innovation
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* Core Differentiators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">Our Core Differentiators</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
              <div className="bg-blue-600/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">95%+ Accuracy</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Industry-leading detection with 96.55% true positive rate and only 3.03% false positives
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
              <div className="bg-green-600/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Open Source</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Full transparency, no vendor lock-in, audit the code yourself, contribute improvements
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
              <div className="bg-purple-600/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Lightning Fast</h3>
              <p className="text-gray-600 dark:text-gray-400">
                10-50ms latency overhead, won't slow down your application, optimized for production
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
              <div className="bg-orange-600/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Enterprise Ready</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Multi-tenancy, RBAC, audit logs, SOC2 ready, compliance features out of the box
              </p>
            </div>
          </div>
        </motion.div>

        {/* The KoreShield Advantage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8"
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">The KoreShield Advantage</h2>
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="bg-blue-600/10 w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Defense in Depth</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We don't rely on a single detection method. KoreShield uses 8 layers of security: sanitization, heuristic detection, ML-based analysis, custom rules, blocklists/allowlists, policy enforcement, RBAC, and provider validation.
                </p>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>✓ Pattern matching with 50+ attack signatures</li>
                  <li>✓ ML-based anomaly detection</li>
                  <li>✓ Custom DSL for flexible rules</li>
                  <li>✓ RAG-specific protections</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="bg-green-600/10 w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0">
                <Globe className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Multi-Provider Excellence</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Unlike competitors locked to specific providers, KoreShield works seamlessly with OpenAI, Anthropic, Google Gemini, DeepSeek, Azure OpenAI, and any OpenAI-compatible API.
                </p>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>✓ Unified security across all LLM providers</li>
                  <li>✓ No vendor lock-in</li>
                  <li>✓ Easy provider switching</li>
                  <li>✓ Multi-provider routing and failover</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="bg-purple-600/10 w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0">
                <Heart className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Community-Driven Innovation</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Our open-source community contributes attack patterns, detection improvements, and integrations. Every user benefits from collective intelligence and shared threat data.
                </p>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>✓ Active GitHub community</li>
                  <li>✓ Weekly pattern updates</li>
                  <li>✓ Community-submitted attack examples</li>
                  <li>✓ Collaborative threat research</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="bg-orange-600/10 w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Research-Backed Approach</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  KoreShield is built on published academic research on prompt injection taxonomy and RAG system security. We don't just block attacks—we understand them deeply.
                </p>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>✓ Published research papers</li>
                  <li>✓ Novel attack taxonomy</li>
                  <li>✓ Peer-reviewed detection methods</li>
                  <li>✓ Academic partnerships</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Deployment Flexibility */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">Deploy Your Way</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-900">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">☁️ Managed Cloud</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Let us handle infrastructure, scaling, and updates. Focus on your product.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• 99.9% uptime SLA</li>
                <li>• Automatic scaling</li>
                <li>• Zero maintenance</li>
                <li>• Global edge deployment</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-6 border border-green-200 dark:border-green-900">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">🏢 Self-Hosted</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Deploy on your infrastructure for complete control and data sovereignty.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Full data control</li>
                <li>• VPC/on-premise</li>
                <li>• Air-gapped options</li>
                <li>• Custom compliance</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-6 border border-purple-200 dark:border-purple-900">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">🔧 Hybrid</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Mix cloud and self-hosted for the best of both worlds.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Sensitive data on-prem</li>
                <li>• Public data in cloud</li>
                <li>• Flexible architecture</li>
                <li>• Cost optimization</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* By the Numbers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900 rounded-xl p-12 text-white"
        >
          <h2 className="text-4xl font-bold mb-12 text-center">KoreShield by the Numbers</h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">95%+</div>
              <div className="text-blue-100">Detection Accuracy</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">10-50ms</div>
              <div className="text-blue-100">Latency Overhead</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">10+</div>
              <div className="text-blue-100">Attack Types Detected</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">5</div>
              <div className="text-blue-100">Major LLM Providers</div>
            </div>
          </div>
        </motion.div>

        {/* What Our Users Say */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">Trusted by Innovative Companies</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
              <p className="text-gray-700 dark:text-gray-300 italic mb-4">
                "KoreShield saved us 6 months of development time and $300K+ in engineering costs. The detection accuracy is impressive and it just works."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  JS
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Jane Smith</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">CTO, AI Startup (YC W24)</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
              <p className="text-gray-700 dark:text-gray-300 italic mb-4">
                "We evaluated 5 LLM security solutions. KoreShield had the best accuracy, pricing, and the open-source model gives us peace of mind."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                  MR
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Mike Rodriguez</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">VP Engineering, FinTech SaaS</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
              <p className="text-gray-700 dark:text-gray-300 italic mb-4">
                "The multi-tenancy features are exactly what we needed for our B2B SaaS. Each customer gets isolated policies and audit logs."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                  SK
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Sarah Kim</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">CEO, Enterprise SaaS</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
              <p className="text-gray-700 dark:text-gray-300 italic mb-4">
                "Open-source was a must-have for our security team. Being able to audit the code ourselves was the deciding factor."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold">
                  DP
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">David Patel</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">CISO, Healthcare Tech</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900 rounded-xl p-12 text-center text-white"
        >
          <h2 className="text-4xl font-bold mb-4">Ready to Secure Your LLM Applications?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join innovative companies protecting their AI with KoreShield
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/docs/getting-started/installation"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-lg"
            >
              <Code className="w-6 h-6" />
              Get Started Free
            </a>
            <a
              href="/playground"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-colors text-lg"
            >
              Try Interactive Demo
              <ExternalLink className="w-6 h-6" />
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
