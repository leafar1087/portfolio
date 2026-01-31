# Ciber Portfolio - Rafael Pérez Llorca

Bienvenido a la documentación técnica del Portfolio. Este proyecto ha sido diseñado siguiendo una arquitectura modular y moderna ("Cyber-Executive"), priorizando la experiencia de usuario, la mantenibilidad del código y la velocidad de carga sin dependencias pesadas.

## 🌟 Arquitectura y Diseño

El sitio utiliza una estética de vanguardia combinando elementos de **Glassmorphism** (transparencias desenfocadas), **Neumorphism** (profundidad sutil) y **Cyberpunk** (colores neón y terminales).

### 1. Sistema de Estilos (CSS Modular)

El CSS ya no es un archivo gigante. Se ha dividido en una arquitectura escalable ubicada en `css/modules/`:

- **Variables (`01-variables.css`)**: El corazón del diseño. Define paletas de colores (Navy, Teal, Neon), gradientes, sombras y el sistema de temas (Claro/Oscuro).
- **Base (`02-base.css`)**: Reseteo, tipografía fluida y estilos globales como el fondo con gradiente radial fijo.
- **Layout (`03-layout.css`)**: Estructura mayor. Header con efecto cristal (`backdrop-filter`), Footer y Grid responsivo.
- **Componentes (`04-components.css`)**: Elementos de UI de alto impacto. Botones con efectos de "slide", tarjetas con bordes brillantes, terminal interactiva.
- **Páginas (`05-pages.css`)**: Estilos específicos por sección, incluyendo la animación de "Red Cibernética" en el Hero.
- **Utilidades (`06-utilities.css`)**: Clases helper para ajustes rápidos.

### 2. Lógica JavaScript (ES6 Modules)

El JS entra por `js/app.js` y orquesta módulos especializados:

- **Theme Engine (`theme.js`)**: Detecta preferencias del sistema, persiste tu elección en `localStorage` y cambia clases en el `html` sin parpadeos (FOUC).
- **Icons (`icons.js`)**: Gestiona la carga y reemplazo asíncrono de `feather-icons`.
- **Utils (`utils.js`)**: Funciones auxiliares como la protección de emails contra bots.

## 🚀 Cómo Funciona

1. **Carga Inicial (`app.js`)**:
   - Se determina el tema (Oscuro por defecto).
   - Se renderizan componentes comunes (Header/Footer) si existen en el DOM.
   - Se inicializan los iconos y listeners de eventos.

2. **Interactividad**:
   - **Terminal**: Simula un entorno CLI. Al escribir comandos, el JS procesa la entrada y devuelve respuestas simuladas.
   - **Formularios**: Los inputs tienen efectos de foco con resplandor neón.

3. **Internacionalización (i18n)**:
   - El sistema carga diccionarios JSON (`translations.js`) y sustituye el contenido del DOM en tiempo real según el atributo `data-i18n`.

## 📂 Guía de Archivos

```
/
├── assets/images/      # Recursos gráficos optimizados
├── css/
│   ├── modules/        # Tu código CSS organizado
│   └── styles.css      # Importador principal
├── js/
│   ├── app.js          # Cerebro de la aplicación
│   └── modules/        # Lógica encapsulada
├── pages/              # Rutas internas
└── index.html          # Home
```

## � Mantenimiento

- **Cambiar colores**: Edita `css/modules/01-variables.css`. Los cambios se propagan a todo el sitio.
- **Añadir componentes**: Crea el HTML y añade sus estilos en `css/modules/04-components.css`.
- **Modificar textos**: Edita directamente los HTML o `js/translations.js` para los textos dinámicos.

---

_Este proyecto es "Vanilla Web": No requiere compilación (Webpack/Vite) para funcionar, garantizando máxima velocidad y longevidad._
