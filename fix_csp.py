import glob
import re

csp = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; font-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://cloudflareinsights.com;"

files = glob.glob('**/*.html', recursive=True)
for f in files:
    with open(f, 'r') as file:
        content = file.read()
    
    # regex to match <meta http-equiv="Content-Security-Policy" content="..." /> with any whitespace/newlines
    new_content = re.sub(
        r'<meta\s+http-equiv="Content-Security-Policy"\s+content="[^"]+"\s*/?>', 
        f'<meta http-equiv="Content-Security-Policy" content="{csp}" />', 
        content,
        flags=re.IGNORECASE | re.DOTALL
    )
    
    with open(f, 'w') as file:
        file.write(new_content)

print("HTML csp updated.")

# update _headers
with open('_headers', 'r') as file:
    content = file.read()

new_content = re.sub(
    r'Content-Security-Policy: .*', 
    f'Content-Security-Policy: {csp}', 
    content
)

with open('_headers', 'w') as file:
    file.write(new_content)

print("_headers updated.")
