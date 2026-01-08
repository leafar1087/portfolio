document.addEventListener('DOMContentLoaded', async () => {
    // --- CONFIGURATION & SELECTORS ---
    const container = document.getElementById('article-container');
    const langToggleBtn = document.getElementById('lang-toggle');
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('id');

    // --- STATE MANAGEMENT ---
    // Single Source of Truth: LocalStorage. Default to 'en' if not set.
    let currentLang = localStorage.getItem('portfolio_lang') || 'en';
    let allPosts = [];

    // --- INITIALIZATION ---
    updateLanguageUI(); // Ensure button text matches state on load
    await loadContent();

    // --- EVENT LISTENERS ---
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent conflicts if script.js is also listening (optional)
            
            // Toggle Logic
            currentLang = currentLang === 'en' ? 'es' : 'en';
            
            // Save to Storage
            localStorage.setItem('portfolio_lang', currentLang);
            
            // Update UI & Content
            updateLanguageUI();
            loadContent();
        });
    }

    // Helper to sync Button Text (Independent of script.js to be safe)
    function updateLanguageUI() {
        if(langToggleBtn) {
            // If current is EN, button should offer ES switch, and vice versa
            // Or just show current. Let's assume button shows TARGET language:
            langToggleBtn.innerText = currentLang === 'en' ? 'ES' : 'EN';
        }
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
            
            let finalContent = parts[0]; // Default to EN
            
            if (currentLang === 'es') {
                if (parts.length > 1) {
                    finalContent = parts[1];
                } else {
                    // Fallback Warning
                    finalContent = "> **[SYSTEM WARNING]: Translation not available. Displaying original data.**\n\n" + finalContent;
                }
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
            const backText = currentLang === 'en' ? 'RETURN TO INDEX' : 'VOLVER AL ÍNDICE';

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

    function renderPostList(posts) {
        // Sort by date (optional, newest first)
        // posts.sort((a, b) => new Date(b.date) - new Date(a.date));

        let rows = posts.map(post => {
            // Intelligence to pick the right metadata based on lang
            const meta = post[currentLang] || post['en'] || post['es']; 
            if (!meta) return ''; 

            return `
            <div class="terminal-row" style="margin-bottom: 20px; border-bottom: 1px dashed var(--light-slate); padding-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <a href="article.html?id=${post.id}" style="font-family: 'Roboto Mono'; font-size: 18px; color: var(--teal); text-decoration: none;">
                        > ${meta.title || post.id}
                    </a>
                    <span style="font-family: 'Roboto Mono'; font-size: 12px; color: var(--slate);">${post.date || ''}</span>
                </div>
                <p style="color: var(--slate); font-size: 14px; margin-left: 20px; margin-bottom: 5px;">${meta.description || ''}</p>
                 ${meta.tags ? `<div style="margin-left: 20px;">${meta.tags.map(tag => `<span style="font-family: 'Roboto Mono'; font-size: 10px; border: 1px solid var(--slate); padding: 2px 6px; margin-right: 5px; border-radius: 3px; color: var(--teal);">${tag}</span>`).join('')}</div>` : ''}
            </div>
            `;
        }).join('');

        const headerText = currentLang === 'en' ? '/DOCUMENTS/POSTS/INDEX' : '/DOCUMENTOS/POSTS/INDICE';
        const waitingText = currentLang === 'en' ? '_AWAITING INPUT' : '_ESPERANDO ENTRADA';

        container.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto; padding-top: 20px;">
                 <div style="border-bottom: 2px solid var(--teal); padding-bottom: 10px; margin-bottom: 30px; display: flex; align-items: center;">
                    <i data-feather="terminal" style="color: var(--teal); margin-right: 15px;"></i>
                    <h1 style="color: var(--teal); font-family: 'Roboto Mono'; font-size: 24px; margin: 0;">${headerText}</h1>
                </div>
                <div>${rows}</div>
                 <p style="font-family: 'Roboto Mono'; color: var(--teal); margin-top: 30px;" class="blink">${waitingText}</p>
            </div>
            <style>
                @keyframes blink { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }
                .blink { animation: blink 1s infinite; }
                .terminal-row a:hover { color: var(--white) !important; text-decoration: none; border-bottom: 1px solid var(--teal); }
            </style>
        `;
        if(window.feather) feather.replace();
    }

    function renderTerminalState({ status, color, lines, actions }) {
        let linesHtml = lines.map(line => `<p style="margin-bottom: 10px; font-family: 'Roboto Mono';">> ${line}</p>`).join('');
        let actionsHtml = actions.map(action => 
            `<a href="${action.href}" class="${action.primary ? 'btn btn-filled' : 'btn btn-outline'}" 
                style="margin-right: 15px; margin-top: 10px;">${action.text}</a>`
        ).join('');

        container.innerHTML = `
            <div style="max-width: 700px; margin: 50px auto; padding: 40px; border: 1px solid ${color}; background-color: rgba(17, 34, 64, 0.5); border-radius: 4px;">
                <div style="border-bottom: 1px solid ${color}; padding-bottom: 10px; margin-bottom: 20px; display: flex; align-items: center;">
                     <span style="font-family: 'Roboto Mono'; color: ${color}; font-weight: 700; letter-spacing: 2px;">${status}</span>
                </div>
                <div style="color: var(--light-slate); margin-bottom: 30px;">${linesHtml}</div>
                <div style="display: flex; flex-wrap: wrap;">${actionsHtml}</div>
            </div>
        `;
    }
});
