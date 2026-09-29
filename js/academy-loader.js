document.addEventListener('DOMContentLoaded', async () => {
    const catalog = document.getElementById('academy-catalog');
    const idPattern = /^[a-z0-9][a-z0-9_-]*(?:\/[a-z0-9][a-z0-9_-]*)*$/i;
    const allowedStatuses = new Set(['reviewed', 'canonical']);
    const clean = value => DOMPurify.sanitize(String(value || ''));
    const metadata = entry => entry.es || entry.en || {};

    function appendText(parent, tag, className, value) {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = clean(value);
        parent.appendChild(element);
    }

    function renderEmpty(message) {
        const empty = document.createElement('p');
        empty.className = 'text-muted';
        empty.textContent = message;
        catalog.replaceChildren(empty);
    }

    try {
        const response = await fetch('../content-index.json');
        if (!response.ok) throw new Error(`Índice no disponible: ${response.status}`);
        const entries = await response.json();
        if (!Array.isArray(entries)) throw new Error('Índice no válido');

        const courses = new Map();
        entries.filter(entry => entry && entry.type === 'course' && idPattern.test(entry.id || '')
            && (!entry.publication_status || allowedStatuses.has(entry.publication_status)))
            .forEach(entry => {
                const slug = entry.course_slug || entry.id.split('/')[0];
                if (!slug || !idPattern.test(slug)) return;
                const course = courses.get(slug) || { slug, entries: [], index: null };
                course.entries.push(entry);
                if (entry.content_type === 'course' || entry.id.endsWith('/index')) course.index = entry;
                courses.set(slug, course);
            });

        if (!courses.size) return renderEmpty('No hay cursos publicados en este momento.');
        window.academySeo?.catalog(courses);
        const fragment = document.createDocumentFragment();
        [...courses.values()].sort((a, b) => {
            const aOrder = Number(a.index?.course_order);
            const bOrder = Number(b.index?.course_order);
            const aValid = Number.isFinite(aOrder);
            const bValid = Number.isFinite(bOrder);
            if (aValid && bValid && aOrder !== bOrder) return aOrder - bOrder;
            if (aValid !== bValid) return aValid ? -1 : 1;
            return a.slug.localeCompare(b.slug);
        }).forEach(course => {
            const overview = course.index || course.entries[0];
            const meta = metadata(overview);
            const modules = course.entries.filter(entry => entry.content_type === 'module' || (!entry.id.endsWith('/index') && entry !== overview));
            const card = document.createElement('article');
            card.className = 'course-card';
            const content = document.createElement('div');
            content.className = 'course-content';
            appendText(content, 'span', 'course-badge', overview.content_type || 'course');
            appendText(content, 'h3', 'course-title', overview.course_title || meta.title || course.slug);
            appendText(content, 'p', 'course-desc', meta.description || 'Contenido formativo publicado.');
            const details = document.createElement('div');
            details.className = 'course-meta-tag';
            appendText(details, 'span', 'badge-outline', `${modules.length} módulos`);
            appendText(details, 'span', '', `· ${overview.version || 'Sin versión'} · ${overview.publication_status || 'published'}`);
            content.appendChild(details);
            const tags = Array.isArray(meta.tags) ? meta.tags : [];
            if (tags.length) appendText(content, 'p', 'course-meta-tag', tags.join(' · '));
            const link = document.createElement('a');
            link.className = 'btn btn-primary w-full text-center';
            link.href = `article.html?id=${encodeURIComponent(overview.id)}`;
            link.textContent = 'Ver curso';
            content.appendChild(link);
            card.appendChild(content);
            fragment.appendChild(card);
        });
        catalog.replaceChildren(fragment);
    } catch (error) {
        renderEmpty('El catálogo no está disponible ahora.');
    }
});
