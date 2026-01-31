/**
 * theme.js
 * Handles theme toggling (light/dark mode) and icon updates.
 */

// Initialize theme immediately on load to prevent flash
const storedTheme = localStorage.getItem('portfolio_theme') || 'dark';
document.documentElement.setAttribute('data-theme', storedTheme);

window.toggleTheme = function() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('portfolio_theme', next);
    updateThemeIcon(next);
};

export function updateThemeIcon(theme) {
    const icon = theme === 'light' ? 'moon' : 'sun';
    const btns = document.querySelectorAll('.theme-toggle-btn');
    if (btns.length > 0) {
        btns.forEach(btn => {
            btn.innerHTML = `<i data-feather="${icon}"></i>`;
        });
        if (window.feather) {
            try { feather.replace(); } catch(e) {}
        }
    }
}

// Event Delegation for Theme Button (Robust)
document.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('.theme-toggle-btn');
    if (toggleBtn) {
        e.preventDefault();
        window.toggleTheme();
    }
});

// Run once on load to sync icons
setTimeout(() => updateThemeIcon(storedTheme), 100);
