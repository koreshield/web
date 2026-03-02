import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

const config: Config = {
  // === SITE METADATA ===
  title: 'Koreshield',
  tagline: 'Open-source security platform protecting LLM applications from prompt injection attacks',
  favicon: 'img/favicon.png',

  future: {
    v4: true,
  },

  // === DEPLOYMENT ===
  url: 'https://docs.Koreshield.com',
  baseUrl: '/',
  organizationName: 'Koreshield',
  projectName: 'Koreshield',


  onBrokenLinks: 'throw',
  trailingSlash: true,

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  stylesheets: [
    {
      href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap',
      type: 'text/css',
    },
  ],

  // === CONTENT CONFIGURATION ===
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/Koreshield/Koreshield-docs/edit/main/',
          breadcrumbs: true,
          showLastUpdateAuthor: false,
          showLastUpdateTime: true,
        },
        theme: {
          customCss: './src/css/custom.scss',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    'docusaurus-plugin-sass',
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['en'],
        docsRouteBasePath: '/docs',
      },
    ],
  ],

  // === THEME CONFIGURATION ===
  themeConfig: {
    image: 'img/Koreshield-social-card.jpg',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    // === NAVIGATION BAR ===
    navbar: {
      hideOnScroll: false,
      title: 'Koreshield',
      logo: {
        alt: 'Koreshield Logo',
        src: 'img/Black.svg',
        srcDark: 'img/White.svg',
        href: 'https://Koreshield.com/',
      },
      items: [
        {
          to: 'https://Koreshield.com/',
          position: 'left',
          label: 'Product',
        },
        {
          to: '/docs/getting-started/quick-start',
          label: 'Getting Started',
          position: 'left',
          className: 'nav-link_getting-started',
        },
        {
          to: '/docs/integrations/',
          label: 'Integrations',
          position: 'left',
        },
        {
          to: '/docs/features/rag-defense',
          label: 'Features',
          position: 'left',
        },
        {
          type: 'search',
          position: 'right',
        },
        {
          to: '/docs/api/',
          label: 'API Reference',
          position: 'right',
        },
        {
          href: 'https://github.com/Koreshield/',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://discord.gg/Koreshield',
          label: 'Community',
          position: 'right',
        },
      ],
    },
    // === FOOTER ===
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Product',
          items: [
            {
              label: 'Introduction',
              to: '/',
            },
            {
              label: 'Installation',
              to: '/docs/getting-started/installation',
            },
            {
              label: 'Quick Start',
              to: '/docs/getting-started/quick-start',
            },
            {
              label: 'Configuration',
              to: '/docs/configuration/',
            },
          ],
        },
        {
          title: 'Developers',
          items: [
            {
              label: 'API Reference',
              to: '/docs/api/',
            },
            {
              label: 'Python SDK',
              href: 'https://github.com/koreshield/python-sdk',
            },
            {
              label: 'JavaScript SDK',
              href: 'https://github.com/koreshield/node-sdk',
            },
            {
              label: 'Integrations',
              to: '/docs/integrations/',
            },
          ],
        },
        {
          title: 'Features',
          items: [
            {
              label: 'RAG Defense Engine',
              to: '/docs/features/rag-defense',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              html: '<a class="footer-icon-link" href="https://github.com/Koreshield/" aria-label="GitHub" rel="noopener noreferrer" target="_blank"><svg viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg></a>',
            },
            {
              html: '<a class="footer-icon-link" href="https://discord.gg/Koreshield" aria-label="Discord" rel="noopener noreferrer" target="_blank"><svg viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false"><path fill="currentColor" d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.078.037 13.38 13.38 0 0 0-.596 1.224 18.563 18.563 0 0 0-5.487 0 13.38 13.38 0 0 0-.596-1.224.074.074 0 0 0-.078-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.054-.32 13.579.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.04.077.077 0 0 0 .084-.027 14.28 14.28 0 0 0 1.226-1.994.076.076 0 0 0-.041-.105 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.127c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.009c.12.1.246.198.372.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.076.076 0 0 0-.04.106c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.864 19.864 0 0 0 6.002-3.04.077.077 0 0 0 .031-.055c.5-5.177-.838-9.673-3.548-13.66a.061.061 0 0 0-.031-.03Zm-13.67 10.91c-1.183 0-2.157-1.085-2.157-2.419 0-1.334.955-2.419 2.157-2.419 1.21 0 2.175 1.094 2.157 2.419 0 1.334-.955 2.419-2.157 2.419Zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.334.955-2.419 2.157-2.419 1.21 0 2.175 1.094 2.157 2.419 0 1.334-.946 2.419-2.157 2.419Z"/></svg></a>',
            },
            {
              html: '<a class="footer-icon-link" href="https://twitter.com/Koreshield" aria-label="Twitter" rel="noopener noreferrer" target="_blank"><svg viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.658l-5.214-6.817-5.96 6.817H1.687l7.73-8.835L1.25 2.25h6.827l4.713 6.231 5.454-6.231Zm-1.161 17.52h1.833L7.083 4.126H5.117L17.083 19.77Z"/></svg></a>',
            },
            {
              label: 'Contributing',
              href: 'https://github.com/Koreshield/',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Case Studies',
              to: '/docs/case-studies/',
            },
            {
              label: 'Security',
              href: 'https://github.com/Koreshield/',
            },
            {
              label: 'License',
              href: 'https://github.com/Koreshield/',
            },
            {
              label: 'Support',
              href: 'mailto:support@Koreshield.com',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Koreshield. Open source under MIT License.`,
    },
    // === CODE HIGHLIGHTING ===
    prism: {
      theme: prismThemes.vsLight,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: [
        'python',
        'javascript',
        'typescript',
        'java',
        'bash',
        'json',
        'yaml',
        'docker',
        'nginx',
      ],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
