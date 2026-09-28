---
content_type: course
course_slug: wazuh
course_title: Fundamentos de Wazuh
title: Fundamentos de Wazuh
title_es: Fundamentos de Wazuh
description: An evidence-based introduction to Wazuh architecture and its verified version scope.
description_es: Introducción basada en evidencia a la arquitectura de Wazuh y su alcance de versión verificado.
date: 2026-09-28
author: Rafael Pérez Llorca
tags: [wazuh, blue-team, siem, xdr, fundamentos]
module_order: 0
publication_status: reviewed
version: 4.14.x
---

# Fundamentos de Wazuh

Curso introductorio sobre los componentes de Wazuh y el control de versiones aplicable a su uso formativo.

## Ruta de aprendizaje publicada

Sigue esta secuencia. Cada paso prepara el siguiente; no se debe usar un laboratorio de agentes para suplir una instalación central que todavía no ha sido verificada.

1. [Arquitectura y alcance de Wazuh](01-fundamentos.md)
2. [Topologías de despliegue](02-despliegue.md)
3. [Vigencia y compatibilidad de versiones](05-vigencia-y-versiones.md)
4. [Laboratorio: desplegar Wazuh All-in-One](07-despliegue-all-in-one.md)
5. [Pruebas de aceptación del laboratorio](10-validacion-extremo-a-extremo.md)
6. [Agentes y enrolamiento](03-agentes.md)
7. [Laboratorio: enrolar un agente Linux](08-agente-linux.md)
8. [Laboratorio: enrolar un agente Windows](09-agente-windows.md)
9. [Recolección y procesamiento de logs](04-recoleccion-de-logs.md)

## Siguiente tramo de la ruta

Estos recursos se publicarán en este orden, usando el mismo entorno ya validado:

| Orden | Recurso | Resultado que debe conseguir el alumnado |
| --- | --- | --- |
| 10 | Decoders | Ver qué campos extrae Wazuh de una muestra real. |
| 11 | Rules y `wazuh-logtest` | Probar una detección antes de ponerla en uso. |
| 12 | Primera alerta end-to-end | Relacionar fuente, campos, rule, alerta y búsqueda. |
| 13 | FIM, SCA, inventario y vulnerabilidades | Activar capacidades con alcance y evidencia. |
| 14 | [Casos de uso: de la señal a la decisión](06-casos-de-uso.md) | Aplicar las capacidades a investigación y priorización. |
| 15 | Dashboard e investigación | Convertir alertas y eventos en una línea temporal. |
| 16 | Operación: retención, actualización y recuperación | Mantener la plataforma sin confundir laboratorio y producción. |

## Vigencia

El contenido se revisa contra documentación oficial vigente. La versión concreta depende del canal de instalación y del entorno; confirma siempre el alcance antes de aplicar una guía.
