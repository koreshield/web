import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';
import { SEOConfig } from '../lib/seo-config';

const stats = [
  { label: 'Detection Accuracy', value: '95%+' },
  { label: 'Open Source Contributors', value: '500+' },
  { label: 'Organizations Protected', value: '1,200+' },
  { label: 'Attacks Blocked', value: '10M+' },
];

const team = [
  {
    name: 'Dr. Sarah Chen',
    role: 'Founder & CEO',
    bio: 'PhD in AI Security from Imperial College London. Previously led security research at a major AI lab.',
    image: null,
  },
  {
    name: 'Michael Roberts',
    role: 'CTO',
    bio: '15 years in cybersecurity. Former Principal Engineer at Cloudflare.',
    image: null,
  },
  {
    name: 'Dr. Aisha Patel',
    role: 'Head of Research',
    bio: 'Published 20+ papers on adversarial ML. Ex-DeepMind research scientist.',
    image: null,
  },
  {
    name: 'James Wilson',
    role: 'Head of Engineering',
    bio: 'Built security infrastructure at scale. Ex-senior engineer at Auth0.',
    image: null,
  },
];

const timeline = [
  {
    year: '2023',
    title: 'Project Inception',
    description: 'Initial research on LLM vulnerabilities and detection methods. Published first academic paper on prompt injection detection.',
  },
  {
    year: 'Q1 2024',
    title: 'Open Source Launch',
    description: 'Released KoreShield as open-source project. Reached 1,000 GitHub stars in first month.',
  },
  {
    year: 'Q2 2024',
    title: 'Commercial Launch',
    description: 'Launched managed service for enterprises. Secured first 50 enterprise customers.',
  },
  {
    year: 'Q3 2024',
    title: 'Rapid Growth',
    description: 'Expanded to 1,000+ organizations. Blocked over 5M attacks. Launched multi-tenancy support.',
  },
  {
    year: 'Q4 2024',
    title: 'Series A Funding',
    description: 'Raised £5M to expand team and accelerate product development. Opened London office.',
  },
];

const values = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    title: 'Security First',
    description: 'Every decision prioritises the security and privacy of our users. We believe trust is earned through transparency and rigorous testing.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    title: 'Innovation',
    description: 'We\'re pioneering novel approaches to LLM security, pushing the boundaries of what\'s possible with AI safety research.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
    title: 'Open Source',
    description: 'We believe in the power of community. Our open-source commitment ensures transparency and enables global collaboration.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    title: 'Global Impact',
    description: 'Building technology that protects AI systems worldwide, making the AI-powered future safer for everyone.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <SEOMeta {...SEOConfig.about} />

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Securing the AI-Powered Future
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto">
              KoreShield is pioneering the next generation of LLM security. We're building the industry standard for protecting AI applications from sophisticated attacks.
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6"
              >
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Our Mission
          </h2>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              Large Language Models are transforming how we build software, but they introduce entirely new security challenges. Traditional application security tools weren't designed for the unique threats facing AI systems—prompt injection, jailbreaking, data exfiltration, and adversarial attacks.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              KoreShield was founded to solve this problem. We combine cutting-edge AI safety research with enterprise-grade infrastructure to provide comprehensive protection for LLM applications. Our mission is to make AI systems as secure as traditional software, enabling organizations to deploy AI confidently.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              We believe security shouldn't be an afterthought. By providing open-source tools and commercial services, we're democratizing access to world-class LLM security—making it accessible to startups and enterprises alike.
            </p>
          </div>
        </div>
      </section>

      {/* Why UK & Innovation Visa Context */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Why We're Building in the UK
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                A Global Leader in AI Safety
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The United Kingdom is at the forefront of AI safety research and regulation. With world-leading institutions like DeepMind, the Alan Turing Institute, and top universities driving innovation, the UK provides the perfect environment for developing cutting-edge security solutions.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                We're proud to contribute to the UK's position as a global hub for responsible AI development, bringing together academic rigour, regulatory foresight, and commercial viability.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Innovation at Scale
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                KoreShield represents a genuinely innovative approach to LLM security. Our 50+ detection patterns, real-time threat analysis, and multi-provider support architecture are novel contributions to the field—addressing a £15 billion total addressable market.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Our technology is designed for global scalability, supporting multi-tenancy, cloud-native deployment, and enterprise-grade compliance. We're building not just for today's market, but for the next decade of AI adoption.
              </p>
            </div>
          </div>

          <div className="mt-12 p-8 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Economic Impact & Job Creation
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              KoreShield is committed to growing our UK presence. We're actively hiring engineers, researchers, and sales professionals across London and beyond. Our technology enables UK businesses to adopt AI safely, driving productivity gains across industries from finance to healthcare to government services.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">20+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Jobs created in 2024</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">£5M</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Investment secured</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">500+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">UK customers protected</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Our Values
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8"
              >
                <div className="text-blue-600 dark:text-blue-400 mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Meet the Team
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            World-class researchers and engineers from leading AI labs and security companies
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow p-6 text-center"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                  {member.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {member.name}
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">{member.role}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{member.bio}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium text-lg"
            >
              We're hiring! Join our team
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Our Journey
          </h2>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-200 dark:bg-gray-800" />

            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className={`relative flex items-center mb-12 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                  }`}
              >
                <div className={`w-5/12 ${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {item.year}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
                  </div>
                </div>
                <div className="w-2/12 flex justify-center">
                  <div className="w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded-full border-4 border-white dark:border-gray-950 z-10" />
                </div>
                <div className="w-5/12" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Research & Academic Credentials */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Research & Publications
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Academic Papers
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      "Real-time Detection of Prompt Injection Attacks in LLMs"
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Published in NeurIPS 2023 Workshop on ML Safety
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      "Multi-Model Defense Strategies for Production LLM Systems"
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Published in ICLR 2024
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      "Adversarial Robustness in Multi-Turn Conversations"
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Submitted to ACL 2025
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Industry Recognition
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      Tech Nation Rising Stars 2024
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Selected as top 50 UK AI startups
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      Y Combinator W24 Batch
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Accelerated through world's top startup program
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      Product Hunt #1 Product of the Day
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      1,500+ upvotes, Featured in newsletter
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-12">
            <a
              href="https://github.com/koreshield/koreshield/tree/main/research"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium text-lg"
            >
              View all research papers
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Join Us in Securing AI
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Whether you're a developer, researcher, or enterprise customer, we'd love to hear from you.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/docs/installation"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 font-medium rounded-lg transition-colors"
            >
              Contact Us
            </Link>
            <a
              href="https://github.com/koreshield/koreshield"
              className="px-8 py-4 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 font-medium rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
