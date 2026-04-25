import fs from 'fs';
import path from 'path';

const indexPath = path.join(process.cwd(), 'dist', 'studio', 'index.html');

try {
	let content = fs.readFileSync(indexPath, 'utf8');
	// Replace absolute static paths with the /studio/ prefix
	content = content.replace(/=["']\/static\//g, '="/studio/static/');
	fs.writeFileSync(indexPath, content);
	console.log('Successfully patched Sanity Studio index.html to use /studio/ base path.');
} catch (error) {
	console.error('Error patching Sanity Studio index.html:', error);
	process.exit(1);
}
