# Contrato de contenido de Ciber Academia

Cada curso se almacena bajo `posts/academy/<course-slug>/` y usa este frontmatter:

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
course_order: <número; solo en el índice del curso, opcional>
publication_status: reviewed|canonical
version: <versión o alcance>
```

El contenido legacy sin `publication_status` se conserva por compatibilidad; al incluirlo, solo se admiten `reviewed` y `canonical`. El índice del curso usa `content_type: course` y `module_order: 0`; si hay varios cursos, `course_order` define el orden visual entre ellos. Los módulos usan `content_type: module`. Solo `reviewed` y `canonical` se publican. El generador excluye otros estados y rutas internas, backups y secretos.

## Próxima integración entre repositorios

El repositorio de cursos deberá ejecutar, al publicar contenido `reviewed` o `canonical`, un workflow que copie exclusivamente esos directorios Markdown y abra un pull request hacia `posts/academy/` en este repositorio. Al fusionarse, el `push` sobre `posts/**` ejecuta `build_index.py`, valida `public/` y Cloudflare Pages despliega el resultado. No hay acceso runtime a GitHub, secretos ni integración cross-repository configurados aquí.
