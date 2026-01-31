# Ciber Portfolio - Rafael Pérez Llorca

Portafolio profesional interactivo diseñado con una estética "Cyber/Terminal" moderna, enfocado en servicios de Ciberseguridad, Auditoría y Gobierno de TI (GRC).

## 🚀 Características Principales

- **Diseño Temático**: Estética híbrida entre corporativo y terminal hacker, con efectos de brillo, grids animados y tipografía monoespaciada.
- **Sistema de Temas**: Modo Claro/Oscuro persistente (localStorage) con transición suave y paleta de colores optimizada (Variables CSS).
- **Internacionalización (i18n)**: Soporte nativo para Español e Inglés con cambio dinámico de contenido sin recarga.
- **Arquitectura Modular**:
  - **CSS**: Estructura modular escalable (Variables, Base, Layout, Componentes, Pages, Utilities).
  - **JS**: Arquitectura basada en Módulos ES6 (`app.js`, `theme.js`, `utils.js`) para un código limpio y mantenible.
- **Componentes Interactivos**:
  - Terminal interactiva (simulación de línea de comandos).
  - Animaciones scroll-reveal y efectos de escritura (typing effect).
  - Navegación responsive con menú "drawer" para móviles.

## 🛠 Tecnología

El proyecto está construido con tecnologías web estándar modernas, sin necesidad de frameworks pesados de compilación:

- **HTML5**: Semántico y accesible.
- **CSS3**: Variables CSS (Custom Properties), Flexbox, Grid y Animaciones Keyframe.
- **JavaScript (Vanilla)**: ES6 Modules, localStorage API, DOM Manipulation eficiente.
- **Librerías Externas**:
  - `Feather Icons`: Para la iconografía ligera.
  - `ScrollReveal` (integración nativa CSS/JS).

## 📂 Estructura del Proyecto

```
/
├── index.html          # Página de inicio (Landing)
├── css/
│   ├── styles.css      # Archivo principal (Importador)
│   └── modules/        # Módulos CSS (7-1 Architecture Lite)
│       ├── 01-variables.css
│       ├── 02-base.css
│       ├── 03-layout.css
│       └── ...
├── js/
│   ├── app.js          # Punto de entrada principal (ES6 Module)
│   ├── modules/        # Módulos de lógica JS
│   │   ├── theme.js    # Lógica Dark/Light Mode
│   │   ├── icons.js    # Manejo de iconos
│   │   └── utils.js    # Utilidades
│   ├── components.js   # Renderizado de Header/Footer
│   ├── translations.js # Diccionarios JSON de idiomas
│   └── ...
├── pages/              # Páginas internas (Academy, Legal, 404)
└── assets/             # Recursos estáticos
    └── images/         # Imágenes del sitio (favicon, perfil, posts)
```

## 📦 Instalación y Uso

Este es un proyecto estático, por lo que no requiere instalación de dependencias de Node.js ni compilación.

1. **Clonar el repositorio**:

   ```bash
   git clone https://github.com/tu-usuario/portfolio.git
   ```

2. **Ejecutar localmente**:
   Para ver el sitio correctamente (especialmente por los Módulos JS que requieren protocolo HTTP/HTTPS y no `file://`), debes usar un servidor local.
   - **Con VS Code**: Usa la extensión "Live Server".
   - **Con Python**:
     ```bash
     python3 -m http.server 8000
     ```
   - **Con Node/NPM** (si tienes `serve` instalado):
     ```bash
     npx serve .
     ```

3. **Abrir en el navegador**:
   Visita `http://localhost:8000` (o el puerto que indique tu servidor).

## 🔧 Personalización

- **Colores**: Edita `css/modules/01-variables.css` para cambiar las paletas de colores de ambos temas.
- **Textos**: Los textos estáticos están en los archivos HTML. Los textos traducibles están en `js/translations.js`.
- **Menú**: Los enlaces del menú se gestionan centralizadamente en `js/components.js`.

---

© 2026 Rafael Pérez Llorca - Todos los derechos reservados.
