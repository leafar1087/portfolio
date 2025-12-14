import os
import json
import re
from datetime import datetime

# Configuration

"""
SCRIPT DE AUTOMATIZACIÓN DE CONTENIDO (Static Site Generator)
-------------------------------------------------------------
Este script actúa como el "Backend" en tiempo de construcción (Build Time).
Su función es convertir la carpeta de artículos Markdown en una API estática (JSON)
que el navegador pueda consumir.

FLUJO DE TRABAJO (ETL):
1. EXTRACT: Escanea la carpeta 'posts/' buscando archivos .md.
2. TRANSFORM: 
   - Lee el Frontmatter (metadatos YAML entre ---).
   - Procesa la lógica bilingüe: Crea objetos para Inglés (default) y Español (usando sufijos _es).
   - Ordena los artículos por fecha descendente (lo nuevo primero).
3. LOAD: Guarda el resultado en 'posts.json'.

USO:
- Local: Ejecutar `python build_index.py` antes de subir cambios.
- CI/CD: Cloudflare Pages ejecuta esto automáticamente al detectar un git push.
"""



POSTS_DIR = 'posts'
OUTPUT_FILE = 'posts.json'

def parse_frontmatter(content):
    """
    Extracts metadata from the YAML frontmatter block of a markdown file.
    Returns a dictionary of metadata or None if frontmatter is missing/invalid.
    """
    # Regex to capture content between the first two '---' separators
    match = re.search(r'^---\s*\n(.*?)\n---\s*', content, re.DOTALL)
    
    if not match:
        return None
    
    frontmatter_raw = match.group(1)
    metadata = {}
    
    # Parse each line of the frontmatter
    for line in frontmatter_raw.split('\n'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
            
        # Split key: value
        parts = line.split(':', 1)
        if len(parts) < 2:
            continue
            
        key = parts[0].strip()
        value = parts[1].strip()
        
        # Handle tags list (e.g., tags: ["a", "b"] or tags: [a, b])
        if key == 'tags':
            # Remove brackets and quotes, then split
            clean_value = value.strip('[]')
            tags = [t.strip().strip('"').strip("'") for t in clean_value.split(',') if t.strip()]
            metadata[key] = tags
        else:
            # Clean string values (remove quotes if present)
            if (value.startswith('"') and value.endswith('"')) or \
               (value.startswith("'") and value.endswith("'")):
                value = value[1:-1]
            metadata[key] = value
            
    return metadata

def main():
    print(f"[*] Starting Blog Index Build Process...")
    print(f"[*] Scanning directory: {POSTS_DIR}")
    
    posts = []
    
    if not os.path.exists(POSTS_DIR):
        print(f"[!] Error: Directory '{POSTS_DIR}' not found.")
        return

    # Iterate over files in posts directory
    for filename in os.listdir(POSTS_DIR):
        if not filename.endswith('.md'):
            continue
            
        filepath = os.path.join(POSTS_DIR, filename)
        post_id = os.path.splitext(filename)[0]
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            metadata = parse_frontmatter(content)
            
            if metadata:
                # Construct Bilingual Object
                post_entry = {
                    'id': post_id,
                    'date': metadata.get('date', ''),
                    'en': {},
                    'es': {}
                }
                
                # Fill EN (Default)
                post_entry['en']['title'] = metadata.get('title', post_id.title())
                post_entry['en']['description'] = metadata.get('description', '')
                post_entry['en']['tags'] = metadata.get('tags', [])
                post_entry['en']['author'] = metadata.get('author', '')

                # Fill ES (Mapped from _es fields)
                post_entry['es']['title'] = metadata.get('title_es', post_entry['en']['title']) # Fallback to EN
                post_entry['es']['description'] = metadata.get('description_es', post_entry['en']['description'])
                post_entry['es']['tags'] = metadata.get('tags', []) # Tags usually shared or need tags_es? Assuming shared for now.
                post_entry['es']['author'] = metadata.get('author', '')

                # Fallback Date logic if missing
                if not post_entry['date']:
                     mod_time = os.path.getmtime(filepath)
                     post_entry['date'] = datetime.fromtimestamp(mod_time).strftime('%Y-%m-%d')
                
                posts.append(post_entry)
                print(f"[+] Processed: {filename}")
            else:
                print(f"[-] Warning: No Valid Frontmatter in {filename}. Skipping.")
                
        except Exception as e:
            print(f"[!] Error processing {filename}: {str(e)}")

    # Sort posts by date descending (newest first)
    try:
        posts.sort(key=lambda x: x.get('date', ''), reverse=True)
    except Exception as e:
        print(f"[!] Warning: Could not sort strictly by date. {str(e)}")

    # Write to JSON
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(posts, f, indent=4, ensure_ascii=False)
        print(f"[*] Success! Index generated at '{OUTPUT_FILE}' with {len(posts)} posts.")
    except Exception as e:
        print(f"[!] Error writing output file: {str(e)}")

if __name__ == '__main__':
    main()
