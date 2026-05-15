/**
 * app.js
 * Main entry point using ES6 Modules.
 * Replaces init.js and script.js in the future.
 */

import { updateThemeIcon, toggleTheme } from './modules/theme.js';
import { detectBasePath, protectEmails } from './modules/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const basePath = detectBasePath();

    // Render Components
    if (typeof Components !== 'undefined') {
        if (document.getElementById('main-header')) {
            Components.renderHeader('main-header', basePath);
        }
        if (document.getElementById('main-footer')) {
            Components.renderFooter('main-footer', basePath);
        }
    }

    protectEmails();
    
    // Sync Theme Icon after rendering components
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    updateThemeIcon(currentTheme);

    // Direct listener as fail-safe
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            toggleTheme();
        };
    });
    
    // Init Main App Logic (from script.js if adapted to module, for now global)
    if (typeof window.initApp === 'function') {
        window.initApp();
    }
});
