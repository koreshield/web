export type AuthorProfile = {
	slug: string;
	name: string;
	role: string;
	bio: string;
	image: string;
	linkedin: string;
	aliases: string[];
};

export const authorProfiles: AuthorProfile[] = [
	{
		slug: 'isaac-emmanuel',
		name: 'Isaac Emmanuel',
		role: 'Co-founder, CTO & Engineering Lead',
		bio: 'Isaac architects the Koreshield platform, SDKs, runtime proxy layer, detection systems, and operational infrastructure.',
		image: '/team/isaac-emmanuel.jpg',
		linkedin: 'https://www.linkedin.com/in/isaacnsisong/',
		aliases: ['Isaac Emmanuel'],
	},
	{
		slug: 'teslim-kazeem',
		name: 'Teslim O. Kazeem',
		role: 'Co-founder, CEO & Product Lead',
		bio: 'Teslim leads Koreshield product direction, customer discovery, commercial strategy, and the company’s work on practical AI security.',
		image: '/team/teslim-kazeem.png',
		linkedin: 'https://www.linkedin.com/in/teslim-kazeem/',
		aliases: ['Teslim O. Kazeem', 'Teslim Kazeem'],
	},
];

export function getAuthorBySlug(slug: string): AuthorProfile | undefined {
	return authorProfiles.find((author) => author.slug === slug);
}

export function getAuthorByName(name: string): AuthorProfile | undefined {
	return authorProfiles.find((author) => author.aliases.includes(name));
}
