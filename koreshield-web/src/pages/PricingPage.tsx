import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../components/ToastNotification';
import { SEOMeta } from '../components/SEOMeta';
import { SEOConfig } from '../lib/seo-config';

const tiers = [
  {
    name: 'Open Source',
    id: 'free',
    price: '$0',
    description: 'Perfect for developers and small projects',
    features: [
      'Self-hosted deployment',
      '10,000 requests/month',
      'Community support',
      'All core security features',
      '50+ attack detection patterns',
      'Multi-provider support',
      'Basic monitoring',
      'Open-source licence',
    ],
    limitations: [
      'Self-managed infrastructure',
      'Community support only',
      'No SLA guarantee',
    ],
    cta: 'Get Started',
    ctaLink: '/docs/installation',
    popular: false,
  },
  {
    name: 'Startup',
    id: 'startup',
    price: '$299–$999',
    priceDetail: '/month',
    description: 'For growing startups and scale-ups',
    features: [
      'Everything in Open Source',
      'Up to 1M requests/month',
      'Email & chat support',
      'Advanced monitoring dashboard',
      'Custom detection rules',
      'Multi-tenancy support',
      'Compliance reports',
      '99.9% SLA',
      'Priority security updates',
    ],
    cta: 'Start Free Trial',
    ctaLink: '#contact-sales',
    popular: true,
  },
  {
    name: 'Growth',
    id: 'growth',
    price: '$1,999–$9,999',
    priceDetail: '/month',
    description: 'For established businesses scaling AI',
    features: [
      'Everything in Startup',
      'Up to 10M requests/month',
      'Dedicated support engineer',
      'Custom integrations',
      'Advanced analytics',
      'SSO/SAML authentication',
      'API key management',
      '99.95% SLA',
      'Quarterly security reviews',
      'Custom training sessions',
    ],
    cta: 'Contact Sales',
    ctaLink: '#contact-sales',
    popular: false,
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    price: 'Custom',
    description: 'For large-scale deployments with custom requirements',
    features: [
      'Everything in Growth',
      'Unlimited requests',
      '24/7 dedicated support',
      'Private deployment options',
      'Custom SLA agreements',
      'On-premise deployment',
      'Advanced compliance (SOC2, ISO 27001, HIPAA)',
      'Custom AI model support',
      'Dedicated account manager',
      'Custom contract terms',
      'Volume discounts',
    ],
    cta: 'Contact Sales',
    ctaLink: '#contact-sales',
    popular: false,
  },
];

