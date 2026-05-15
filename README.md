# Rafael Pérez Llorca - Ciber-Portafolio de Ingeniería & Ciberseguridad

Ecosistema digital diseñado para la exhibición de competencias en **Ingeniería Informática, Ciberseguridad (Blue/Red Team) y GRC**. Este proyecto combina un motor de generación de sitios estáticos (SSG) ligero con una arquitectura frontend robusta y securizada.

---

## Arquitectura del Sistema

### 1. Motor de Contenidos (SSG & Indexing)

El proyecto utiliza un pipeline de automatización en Python (`build_index.py`) que gestiona el ciclo de vida del contenido:

- **Escaneo Recursivo:** Procesa archivos Markdown en `/posts` y subcarpetas.
- **Categorización Automática:** Clasifica el contenido en `article` (blog técnico) o `course` (módulos académicos).
- **Master Index (`content-index.json`):** Genera una "API estática" que el frontend consume para el renderizado dinámico.
- **SEO & AI Ready:** Genera automáticamente `sitemap.xml` para buscadores y `llms.txt` para proporcionar contexto estructurado a agentes de IA.

### 2. Frontend de Alta Intensidad (Vanilla Tech)

Construido sin frameworks pesados para garantizar longevidad y rendimiento:

- **CSS Modular (v15):** Sistema basado en tokens de diseño (`css/modules/`) que separa variables, layout, componentes y estilos específicos de cursos.
- **Dynamic Loader (`article-loader.js`):** Orquesta la carga de Markdown, lo convierte a HTML vía `marked.js`, aplica resaltado de sintaxis con `Prism.js` e inicializa diagramas de flujo con `Mermaid.js`.
- **i18n Engine:** Soporte nativo bilingüe (ES/EN) mediante diccionarios en `js/translations.js`.

---

## 3. Hardening & Ciberseguridad (Audit-Ready)

Siguiendo los estándares **NIST CSF 2.0** y **ENS**, se han implementado las siguientes salvaguardas:

- **Sanitización Estricta:** Uso mandatario de `DOMPurify` en todos los puntos de inyección de HTML (`innerHTML`). Política de "Zero Unsanitized DOM".
- **Segregación de Contenidos:** Los módulos de la Academia están aislados del índice general de artículos mediante filtrado por metadatos a nivel de datos.
- **Content Security Policy (CSP):** Cabeceras configuradas para mitigar ataques de XSS e inyección de datos, restringiendo la ejecución de scripts a fuentes verificadas.
- **Ofuscación de Identidad:** Protección de correos electrónicos y datos de contacto contra scrapers automatizados.

---

## 4. Estructura de Directorios

```tree
/
├── assets/             # Recursos estáticos (imágenes, fuentes, iconos SVG)
├── css/
│   ├── modules/        # Arquitectura CSS Modular (01-07)
│   └── styles.css      # Manifiesto de estilos principal
├── js/
│   ├── modules/        # Lógica de negocio (Theme, Utils, i18n)
│   ├── article-loader  # Motor de renderizado de Markdown
│   ├── components.js   # Generador de componentes UI reutilizables
│   └── terminal.js     # Simulación de CLI interactiva
├── pages/              # Vistas de la aplicación (Academy, Article, Legal)
├── posts/              # Base de conocimientos en Markdown
│   └── python-course/  # Módulos del Curso de Python Avanzado
├── build_index.py      # Script de automatización (SSG)
├── content-index.json  # Índice maestro de contenidos
└── index.html          # Punto de entrada principal
```

---

## 5. Guía de Mantenimiento

### Actualización de Contenidos

Para añadir un nuevo artículo o módulo de curso:

1. Crea el archivo `.md` en `/posts` o en la carpeta correspondiente del curso.
2. Añade el frontmatter YAML necesario (título, fecha, descripción, tags).
3. Ejecuta el pipeline de construcción:
   ```bash
   python3 build_index.py
   ```
   _Esto actualizará el índice, el sitemap y el contexto para IA automáticamente._

### 6. Personalización de Estilos

- **Colores y Temas:** Modifica `css/modules/01-variables.css`.
- **Nuevos Componentes:** Añade el CSS en `css/modules/04-components.css` y la lógica de renderizado en `js/components.js`.

---

_Proyecto auditado y mantenido por Rafael Pérez Llorca._
