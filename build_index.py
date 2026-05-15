import os
import json
import re
from datetime import datetime

# Configuration
POSTS_DIR = 'posts'
OUTPUT_FILE = 'content-index.json'
SITEMAP_FILE = 'sitemap.xml'
LLMS_TXT_FILE = 'llms.txt'
BASE_URL = 'https://rafaelperezllorca.com'

STATIC_PAGES = [
    {'loc': '/', 'priority': '1.0', 'desc': 'Home - Portafolio Principal'},
    {'loc': '/pages/academy.html', 'priority': '0.9', 'desc': 'Academy - Formación y Cursos'},
    {'loc': '/pages/article.html', 'priority': '0.8', 'desc': 'Articles - Blog Técnico'},
    {'loc': '/pages/legal.html', 'priority': '0.3', 'desc': 'Legal - Aviso Legal'},
    {'loc': '/pages/privacy.html', 'priority': '0.3', 'desc': 'Privacy - Política de Privacidad'}
]

"""
## SCRIPT DE AUTOMATIZACIÓN DE CONTENIDO (SSG + SEO + AI)
-------------------------------------------------------------
Genera:
1. content-index.json (API para frontend)
2. sitemap.xml (SEO para Google/Bing)
3. llms.txt (Contexto para Agentes de IA)
"""

def parse_frontmatter(content):
    """Extras metadata from YAML frontmatter."""
    match = re.search(r'^---\s*\n(.*?)\n---\s*', content, re.DOTALL)
    if not match: return None
    
    frontmatter_raw = match.group(1)
    metadata = {}
    
    for line in frontmatter_raw.split('\n'):
        line = line.strip()
        if not line or line.startswith('#'): continue
        parts = line.split(':', 1)
        if len(parts) < 2: continue
        
        key = parts[0].strip()
        value = parts[1].strip()
        
        if key == 'tags':
            clean_value = value.strip('[]')
            tags = [t.strip().strip('"').strip("'") for t in clean_value.split(',') if t.strip()]
            metadata[key] = tags
        else:
            if (value.startswith('"') and value.endswith('"')) or \
               (value.startswith("'") and value.endswith("'")):
                value = value[1:-1]
            metadata[key] = value
            
    return metadata

def generate_sitemap(posts):
    """Generates a standard XML sitemap."""
    print(f"[*] Generating {SITEMAP_FILE}...")
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    # Add Static Pages
    for page in STATIC_PAGES:
        xml += '  <url>\n'
        xml += f'    <loc>{BASE_URL}{page["loc"]}</loc>\n'
        xml += f'    <lastmod>{datetime.now().strftime("%Y-%m-%d")}</lastmod>\n'
        xml += f'    <changefreq>monthly</changefreq>\n'
        xml += f'    <priority>{page["priority"]}</priority>\n'
        xml += '  </url>\n'

    # Add Posts (Dynamic)
    for post in posts:
        url = f"{BASE_URL}/pages/article.html?id={post['id']}"
        date = post.get('date', datetime.now().strftime("%Y-%m-%d"))
        
        xml += '  <url>\n'
        xml += f'    <loc>{url}</loc>\n'
        xml += f'    <lastmod>{date}</lastmod>\n'
        xml += f'    <changefreq>monthly</changefreq>\n'
        xml += f'    <priority>{"0.7" if post["type"] == "article" else "0.5"}</priority>\n'
        xml += '  </url>\n'

    xml += '</urlset>'
    
    with open(SITEMAP_FILE, 'w', encoding='utf-8') as f:
        f.write(xml)

def generate_llmstxt(posts):
    """Generates llms.txt for AI Agents with category separation."""
    print(f"[*] Generating {LLMS_TXT_FILE}...")
    
    md = f"# Rafael Pérez Llorca - Cybersecurity Engineer Portfolio\n"
    md += f"> Este archivo está optimizado para ser leído por agentes de IA. Contiene la estructura del sitio y los artículos técnicos disponibles.\n\n"
    
    md += "## Core Pages\n"
    for page in STATIC_PAGES:
        if 'Legal' in page['desc'] or 'Privacy' in page['desc']: continue
        md += f"- [{page['desc']}]({BASE_URL}{page['loc']})\n"

    # Separate Articles
    md += "\n## Technical Articles\n"
    for post in [p for p in posts if p['type'] == 'article']:
        title = post['en']['title']
        title_es = post['es']['title']
        url = f"{BASE_URL}/pages/article.html?id={post['id']}"
        md += f"- [{title} / {title_es}]({url})\n"

    # Separate Courses
    md += "\n## Educational Courses (Modules)\n"
    for post in [p for p in posts if p['type'] == 'course']:
        title = post['en']['title']
        url = f"{BASE_URL}/pages/article.html?id={post['id']}"
        md += f"- [{title}]({url})\n"

    with open(LLMS_TXT_FILE, 'w', encoding='utf-8') as f:
        f.write(md)

def main():
    print(f"[*] Starting Build Process...")
    posts = []
    
    if os.path.exists(POSTS_DIR):
        # Recursive scan for modules and subfolders
        for root, dirs, files in os.walk(POSTS_DIR):
            for filename in files:
                if not filename.endswith('.md'): continue
                
                filepath = os.path.join(root, filename)
                # rel_path will be e.g. 'devsecops.md' or 'python-course/modulo-01.md'
                rel_path = os.path.relpath(filepath, POSTS_DIR)
                post_id = os.path.splitext(rel_path)[0]
                
                # Type assignment: 'article' for root files, 'course' for subfolders
                category = 'article' if root == POSTS_DIR else 'course'
                
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    metadata = parse_frontmatter(content)
                    
                    # Ensure we have at least a basic entry even without metadata
                    if not metadata:
                        metadata = {}
                        # Fallback: Try to find first H1
                        h1_match = re.search(r'^#\s+(.*)', content)
                        if h1_match:
                            metadata['title'] = h1_match.group(1).strip()
                    
                    post_entry = {
                        'id': post_id,
                        'type': category,
                        'date': metadata.get('date', ''),
                        'en': {
                            'title': metadata.get('title', post_id.title()),
                            'description': metadata.get('description', ''),
                            'tags': metadata.get('tags', []),
                            'author': metadata.get('author', '')
                        },
                        'es': {
                            'title': metadata.get('title_es', metadata.get('title', '')),
                            'description': metadata.get('description_es', metadata.get('description', '')),
                            'tags': metadata.get('tags', []),
                            'author': metadata.get('author', '')
                        }
                    }
                    if not post_entry['date']:
                        mod_time = os.path.getmtime(filepath)
                        post_entry['date'] = datetime.fromtimestamp(mod_time).strftime('%Y-%m-%d')
                    
                    posts.append(post_entry)
                except Exception as e:
                    print(f"[!] Error processing {filepath}: {e}")

    # Sort
    posts.sort(key=lambda x: x.get('date', ''), reverse=True)

    # 1. Generate JSON (Master Index)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(posts, f, indent=4, ensure_ascii=False)
    print(f"[+] {OUTPUT_FILE} generated.")

    # 2. Generate Sitemap
    generate_sitemap(posts)
    print(f"[+] {SITEMAP_FILE} generated.")

    # 3. Generate LLMS.txt
    generate_llmstxt(posts)
    print(f"[+] {LLMS_TXT_FILE} generated.")

if __name__ == '__main__':
    main()
