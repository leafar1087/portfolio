---
title: "Building a Port Scanner with Python"
title_es: "Construyendo un Escáner de Puertos con Python"
date: "2026-01-08"
description: "Creating a custom security tool to audit local networks using Python Sockets."
description_es: "Creando una herramienta de seguridad personalizada para auditar redes locales usando Python Sockets."
tags: ["Python", "NetSec", "Scripting"]
author: "Rafael Pérez Llorca"
---

# Building a Port Scanner with Python

In the world of cybersecurity, understanding how networks communicate is fundamental. While tools like Nmap are the industry standard, building your own scanner is the best way to understand the **TCP Handshake** and socket programming.

Today, I'll share a script I developed to perform quick audits on local servers.

## The Concept

We will use Python's native `socket` library to attempt connections to a range of ports. If the socket connects successfully (returns 0), the port is **OPEN**.

## The Code

This script implements a basic linear scan. In a production environment (SecDevOps), I would implement threading to speed up the process, but this version is excellent for understanding the logic.

```python
import socket
import sys
from datetime import datetime

# Target Definition
target = "192.168.1.1" # Example Local IP

print("-" * 50)
print(f"Scanning Target: {target}")
print(f"Time started: {str(datetime.now())}")
print("-" * 50)

try:
    # Scan ports 1 to 1024 (Well-known ports)
    for port in range(1, 1025):
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        socket.setdefaulttimeout(1)

        # Attempt connection
        result = s.connect_ex((target, port))

        if result == 0:
            print(f"Port {port}: OPEN")
        s.close()

except KeyboardInterrupt:
    print("\nExiting Program.")
    sys.exit()
except socket.error:
    print("\nServer not responding.")
    sys.exit()
```

![script execution](/images/posts/python-port-scanner.png)

## Strategic Analysis: Custom vs. Standard Tools

As a Cybersecurity Specialist, relying solely on one type of tool is a mistake. We must know when to code and when to use established software.

### When to use Custom Scripts (The "Hacker" Approach)

- Stealth & Evasion: Standard tools like Nmap have recognizable signatures that are easily blocked by IDS/IPS. A custom Python script can mimic legitimate traffic.

- Specific Automation: When you need to plug the output directly into a CI/CD pipeline or a custom database.

- Learning: To deeply understand the protocol.

### When NOT to use them (The "Forensic" Approach)

- Legal Proceedings & Forensics: In a court of law, evidence collected with a custom script can be dismissed. The opposing counsel can argue the tool is not validated or audited.

- Compliance Audits (PCI-DSS, ISO): Auditors require industry-standard, validated tools to ensure results are consistent and reproducible.

- Professional Note: Use custom scripts for Red Teaming and internal research. Use standard tools (Nmap, Nessus) for formal reports and legal evidence.

Note: Use custom scripts for Red Teaming and internal research. Use standard tools (Nmap, Nessus) for formal reports and legal evidence.

<!-- es -->

# Construyendo un Escáner de Puertos con Python

En el mundo de la ciberseguridad, entender cómo se comunican las redes es fundamental. Aunque herramientas como Nmap son el estándar de la industria, construir tu propio escáner es la mejor manera de entender el TCP Handshake y la programación de sockets.

Hoy comparto un script que desarrollé para realizar auditorías rápidas en servidores locales.

## El Concepto

Utilizaremos la librería nativa `socket` de Python para intentar conexiones a un rango de puertos. Si el socket se conecta exitosamente (retorna 0), el puerto está **ABIERTO**.

## El Código

Este script implementa un escaneo lineal básico. En un entorno de producción (SecDevOps), implementaría hilos (threading) para acelerar el proceso, pero esta versión es excelente para entender la lógica.

```python
import socket
import sys
from datetime import datetime

# Definición del Objetivo
target = "192.168.1.1" # Ejemplo IP Local

print("-" * 50)
print(f"Escaneando Objetivo: {target}")
print(f"Hora de inicio: {str(datetime.now())}")
print("-" * 50)

try:
    # Escanear puertos 1 a 1024 (Puertos bien conocidos)
    for port in range(1, 1025):
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        socket.setdefaulttimeout(1)

        # Intentar conexión
        result = s.connect_ex((target, port))

        if result == 0:
            print(f"Puerto {port}: ABIERTO")
        s.close()

except KeyboardInterrupt:
    print("\nSaliendo del Programa.")
    sys.exit()
except socket.error:
    print("\nEl servidor no responde.")
    sys.exit()
```

![ejecución del script](/images/posts/python-port-scanner.png)

## Análisis Estratégico: Herramientas Propias vs. Estándares

Como Especialista en Ciberseguridad, depender únicamente de un tipo de herramienta es un error. Debemos saber cuándo programar y cuándo usar software establecido.

### Cuándo usar Scripts Propios

- Sigilo y Evasión: Las herramientas estándar como Nmap tienen firmas reconocibles que los IDS/IPS bloquean fácilmente. Un script de Python personalizado puede imitar tráfico legítimo.

- Automatización Específica: Cuando necesitas conectar la salida directamente a un pipeline CI/CD o una base de datos propia.

- Aprendizaje: Para entender el protocolo a bajo nivel.

### Cuándo NO usarlos

- Procedimientos Legales y Judiciales: En un juicio, la evidencia recolectada con un script propio puede ser descartada. La defensa puede argumentar que la herramienta no está homologada, no ha sido auditada y podría generar falsos positivos o manipular la evidencia.

- Auditorías de Cumplimiento (PCI-DSS, ISO): Los auditores requieren herramientas estándar validadas para asegurar que los resultados son consistentes y reproducibles.

Nota: Usa scripts propios para Red Teaming e investigación interna. Usa herramientas estándar (Nmap, Nessus) para reportes formales, peritajes y evidencia legal.
