import re

with open('fonts.css', 'r') as f:
    css = f.read()

def replacer(match):
    url = match.group(1)
    filename = url.split('/')[-1]
    return f"url('../assets/fonts/{filename}')"

new_css = re.sub(r"url\((https://[^)]*)\)", replacer, css)

with open('fonts_updated.css', 'w') as f:
    f.write(new_css)
