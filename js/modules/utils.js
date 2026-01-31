/**
 * utils.js
 * Shared utility functions
 */

export function detectBasePath() {
    return window.location.pathname.includes('/pages/') ? '../' : './';
}

export function protectEmails() {
    document.querySelectorAll('.email-protected').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'mailto:contacto@rafaelperezllorca.com'; 
        });
        btn.removeAttribute('onclick');
    });
}
