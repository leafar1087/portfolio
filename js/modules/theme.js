/**
 * theme.js
 * Light/dark toggle. Icons served from the SVG sprite (no embedded strings).
 */

// Apply stored theme immediately to prevent FOUT
const storedTheme = localStorage.getItem('portfolio_theme') || 'dark';
document.documentElement.setAttribute('data-theme', storedTheme);

const SUN_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

const MOON_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

export function updateThemeIcon(theme) {
    // In light mode show moon (to switch to dark). In dark mode show sun.
    const iconHtml = theme === 'light' ? MOON_SVG : SUN_SVG;

    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
        if (typeof DOMPurify !== 'undefined') {
            btn.innerHTML = DOMPurify.sanitize(iconHtml, {
                USE_PROFILES: { html: true, svg: true },
                ADD_TAGS: ['svg', 'circle', 'line', 'path'],
                ADD_ATTR: ['viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'd', 'width', 'height', 'aria-hidden'],
            });
        } else {
            btn.innerHTML = iconHtml;
        }
    });

    // Swap Prism syntax-highlight theme if present
    const prismTheme = document.getElementById('prism-theme');
    if (prismTheme) {
        prismTheme.href = theme === 'light'
            ? 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/themes/prism.min.css'
            : 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/themes/prism-tomorrow.min.css';
    }
}

export function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next    = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('portfolio_theme', next);
    updateThemeIcon(next);
}

// Global fallback for non-module scripts
window.toggleTheme = toggleTheme;

// Event delegation — catches dynamically rendered buttons too
document.addEventListener('click', (e) => {
    if (e.target.closest('.theme-toggle-btn')) {
        e.preventDefault();
        toggleTheme();
    }
});
