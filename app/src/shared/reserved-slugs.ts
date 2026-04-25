const RESERVED_SLUGS = [
  'admin',
  'api',
  'app',
  'auth',
  'billing',
  'dashboard',
  'docs',
  'help',
  'login',
  'logout',
  'pricing',
  'profile',
  'settings',
  'signup',
  'support',
  'www',
  'koreshield',
  'llm-firewall'
];

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase());
}