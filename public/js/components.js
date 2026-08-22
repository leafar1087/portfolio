/**
 * components.js
 * Renders shared header and footer.
 * Logo: fetched once from /assets/images/rpll-logo.svg and injected inline
 * so it inherits CSS custom properties (currentColor, --text-muted, etc.).
 */

// Singleton cache: one fetch for the entire session regardless of how many
// times renderHeader / renderFooter are called.
let _logoSvgCache = null;

async function _fetchLogo(assetsPath) {
    if (_logoSvgCache !== null) return _logoSvgCache;
    try {
        const res = await fetch(`${assetsPath}images/rpll-logo.svg`);
        if (!res.ok) throw new Error(`logo fetch ${res.status}`);
        _logoSvgCache = await res.text();
    } catch {
        // Fallback: minimal inline text so the page never breaks
        _logoSvgCache = `<svg viewBox="0 0 80 24" class="logo-svg" aria-hidden="true">
          <text x="0" y="20" class="rpll-brand-text" font-weight="900" font-size="22" letter-spacing="2">RP<tspan fill="#00E5FF">LL</tspan></text>
        </svg>`;
    }
    return _logoSvgCache;
}

/** Inject the fetched SVG into `el`, sanitising with DOMPurify if available. */
function _injectSvg(el, svgText) {
    const EXTRA_TAGS = ['svg','g','polygon','path','circle','line','rect',
                        'text','tspan','defs','linearGradient','stop',
                        'filter','feGaussianBlur','feComposite','use','style'];
    const EXTRA_ATTR = ['viewBox','class','height','width','fill','stroke',
                        'stroke-width','stroke-linejoin','stroke-linecap',
                        'stroke-opacity','stroke-dasharray','opacity',
                        'transform','points','d','cx','cy','r',
                        'x','y','x1','x2','y1','y2',
                        'font-family','font-weight','font-size','letter-spacing',
                        'offset','stop-color','stop-opacity',
                        'stdDeviation','in','in2','operator','result',
                        'filter','href','xlink:href','id','aria-hidden'];

    if (typeof DOMPurify !== 'undefined') {
        el.innerHTML = DOMPurify.sanitize(svgText, {
            USE_PROFILES: { html: true, svg: true },
            ADD_TAGS:     EXTRA_TAGS,
            ADD_ATTR:     EXTRA_ATTR,
        });
    } else {
        el.innerHTML = svgText;
    }
    // Tag the injected SVG so CSS can target it
    const svg = el.querySelector('svg');
    if (svg) svg.classList.add('logo-svg');
}

const Components = {
    renderHeader(containerId, basePath = './') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const isHome     = basePath === './';
        const pagesPath  = isHome ? 'pages/' : '';
        const assetsPath = isHome ? './assets/' : '../assets/';
        const logoHref   = isHome ? '#' : '../index.html';
        const getLink    = (hash) => isHome ? hash : `../index.html${hash}`;

        const html = `
      <nav class="nav container">
        <div class="logo">
          <a href="${logoHref}" aria-label="RPLL Inicio" class="logo-link">
            <div class="logo-svg-wrap" id="logo-svg-header"></div>
          </a>
        </div>

        <ul class="nav-links">
          <li><a href="${getLink('#research')}"><span>Investigación</span></a></li>
          <li><a href="${getLink('#experience')}"><span>Experiencia</span></a></li>
          <li><a href="${getLink('#practice')}"><span>Especialidad</span></a></li>
          <li><a href="${pagesPath}article.html"><span>Artículos</span></a></li>
          <li><a href="${pagesPath}academy.html"><span>Academia</span></a></li>
          <li><a href="${getLink('#about')}"><span>Sobre mí</span></a></li>
          <!-- Mobile actions -->
          <li class="mobile-only">
            <button id="theme-toggle-mobile" class="theme-toggle-btn theme-btn-mobile" aria-label="Alternar Tema">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            </button>
          </li>
          <li class="mobile-only">
            <a href="${assetsPath}CV_Rafael_Perez.pdf" target="_blank" rel="noopener noreferrer" class="btn btn-primary w-full">
              <span>Descargar CV</span>
            </a>
          </li>
        </ul>

        <!-- Desktop actions -->
        <div class="nav-actions desktop-only">
          <button id="theme-toggle" class="theme-toggle-btn" aria-label="Alternar Tema">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          </button>
          <a href="${assetsPath}CV_Rafael_Perez.pdf" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
            <span>Descargar CV</span>
          </a>
        </div>

        <button class="hamburger" aria-label="Abrir menú de navegación">
          <svg width="22" height="22"><use href="/assets/images/tech-icons.svg#icon-menu"></use></svg>
        </button>
      </nav>`;

        container.classList.add('header');

        if (typeof DOMPurify !== 'undefined') {
            container.innerHTML = DOMPurify.sanitize(html, {
                USE_PROFILES: { html: true, svg: true },
                ADD_TAGS: ['use', 'svg'],
                ADD_ATTR: ['href', 'xlink:href', 'width', 'height', 'viewBox',
                           'aria-label', 'target', 'rel', 'class', 'id',
                           'data-i18n', 'style'],
            });
        } else {
            container.innerHTML = html;
        }

        // Inject logo SVG inline (async, non-blocking)
        _fetchLogo(assetsPath).then(svgText => {
            const wrap = document.getElementById('logo-svg-header');
            if (wrap) _injectSvg(wrap, svgText);
        });
    },

    renderFooter(containerId, basePath = './') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const isHome     = basePath === './';
        const pagesPath  = isHome ? 'pages/' : '';
        const assetsPath = isHome ? './assets/' : '../assets/';

        const html = `
      <div class="container footer-content">
        <div class="footer-info">
          <div class="footer-logo-wrap" id="logo-svg-footer"></div>
          <p data-i18n="footer.rights">
            &copy; ${new Date().getFullYear()} Rafael Pérez Llorca. Ingeniería de Sistemas &amp; Ciberseguridad.
          </p>
        </div>
        <div class="footer-links">
          <a href="${pagesPath}privacy.html" data-i18n="footer.privacy">Política de Privacidad</a>
          <a href="${pagesPath}legal.html"   data-i18n="footer.legal">Aviso Legal</a>
          <a href="https://www.linkedin.com/in/rperezll/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">LinkedIn</a>
          <a href="https://github.com/leafar1087"         target="_blank" rel="noopener noreferrer" aria-label="GitHub">GitHub</a>
        </div>
      </div>`;

        container.classList.add('footer');

        if (typeof DOMPurify !== 'undefined') {
            container.innerHTML = DOMPurify.sanitize(html, {
                USE_PROFILES: { html: true },
                ADD_ATTR: ['aria-label', 'target', 'rel', 'class', 'id', 'data-i18n'],
            });
        } else {
            container.innerHTML = html;
        }

        _fetchLogo(assetsPath).then(svgText => {
            const wrap = document.getElementById('logo-svg-footer');
            if (wrap) _injectSvg(wrap, svgText);
        });
    },
};
