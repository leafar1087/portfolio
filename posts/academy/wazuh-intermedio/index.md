---
content_type: course
course_slug: wazuh-intermedio
course_title: Wazuh intermedio: telemetría y detección
title: Wazuh intermedio: telemetría y detección
title_es: Wazuh intermedio: telemetría y detección
description: Build, test and investigate Wazuh telemetry and detections from real evidence.
description_es: Construye, prueba e investiga telemetría y detecciones de Wazuh a partir de evidencia real.
date: 2026-09-29
author: Rafael Pérez Llorca
tags: [wazuh, deteccion, decoders, rules, mitre, blue-team]
module_order: 0
course_order: 2
publication_status: reviewed
version: 4.14.x
---

# Wazuh intermedio: telemetría y detección

Aquí Wazuh deja de ser una consola instalada y pasa a ser una herramienta de análisis. El trabajo empieza con una fuente cuya calidad conocemos, continúa con decoders y rules que podemos probar y termina en una investigación que separa evidencia de hipótesis.

## Prerrequisitos

Haber terminado Wazuh esencial: stack aceptado, agente canario conectado, reloj coherente y una señal que pueda seguirse desde el endpoint al dashboard.

## Ruta de aprendizaje

1. [Diseño y recolección de logs](04-recoleccion-de-logs.md)
2. [Decoders: convertir registros en campos](11-decoders.md)
3. [Rules y `wazuh-logtest`: convertir campos en una detección](12-rules-y-logtest.md)
4. [Primera alerta end-to-end](13-primera-alerta-end-to-end.md)
5. [MITRE ATT&CK y cobertura](14-mitre-attck-y-cobertura.md)
6. [FIM, SCA, inventario y vulnerabilidades](15-fim-sca-inventario-vulnerabilidades.md)
7. [Dashboard e investigación](16-dashboard-e-investigacion.md)
8. [Casos de uso: de la señal a la decisión](06-casos-de-uso.md)

## Resultado final

Una fuente real interpretada, un decoder y una rule con pruebas positivas y negativas, una alerta que llega al dashboard y una investigación que otra persona puede repetir. La automatización de respuestas sigue fuera de alcance: antes hay que entender confianza, falsos positivos e impacto.
