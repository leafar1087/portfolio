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
├── _redirects                 # Reglas de bloqueo 302 hacia /404.html
├── index.html                 # Página principal
├── 404.html                   # Página de error canónica
├── css/
│   ├── modules/               # CSS modular (00 a 07)
│   └── styles.css             # Bundle compilado de estilos
├── js/
│   ├── modules/               # Módulos ES6 (tema claro/oscuro, utilidades)
│   ├── article-loader.js      # Cargador seguro de Markdown con lista blanca
│   ├── components.js          # Componentes de cabecera y pie de página
│   ├── mermaid-init.js        # Inicializador seguro de Mermaid (strict)
│   └── translations.js        # Diccionario bilingüe (ES/EN)
├── pages/                     # Páginas interiores (Academy, Article, Legal, Privacy, 404)
├── posts/                     # Publicaciones técnicas y cursos en Markdown
├── assets/                    # Tipografías, imágenes, logos y PDF
└── public/                    # Directorio de distribución estática (Runtime de producción)
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

## 3. Seguridad y Cumplimiento Técnico (Audit-Ready)

Alineado con directrices de **NIST CSF 2.0**, **CIS Controls v8.1** y **ENS**:

- **Aislamiento de Despliegue**: Cloudflare Pages sirve únicamente el directorio `public/`. Los archivos de soporte, scripts de build y documentación interna no son accesibles desde la red pública.
- **Defensa contra Path Traversal / IDOR**: `article-loader.js` valida identificadores con expresiones regulares canónicas y aplica verificación de lista blanca en modo *fail-closed* contra `content-index.json`.
- **Sanitización del DOM**: Limpieza de contenido HTML mediante `DOMPurify 3.2.4` antes de cualquier renderizado dinámico.
- **Integridad de Recursos (SRI)**: Hashes `sha384` aplicados en todas las dependencias externas (PrismJS 1.30.0, Marked 12.0.2, DOMPurify).
- **Mermaid Hardening**: Diagramas procesados bajo `securityLevel: 'strict'` con `mermaid@11.4.1`.
- **Content Security Policy (CSP)**: Restricción de orígenes, bloqueo de objetos (`object-src 'none'`), protección contra clickjacking (`frame-ancestors 'none'`) y transporte cifrado obligatorio (HSTS con preload).

---

## 4. Despliegue en Cloudflare Pages

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
