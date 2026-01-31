const Components = {
    renderHeader: (containerId, basePath = './') => {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Path Adjustments
        const isHome = basePath === './';
        const pagesPath = isHome ? 'pages/' : '';
        const assetsPath = isHome ? './assets/' : '../assets/';
        const logoHref = isHome ? '#' : '../index.html';
        
        // Navigation Links Logic
        // If on homepage, anchors (#about) work directly.
        // If on pages, anchors must point to ../index.html#about
        const getLink = (hash) => isHome ? hash : `../index.html${hash}`;

        const html = `
      <nav class="nav container">
        <div class="logo">
          <a href="${logoHref}">Rafael Pérez Llorca</a>
        </div>

        <ul class="nav-links">
          <li>
            <a href="${getLink('#about')}"
              ><span data-i18n="nav.about">Sobre Mí</span
              ><span class="glowing-dot"></span
            ></a>
          </li>
          <li>
            <a href="${getLink('#expertise')}"
              ><span data-i18n="nav.expertise">Perfil</span
              ><span class="glowing-dot"></span
            ></a>
          </li>
          <li>
            <a href="${getLink('#experience')}"
              ><span data-i18n="nav.experience">Experiencia</span
              ><span class="glowing-dot"></span
            ></a>
          </li>
          <li>
            <a href="${getLink('#contact')}"
              ><span data-i18n="nav.contact">Contacto</span
              ><span class="glowing-dot"></span
            ></a>
          </li>
          <li>
            <a href="${pagesPath}academy.html"
              ><span data-i18n="nav.academy">Academia</span
              ><span class="glowing-dot"></span
            ></a>
          </li>
          <li>
            <a href="${pagesPath}article.html"
              ><span data-i18n="nav.article">Artículo</span
              ><span class="glowing-dot"></span
            ></a>
          </li>
          <!-- Mobile Actions -->
          <li class="mobile-only">
             <button
               id="theme-toggle-mobile" class="btn btn-outline btn-sm theme-toggle-btn w-full ml-0" style="display:flex; justify-content:center;"
               aria-label="Toggle Theme"
            >
              <i data-feather="sun"></i>
            </button>
          </li>
          <li class="mobile-only" id="lang-toggle-li-mobile">
            <button
              class="btn btn-outline lang-toggle-btn btn-sm ml-0"
            >
              ES
            </button>
          </li>
          <li class="mobile-only"><a href="${assetsPath}CV_Rafael_Perez.pdf" target="_blank" class="btn btn-filled"><span data-i18n="nav.resume">Descargar CV</span></a></li>
        </ul>

        <!-- Desktop Actions -->
        <div class="nav-actions desktop-only">
          <button
            class="btn btn-outline lang-toggle-btn btn-sm"
          >
            ES
          </button>
          <button id="theme-toggle" class="btn btn-outline btn-sm theme-toggle-btn" aria-label="Toggle Theme">
               <i data-feather="sun"></i>
          </button>
          <a href="${assetsPath}CV_Rafael_Perez.pdf" target="_blank" class="btn btn-filled"><span data-i18n="nav.resume">Resume</span></a>
        </div>

        <div class="hamburger" aria-label="Menu">
          <i data-feather="menu"></i>
        </div>
      </nav>
        `;

        container.classList.add('header'); // Ensure class is present
        container.innerHTML = html;
        
        // Re-initialize Feather Icons for the menu
        if (window.feather) {
            try { feather.replace(); } catch (e) { console.warn('Header icons init failed', e); }
        }
    },

    renderFooter: (containerId, basePath = './') => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const isHome = basePath === './';
        const pagesPath = isHome ? 'pages/' : '';

        const html = `
      <div class="footer-content">
        <div class="footer-socials">
          <a
            href="https://www.linkedin.com/in/rperezll/"
            target="_blank"
            rel="me"
            aria-label="LinkedIn"
            ><i data-feather="linkedin"></i
          ></a>
          <a href="#" aria-label="Email" class="email-trigger"
            ><i data-feather="mail"></i
          ></a>
        </div>
        <div class="footer-links">
          <a href="${pagesPath}privacy.html" data-i18n="footer.privacy"
            >Política de Privacidad</a
          >
          <a href="${pagesPath}legal.html" data-i18n="footer.legal">Aviso Legal</a>
        </div>
        <div class="footer-copyright">
          <p data-i18n="footer.rights">
            &copy; 2026 Rafael Pérez Llorca. Todos los derechos reservados.
          </p>
        </div>
      </div>
        `;

        container.classList.add('footer');
        container.innerHTML = html;

        // Attach Event Listeners
        const emailBtn = container.querySelector('.email-trigger');
        if (emailBtn) {
            emailBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'mailto:' + 'contacto' + '@' + 'rafaelperezllorca.com';
            });
        }

        if (window.feather) {
             try { feather.replace(); } catch (e) { console.warn('Footer icons init failed', e); }
        }
    }
};
