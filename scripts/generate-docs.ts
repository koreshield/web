/**
 * Generate TypeScript documentation content from MDX files
 * Reads all MDX files from client-facing-documentation and creates TypeScript constants
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.resolve(__dirname, '../client-facing-documentation');
const OUTPUT_FILE = path.resolve(__dirname, '../src/docs/content.ts');

interface FrontMatter {
	title?: string;
	description?: string;
	sidebar_position?: number;
	slug?: string;
	last_update?: {
		date?: string;
	};
}

interface DocEntry {
	title: string;
	description?: string;
	content: string;
	order?: number;
}

interface SectionConfig {
	title: string;
	description?: string;
	order?: number;
	docs: Record<string, DocEntry>;
}

type DocsConfig = Record<string, SectionConfig>;

/**
 * Parse YAML frontmatter from MDX file
 */
function parseFrontMatter(content: string): { frontMatter: FrontMatter; content: string } {
	const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!match) {
		return { frontMatter: {}, content };
	}

	const yamlContent = match[1];
	const bodyContent = match[2];

	const frontMatter: FrontMatter = {};

	// Parse YAML fields
	const titleMatch = yamlContent.match(/title:\s*(.+)/);
	if (titleMatch) frontMatter.title = titleMatch[1].trim().replace(/^["']|["']$/g, '');

	const descMatch = yamlContent.match(/description:\s*(.+)/);
	if (descMatch) frontMatter.description = descMatch[1].trim().replace(/^["']|["']$/g, '');

	const slugMatch = yamlContent.match(/slug:\s*(.+)/);
	if (slugMatch) frontMatter.slug = slugMatch[1].trim().replace(/^["']|["']$/g, '');

	const posMatch = yamlContent.match(/sidebar_position:\s*(\d+)/);
	if (posMatch) frontMatter.sidebar_position = parseInt(posMatch[1], 10);

	return { frontMatter, content: bodyContent.trim() };
}

/**
 * Get slug from path or frontmatter
 */
function getSlug(filePath: string, frontMatter: FrontMatter): string {
	if (frontMatter.slug) {
		// Extract last part of slug path
		const parts = frontMatter.slug.split('/').filter(Boolean);
		return parts[parts.length - 1];
	}
	return path.basename(filePath, '.mdx');
}

/**
 * Get section name from directory
 */
function getSectionName(dirPath: string): string {
	return path.basename(dirPath);
}

/**
 * Generate section title from directory name
 */
function generateSectionTitle(dirName: string): string {
	return dirName
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/**
 * Read all MDX files and build config
 */
function generateDocsConfig(): DocsConfig {
	const config: DocsConfig = {};

	// Define section order
	const sectionOrder: Record<string, number> = {
		'overview': 0,
		'getting-started': 1,
		'client-integration': 2,
		'features': 3,
		'configuration': 4,
		'compliance': 5,
		'best-practices': 6,
		'case-studies': 7,
		'integrations': 8,
		'api': 9,
		'api-reference': 10,
	};

	// Process top-level MDX files
	const topLevelFiles = fs.readdirSync(DOCS_DIR).filter(file => file.endsWith('.mdx'));
	topLevelFiles.forEach(file => {
		const filePath = path.join(DOCS_DIR, file);
		const content = fs.readFileSync(filePath, 'utf-8');
		const { frontMatter, content: bodyContent } = parseFrontMatter(content);

		const key = path.basename(file, '.mdx');
		const title = frontMatter.title || generateSectionTitle(key);

		config[key] = {
			title,
			description: frontMatter.description,
			order: sectionOrder[key] || 999,
			docs: {
				index: {
					title,
					description: frontMatter.description,
					content: bodyContent,
				},
			},
		};
	});

	// Process subdirectories
	const subdirs = fs.readdirSync(DOCS_DIR).filter(name => {
		const fullPath = path.join(DOCS_DIR, name);
		return fs.statSync(fullPath).isDirectory();
	});

	subdirs.forEach(subdir => {
		const sectionPath = path.join(DOCS_DIR, subdir);
		const sectionName = getSectionName(sectionPath);
		const sectionTitle = generateSectionTitle(sectionName);

		const docs: Record<string, DocEntry> = {};
		let sectionOrder = 0;

		// Read meta.json if it exists
		const metaPath = path.join(sectionPath, 'meta.json');
		let metaConfig = {};
		if (fs.existsSync(metaPath)) {
			try {
				metaConfig = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
			} catch (e) {
				console.warn(`Failed to parse ${metaPath}:`, e);
			}
		}

		// Process MDX files in subdirectory
		const mdxFiles = fs
			.readdirSync(sectionPath)
			.filter(file => file.endsWith('.mdx'))
			.sort();

		mdxFiles.forEach((file, index) => {
			const filePath = path.join(sectionPath, file);
			const content = fs.readFileSync(filePath, 'utf-8');
			const { frontMatter, content: bodyContent } = parseFrontMatter(content);

			const slug = getSlug(filePath, frontMatter);
			const title = frontMatter.title || generateSectionTitle(slug);

			docs[slug] = {
				title,
				description: frontMatter.description,
				content: bodyContent,
				order: frontMatter.sidebar_position ?? index,
			};
		});

		config[sectionName] = {
			title: sectionTitle,
			order: sectionOrder[sectionName] || 999,
			docs,
		};
	});

	return config;
}

/**
 * Escape string for TypeScript
 */
function escapeString(str: string): string {
	return str
		.replace(/\\/g, '\\\\')
		.replace(/`/g, '\\`')
		.replace(/\$/g, '\\$')
		.replace(/\n/g, '\\n');
}

/**
 * Generate TypeScript file content
 */
function generateTypeScriptContent(config: DocsConfig): string {
	const lines: string[] = [];

	lines.push(`/**`);
	lines.push(` * Auto-generated documentation content`);
	lines.push(` * Generated from: client-facing-documentation`);
	lines.push(` * Do not edit manually - regenerate using: npm run generate-docs`);
	lines.push(` */`);
	lines.push(``);
	lines.push(`export interface DocEntry {`);
	lines.push(`\ttitle: string;`);
	lines.push(`\tdescription?: string;`);
	lines.push(`\tcontent: string;`);
	lines.push(`\torder?: number;`);
	lines.push(`}`);
	lines.push(``);
	lines.push(`export interface SectionConfig {`);
	lines.push(`\ttitle: string;`);
	lines.push(`\tdescription?: string;`);
	lines.push(`\torder?: number;`);
	lines.push(`\tdocs: Record<string, DocEntry>;`);
	lines.push(`}`);
	lines.push(``);
	lines.push(`export type DocsConfig = Record<string, SectionConfig>;`);
	lines.push(``);
	lines.push(`export const docsConfig: DocsConfig = {`);

	// Sort sections by order
	const sortedSections = Object.entries(config).sort(
		([, a], [, b]) => (a.order || 999) - (b.order || 999)
	);

	sortedSections.forEach(([key, section], idx) => {
		lines.push(`\t"${key}": {`);
		lines.push(`\t\ttitle: "${section.title}",`);
		if (section.description) {
			lines.push(`\t\tdescription: "${section.description}",`);
		}
		lines.push(`\t\torder: ${section.order ?? 999},`);
		lines.push(`\t\tdocs: {`);

		// Sort docs by order
		const sortedDocs = Object.entries(section.docs).sort(
			([, a], [, b]) => (a.order ?? 999) - (b.order ?? 999)
		);

		sortedDocs.forEach(([docKey, doc]) => {
			lines.push(`\t\t\t"${docKey}": {`);
			lines.push(`\t\t\t\ttitle: "${doc.title}",`);
			if (doc.description) {
				lines.push(`\t\t\t\tdescription: "${doc.description}",`);
			}
			lines.push(`\t\t\t\tcontent: \`${escapeString(doc.content)}\`,`);
			if (doc.order !== undefined) {
				lines.push(`\t\t\t\torder: ${doc.order},`);
			}
			lines.push(`\t\t\t},`);
		});

		lines.push(`\t\t},`);
		lines.push(`\t},`);
	});

	lines.push(`};`);

	return lines.join('\n');
}

/**
 * Main entry point
 */
function main() {
	console.log('🔍 Scanning documentation directory...');
	console.log(`📁 Reading from: ${DOCS_DIR}`);

	const config = generateDocsConfig();

	// Count docs
	let totalDocs = 0;
	Object.values(config).forEach(section => {
		totalDocs += Object.keys(section.docs).length;
	});

	console.log(`✅ Found ${Object.keys(config).length} sections with ${totalDocs} total pages`);

	const content = generateTypeScriptContent(config);
	fs.writeFileSync(OUTPUT_FILE, content, 'utf-8');

	console.log(`✅ Generated: ${OUTPUT_FILE}`);
	console.log(`📊 Documentation config ready for use!`);
}

main();
