document.addEventListener('DOMContentLoaded', async () => {
    const catalog = document.getElementById('academy-catalog');
    const searchInput = document.getElementById('academy-search');
    const filters = [...document.querySelectorAll('.academy-filter')];
    const idPattern = /^[a-z0-9][a-z0-9_-]*(?:\/[a-z0-9][a-z0-9_-]*)*$/i;
    const allowedStatuses = new Set(['reviewed', 'canonical']);
    const metadata = entry => entry.es || entry.en || {};

    function appendText(parent, tag, className, value) {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = String(value || '');
        parent.appendChild(element);
    }

    function renderEmpty(message) {
        const empty = document.createElement('p');
        empty.className = 'text-muted';
        empty.textContent = message;
        catalog.replaceChildren(empty);
    }

    function compareCourses(a, b) {
        const aOrder = Number(a.index?.course_order);
        const bOrder = Number(b.index?.course_order);
        const aValid = Number.isFinite(aOrder);
        const bValid = Number.isFinite(bOrder);
        if (aValid && bValid && aOrder !== bOrder) return aOrder - bOrder;
        if (aValid !== bValid) return aValid ? -1 : 1;
        return a.slug.localeCompare(b.slug);
    }

    function searchText(course) {
        const overview = course.index || course.entries[0];
        const meta = metadata(overview);
        const tags = Array.isArray(meta.tags) ? meta.tags : [];
        return [overview.course_title, overview.learning_stage, overview.version, meta.title, meta.description, ...tags]
            .filter(Boolean).join(' ').toLocaleLowerCase('es');
    }

    function courseStages(course) {
        return [...new Set(course.entries.map(entry => entry.learning_stage).filter(Boolean))];
    }

    function renderCourses(courses, term = '', stage = 'all') {
        const normalized = term.trim().toLocaleLowerCase('es');
        const visible = courses.filter(course =>
            (!normalized || searchText(course).includes(normalized))
            && (stage === 'all' || courseStages(course).includes(stage))
        );
        if (!visible.length) {
            renderEmpty(`No hay cursos que coincidan con “${term.trim()}”.`);
            return;
        }
        const fragment = document.createDocumentFragment();
        visible.forEach(course => {
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
            appendText(details, 'span', '', `· ${overview.version || 'Sin versión'}`);
            content.appendChild(details);
            const syllabus = document.createElement('ol');
            syllabus.className = 'course-syllabus';
            modules.slice(0, 3).forEach((module, index) => {
                const item = document.createElement('li');
                item.textContent = `${String(index + 1).padStart(2, '0')}. ${metadata(module).title || module.id}`;
                syllabus.appendChild(item);
            });
            if (syllabus.childElementCount) content.appendChild(syllabus);
            const tags = Array.isArray(meta.tags) ? meta.tags : [];
            if (tags.length) appendText(content, 'p', 'course-meta-tag', tags.join(' · '));
            const link = document.createElement('a');
            link.className = 'catalog-card-action';
            link.href = `article.html?id=${encodeURIComponent(overview.id)}`;
            link.textContent = 'Ver curso';
            content.appendChild(link);
            card.appendChild(content);
            fragment.appendChild(card);
        });
        catalog.replaceChildren(fragment);
    }

    try {
        const response = await fetch('../content-index.json');
        if (!response.ok) throw new Error(`Índice no disponible: ${response.status}`);
        const entries = await response.json();
        if (!Array.isArray(entries)) throw new Error('Índice no válido');
        const courseMap = new Map();
        entries.filter(entry => entry && entry.type === 'course' && idPattern.test(entry.id || '')
            && (!entry.publication_status || allowedStatuses.has(entry.publication_status)))
            .forEach(entry => {
                const slug = entry.course_slug || entry.id.split('/')[0];
                if (!slug || !idPattern.test(slug)) return;
                const course = courseMap.get(slug) || { slug, entries: [], index: null };
                course.entries.push(entry);
                if (entry.content_type === 'course' || entry.id.endsWith('/index')) course.index = entry;
                courseMap.set(slug, course);
            });
        const courses = [...courseMap.values()].sort(compareCourses);
        if (!courses.length) return renderEmpty('No hay cursos publicados en este momento.');
        window.academySeo?.catalog(courseMap);
        let selectedStage = 'all';
        const render = () => renderCourses(courses, searchInput?.value || '', selectedStage);
        render();
        searchInput?.addEventListener('input', render);
        filters.forEach(filter => filter.addEventListener('click', () => {
            selectedStage = filter.dataset.stage || 'all';
            filters.forEach(button => {
                const active = button === filter;
                button.classList.toggle('active', active);
                button.setAttribute('aria-pressed', String(active));
            });
            render();
        }));
    } catch (error) {
        renderEmpty('El catálogo no está disponible ahora.');
    }
});
