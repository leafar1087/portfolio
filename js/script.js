window.initApp = function() {
    // Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Logo click to top
    const logoLink = document.querySelector('.logo a');
    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            const href = logoLink.getAttribute('href');
            // Only intercept if we are on the homepage (link is just anchor)
            if (href === '#' || (href && href.startsWith('#'))) {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
            // Otherwise, let the browser handle standard navigation (e.g. to ../index.html)
        });
    }

    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links li');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('nav-active');
            links.forEach((link, index) => {
                if (link.style.animation) {
                    link.style.animation = '';
                } else {
                    link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
                }
            });
            hamburger.classList.toggle('toggle');
        });
        
        links.forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('nav-active')) {
                   navLinks.classList.remove('nav-active');
                   links.forEach(l => l.style.animation = '');
                   hamburger.classList.remove('toggle');
                }
            });
        });
    }

    // Language Support
    // Check localStorage first, default to 'es'
    let currentLang = localStorage.getItem('portfolio_lang') || 'es';
    const langToggleBtns = document.querySelectorAll('.lang-toggle-btn'); // Select all toggle buttons

    function updateContent(lang) {
        if (typeof translations === 'undefined') return;

        // Update simple text elements
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const keys = key.split('.');
            let value = translations[lang];
            
            keys.forEach(k => {
                if (value) value = value[k];
            });

            if (value) {
                element.innerHTML = value;
            }
        });

        // Update Dynamic Lists
        document.querySelectorAll('[data-i18n-list]').forEach(list => {
            const key = list.getAttribute('data-i18n-list');
            const keys = key.split('.');
            let items = translations[lang];
            
            keys.forEach(k => {
                if (items) items = items[k];
            });

            updateList(list, items);
        });

        // Update Button Text for ALL toggle buttons
        langToggleBtns.forEach(btn => {
            btn.innerText = lang === 'es' ? 'EN' : 'ES';
        });
    }

    function updateList(ulElement, items) {
        if (ulElement && items && Array.isArray(items)) {
            ulElement.innerHTML = '';
            items.forEach(item => {
                const li = document.createElement('li');
                li.innerText = item;
                ulElement.appendChild(li);
            });
        }
    }

    if (langToggleBtns.length > 0) {
        langToggleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                currentLang = currentLang === 'en' ? 'es' : 'en';
                // Save preference
                localStorage.setItem('portfolio_lang', currentLang);
                updateContent(currentLang);
            });
        });
    }

    // Initialize with the detected/stored language
    updateContent(currentLang);

    // Active Link Highlighting
    // Select only sections with IDs for the scroll spy (prevents issues on sub-pages)
    const sections = document.querySelectorAll('section[id]'); 
    const navItems = document.querySelectorAll('.nav-links a');

    function highlightActiveSection() {
        const scrollY = window.scrollY;
        
        // --- 1. Sub-page Logic (Academy, Article) ---
        const isHomePage = document.getElementById('about') && document.getElementById('expertise');
        
        // If not home page, logic is simpler (based on URL matching done in components.js mostly)
        // We just ensure we don't clear the active state blindly
        if (!isHomePage) {
            // Logic handled by static check in components.js or simple path match
            // Here we can reinforce it if needed, but components.js does it at render time.
            return; 
        }

        // --- 2. Homepage Scroll Spy Logic ---
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        if ((window.innerHeight + Math.ceil(scrollY)) >= document.body.offsetHeight - 50) {
             current = 'contact'; 
        }

        navItems.forEach(a => {
            a.classList.remove('active');
            const href = a.getAttribute('href');
            if (current && href && href.endsWith(`#${current}`)) {
                a.classList.add('active');
            }
        });
    }

    // Always listen for scroll
    window.addEventListener('scroll', highlightActiveSection);
    // Run once on load
    highlightActiveSection();

    // Scroll Animations (IntersectionObserver)
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));
};
