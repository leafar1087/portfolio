# Rafael Pérez Llorca — Portafolio Profesional & Portal de Investigación

Sitio web profesional y repositorio de investigación técnica enfocado en **Ingeniería de Sistemas, Seguridad de la Información, Respuesta a Incidentes y Docencia Especializada**. Construido bajo arquitectura estática con aislamiento estricto de despliegue y hardening multimarco.

---

## 1. Arquitectura del Sistema

```
PORTFOLIO/
├── wrangler.toml              # Configuración de Cloudflare Pages (pages_build_output_dir = "public")
├── build_index.py             # Pipeline de generación (SSG, SEO, LLMs y sync)
├── content-index.json         # Registro maestro de artículos y módulos
├── sitemap.xml                # Sitemap SEO
├── llms.txt                   # Índice estructurado para agentes de IA
├── robots.txt                 # Directivas canónicas de rastreo
├── _headers                   # Cabeceras HTTP (CSP estricta, HSTS, X-Frame-Options)
├── _redirects                 # Directivas de redirección canónica y fallback nativo 404
├── index.html                 # Página principal
├── 404.html                   # Página de error canónica
├── css/
│   ├── modules/               # CSS modular (00 a 07)
│   └── styles.css             # Bundle compilado de estilos
├── js/
│   ├── modules/               # Módulos ES6 (tema claro/oscuro, utilidades)
│   ├── article-loader.js      # Cargador seguro de Markdown con lista blanca
│   ├── academy-loader.js      # Catálogo dinámico desde el índice estático
│   ├── components.js          # Componentes de cabecera y pie de página
│   ├── mermaid-init.js        # Inicializador seguro de Mermaid (strict)
│   └── translations.js        # Diccionario bilingüe (ES/EN)
├── pages/                     # Páginas interiores (Academy, Article, Legal, Privacy, 404)
├── posts/                     # Publicaciones técnicas y Markdown publicado
│   └── academy/               # Cursos aprobados: <course-slug>/
├── assets/                    # Tipografías, imágenes, logos y PDF
├── public/                    # Directorio de distribución estática (Runtime de producción)
├── docs/academy-content.md    # Contrato de contenido de Ciber Academia
├── tests/                     # Pruebas del índice y aislamiento de publicación
└── .github/workflows/         # Validación del build estático
```

---

## 2. Pipeline de Construcción & Aislamiento (`build_index.py`)

El script de automatización realiza las siguientes tareas de forma determinista:

1. **Indexación de Contenidos**: Escanea `/posts` y parsea los metadatos YAML.
2. **Generación de Metadatos**: Actualiza `content-index.json`, `sitemap.xml` y `llms.txt`.
3. **Aislamiento de Producción**: Sincroniza exclusivamente los activos de runtime hacia `public/`, purgando scripts Python, documentación interna y archivos temporales.

Ejecución manual:
```bash
python3 build_index.py
```

---

## 3. Ciber Academia: catálogo y publicación

`pages/academy.html` carga `js/academy-loader.js`, que consulta exclusivamente `content-index.json`. Agrupa módulos por `course_slug`, muestra metadatos publicados y enlaza al índice del curso o a su primer recurso mediante `article.html?id=...`. Todo texto dinámico se sanea con DOMPurify; los IDs siguen validados por la lista blanca del índice.

El contenido nuevo se guarda únicamente en:

```text
posts/academy/<course-slug>/
```

Cada Markdown publicado usa este frontmatter:

```yaml
title: <título>
title_es: <título español>
description: <resumen>
description_es: <resumen español>
date: YYYY-MM-DD
author: Rafael Pérez Llorca
tags: [ciberseguridad, ...]
content_type: course|module|guide|lab
course_slug: <slug del curso>
course_title: <título del curso>
module_order: <número o 0>
publication_status: reviewed|canonical
version: <versión o alcance>
```

El build excluye cualquier `publication_status` distinto de `reviewed` o `canonical`, además de rutas internas, backups, secretos, enlaces fuera de `posts/`, archivos Python, `.env` y cachés. El contenido legacy sin ese campo permanece publicado por compatibilidad. El contrato detallado está en [`docs/academy-content.md`](docs/academy-content.md).

### Flujo desde el repositorio privado de cursos

1. Preparar contenido en `leafar1087/cursos/products/portfolio/courses/<course-slug>/`.
2. Ejecutar allí `python3 tools/validate_portfolio_publication.py`.
3. Exportar a un destino vacío con `python3 tools/export_portfolio_content.py --output /ruta/al/portfolio/posts/academy`.
4. Abrir un PR en este repositorio que solo modifique `posts/academy/`.
5. El workflow `Static content build` ejecuta tests, `python3 build_index.py` y verifica que `public/` contiene únicamente runtime estático.
6. Cloudflare Pages despliega `public/`.

No hay token, webhook, submódulo, backend, API runtime ni carga directa de Markdown desde GitHub. Mientras la zona exportable del repositorio privado no contenga Markdown validado, no se incorporarán nuevos cursos.

---

## 4. Seguridad y Cumplimiento Técnico (Audit-Ready)

Alineado con directrices de **NIST CSF 2.0**, **CIS Controls v8.1** y **ENS**:

- **Aislamiento de Despliegue**: Cloudflare Pages sirve únicamente el directorio `public/`. Los archivos de soporte, scripts de build y documentación interna no son accesibles desde la red pública.
- **Defensa contra Path Traversal / IDOR**: `article-loader.js` valida identificadores con expresiones regulares canónicas y aplica verificación de lista blanca en modo *fail-closed* contra `content-index.json`.
- **Sanitización del DOM**: Limpieza de contenido HTML mediante `DOMPurify 3.4.14` antes de cualquier renderizado dinámico.
- **Integridad de Recursos (SRI)**: Hashes `sha384` aplicados en todas las dependencias externas (PrismJS 1.30.0, Marked 12.0.2, DOMPurify 3.4.14).
- **Mermaid Hardening**: Diagramas procesados bajo `securityLevel: 'strict'` con `mermaid@11.17.0`.
- **Content Security Policy (CSP)**: Restricción de orígenes, bloqueo de objetos (`object-src 'none'`), protección contra clickjacking (`frame-ancestors 'none'`) y transporte cifrado obligatorio (HSTS con preload).

---

## 5. Despliegue en Cloudflare Pages

### Configuración en Dashboard
- **Build command**: `python build_index.py`
- **Build output directory**: `public`
- **Root directory**: `/`

### Despliegue Local vía CLI
```bash
# Compilar distribución y desplegar
python3 build_index.py
npx wrangler pages deploy public
```
