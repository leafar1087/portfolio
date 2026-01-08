document.addEventListener('DOMContentLoaded', () => {
    // Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Logo click to top
    const logoLink = document.querySelector('.logo a');
    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
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
    // Check localStorage first, default to 'en'
    let currentLang = localStorage.getItem('portfolio_lang') || 'en';
    const langToggleBtns = document.querySelectorAll('.lang-toggle-btn'); // Select all toggle buttons

    function updateContent(lang) {
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

        // Update Expertise Lists
        updateList('expertise-list-1', translations[lang]?.expertise?.card1?.items);
        updateList('expertise-list-2', translations[lang]?.expertise?.card2?.items);
        updateList('expertise-list-3', translations[lang]?.expertise?.card3?.items);

        // Update Experience Lists
        updateList('experience-list-1', translations[lang]?.experience?.job1?.items);
        updateList('experience-list-2', translations[lang]?.experience?.job2?.items);
        updateList('experience-list-3', translations[lang]?.experience?.job3?.items);
        updateList('experience-list-4', translations[lang]?.experience?.job4?.items);

        // Update Button Text for ALL toggle buttons
        langToggleBtns.forEach(btn => {
            btn.innerText = lang === 'en' ? 'ES' : 'EN';
        });
    }

    function updateList(id, items) {
        const ul = document.getElementById(id);
        if (ul && items) {
            ul.innerHTML = '';
            items.forEach(item => {
                const li = document.createElement('li');
                li.innerText = item;
                ul.appendChild(li);
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
        
        if (!isHomePage) {
            const currentPath = window.location.pathname;
            navItems.forEach(a => {
                a.classList.remove('active');
                const href = a.getAttribute('href');

                if (href && href.includes('academy.html') && currentPath.includes('academy.html')) {
                    a.classList.add('active');
                } else if (href && href.includes('article.html') && currentPath.includes('article.html')) {
                    a.classList.add('active');
                }
            });
            return; // Exit, do not run homepage scroll logic
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
});
