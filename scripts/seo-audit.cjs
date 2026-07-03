#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const sitemapFiles = [
	'sitemap.xml',
	'sitemap-blog.xml',
	'sitemap-docs.xml',
	'sitemap-research.xml',
	'sitemap-careers.xml',
];
const canonicalOrigin = 'https://koreshield.ai';
const failures = [];
const allUrls = new Map();

function urlsFromXml(xml) {
	return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function fail(message) {
	failures.push(message);
}

const robots = fs.readFileSync(path.join(publicDir, 'robots.txt'), 'utf-8');
const universalRobotsBlock = robots.match(/User-agent: \*\n([\s\S]*?)(?=\nUser-agent:|\n# Aggressive)/)?.[1] || '';
const disallowed = universalRobotsBlock
	.split('\n')
	.filter((line) => line.startsWith('Disallow: '))
	.map((line) => line.slice('Disallow: '.length));

for (const filename of sitemapFiles) {
	const xml = fs.readFileSync(path.join(publicDir, filename), 'utf-8');
	for (const urlValue of urlsFromXml(xml)) {
		let url;
		try {
			url = new URL(urlValue);
		} catch {
			fail(`${filename}: invalid URL ${urlValue}`);
			continue;
		}

		if (url.origin !== canonicalOrigin) {
			fail(`${filename}: non-canonical origin ${urlValue}`);
		}
		if (url.search || url.hash) {
			fail(`${filename}: URL contains query or fragment ${urlValue}`);
		}
		if (allUrls.has(urlValue)) {
			fail(`${filename}: duplicate URL also present in ${allUrls.get(urlValue)}: ${urlValue}`);
		} else {
			allUrls.set(urlValue, filename);
		}
		const blockedBy = disallowed.find((rule) => rule && url.pathname.startsWith(rule));
		if (blockedBy) {
			fail(`${filename}: ${urlValue} is blocked by robots rule ${blockedBy}`);
		}
	}
}

if (/koreshield\.com/.test(robots)) {
	fail('robots.txt advertises the non-canonical .com host');
}
if (!robots.includes('Sitemap: https://koreshield.ai/sitemap-index.xml')) {
	fail('robots.txt does not advertise the canonical sitemap index');
}
if (robots.match(/^Sitemap:/gm)?.length !== 1) {
	fail('robots.txt must advertise exactly one sitemap index');
}
if (fs.readdirSync(publicDir).some((filename) => filename.startsWith('sitemap.com'))) {
	fail('non-canonical .com sitemap files still exist');
}

const manifestPath = path.join(publicDir, 'seo-routes.json');
if (!fs.existsSync(manifestPath)) {
	fail('SEO route manifest is missing');
} else {
	const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
	if (manifest.origin !== canonicalOrigin) {
		fail(`SEO route manifest uses non-canonical origin ${manifest.origin}`);
	}
	for (const urlValue of allUrls.keys()) {
		const routePath = new URL(urlValue).pathname;
		const metadata = manifest.routes?.[routePath];
		if (!metadata) {
			fail(`SEO route manifest is missing ${routePath}`);
			continue;
		}
		if (!metadata.title?.trim() || !metadata.description?.trim()) {
			fail(`SEO route manifest has incomplete metadata for ${routePath}`);
		}
	}
	for (const routePath of Object.keys(manifest.routes || {})) {
		const urlValue = `${canonicalOrigin}${routePath === '/' ? '/' : routePath}`;
		if (!allUrls.has(urlValue)) {
			fail(`SEO route manifest contains a URL not found in sitemaps: ${routePath}`);
		}
	}
}

const socialImage = path.join(publicDir, 'og-default.png');
if (!fs.existsSync(socialImage)) {
	fail('default social image is missing');
} else {
	const imageBuffer = fs.readFileSync(socialImage);
	const width = imageBuffer.readUInt32BE(16);
	const height = imageBuffer.readUInt32BE(20);
	if (width !== 1200 || height !== 630) {
		fail(`default social image must be 1200x630, found ${width}x${height}`);
	}
}

if (failures.length > 0) {
	console.error(`SEO validation failed (${failures.length}):`);
	for (const failure of failures) console.error(`- ${failure}`);
	process.exit(1);
}

console.log(`SEO validation passed for ${allUrls.size} canonical URLs.`);
