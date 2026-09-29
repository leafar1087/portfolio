---
content_type: course
course_slug: wazuh-avanzado-operacion
course_title: Wazuh avanzado: automatización y operación
title: Wazuh avanzado: automatización y operación
title_es: Wazuh avanzado: automatización y operación
description: Design controlled Wazuh automation, scalable configuration and recoverable operations.
description_es: Diseña automatización controlada, configuración escalable y operación recuperable de Wazuh.
date: 2026-09-29
author: Rafael Pérez Llorca
tags: [wazuh, automatizacion, active-response, operaciones, blue-team]
module_order: 0
course_order: 3
publication_status: reviewed
version: 4.14.x
---

# Wazuh avanzado: automatización y operación

Este curso trata cambios con impacto: automatizar una respuesta, aplicar configuración a grupos, integrar sistemas externos o recuperar una plataforma. Cada módulo muestra alcance, observabilidad, prueba en canario y retorno; un script de ejemplo es una guía que debe validarse en el entorno, no una receta de producción.

## Prerrequisitos

Haber terminado Wazuh intermedio y poder demostrar una detección con muestras positivas y negativas, una fuente entendida y una investigación básica reproducible.

## Ruta de aprendizaje

| Orden | Módulo | Estado del borrador | Resultado |
| --- | --- | --- | --- |
| 1 | Arquitectura para producción | Pendiente de redactar | Decisión defendible de roles, red, certificados y capacidad. |
| 2 | Configuración como producto | Pendiente de redactar | Cambio mínimo promovido, validado y reversible. |
| 3 | [Respuesta activa controlada](03-respuesta-activa-controlada.md) | Preparado | Acción de laboratorio auditable con `add`, `delete` y retorno. |
| 4 | Automatización idempotente | Pendiente de redactar | Script con dry-run, logs, manejo de errores y rollback. |
| 5 | Integraciones | Pendiente de redactar | Integración con criterios de salud y fallo. |
| 6 | Tuning y detección a escala | Pendiente de redactar | Menos ruido sin perder evidencia útil. |
| 7 | Investigación avanzada y preservación | Pendiente de redactar | Hipótesis reproducible con evidencia preservada. |
| 8 | Indexer, retención y consultas operativas | Pendiente de redactar | Consulta y retención justificadas por uso y capacidad. |
| 9 | Administración, identidad y actualización | Pendiente de redactar | Salud, acceso y actualización con retorno. |
| 10 | [Operación y recuperación](10-operacion-y-recuperacion.md) | Preparado | Health check, cambio controlado y restore aislado demostrado. |

No se automatiza una alerta hasta que detección, impacto, exclusiones y recuperación estén demostrados en un entorno de laboratorio controlado. El orden de la tabla es una dependencia pedagógica: los módulos 1 y 2 deben completarse antes de convertir el módulo 3 en una actividad publicada.