const faqs = [
  {
    question: 'How does the pricing work?',
    answer: 'Our pricing is based on the number of API requests per month and the level of support you need. The Open Source tier is completely free for self-hosted deployments. Paid tiers include managed hosting, priority support, and advanced features. All pricing is in US Dollars ($). We also accept payments in British Pounds (£). Prices exclude VAT/sales tax.',
  },
  {
    question: 'What counts as a request?',
    answer: 'Each API call to the /v1/chat/completions endpoint counts as one request. We count both successful completions and blocked security violations. Streaming requests count as a single request.',
  },
  {
    question: 'Can I switch between tiers?',
    answer: 'Yes! You can upgrade or downgrade at any time. Upgrades take effect immediately, whilst downgrades apply at the start of your next billing cycle. There are no long-term contracts for Startup and Growth tiers.',
  },
  {
    question: 'What happens if I exceed my request limit?',
    answer: 'You\'ll receive alerts at 80% and 95% of your limit. If you exceed your monthly allocation, we\'ll automatically upgrade you to the next tier (prorated for the remainder of the month). You can also set hard limits to prevent overages.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! All paid tiers include a 14-day free trial with no credit card required. You get full access to all features during the trial period. The Open Source tier is free forever.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept credit/debit cards (Visa, Mastercard, Amex), bank transfers, and purchase orders for annual contracts. All payments are processed securely through Stripe.',
  },
  {
    question: 'Do you offer discounts for non-profits or educational institutions?',
    answer: 'Yes! We offer 50% off paid tiers for registered non-profits and educational institutions. Please contact sales@koreshield.com with proof of your organisation\'s status.',
  },
  {
    question: 'What is your refund policy?',
    answer: 'We offer a 30-day money-back guarantee on annual plans. Monthly plans can be cancelled at any time with no penalty. Unused requests do not roll over to the next billing period.',
  },
  {
    question: 'Can I use KoreShield for commercial projects on the Open Source tier?',
    answer: 'Yes! Our Open Source tier is licenced under MIT, which allows commercial use. You\'re free to self-host and use it for any purpose, including commercial applications.',
  },
  {
    question: 'Do you offer regional hosting?',
    answer: 'Yes, Enterprise customers can choose from UK, EU, or US data centres. We\'re also working on Asia-Pacific availability. All data remains in your chosen region for compliance purposes.',
  },
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleContactSales = () => {
    document.getElementById('contact-sales')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <SEOMeta {...SEOConfig.pricing} />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Start free with our Open Source tier. Upgrade when you need managed hosting, priority support, and enterprise features.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-lg ${billingPeriod === 'monthly' ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
                className="relative w-16 h-8 bg-gray-300 dark:bg-gray-700 rounded-full transition-colors hover:bg-gray-400 dark:hover:bg-gray-600"
              >
                <motion.div
                  className="absolute top-1 left-1 w-6 h-6 bg-blue-600 rounded-full"
                  animate={{ x: billingPeriod === 'annual' ? 32 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
              <span className={`text-lg ${billingPeriod === 'annual' ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500'}`}>
                Annual
                <span className="ml-2 text-sm text-green-600 dark:text-green-400">(Save 20%)</span>
              </span>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 flex flex-col ${tier.popular ? 'ring-2 ring-blue-600 scale-105' : ''
                  }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {tier.price}
                    </span>
                    {tier.priceDetail && (
                      <span className="text-gray-600 dark:text-gray-400 ml-2">
                        {tier.priceDetail}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {tier.description}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {tier.ctaLink.startsWith('#') ? (
                  <button
                    onClick={handleContactSales}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${tier.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                  >
                    {tier.cta}
                  </button>
                ) : (
                  <Link
                    to={tier.ctaLink}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-colors text-center ${tier.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                  >
                    {tier.cta}
                  </Link>
                )}
              </motion.div>
            ))}
          </div>

          {/* Enterprise Note */}
          <p className="text-center text-gray-600 dark:text-gray-400 mt-12">
            All prices are in US Dollars ($). We also accept British Pounds (£). Prices exclude VAT/sales tax. Annual plans save 20%.
          </p>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Compare Features
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left p-4 font-semibold text-gray-900 dark:text-white">Feature</th>
                  {tiers.map((tier) => (
                    <th key={tier.id} className="text-center p-4 font-semibold text-gray-900 dark:text-white">
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                <tr>
                  <td className="p-4 text-gray-700 dark:text-gray-300">Requests/month</td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">10K</td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">1M</td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">10M</td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">Unlimited</td>
                </tr>
                <tr>
                  <td className="p-4 text-gray-700 dark:text-gray-300">Support</td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">Community</td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">Email & Chat</td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">Dedicated</td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">24/7 Dedicated</td>
                </tr>
                <tr>
                  <td className="p-4 text-gray-700 dark:text-gray-300">SLA</td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">-</td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">99.9%</td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">99.95%</td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">Custom</td>
                </tr>
                <tr>
                  <td className="p-4 text-gray-700 dark:text-gray-300">Custom rules</td>
                  <td className="p-4 text-center">
                    <svg className="w-5 h-5 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </td>
                  <td className="p-4 text-center">
                    <svg className="w-5 h-5 text-green-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                  <td className="p-4 text-center">
                    <svg className="w-5 h-5 text-green-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                  <td className="p-4 text-center">
                    <svg className="w-5 h-5 text-green-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 text-gray-700 dark:text-gray-300">SOC2/ISO 27001</td>
                  <td className="p-4 text-center">
                    <svg className="w-5 h-5 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </td>
                  <td className="p-4 text-center">
                    <svg className="w-5 h-5 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </td>
                  <td className="p-4 text-center">
                    <svg className="w-5 h-5 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </td>
                  <td className="p-4 text-center">
                    <svg className="w-5 h-5 text-green-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4" id="faq">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white dark:bg-gray-900 rounded-lg shadow"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-semibold text-gray-900 dark:text-white pr-8">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${openFaq === index ? 'rotate-180' : ''
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openFaq === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-6 pb-6"
                  >
                    <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Sales Form */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20" id="contact-sales">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Talk to our team about your security needs
            </p>
          </div>

          <ContactSalesForm />
        </div>
      </section>
    </div>
  );
}

function ContactSalesForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    tier: 'startup',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success(
      'Thank you for your enquiry!',
      'Our sales team will contact you within 24 hours.'
    );

    setFormData({
      name: '',
      email: '',
      company: '',
      tier: 'startup',
      message: '',
    });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company Name *
          </label>
          <input
            type="text"
            id="company"
            required
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="tier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Interested In
          </label>
          <select
            id="tier"
            value={formData.tier}
            onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="startup">Startup Tier</option>
            <option value="growth">Growth Tier</option>
            <option value="enterprise">Enterprise</option>
            <option value="other">Just exploring</option>
          </select>
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tell us about your needs
        </label>
        <textarea
          id="message"
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="What are your security requirements? Expected request volume? Any specific compliance needs?"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending...' : 'Contact Sales'}
      </button>

      <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-4">
        By submitting this form, you agree to our{' '}
        <a href="#" className="text-blue-600 hover:underline">
          Privacy Policy
        </a>
      </p>
    </form>
  );
}
