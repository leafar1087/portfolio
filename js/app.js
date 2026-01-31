/**
 * app.js
 * Main entry point using ES6 Modules.
 * Replaces init.js and script.js in the future.
 */

import { updateThemeIcon } from './modules/theme.js';
import { initIcons } from './modules/icons.js';
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

    initIcons();
    protectEmails();
    
    // Init Main App Logic (from script.js if adapted to module, for now global)
    if (typeof window.initApp === 'function') {
        window.initApp();
    }
});
