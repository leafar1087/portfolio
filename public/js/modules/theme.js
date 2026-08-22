/**
 * theme.js
 * Light/dark toggle. Icons served from the SVG sprite (no embedded strings).
 */

// Apply stored theme immediately to prevent FOUT
const storedTheme = localStorage.getItem('portfolio_theme') || 'dark';
document.documentElement.setAttribute('data-theme', storedTheme);

const ICON_SVG = (id) =>
    `<svg width="18" height="18" aria-hidden="true" focusable="false">
       <use href="/assets/images/tech-icons.svg#${id}"></use>
     </svg>`;

export function updateThemeIcon(theme) {
    // In light mode show moon (to switch to dark). In dark mode show sun.
    const iconId  = theme === 'light' ? 'icon-moon' : 'icon-sun';
    const iconHtml = ICON_SVG(iconId);

    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
        if (typeof DOMPurify !== 'undefined') {
            btn.innerHTML = DOMPurify.sanitize(iconHtml, {
                USE_PROFILES: { html: true, svg: true },
                ADD_TAGS: ['svg', 'use'],
                ADD_ATTR: ['href', 'xlink:href', 'width', 'height',
                           'aria-hidden', 'focusable'],
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
