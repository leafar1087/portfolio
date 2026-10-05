# Portafolio

Sitio estático profesional desplegado en Cloudflare Pages.

## Estructura pública

- `index.html` y `pages/`: vistas del sitio.
- `css/modules/`: fuentes de estilo ordenadas.
- `css/styles.css`: bundle generado que cargan las páginas.
- `js/`: comportamiento del navegador.
- `assets/`: recursos públicos.
- `build_index.py`: genera índice de contenido, SEO y `public/`.
- `public/`: distribución estática servida en producción.

## Desarrollo

No se requieren dependencias adicionales para validar la parte estática.

```bash
python3 tools/build_css.py
python3 -m unittest discover -s tests -v
python3 build_index.py
```

`css/styles.css` debe estar sincronizado con los módulos:

```bash
python3 tools/build_css.py --check
```

## Contenido y despliegue

El contenido aprobado se incorpora desde un origen privado durante CI y se publica únicamente como archivos estáticos en `public/`. No se almacenan credenciales ni material interno en este repositorio.

La documentación operativa local está en `.private/` y Git la ignora por diseño.
