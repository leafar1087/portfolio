document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('article-container');
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('id');
    const langToggleBtn = document.getElementById('lang-toggle');
    
    // Initialize Language: Default to 'en' or sync with main script if possible (requires shared state, assuming 'en' reset for now)
    let currentLang = 'en';

    // Global Post Cache
    let allPosts = [];

    // --- INITIALIZATION ---
    await loadContent();

    // --- EVENT LISTENERS ---
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            // Toggle Logic is handled by script.js for the UI button text
            // We just need to sync our state and re-render
            const newLang = langToggleBtn.innerText === 'EN' ? 'es' : 'en'; // If button says EN, current is ES? 
            // Wait. In script.js: langToggleBtn.innerText = lang === 'en' ? 'ES' : 'EN';
            // So if button says 'ES', current is 'en'. Clicking it changes to 'es', button becomes 'EN'.
            // Therefore:
            currentLang = langToggleBtn.innerText === 'ES' ? 'es' : 'en'; // Logic synced with what happens AFTER click handled by script.js? 
            // Actually, we can just check the button state after a small delay or implement our own toggle logic parallel to script.js
            // SAFER: Read the button text, which indicates the TARGET language.
            // But script.js runs first.
            // Let's assume script.js toggles it. IF script.js toggles text to EN, it means we are now in ES.
            
            // To allow script.js to finish its update:
            setTimeout(() => {
                // If button says 'EN', it means we are in Spanish mode (button offers switch to English)
                // If button says 'ES', it means we are in English mode.
                const btnText = langToggleBtn.innerText;
                currentLang = btnText === 'EN' ? 'es' : 'en'; 
                loadContent(); // Re-render
            }, 50);
        });
    }

    async function loadContent() {
        // State 1: No ID Provided -> LIST ARTICLES (The Index)
        if (!articleId) {
            try {
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

            // Fetch the single markdown file (always the Standard ID)
            const fetchUrl = `../posts/${articleId}.md`;
            
            const response = await fetch(fetchUrl);
            
            if (!response.ok) {
                throw new Error(response.status === 404 ? "TARGET PAYLOAD NOT FOUND" : `TRANSMISSION ERROR: ${response.statusText}`);
            }

            const markdownText = await response.text();
            const { content, metadata } = parseFrontmatter(markdownText);
            
            // --- BILINGUAL CONTENT SPLITTING ---
            // We expect a separator like "<!-- es -->" to divide EN (top) and ES (bottom)
            const separatorRegex = /<!--\s*es\s*-->/i;
            const parts = content.split(separatorRegex);
            
            let finalContent = parts[0]; // Default to EN
            if (currentLang === 'es' && parts.length > 1) {
                finalContent = parts[1];
            } else if (currentLang === 'es') {
                // Warning if Spanish requested but not found? Or just show English?
                // Let's prepend a small warning
                finalContent = "> **[SYSTEM WARNING]: Translation not available. Displaying original data.**\n\n" + finalContent;
            }

            const rawHtml = marked.parse(finalContent);

            // SECURITY ENHANCEMENT: Prevent Reverse Tabnabbing
            // Hook to force secure attributes on external links
            DOMPurify.addHook('afterSanitizeAttributes', function (node) {
                // If the tag is a link (<a>) and has target="_blank"
                if ('target' in node && node.getAttribute('target') === '_blank') {
                    // Force secure relationship: noopener noreferrer
                    node.setAttribute('rel', 'noopener noreferrer');
                }
            });

            // Sanitize allowing 'target' (safe because our Hook protected it)
            const cleanHtml = DOMPurify.sanitize(rawHtml, {
                ADD_ATTR: ['target'] // Allow target attribute
            });

            container.innerHTML = `
                <div style="margin-bottom: 30px;">
                    <a href="article.html" class="btn btn-outline" style="font-size: 12px;">&lt; // ${currentLang === 'en' ? 'RETURN TO INDEX' : 'VOLVER AL ÍNDICE'}</a>
                </div>
                ${cleanHtml}
            `;

            // Update Page Title
            let docTitle = "";
            if (currentLang === 'es' && metadata.title_es) {
                docTitle = metadata.title_es;
            } else {
                docTitle = metadata.title || (finalContent.match(/^#\s+(.+)$/m)?.[1]);
            }
            
            if (docTitle) document.title = `${docTitle} - Rafael Pérez Llorca`;

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
                    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }
                    metadata[key] = value;
                }
            });
            return { metadata, content: text.replace(frontmatterRegex, '') };
        }
        return { metadata: {}, content: text };
    }

    function renderPostList(posts) {
        // Filter/Map posts for the current language
        // Since posts.json is grouped by ID, we check if the ID has the current lang
        
        let rows = posts.map(post => {
            const meta = post[currentLang] || post['en'] || post['es']; // Fallback chain
            if (!meta) return ''; // Skip if absolutely no data

            return `
            <div class="terminal-row" style="margin-bottom: 20px; border-bottom: 1px dashed var(--light-slate); padding-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <a href="article.html?id=${post.id}" style="font-family: 'Roboto Mono'; font-size: 18px; color: var(--teal); text-decoration: none;">
                        > ${meta.title || post.id}
                    </a>
                    <span style="font-family: 'Roboto Mono'; font-size: 12px; color: var(--slate);">${post.date || ''}</span>
                </div>
                <p style="color: var(--slate); font-size: 14px; margin-left: 20px; margin-bottom: 0;">${meta.description || ''}</p>
                 ${meta.tags ? `<div style="margin-left: 20px; margin-top: 5px;">${meta.tags.map(tag => `<span style="font-size: 10px; border: 1px solid var(--slate); padding: 2px 5px; margin-right: 5px; border-radius: 3px; color: var(--slate);">${tag}</span>`).join('')}</div>` : ''}
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
                .terminal-row a:hover { text-decoration: underline !important; color: var(--white) !important; }
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
