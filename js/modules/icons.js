/**
 * icons.js
 * Wrapper for Feather Icons initialization.
 */
export function initIcons() {
    if (typeof feather !== 'undefined') {
        try {
            feather.replace();
        } catch (e) {
            console.warn('Feather icons init failed:', e);
        }
    }
}
