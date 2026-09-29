# Despliegue de Ciber Academia sin duplicación de contenido

`leafar1087/cursos` es la fuente canónica privada. El repositorio `leafar1087/portfolio` no debe conservar Markdown de cursos una vez completada la migración.

## Flujo

```text
cursos privado (reviewed/canonical, SHA inmutable)
  -> validación privada
  -> repository_dispatch con la SHA
  -> runner de portfolio obtiene cursos con lectura mínima
  -> exporta a un directorio temporal, construye public/
  -> Cloudflare Pages Direct Upload
```

El navegador solo recibe los archivos estáticos de `public/`; nunca obtiene una credencial de GitHub ni consulta el repositorio privado en tiempo de ejecución.

## Secretos y variable requeridos en `leafar1087/portfolio`

| Nombre | Uso | Permiso mínimo |
| --- | --- | --- |
| `COURSES_READ_TOKEN` | Checkout de `leafar1087/cursos` durante el workflow. | Fine-grained PAT, solo Contents: Read sobre `cursos`. |
| `CLOUDFLARE_API_TOKEN` | Direct Upload a Pages. | Account → Cloudflare Pages: Edit. |
| `CLOUDFLARE_ACCOUNT_ID` | Cuenta destino de Pages. | Identificador, guardado como secreto. |
| `CLOUDFLARE_PAGES_PROJECT` | Nombre del proyecto Pages. | Variable de repositorio, no secreto. |

El token de lectura no se usa en pull requests ni se imprime. Si se reemplaza por una GitHub App, esa App debe tener acceso de solo lectura a `cursos` y al repositorio destino estrictamente necesario.

## Secreto requerido en `leafar1087/cursos`

| Nombre | Uso | Permiso mínimo |
| --- | --- | --- |
| `PORTFOLIO_DISPATCH_TOKEN` | Envía el `repository_dispatch` tras una validación correcta. | Fine-grained PAT limitada a `portfolio`, con permiso para disparar el evento. |

## Activación en Cloudflare

El proyecto actual usa integración Git. En Cloudflare Pages se deben desactivar los despliegues automáticos de ramas antes de activar Direct Upload con Wrangler; el workflow sube el directorio preconstruido `public/`. Conserva el proyecto y dominio actuales, pero evita dos despliegues que compitan entre sí.

## Migración final

1. Añadir los secretos y la variable anteriores.
2. Ejecutar manualmente `Deploy academy from private source` con la SHA `03dd635` o una posterior.
3. Verificar contenido, orden del catálogo y despliegue de Cloudflare.
4. Eliminar `posts/academy/**` y `public/posts/academy/**` del repositorio `portfolio`; esos archivos ya no se versionarán.
5. Mantener solo el workflow y la aplicación del portafolio en `portfolio`.
