---
name: RPLL Portfolio
description: Portafolio técnico de ingeniería de sistemas, ciberseguridad y gobernanza.
colors:
  canvas-dark: "#06090e"
  surface-primary-dark: "#0b1118"
  surface-secondary-dark: "#101924"
  surface-elevated-dark: "#162232"
  surface-hover-dark: "#1c2b3e"
  text-primary-dark: "#f8fafc"
  text-secondary-dark: "#94a3b8"
  text-muted-dark: "#64748b"
  brand-primary: "#0052cc"
  brand-primary-hover: "#0043a8"
  brand-signal-dark: "#00e5ff"
  canvas-light: "#f8fafc"
  surface-primary-light: "#ffffff"
  surface-secondary-light: "#f1f5f9"
  surface-elevated-light: "#e2e8f0"
  text-primary-light: "#0f172a"
  text-secondary-light: "#334155"
  brand-signal-light: "#0284c7"
  state-success: "#10b981"
  state-warning: "#f59e0b"
  state-danger: "#ef4444"
  state-info: "#0284c7"
typography:
  display:
    fontFamily: "IBM Plex Sans, Inter, sans-serif"
    fontSize: "clamp(3rem, 6vw, 5rem)"
    fontWeight: 800
    lineHeight: 1
  headline:
    fontFamily: "IBM Plex Sans, Inter, sans-serif"
    fontSize: "clamp(1.6rem, 3vw, 2.4rem)"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "17px"
    lineHeight: 1.65
  label:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.08em"
rounded:
  sm: "3px"
  md: "6px"
  lg: "8px"
spacing:
  container-desktop: "40px"
  container-mobile: "20px"
  section: "clamp(56px, 5.5vw, 88px)"
components:
  button-primary:
    backgroundColor: "{colors.brand-primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "12px 22px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary-dark}"
    rounded: "{rounded.sm}"
    padding: "12px 22px"
  surface-card:
    backgroundColor: "{colors.surface-primary-dark}"
    rounded: "{rounded.md}"
    padding: "30px"
---

# Design System: RPLL Portfolio

## Overview

**Creative North Star: “Panel de evidencia” (inferencia del sistema existente).**

La interfaz presenta trayectoria, investigación y herramientas como evidencia técnica organizada. El lenguaje visual combina superficies oscuras estratificadas, líneas de señal cian y tipografía de ingeniería sin convertir la página en un dashboard genérico.

La densidad es deliberada: el contenido manda, los acentos orientan y las interacciones responden con cambios breves de borde, color o posición. El tema claro conserva la misma estructura y cambia la lectura tonal, no la identidad.

**Key Characteristics:**

- Oscuro por defecto, técnico y sobrio.
- Cian como señal escasa para foco, enlaces y estados activos.
- Grilla de fondo como referencia de plano técnico, no como decoración dominante.
- Contenido real antes que métricas ornamentales o efectos de “IA”.

## Colors

La paleta usa navy casi negro para el lienzo, superficies azules escalonadas y un cian de alta visibilidad como señal operativa.

### Primary

- **Azul de acción** (`#0052cc`): botones primarios y acciones de avance.
- **Cian de señal** (`#00e5ff` en oscuro, `#0284c7` en claro): foco, enlaces, estados activos y evidencias destacadas.

### Neutral

- **Lienzo nocturno** (`#06090e`): fondo principal oscuro.
- **Superficie primaria** (`#0b1118`): tarjetas y contenedores.
- **Superficie elevada** (`#162232`): controles activos y capas de interacción.
- **Texto principal** (`#f8fafc` oscuro, `#0f172a` claro): títulos y contenido prioritario.
- **Texto secundario** (`#94a3b8` oscuro, `#334155` claro): descripción y contexto.
- **Texto atenuado** (`#64748b`): metadatos y ayudas.

### Named Rules

**The Signal Rarity Rule.** El cian comunica foco o evidencia; no debe rellenar superficies enteras ni competir con el contenido.

## Typography

**Display Font:** IBM Plex Sans (con Inter y sans-serif como fallback)

**Body Font:** Inter (con fallbacks de sistema)

**Label/Mono Font:** IBM Plex Mono (con ui-monospace como fallback)

**Character:** Plex Sans aporta autoridad técnica en titulares; Inter mantiene lectura neutral; Plex Mono queda reservado para labels, datos, comandos y metadatos.

### Hierarchy

