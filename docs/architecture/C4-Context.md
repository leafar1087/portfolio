# RPLL Portfolio - Diagrama de Contexto (C4)

Este documento forma parte del Pilar 27 (Documentation-as-Code) de la especificación RPLL v2.2, asegurando que la arquitectura del Portafolio mantenga su descripción directamente en el código fuente.

## C4 Context Model

```mermaid
C4Context
    title Diagrama de Contexto del Sistema (RPLL Portfolio)

    Person(visitor, "Visitante / Reclutador", "Usuario final que consume la academia y el CV interactivo.")

    System_Boundary(b0, "Frontend Portfolio") {
        System(spa, "Single Page App (Static)", "Portafolio y gestor de artículos sin dependencia de backend tradicional. Provee terminal y theaming dinámico.")
        System(js_engine, "Lógica Vanilla JS (ES6)", "Engine liviano que rutea URLs paramétricas e inyecta Markdown purificado en el DOM.")
    }

    System_Ext(github_pages, "GitHub Pages", "Infraestructura Edge y CDN que sirve el contenido estático de manera global.")
    System_Ext(external_fonts, "Local Fonts CDN", "Fuentes WOFF2 Self-Hosted priorizando velocidad y privacidad de Google Fonts.")

    Rel(visitor, spa, "Lee artículos y ejecuta comandos", "HTTPS")
    Rel(spa, js_engine, "Delega parseo de datos (Routing/i18n)")
    Rel(spa, github_pages, "Alojado y cacheado en")
    Rel(spa, external_fonts, "Consume tipografía desde")

    UpdateElementStyle(visitor, $fontColor="black", $bgColor="#E5E7EB", $borderColor="#9CA3AF")
    UpdateElementStyle(spa, $fontColor="white", $bgColor="#64FFDA", $borderColor="#64FFDA")
    UpdateElementStyle(js_engine, $fontColor="white", $bgColor="#233554", $borderColor="#CCD6F6")
    UpdateElementStyle(github_pages, $fontColor="white", $bgColor="#374151", $borderColor="#111827")
```

## Resumen de Arquitectura

El sistema RPLL Portfolio se define como una aplicación **Level 1 (Digital Presence)**. Al carecer de bases de datos relacionales en línea, toda la lógica transaccional delega su estado persistente al LocalStorage (para Theaming) y su distribución a Edges gratuitos (CDN) reduciendo la superficie de ataque casi a cero.
