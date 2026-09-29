---
content_type: course
course_slug: wazuh-esencial
course_title: Wazuh esencial
title: Wazuh esencial
title_es: Wazuh esencial
description: A guided foundation for deploying Wazuh, connecting endpoints and validating its first telemetry path.
description_es: Ruta guiada para desplegar Wazuh, conectar endpoints y validar su primer flujo de telemetría.
date: 2026-09-29
author: Rafael Pérez Llorca
tags: [wazuh, blue-team, siem, fundamentos]
module_order: 0
course_order: 1
publication_status: reviewed
version: 4.14.x
---

# Wazuh esencial

Este curso construye un laboratorio que se puede explicar y comprobar. El objetivo no es instalar una pantalla: es saber dónde se origina un evento, cómo llega al manager y qué evidencia confirma que el recorrido sigue sano.

## Resultado final

Desplegar un entorno Wazuh de laboratorio, enrolar un agente Linux o Windows, recoger una fuente inicial y seguir una señal hasta la plataforma. Al terminar, podrás localizar una interrupción por capa —servicio, red, identidad, recolección o visualización— sin cambiar configuraciones al azar.

## Ruta de aprendizaje

1. [Arquitectura y alcance de Wazuh](01-fundamentos.md)
2. [Topologías de despliegue](02-despliegue.md)
3. [Vigencia y compatibilidad de versiones](05-vigencia-y-versiones.md)
4. [Laboratorio: desplegar Wazuh All-in-One](07-despliegue-all-in-one.md)
5. [Pruebas de aceptación del laboratorio](10-validacion-extremo-a-extremo.md)
6. [Agentes y enrolamiento](03-agentes.md)
7. [Laboratorio: enrolar un agente Linux](08-agente-linux.md)
8. [Laboratorio: enrolar un agente Windows](09-agente-windows.md)
9. [Recolección y procesamiento de logs](04-recoleccion-de-logs.md)

## Límite del curso

Este curso termina cuando la plataforma recibe telemetría entendida y el alumnado puede seguir una señal de forma fiable. Construir decoders, rules, correlaciones, mapas MITRE, FIM/SCA e investigaciones pertenece a **Wazuh intermedio**. Automatizar acciones o administrar capacidad y recuperación pertenece a **Wazuh avanzado: automatización y operación**.
