/**
 * theme.js
 * Handles theme toggling (light/dark mode) and icon updates.
 */

// Initialize theme immediately on load to prevent flash
const storedTheme = localStorage.getItem('portfolio_theme') || 'dark';
document.documentElement.setAttribute('data-theme', storedTheme);

export function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    
    console.log(`[Theme] Switching from ${current} to ${next}`);
    
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('portfolio_theme', next);
    updateThemeIcon(next);
}

// Global expose for compatibility
window.toggleTheme = toggleTheme;

export function updateThemeIcon(theme) {
    const iconId = theme === 'light' ? 'icon-moon' : 'icon-sun';
    const btns = document.querySelectorAll('.theme-toggle-btn');
    
    if (btns.length === 0) return;

    // Detect basePath from current URL to ensure SVG path is correct
    const basePath = window.location.pathname.includes('/pages/') ? '../' : './';
    const spritePath = `${basePath}assets/images/tech-icons.svg#${iconId}`;
    
    btns.forEach(btn => {
        const html = `<svg width="20" height="20" style="pointer-events:none;"><use href="${spritePath}"/></svg>`;
        if (typeof DOMPurify !== 'undefined') {
            btn.innerHTML = DOMPurify.sanitize(html, {
                USE_PROFILES: { html: true, svg: true },
                ADD_TAGS: ['use', 'svg'],
                ADD_ATTR: ['href', 'xlink:href'] 
            });
        } else {
            btn.innerHTML = html;
        }
    });

    const prismTheme = document.getElementById('prism-theme');
    if (prismTheme) {
        prismTheme.href = theme === 'light' 
            ? 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css'
            : 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
    }
}

// Event Delegation for Theme Button (Robust)
// We use a broader listener to ensure it catches clicks even if the module loads late
document.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('.theme-toggle-btn');
    if (toggleBtn) {
        console.log('[Theme] Click detected on toggle button');
        e.preventDefault();
        e.stopPropagation();
        toggleTheme();
    }
}, true); // Use capture phase to be sure