- **Display** (800, `clamp(3rem, 6vw, 5rem)`, `1`): hero y títulos de entrada.
- **Headline** (700, `clamp(1.6rem, 3vw, 2.4rem)`, `1.2`): secciones y casos principales.
- **Title** (600–700, `1.05rem–1.55rem`): tarjetas, cargos y módulos.
- **Body** (400, `17px`, `1.65`): lectura general y descripciones.
- **Label** (600, `0.75rem`, `0.08em`, mono): navegación técnica, estados y metadatos.

## Layout

El ancho máximo es `1280px`, con padding horizontal de `40px` en desktop y `20px` hasta `768px`. La lectura larga usa `760px` como medida objetivo. El ritmo vertical principal usa `--section-pad: clamp(56px, 5.5vw, 88px)`.

El hero usa dos columnas en desktop y una columna hasta `1024px`; la foto se centra dentro de su tarjeta desde `1025px` y reduce su ancho a `200px`/`160px` en tablet/móvil. Catálogo, lectura y herramientas colapsan por superficie, no por una única regla global.

## Elevation & Depth

El sistema usa profundidad híbrida: bordes sutiles y capas tonales en reposo; sombras suaves solo para navegación, tarjetas destacadas y señal. No se usan sombras offset duras.

### Shadow Vocabulary

- **Navigation:** `var(--shadow-nav)` para separar el panel móvil del lienzo.
- **Card:** `var(--shadow-card)` para elevación ambiental mínima.
- **Signal:** `var(--shadow-signal)` para acciones o evidencias destacadas.
- **Glass:** `var(--glass-shadow)` solo junto a la superficie translúcida del header.

## Shapes

Las esquinas son pequeñas y funcionales: `3px` para controles, `6px` para tarjetas y `8px` para superficies mayores. Los bordes de `1px` distinguen capas; los radios de píldora quedan reservados para tags y filtros.

## Components

### Buttons

- **Shape:** radio `3px`, `12px 22px`, tipografía Plex Sans semibold.
- **Primary:** fondo `--brand-primary`, texto `--text-on-brand`.
- **Hover / Focus:** cambia fondo, borde, color o transform mediante `--transition-fast`; focus visible usa `--border-focus`.
- **Outline:** transparente en reposo, superficie secundaria al pasar el cursor.

### Cards / Containers

- **Corner Style:** `--radius-md` para tarjetas, `--radius-sm` para módulos compactos.
- **Background:** `--surface-primary` o `--surface-secondary` según jerarquía.
- **Shadow Strategy:** bordes sutiles en reposo; sombra solo cuando la superficie necesita elevación.
- **Internal Padding:** `30px` en cards generales; las superficies de herramientas usan `clamp(22px, 4vw, 34px)`.

### Inputs / Fields

- **Style:** fondo de superficie primaria, borde sutil, radio `--radius-sm`, altura mínima de `42–44px`.
- **Focus:** borde de señal y anillo suave de señal; no se elimina el indicador de teclado.
- **Error / Empty:** estado textual explícito con `role="alert"` o `role="status"` según corresponda.

### Navigation

- **Style:** header fijo de `80px`, translúcido y con blur; enlaces en `14px`.
- **Hover / Active:** texto primario y superficie secundaria.
- **Mobile:** navegación en panel con overlay; el toggle de tema mantiene un área mínima de `44px`.

### Evidence Explorer

El explorador de ciberresiliencia usa tabs para convertir el modelo en una secuencia navegable. Cada etapa tiene panel propio y la selección comunica estado, no decoración.

## Do's and Don'ts

### Do:

- **Do** reutilizar los tokens de `css/modules/01-variables.css` antes de introducir un color o radio.
- **Do** mantener una medida de lectura cercana a `65–75ch` en artículos y descripciones largas.
- **Do** usar Plex Mono para datos, labels, comandos y metadatos, no como textura general.
- **Do** conservar estados `loading`, `success`, `empty` y `error` con semántica accesible.
- **Do** verificar desktop y breakpoints `1024`, `900`, `780`, `768`, `640`, `520` antes de publicar.

### Don't:

- **Don't** usar `transition: all`; declara las propiedades que realmente cambian.
- **Don't** añadir gradientes de texto, glassmorphism ornamental o estética de “IA” genérica.
- **Don't** convertir cada sección en una tarjeta ni añadir métricas sin evidencia.
- **Don't** usar colores directos cuando exista un token semántico equivalente.
- **Don't** cambiar la identidad visual al crear una nueva pantalla: el contenido técnico debe seguir siendo el protagonista.
