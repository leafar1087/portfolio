document.addEventListener('DOMContentLoaded', async () => {
    // --- CONFIGURATION & SELECTORS ---
    const container = document.getElementById('article-container');
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('id');

    // --- STATE MANAGEMENT ---
    const currentLang = 'es';
    let allPosts = [];

    await loadContent();


    async function loadContent() {
        // Clear container mostly for re-renders on lang switch
        container.innerHTML = ''; 

        // Always fetch posts index if missing, needed for sidebars
        if (allPosts.length === 0) {
            try {
                const postsUrl = '../content-index.json?v=' + Date.now();
                const response = await fetch(postsUrl);
                if (!response.ok) throw new Error("No se pudo cargar el registro oficial: " + response.status);
                allPosts = await response.json();
            } catch (error) {
                renderTerminalState({
                    status: "FALLO_DE_INDICE",
                    color: "#ff6b6b",
                    lines: ["ERROR AL RECUPERAR EL REGISTRO: 503", "No fue posible verificar la integridad del índice oficial de publicaciones.", error.message],
                    actions: [{ text: "REINTENTAR", href: "article.html", primary: true }]
                });
                return;
            }
        }

        // State 1: No ID Provided -> LIST ARTICLES (The Index)
        if (!articleId) {
            renderPostList(allPosts);
            return;
        }

        // State 2: Fetching Specific Article
        try {
            // --- SECURITY HARDENING: Path Traversal & Whitelist Defense ---
            const ARTICLE_ID_PATTERN = /^[a-z0-9][a-z0-9_-]*(?:\/[a-z0-9][a-z0-9_-]*)*$/i;
            if (!ARTICLE_ID_PATTERN.test(articleId)) {
                renderTerminalState({
                    status: "ACCESO_INVALIDO",
                    color: "#ff6b6b",
                    lines: ["IDENTIFICADOR NO VÁLIDO: 400", "El identificador del recurso contiene caracteres o patrones no permitidos."],
                    actions: [{ text: "VOLVER AL ÍNDICE", href: "article.html", primary: true }]
                });
                return;
            }

            // Whitelist against official index (Mandatory Fail-Closed)
            const existsInIndex = allPosts.some(post => post.id === articleId);
            if (!existsInIndex) {
                renderTerminalState({
                    status: "RECURSO_NO_REGISTRADO",
                    color: "#ff6b6b",
                    lines: ["CÓDIGO DE ERROR: 404", "El artículo solicitado no figura en el registro oficial."],
                    actions: [{ text: "VOLVER AL ÍNDICE", href: "article.html", primary: true }]
                });
                return;
            }

            const loadingDiv = document.createElement('div');
            loadingDiv.style.cssText = "display: flex; justify-content: center; align-items: center; height: 300px; color: var(--brand-signal);";
            const loadingP = document.createElement('p');
            loadingP.style.fontFamily = "'IBM Plex Mono', monospace";
            loadingP.textContent = `Cargando contenido [${articleId}]...`;
            loadingDiv.appendChild(loadingP);
            container.appendChild(loadingDiv);

            const safePath = articleId.split('/').map(encodeURIComponent).join('/');
            const fetchUrl = `../posts/${safePath}.md`;
            const response = await fetch(fetchUrl);
            
            if (!response.ok) {
                throw new Error(response.status === 404 ? "CONTENIDO NO ENCONTRADO" : `ERROR DE TRANSMISIÓN: ${response.statusText}`);
            }

            const markdownText = await response.text();
            const { content, metadata } = parseFrontmatter(markdownText);
            
            // --- BILINGUAL CONTENT SPLITTING ---
            // Separator: 
            const separatorRegex = /<!--\s*es\s*-->/i;
            const parts = content.split(separatorRegex);
            
            let finalContent = parts[0]; // Default to first part (often EN in legacy posts)
            
            // If the post has 2 parts, usually Part 1 = EN, Part 2 = ES
            // But if we want Spanish Default, we should check logic:
            
            if (currentLang === 'es') {
                if (parts.length > 1) {
                    finalContent = parts[1];
                } 
                // If only 1 part exists, it's likely the only content available.
            } else {
                // English requested
                finalContent = parts[0];
            }
            
            // Parse Markdown. First configure marked to add language- class prefix for Prism
            marked.setOptions({
                highlight: function(code, lang) {
                    if (Prism.languages[lang]) {
                        return Prism.highlight(code, Prism.languages[lang], lang);
                    } else {
                        return code;
                    }
                }
            });
            const rawHtml = marked.parse(finalContent);

            // --- SECURITY CORE (YOUR "KILLER FEATURE") ---
            // Prevent Reverse Tabnabbing via Hook
            DOMPurify.addHook('afterSanitizeAttributes', function (node) {
                if ('target' in node && node.getAttribute('target') === '_blank') {
                    node.setAttribute('rel', 'noopener noreferrer');
                }
            });

            const cleanHtml = DOMPurify.sanitize(rawHtml, {
                ADD_ATTR: ['target'],
                ADD_TAGS: ['span'], // Allow Prism to create syntax highlight spans
                ADD_CLASSES: {
                    'code': ['language-python', 'language-bash', 'language-sql', 'language-js', 'language-html', 'language-css', 'language-mermaid', 'language-ignore', 'language-gitignore', 'language-json', 'language-yaml', 'language-text', 'language-sh', 'language-tree'],
                    'span': ['token', 'keyword', 'string', 'number', 'operator', 'punctuation', 'comment', 'function', 'class-name', 'builtin', 'boolean', 'property', 'regex', 'directive', 'value', 'key']
                }
            });

            // Fix relative markdown links within the content
            let fixedHtml = cleanHtml.replace(/href="(?:\.\/)?([^"]+)\.md"/g, (match, path) => {
                if (articleId.startsWith('python-course/')) {
                    const cleanPath = path.replace(/^python-course\//, '');
                    return `href="article.html?id=python-course/${cleanPath}"`;
                }
                return `href="article.html?id=${path}"`;
            });

            // --- GENERIC HIGHLIGHTING FALLBACK ---
            // Code blocks without a language (like directory trees or ASCII art) won't have a class. 
            // We assign 'language-bash' by default so Prism colors the '#' as comments.
            fixedHtml = fixedHtml.replace(/<pre><code>/g, '<pre><code class="language-bash">');

            // --- BUILD SIDEBAR IF IN COURSE MODE ---
            let sidebarHtml = '';
            let wrapperClass = '';
            const backText = currentLang === 'es' ? 'VOLVER A ACADEMIA' : 'RETURN TO ACADEMY';
            let backLink = 'academy.html';

            if (articleId.startsWith('python-course/')) {
                wrapperClass = 'course-content-wrapper';
                const coursePosts = allPosts.filter(p => p.id && p.id.startsWith('python-course/'));
                
                // Sort appropriately (index first, then modulo-01, modulo-02...)
                coursePosts.sort((a,b) => {
                    if(a.id.includes('index')) return -1;
                    if(b.id.includes('index')) return 1;
                    return a.id.localeCompare(b.id);
                });
                
                const navLinks = coursePosts.map(p => {
                    const postMeta = p[currentLang] || p['en'] || p['es'] || {};
                    const title = postMeta.title || p.id.split('/').pop();
                    const isActive = p.id === articleId ? 'active' : '';
                    return `<a href="article.html?id=${p.id}" class="course-nav-link ${isActive}">${title}</a>`;
                }).join('');
                
                const sidebarTitle = currentLang === 'es' ? 'Contenido del Curso' : 'Course Content';
                sidebarHtml = `
                    <div class="course-sidebar">
                        <h4 class="mb-3 font-mono text-teal">${sidebarTitle}</h4>
                        <div class="course-nav-list">
                            ${navLinks}
                        </div>
                    </div>
                `;
            } else {
                backLink = 'article.html'; // Default back to posts list if not a course
            }

            const finalHtml = `
                <div style="margin-bottom: 30px;">
                    <a href="${backLink}" class="btn btn-outline" style="font-family: 'Roboto Mono'; font-size: 12px;">&lt; // ${backText}</a>
                </div>
                <div class="${wrapperClass}">
                    ${sidebarHtml}
                    <div class="article-content" style="flex-grow: 1; overflow: hidden;">
                        ${fixedHtml}
                    </div>
                </div>
            `;

            container.innerHTML = DOMPurify.sanitize(finalHtml, {
                ADD_ATTR: ['target'],
                ADD_TAGS: ['use', 'svg'], // Support for icons if needed
            });

            // Update Page Title dynamically
            let docTitle = "";
            if (currentLang === 'es' && metadata.title_es) {
                docTitle = metadata.title_es;
            } else {
                docTitle = metadata.title || (finalContent.match(/^#\s+(.+)$/m)?.[1]);
            }
            if (docTitle) document.title = `${docTitle} - Rafael Pérez Llorca`;

            // --- RENDER MERMAID AND PRISM ---
            if (window.mermaid) {
                setTimeout(() => {
                    const mermaidBlocks = document.querySelectorAll('.language-mermaid');
                    if(mermaidBlocks.length > 0) {
                        mermaidBlocks.forEach(codeBlock => {
                            const pre = codeBlock.parentElement;
                            const div = document.createElement('div');
                            div.className = 'mermaid';
                            div.textContent = codeBlock.textContent;
                            pre.parentElement.replaceChild(div, pre);
                        });
                        window.mermaid.run();
                    }
                    
                    // Trigger Prism Syntax Highlighting
                    if (window.Prism) {
                        Prism.highlightAll();
                    }
                }, 50);
            } else if (window.Prism) {
                setTimeout(() => {
                    Prism.highlightAll();
                }, 50);
            }

        } catch (error) {
            renderTerminalState({
                status: "FALLO_DE_TRANSMISION",
                color: "#ff6b6b",
                lines: ["CÓDIGO DE ERROR: 404", `DETALLES: ${error.message}`, "No se pudo cargar el artículo o módulo solicitado."],
                actions: [{ text: "VOLVER AL ÍNDICE", href: "article.html", primary: true }]
            });
            document.title = "Error - Contenido No Encontrado";
        }
    }

    // --- HELPER FUNCTIONS ---

    function parseFrontmatter(text) {
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
        const match = text.match(frontmatterRegex);
        if (match) {
            const metadata = {};
            match[1].split('\n').forEach(line => {
                const parts = line.split(':');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    let value = parts.slice(1).join(':').trim();
                    // Remove quotes if present
                    value = value.replace(/^["'](.*)["']$/, '$1');
                    metadata[key] = value;
                }
            });
            return { metadata, content: text.replace(frontmatterRegex, '') };
        }
        return { metadata: {}, content: text };
    }

    function renderPostList(posts, searchTerm = '') {
        // Sort by date (newest first)
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Filter Logic
        const filteredPosts = posts.filter(post => {
            if (post.type !== 'article') return false;

            const meta = post[currentLang] || post['es'] || post['en'];
            if (!meta) return false;
            
            const term = searchTerm.toLowerCase();
            const titleMatch = (meta.title || '').toLowerCase().includes(term);
            const descMatch = (meta.description || '').toLowerCase().includes(term);
            const tagMatch = (meta.tags || []).some(tag => tag.toLowerCase().includes(term));
            
            return titleMatch || descMatch || tagMatch;
        });

        let rows = filteredPosts.map(post => {
            const meta = post[currentLang] || post['es'] || post['en']; 
            if (!meta) return ''; 

            const title = meta.title || post.id;
            const description = meta.description || '';
            const tags = meta.tags || [];

            const tagsText = tags.length > 0 ? tags.map(tag => DOMPurify.sanitize(tag)).join(' · ') : '';

            return `
            <article class="editorial-post-item">
                <div class="editorial-post-date">${DOMPurify.sanitize(post.date || 'N/A')}</div>
                <div class="editorial-post-body">
                    <h2 class="editorial-post-title">
                        <a href="article.html?id=${encodeURIComponent(post.id)}">
                            ${DOMPurify.sanitize(title)}
                        </a>
                    </h2>
                    ${tagsText ? `<div class="editorial-post-tags">${tagsText}</div>` : ''}
                    <p class="editorial-post-desc">${DOMPurify.sanitize(description)}</p>
                    <a href="article.html?id=${encodeURIComponent(post.id)}" class="editorial-post-link">Leer artículo &rarr;</a>
                </div>
            </article>
            `;
        }).join('');

        if (rows.length === 0) {
            const safeTerm = DOMPurify.sanitize(searchTerm);
            rows = `<div class="py-4"><p class="text-muted">No se encontraron publicaciones que coincidan con "${safeTerm}".</p></div>`;
        }

        const placeholderText = 'Buscar por tema, tecnología o marco (ej. Wazuh, NIST, Python)...';
        const cleanSearchTerm = DOMPurify.sanitize(searchTerm);

        const finalContent = `
            <div class="articles-index-editorial">
                <div class="articles-hero-editorial">
                    <span class="section-code">// ARTÍCULOS &amp; INVESTIGACIÓN</span>
                    <h1 class="articles-main-title">Publicaciones Técnicas</h1>
                    <p class="articles-main-desc">Investigación aplicada, análisis de incidentes y notas sobre ingeniería de sistemas, datos y ciberseguridad.</p>
                </div>
                
                <div class="articles-search-bar">
                    <input type="text" id="article-search" class="editorial-search-input" placeholder="${placeholderText}" value="${cleanSearchTerm}" autocomplete="off">
                </div>

                <div id="posts-list" class="editorial-posts-ledger">${rows}</div>
            </div>
        `;
        container.innerHTML = DOMPurify.sanitize(finalContent, { ADD_ATTR: ['id', 'value', 'placeholder', 'autocomplete'] });

        const searchInput = document.getElementById('article-search');
        if (searchInput) {
            // Keep focus if user was already searching
            if (searchTerm) {
                searchInput.focus();
                const val = searchInput.value;
                searchInput.value = '';
                searchInput.value = val;
            }

            searchInput.addEventListener('input', (e) => {
                renderPostList(posts, e.target.value); 
            });
        }
    }

    function renderTerminalState({ status, color, lines, actions }) {
        // Note: 'color' param is kept for status text to maintain dynamic error coloring if needed, 
        // but container uses class.
        let linesHtml = lines.map(line => `<p class="mb-1 font-mono">> ${line}</p>`).join('');
        let actionsHtml = actions.map(action => 
            `<a href="${action.href}" class="${action.primary ? 'btn btn-filled' : 'btn btn-outline'} mr-1 mt-1">
                ${action.text}
             </a>`
        ).join('');

        const errorHtml = `
            <div class="error-box" style="border-color: ${color}">
                <div class="error-header" style="border-color: ${color}">
                     <span class="error-title" style="color: ${color}">${status}</span>
                </div>
                <div class="text-light-slate mb-3">${linesHtml}</div>
                <div class="d-flex flex-wrap">${actionsHtml}</div>
            </div>
        `;
        container.innerHTML = DOMPurify.sanitize(errorHtml, { ADD_ATTR: ['style'] });
    }
});
