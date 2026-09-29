(() => {
    const site = 'https://rafaelperezllorca.com';
    const provider = {
        '@type': 'Person',
        name: 'Rafael Pérez Llorca',
        url: site
    };

    function setMeta(selector, value) {
        if (!value) return;
        const element = document.querySelector(selector);
        if (element) element.setAttribute('content', value);
    }

    function setCanonical(url) {
        const element = document.querySelector('link[rel="canonical"]');
        if (element) element.setAttribute('href', url);
    }

    function setSchema(value) {
        const element = document.getElementById('academy-structured-data');
        if (element) element.textContent = JSON.stringify(value).replace(/</g, '\\u003c');
    }

    window.academySeo = {
        catalog(courses) {
            const items = [...courses.values()]
                .map(course => course.index || course.entries[0])
                .filter(Boolean)
                .sort((a, b) => Number(a.course_order || 999) - Number(b.course_order || 999))
                .map((entry, index) => {
                    const meta = entry.es || entry.en || {};
                    const url = `${site}/pages/article?id=${encodeURIComponent(entry.id)}`;
                    return {
                        '@type': 'ListItem',
                        position: index + 1,
                        item: {
                            '@type': 'LearningResource',
                            name: entry.course_title || meta.title,
                            description: meta.description,
                            url,
                            provider
                        }
                    };
                });
            setSchema({
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                name: 'Ciber Academia',
                itemListElement: items
            });
        },

        resource(entry, articleId, metadata) {
            if (!entry) return;
            const meta = entry.es || entry.en || metadata || {};
            const title = metadata.title_es || metadata.title || meta.title;
            const description = metadata.description_es || metadata.description || meta.description;
            const url = `${site}/pages/article?id=${encodeURIComponent(articleId)}`;
            setCanonical(url);
            setMeta('meta[name="description"]', description);
            setMeta('meta[property="og:title"]', title);
            setMeta('meta[property="og:description"]', description);
            setMeta('meta[property="og:url"]', url);
            setMeta('meta[name="twitter:title"]', title);
            setMeta('meta[name="twitter:description"]', description);
            setSchema({
                '@context': 'https://schema.org',
                '@type': 'LearningResource',
                name: title,
                description,
                url,
                dateModified: entry.date,
                author: provider,
                isPartOf: entry.course_title ? { '@type': 'LearningResource', name: entry.course_title } : undefined
            });
        }
    };
})();
