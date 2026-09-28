---
content_type: module
course_slug: wazuh
course_title: Fundamentos de Wazuh
title: Arquitectura y alcance de Wazuh
title_es: Arquitectura y alcance de Wazuh
description: Learn the verified Wazuh architecture and version scope.
description_es: Aprende la arquitectura y el alcance de versión verificados de Wazuh.
date: 2026-09-28
author: Rafael Pérez Llorca
tags: [wazuh, blue-team, siem, xdr, fundamentos]
module_order: 1
publication_status: reviewed
version: 4.14.x
artifact_id: MOD-WAZUH-FUNDAMENTOS-01
artifact_type: module
status: reviewed
owner: leafar1087
last_reviewed: 2026-09-28
review_due: 2026-10-26
knowledge_dependencies: K-1EB1CF7ED3F97D57
source_dependencies: SRC-WAZUH-ARCHITECTURE-4.14, SRC-WAZUH-RELEASE-4.14.8, SRC-WAZUH-DOCS-REPO
source_path: knowledge/curated/blue-team/wazuh/baselines/01-fundamentos-wazuh.md
---

# Arquitectura y alcance de Wazuh

## Objetivo

Identificar los componentes de Wazuh y distinguir el baseline pedagógico del release oficial verificado.

## Arquitectura mínima

Wazuh 4.14.x se compone de cuatro elementos:

1. El agente recopila telemetría del endpoint.
2. El servidor recibe y analiza los eventos.
3. El indexer almacena las alertas.
4. El dashboard permite su consulta y análisis.

Endpoint → Wazuh agent → Wazuh server → Wazuh indexer → Wazuh dashboard

## Alcance de versión

La documentación y los paquetes oficiales se verificaron en la versión 4.14.8 el 2026-09-26. El curso conserva 4.14.7 como baseline pedagógico reproducible mientras se completa su revisión diferencial. No se debe sustituir una patch release de forma global ni tratar el baseline como instrucción de producción.

## Validación

Antes de aplicar una guía en un entorno, confirma la versión objetivo y consulta la documentación oficial vigente. Una actualización estable, aviso de seguridad, cambio de documentación o upgrade del entorno requiere revalidación.

## Referencias

- [Arquitectura de Wazuh](https://documentation.wazuh.com/current/getting-started/architecture.html)
- [Documentación oficial de Wazuh](https://documentation.wazuh.com/current/)
- Registro interno: K-1EB1CF7ED3F97D57.

## Control de cambios

- 2026-09-28: primera publicación para Ciber Academia, derivada del baseline canónico revisado el 2026-09-26.
