/*
 * Optional GA4 integration.
 * The deploy workflow may inject the public Measurement ID through
 * analytics-config.js. The ID is not a credential and is visible to browsers.
 */
(function () {
    'use strict';

    const MEASUREMENT_ID = window.PORTFOLIO_GA_MEASUREMENT_ID || 'G-REPLACE_ME';
    const CONSENT_KEY = 'portfolio_analytics_consent';

    if (!/^G-[A-Z0-9]+$/.test(MEASUREMENT_ID)) return;

    const consentDefaults = {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        wait_for_update: 500,
    };

    function ensureGtag() {
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
        window.gtag('consent', 'default', consentDefaults);
    }

    function loadAnalytics() {
        if (document.querySelector('script[data-portfolio-ga]')) return;
        ensureGtag();
        window.gtag('consent', 'update', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
        });

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
        script.dataset.portfolioGa = 'true';
        script.onload = () => {
            window.gtag('js', new Date());
            window.gtag('config', MEASUREMENT_ID, { send_page_view: true });
        };
        document.head.appendChild(script);
    }

    function showPreferences() {
        const banner = document.getElementById('analytics-consent');
        if (banner) banner.hidden = false;
    }

    function setConsent(value) {
        localStorage.setItem(CONSENT_KEY, value);
        const banner = document.getElementById('analytics-consent');
        if (banner) banner.hidden = true;
        if (value === 'granted') loadAnalytics();
    }

    function addPreferencesControl() {
        const footer = document.getElementById('main-footer');
        if (!footer || footer.querySelector('[data-analytics-preferences]')) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'analytics-preferences';
        button.dataset.analyticsPreferences = 'true';
        button.textContent = 'Configurar analítica';
        button.addEventListener('click', showPreferences);
        footer.querySelector('.footer-content')?.appendChild(button);
    }

    function init() {
        const savedConsent = localStorage.getItem(CONSENT_KEY);
        const banner = document.createElement('section');
        banner.id = 'analytics-consent';
        banner.className = 'analytics-consent';
        banner.hidden = savedConsent !== null;
        banner.setAttribute('aria-label', 'Preferencias de analítica');
        banner.innerHTML = `
            <div>
                <strong>Analítica opcional</strong>
                <p>Google Analytics solo se activa si aceptas las métricas de uso. Puedes cambiar esta decisión cuando quieras.</p>
            </div>
            <div class="analytics-consent-actions">
                <button type="button" class="analytics-consent-reject">Rechazar</button>
                <button type="button" class="analytics-consent-accept">Aceptar analítica</button>
            </div>`;
        document.body.appendChild(banner);
        banner.querySelector('.analytics-consent-reject').addEventListener('click', () => setConsent('denied'));
        banner.querySelector('.analytics-consent-accept').addEventListener('click', () => setConsent('granted'));

        if (savedConsent === 'granted') loadAnalytics();
        window.setTimeout(addPreferencesControl, 0);
    }

    document.addEventListener('DOMContentLoaded', init, { once: true });
}());
