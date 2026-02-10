import Plausible from 'plausible-tracker';

// Initialize Plausible
// Set your Plausible domain here (e.g., 'koreshield.com')
// You can also use a custom API host if self-hosting Plausible
const plausible = Plausible({
	domain: 'koreshield.com',
	// apiHost: 'https://plausible.io', // Optional: self-hosted instance
	trackLocalhost: false, // Don't track localhost
});

// Enable automatic page view tracking
plausible.enableAutoPageviews();

/**
 * Track custom events
 * @param eventName - Name of the event (e.g., 'CTA Click', 'Demo Request')
 * @param props - Optional event properties
 */
export function trackEvent(eventName: string, props?: Record<string, string | number | boolean>) {
	try {
		plausible.trackEvent(eventName, { props });
	} catch (_error) {
		// Silently fail in development or if analytics is blocked
		if (import.meta.env.DEV) {
			console.log('Analytics event:', eventName, props);
		}
	}
}

/**
 * Track page views manually (if not using auto page views)
 * @param url - The page URL
 */
export function trackPageView(url?: string) {
	try {
		if (url) {
			plausible.trackPageview({ url });
		} else {
			plausible.trackPageview();
		}
	} catch (_error) {
		if (import.meta.env.DEV) {
			console.log('Analytics page view:', url);
		}
	}
}

// Predefined event tracking functions for common actions
export const analytics = {
	// CTA events
	clickGetStarted: (location: string) => {
		trackEvent('Get Started Click', { location });
	},

	clickContactSales: (location: string) => {
		trackEvent('Contact Sales Click', { location });
	},

	clickTryDemo: (location: string) => {
		trackEvent('Try Demo Click', { location });
	},

	// Documentation events
	viewDocs: (page: string) => {
		trackEvent('View Docs', { page });
	},

	copyCode: (language: string, location: string) => {
		trackEvent('Copy Code', { language, location });
	},

	// GitHub events
	clickGitHub: (location: string) => {
		trackEvent('GitHub Click', { location });
	},

	starGitHub: () => {
		trackEvent('GitHub Star');
	},

	// Pricing events
	viewPricing: () => {
		trackEvent('View Pricing');
	},

	selectTier: (tier: string) => {
		trackEvent('Select Tier', { tier });
	},

	clickPricingCTA: (tier: string) => {
		trackEvent('Pricing CTA Click', { tier });
	},

	// Contact form events
	submitContactForm: (formType: 'general' | 'enterprise' | 'technical') => {
		trackEvent('Submit Contact Form', { type: formType });
	},

	submitSalesForm: (tier: string) => {
		trackEvent('Submit Sales Form', { tier });
	},

	// Social events
	clickTwitter: () => {
		trackEvent('Twitter Click');
	},

	clickLinkedIn: () => {
		trackEvent('LinkedIn Click');
	},

	clickDiscord: () => {
		trackEvent('Discord Click');
	},

	// Integration events
	selectIntegration: (framework: string) => {
		trackEvent('Select Integration', { framework });
	},

	copyIntegrationCode: (framework: string) => {
		trackEvent('Copy Integration Code', { framework });
	},

	// Download events
	downloadSDK: (language: string) => {
		trackEvent('Download SDK', { language });
	},

	// Newsletter/updates
	subscribeNewsletter: (location: string) => {
		trackEvent('Subscribe Newsletter', { location });
	},

	// Error tracking (optional)
	trackError: (error: string, location: string) => {
		trackEvent('Error', { error, location });
	},
};

export default analytics;
