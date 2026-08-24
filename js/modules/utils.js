/**
 * utils.js
 * Shared utility functions
 */

export function detectBasePath() {
    return window.location.pathname.includes('/pages/') ? '../' : './';
}

export function protectEmails() {
    // 1. Buttons
    document.querySelectorAll('.email-protected').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'mailto:contacto@rafaelperezllorca.com'; 
        });
        btn.removeAttribute('onclick');
    });

    // 2. Static text spans (for SEO/Bot protection in text)
    document.querySelectorAll('.email-deobfuscate').forEach(el => {
        const u = el.getAttribute('data-u');
        const d = el.getAttribute('data-d');
        if (u && d) {
            el.innerText = `${u}@${d}`;
        }
    });
}
