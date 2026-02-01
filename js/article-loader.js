document.addEventListener('DOMContentLoaded', async () => {
    // --- CONFIGURATION & SELECTORS ---
    // --- CONFIGURATION & SELECTORS ---
    const container = document.getElementById('article-container');
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('id');

    // --- STATE MANAGEMENT ---
    // Single Source of Truth: LocalStorage. Default to 'es' if not set.
    let currentLang = localStorage.getItem('portfolio_lang') || 'es';
    let allPosts = [];

    // --- INITIALIZATION ---
    // Defer UI update slightly to allow Components to render if race condition exists, 
    // though the mutation/event delegation handles interaction.
    setTimeout(updateLanguageUI, 100); 
    await loadContent();

    // --- EVENT LISTENERS (DELEGATION) ---
    // Use delegation because .lang-toggle-btn might be injected by components.js AFTER this script runs.
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.lang-toggle-btn');
        if (btn) {
            // Logic handled by script.js?
            // If script.js is present, it might ALSO toggle. 
            // To be safe and avoid double-toggling if both run:
            // We can check the STARTING state from localStorage which script.js might have just updated 
            // OR we just wait a microtask? 
            // actually, let's just force read the NEW state after a small delay to sync with script.js 
            // OR, simplest: Let us handle the Article Content update, let script.js handle the global UI.
            // But we need to know the NEW lang.
            
            // Let's assume we want to be reactive.
            // We proactively update our local state and render.
            // If checking e.defaultPrevented might hint if script.js handled it? No.

            // Safe Approach: 
            // calculate desired next state based on CURRENT local variable (snapshot at load time might be stale if modified elsewhere, so read fresh)
            const stored = localStorage.getItem('portfolio_lang') || 'es';
            const next = stored === 'en' ? 'es' : 'en';
            
            // We update it. (Idempotent if script.js does same)
            currentLang = next;
            localStorage.setItem('portfolio_lang', currentLang);

            updateLanguageUI();
            loadContent();
        }
    });

    // Helper to sync Button Text
    function updateLanguageUI() {
        const btns = document.querySelectorAll('.lang-toggle-btn');
        btns.forEach(btn => {
            btn.innerText = currentLang === 'en' ? 'ES' : 'EN';
        });
    }

    async function loadContent() {
        // Clear container mostly for re-renders on lang switch
        container.innerHTML = ''; 

        // State 1: No ID Provided -> LIST ARTICLES (The Index)
        if (!articleId) {
            try {
                // Cache strategy: only fetch if empty
                if (allPosts.length === 0) {
                    const response = await fetch('../posts.json');
                    if (!response.ok) throw new Error("Could not load post index");
                    allPosts = await response.json();
                }
                renderPostList(allPosts);
            } catch (error) {
                renderTerminalState({
                    status: "INDEX_RETRIEVAL_FAILED",
                    color: "#ff6b6b",
                    lines: ["ERROR LOADING ARCHIVES", "DETAILS: " + error.message],
                    actions: [{ text: "RETRY", href: "article.html", primary: true }]
                });
            }
            return;
        }

        // State 2: Fetching Specific Article
        try {
            container.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 300px; color: var(--teal);">
                    <p style="font-family: 'Roboto Mono';">_RETRIEVING PAYLOAD: ${articleId} [${currentLang.toUpperCase()}]...</p>
                </div>
            `;

            const fetchUrl = `../posts/${articleId}.md`;
            const response = await fetch(fetchUrl);
            
            if (!response.ok) {
                throw new Error(response.status === 404 ? "TARGET PAYLOAD NOT FOUND" : `TRANSMISSION ERROR: ${response.statusText}`);
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
            
            // Parse Markdown
            const rawHtml = marked.parse(finalContent);

            // --- SECURITY CORE (YOUR "KILLER FEATURE") ---
            // Prevent Reverse Tabnabbing via Hook
            DOMPurify.addHook('afterSanitizeAttributes', function (node) {
                if ('target' in node && node.getAttribute('target') === '_blank') {
                    node.setAttribute('rel', 'noopener noreferrer');
                }
            });

            const cleanHtml = DOMPurify.sanitize(rawHtml, {
                ADD_ATTR: ['target'] 
            });

            // Navigation Text
            const backText = currentLang === 'es' ? 'VOLVER AL ÍNDICE' : 'RETURN TO INDEX';

            container.innerHTML = `
                <div style="margin-bottom: 30px;">
                    <a href="article.html" class="btn btn-outline" style="font-family: 'Roboto Mono'; font-size: 12px;">&lt; // ${backText}</a>
                </div>
                <div class="article-content">
                    ${cleanHtml}
                </div>
            `;

            // Update Page Title dynamically
            let docTitle = "";
            if (currentLang === 'es' && metadata.title_es) {
                docTitle = metadata.title_es;
            } else {
                docTitle = metadata.title || (finalContent.match(/^#\s+(.+)$/m)?.[1]);
            }
            if (docTitle) document.title = `${docTitle} - Rafael Pérez Llorca`;

            // Syntax Highlighting (if you use Highlight.js or Prism later)
            // if(window.hljs) hljs.highlightAll();

        } catch (error) {
            renderTerminalState({
                status: "TRANSMISSION_FAILURE",
                color: "#ff6b6b",
                lines: ["ERROR CODE: 404", `DETAILS: ${error.message}`, "The requested data stream could not be established."],
                actions: [{ text: "RETURN TO INDEX", href: "article.html", primary: true }]
            });
            document.title = "Error - Payload Failed";
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
            const meta = post[currentLang] || post['en'] || post['es'];
            if (!meta) return false;
            
            const term = searchTerm.toLowerCase();
            const titleMatch = (meta.title || '').toLowerCase().includes(term);
            const descMatch = (meta.description || '').toLowerCase().includes(term);
            const tagMatch = (meta.tags || []).some(tag => tag.toLowerCase().includes(term));
            
            return titleMatch || descMatch || tagMatch;
        });

        let rows = filteredPosts.map(post => {
            const meta = post[currentLang] || post['en'] || post['es']; 
            if (!meta) return ''; 

            const tagsHtml = meta.tags ? 
                `<div class="terminal-tags">${meta.tags.map(tag => `<span class="terminal-tag">${tag}</span>`).join('')}</div>` : '';

            return `
            <div class="terminal-row">
                <div class="mb-2">
                    <a href="article.html?id=${post.id}" class="terminal-link">
                        > ${meta.title || post.id}
                    </a>
                    <div class="terminal-meta">
                        <span class="terminal-date"> [${post.date || 'N/A'}]</span>
                    </div>
                </div>
                <p class="terminal-desc">${meta.description || ''}</p>
                 ${tagsHtml}
            </div>
            `;
        }).join('');

        if (rows.length === 0) {
            rows = `<div class="terminal-row"><p class="terminal-desc">_NO DATA FOUND FOR QUERY: "${searchTerm}"</p></div>`;
        }

        const headerText = currentLang === 'es' ? '/DOCUMENTOS/POSTS/INDICE' : '/DOCUMENTS/POSTS/INDEX';
        const waitingText = currentLang === 'es' ? '_ESPERANDO ENTRADA' : '_AWAITING INPUT';
        const placeholderText = currentLang === 'es' ? 'filtrar_resultados...' : 'filter_results...';

        container.innerHTML = `
            <div class="pt-3">
                 <div class="terminal-header mb-3">
                    <svg width="24" height="24" style="margin-right: 8px;"><use href="../assets/images/tech-icons.svg#icon-terminal"/></svg>
                    <h1 class="terminal-header-title">${headerText}</h1>
                </div>
                
                <div class="terminal-search-container">
                    <span class="prompt">> search_query:</span>
                    <input type="text" id="article-search" class="terminal-search-input" placeholder="${placeholderText}" value="${searchTerm}" autocomplete="off" autofocus>
                </div>

                <div id="posts-list">${rows}</div>
                 <p class="blink-cursor mt-4">${waitingText}</p>
            </div>
        `;
        

        // Attach Event Listener for Search (Debounced slightly by nature of just replacing innerHTML of list or re-rendering whole?)
        // Re-rendering whole container loses focus if we are not careful.
        // Better strategy: Attach listener to the input we just created.
        const searchInput = document.getElementById('article-search');
        if(searchInput) {
            searchInput.focus(); // Keep focus
            // Move cursor to end
            const val = searchInput.value;
            searchInput.value = '';
            searchInput.value = val;

            searchInput.addEventListener('input', (e) => {
                // Recursive call to render with new term
                // Note: deeply recursive calls might be bad if typing fast, but for this scale it's fine.
                // A better approach would be to only update the #posts-list div.
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

        container.innerHTML = `
            <div class="error-box" style="border-color: ${color}">
                <div class="error-header" style="border-color: ${color}">
                     <span class="error-title" style="color: ${color}">${status}</span>
                </div>
                <div class="text-light-slate mb-3">${linesHtml}</div>
                <div class="d-flex flex-wrap">${actionsHtml}</div>
            </div>
        `;
    }
});
