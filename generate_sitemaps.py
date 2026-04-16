#!/usr/bin/env python3
"""
Multi-domain sitemap generator for Koreshield properties.
Generates sitemaps for:
- https://koreshield.com (main web)
- https://blog.koreshield.com (astro blog)
- https://docs.koreshield.com (docusaurus docs)
"""

import os
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple
import xml.etree.ElementTree as ET


class SitemapGenerator:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.timestamp = datetime.now().isoformat()

    def generate_main_web_sitemap(self) -> str:
        """Generate sitemap for koreshield.com"""
        web_path = self.base_path / "koreshield-web" / "src"
        
        urls = [
            {
                "loc": "https://koreshield.com/",
                "priority": "1.0",
                "changefreq": "daily",
            },
            {
                "loc": "https://koreshield.com/features",
                "priority": "0.9",
                "changefreq": "weekly",
            },
            {
                "loc": "https://koreshield.com/pricing",
                "priority": "0.9",
                "changefreq": "weekly",
            },
            {
                "loc": "https://koreshield.com/docs",
                "priority": "0.8",
                "changefreq": "weekly",
            },
            {
                "loc": "https://koreshield.com/blog",
                "priority": "0.8",
                "changefreq": "weekly",
            },
        ]
        
        return self._create_sitemap_xml(urls)

    def generate_blog_sitemap(self) -> str:
        """Generate sitemap for blog.koreshield.com (Astro)"""
        blog_path = self.base_path / "koreshield-blog" / "src" / "content" / "blog"
        
        urls = [
            {
                "loc": "https://blog.koreshield.com/",
                "priority": "1.0",
                "changefreq": "daily",
            },
        ]
        
        # Scan for blog posts
        if blog_path.exists():
            for md_file in blog_path.glob("*.md"):
                post_slug = md_file.stem
                urls.append({
                    "loc": f"https://blog.koreshield.com/{post_slug}/",
                    "priority": "0.8",
                    "changefreq": "monthly",
                })
        
        return self._create_sitemap_xml(urls)

    def generate_docs_sitemap(self) -> str:
        """Generate sitemap for docs.koreshield.com (Docusaurus)"""
        docs_path = self.base_path / "koreshield-docs" / "docs"
        
        urls = [
            {
                "loc": "https://docs.koreshield.com/",
                "priority": "1.0",
                "changefreq": "daily",
            },
        ]
        
        # Scan for documentation files
        if docs_path.exists():
            for md_file in docs_path.rglob("*.md"):
                # Skip index files
                if md_file.name == "index.md" or md_file.name.startswith("_"):
                    continue
                
                # Create URL from file path
                rel_path = md_file.relative_to(docs_path)
                doc_slug = str(rel_path.with_suffix("")).replace("\\", "/")
                
                urls.append({
                    "loc": f"https://docs.koreshield.com/{doc_slug}/",
                    "priority": "0.8",
                    "changefreq": "monthly",
                })
        
        return self._create_sitemap_xml(urls)

    def _create_sitemap_xml(self, urls: List[Dict[str, str]]) -> str:
        """Create XML sitemap from URL list"""
        root = ET.Element("urlset")
        root.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
        root.set("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance")
        root.set("xsi:schemaLocation", 
                "http://www.sitemaps.org/schemas/sitemap/0.9 "
                "http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd")
        
        for url_data in urls:
            url_elem = ET.SubElement(root, "url")
            
            loc = ET.SubElement(url_elem, "loc")
            loc.text = url_data["loc"]
            
            lastmod = ET.SubElement(url_elem, "lastmod")
            lastmod.text = datetime.now().strftime("%Y-%m-%d")
            
            changefreq = ET.SubElement(url_elem, "changefreq")
            changefreq.text = url_data.get("changefreq", "weekly")
            
            priority = ET.SubElement(url_elem, "priority")
            priority.text = url_data.get("priority", "0.5")
        
        return ET.tostring(root, encoding="unicode")

    def generate_sitemap_index(self) -> str:
        """Generate master sitemap index"""
        root = ET.Element("sitemapindex")
        root.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
        
        sitemaps = [
            "https://koreshield.com/sitemap.xml",
            "https://blog.koreshield.com/sitemap.xml",
            "https://docs.koreshield.com/sitemap.xml",
        ]
        
        for sitemap_url in sitemaps:
            sitemap = ET.SubElement(root, "sitemap")
            loc = ET.SubElement(sitemap, "loc")
            loc.text = sitemap_url
        
        return ET.tostring(root, encoding="unicode")

    def save_sitemaps(self):
        """Save all generated sitemaps to their locations"""
        # Generate sitemaps
        main_xml = self.generate_main_web_sitemap()
        blog_xml = self.generate_blog_sitemap()
        docs_xml = self.generate_docs_sitemap()
        index_xml = self.generate_sitemap_index()
        
        # Save main web sitemap
        main_sitemap_path = self.base_path / "koreshield-web" / "public" / "sitemap.xml"
        self._write_sitemap(main_sitemap_path, main_xml, "Main website (koreshield.com)")
        
        # Save blog sitemap
        blog_sitemap_path = self.base_path / "koreshield-blog" / "public" / "sitemap.xml"
        self._write_sitemap(blog_sitemap_path, blog_xml, "Blog (blog.koreshield.com)")
        
        # Save docs sitemap
        docs_sitemap_path = self.base_path / "koreshield-docs" / "static" / "sitemap.xml"
        self._write_sitemap(docs_sitemap_path, docs_xml, "Docs (docs.koreshield.com)")
        
        # Save sitemap index (can be served from any domain or root)
        index_path = self.base_path / "sitemap_index.xml"
        self._write_sitemap(index_path, index_xml, "Sitemap Index")
        
        print("\n✅ All sitemaps generated successfully!")
        print(f"   - {main_sitemap_path}")
        print(f"   - {blog_sitemap_path}")
        print(f"   - {docs_sitemap_path}")
        print(f"   - {index_path}")

    def _write_sitemap(self, filepath: Path, content: str, description: str):
        """Write sitemap to file with proper formatting"""
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        # Pretty print the XML
        root = ET.fromstring(content)
        self._indent_xml(root)
        
        tree = ET.ElementTree(root)
        tree.write(filepath, encoding="utf-8", xml_declaration=True)
        print(f"✓ {description}: {filepath}")

    def _indent_xml(self, elem, level=0):
        """Pretty print XML"""
        indent = "\n" + level * "  "
        if len(elem):
            if not elem.text or not elem.text.strip():
                elem.text = indent + "  "
            if not elem.tail or not elem.tail.strip():
                elem.tail = indent
            for child in elem:
                self._indent_xml(child, level + 1)
            if not child.tail or not child.tail.strip():
                child.tail = indent
        else:
            if level and (not elem.tail or not elem.tail.strip()):
                elem.tail = indent

    def update_robots_txt(self):
        """Update robots.txt files to point to sitemaps"""
        
        robots_configs = {
            self.base_path / "koreshield-web" / "public" / "robots.txt": 
                "https://koreshield.com/sitemap.xml",
            self.base_path / "koreshield-blog" / "public" / "robots.txt": 
                "https://blog.koreshield.com/sitemap.xml",
            self.base_path / "koreshield-docs" / "static" / "robots.txt": 
                "https://docs.koreshield.com/sitemap.xml",
        }
        
        robots_content = """# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Sitemap location
Sitemap: {sitemap_url}

# Crawl delay
Crawl-delay: 1

# Allow all major search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Baiduspider
Allow: /
"""
        
        for robots_path, sitemap_url in robots_configs.items():
            robots_path.parent.mkdir(parents=True, exist_ok=True)
            content = robots_content.format(sitemap_url=sitemap_url)
            
            with open(robots_path, "w") as f:
                f.write(content)
            print(f"✓ Updated robots.txt: {robots_path}")


def main():
    base_path = Path(__file__).parent
    
    print("🔍 Generating sitemaps for all Koreshield properties...\n")
    
    generator = SitemapGenerator(base_path)
    
    print("Generating sitemaps:")
    generator.save_sitemaps()
    
    print("\nUpdating robots.txt files:")
    generator.update_robots_txt()
    
    print("\n" + "="*60)
    print("📊 NEXT STEPS:")
    print("="*60)
    print("""
1. Upload sitemaps to your servers:
   - koreshield-web/public/sitemap.xml → koreshield.com
   - koreshield-blog/public/sitemap.xml → blog.koreshield.com
   - koreshield-docs/static/sitemap.xml → docs.koreshield.com

2. In Google Search Console:
   ✓ Main: https://koreshield.com/sitemap.xml
   ✓ Blog: https://blog.koreshield.com/sitemap.xml
   ✓ Docs: https://docs.koreshield.com/sitemap.xml

3. Submit sitemaps to search engines using:
   - Google Search Console (preferred)
   - Bing Webmaster Tools
   - Yandex Webmaster

4. Set up automated updates:
   - Run this script after each deploy
   - Add to your CI/CD pipeline
""")


if __name__ == "__main__":
    main()
