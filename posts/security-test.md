---
title: "Proof of Concept: Security and Sanitization"
title_es: "Prueba de Concepto: Seguridad y sanitización"
date: "2025-12-13"
description: "Cross-Site Scripting (XSS) injection test."
description_es: "Prueba de inyección de código malicioso."
tags: ["Security", "XSS", "Sanitization"]
author: "Rafael Pérez Llorca"
---

# Proof of Concept: Security and Sanitization

This is a test article to verify that the JAMstack architecture is secure against Cross-Site Scripting (XSS) attacks.

## 1. Normal Content

This is a standard text paragraph to verify that Markdown rendering is working correctly.

- List Item 1
- List Item 2

## 2. Attack Vectors (Payloads)

Below, we will attempt to inject malicious code. If `DOMPurify` is working correctly, **NONE** of the following alerts should appear on your screen.

### Test A: Basic Script Injection

Attempting to inject a direct script tag.

<script>alert('XSS VECTOR A: Script Tag')</script>

### Test B: Event Injection (The most dangerous)

This is the acid test. We use a broken image that executes code when loading fails.
<img src="x" onerror="alert('XSS VECTOR B: YOUR WEB IS VULNERABLE')">

### Test C: Javascript Link

A link that executes code when clicked.
[Click here if you dare](javascript:alert('XSS VECTOR C: Malicious Link'))

## 3. Secure Code

Below shows how code should look if placed inside a code block (this should be displayed as text):

```javascript
console.log("This is safe code because it is inside a code block");
```

<!-- es -->

# Prueba de Concepto: Seguridad y Sanitización

Este es un artículo de prueba para verificar que la arquitectura JAMstack es segura contra ataques de Cross-Site Scripting (XSS).

## 1. Contenido Normal

Esto es un párrafo de texto estándar para verificar que el renderizado de Markdown funciona correctamente.

- Elemento de lista 1
- Elemento de lista 2

## 2. Vectores de Ataque (Payloads)

A continuación, intentaremos inyectar código malicioso. Si `DOMPurify` está funcionando correctamente, **NINGUNA** de las siguientes alertas debería aparecer en tu pantalla.

### Prueba A: Inyección de Script Básico

Intentamos inyectar un tag de script directo.

<script>alert('XSS VECTOR A: Script Tag')</script>

### Prueba B: Inyección por Evento (La más peligrosa)

Esta es la prueba de fuego. Usamos una imagen rota que ejecuta código al fallar la carga.
<img src="x" onerror="alert('XSS VECTOR B: TU WEB ES VULNERABLE')">

### Prueba C: Enlace Javascript

Un enlace que ejecuta código al hacer clic.
[Haz clic aquí si te atreves](javascript:alert('XSS VECTOR C: Link Malicioso'))

## 3. Código Seguro

Aquí abajo mostramos cómo debería verse el código si lo ponemos dentro de un bloque de código (esto sí debe mostrarse como texto):

```javascript
console.log("Esto es código seguro porque está dentro de un bloque code");
```
