---
content_type: module
course_slug: wazuh-esencial
course_title: Wazuh esencial
title: Laboratorio: enrolar un agente Windows
title_es: Laboratorio: enrolar un agente Windows
description: Deploy, enroll, and verify a Wazuh agent on a Windows endpoint.
description_es: Despliega, enrola y verifica un agente Wazuh en un endpoint Windows.
date: 2026-09-28
author: Rafael Pérez Llorca
tags: [wazuh, agente, windows, enrolamiento, powershell, laboratorio]
module_order: 8
publication_status: reviewed
version: 4.14.x
---

# Laboratorio: enrolar un agente Windows

Windows no es un “Linux con otro instalador”. Antes de desplegar, define qué eventos de seguridad, aplicaciones y cambios de configuración necesitas observar. El primer objetivo es más pequeño: conseguir una identidad única, una conexión sana y evidencia de que el agente llega al manager.

## 1. Verificar conectividad

Abre PowerShell como administrador y confirma los puertos desde el endpoint. Usa el FQDN o IP real de tu manager; el nombre de este ejemplo es solo documental.

```powershell
Test-NetConnection -ComputerName wazuh-lab.example.test -Port 1514
Test-NetConnection -ComputerName wazuh-lab.example.test -Port 1515
```

`TcpTestSucceeded : True` solo prueba el camino TCP. No prueba que el agente esté instalado ni que su identidad sea aceptada. Si 1515 funciona pero 1514 no, el enrolamiento podría completarse y la telemetría seguir bloqueada.

## 2. Obtener el comando de despliegue

En el dashboard, ve a **Agents management → Summary → Deploy new agent**. Elige Windows, indica el manager, el grupo existente y copia el comando generado para tu versión. Esta es la vía preferida porque mantiene alineados versión, paquete y variables de enrolamiento.

El patrón que genera el instalador MSI usa variables como estas:

| Variable | Propósito |
| --- | --- |
| `WAZUH_MANAGER` | Manager que recibirá comunicación continua. |
| `WAZUH_REGISTRATION_SERVER` | Servicio usado para enrolar el endpoint. |
| `WAZUH_AGENT_NAME` | Nombre único, normalmente el nombre del equipo. |
| `WAZUH_AGENT_GROUP` | Uno o más grupos que ya existen en el manager. |
| `WAZUH_REGISTRATION_PASSWORD` | Secreto opcional de enrolamiento, si el manager lo exige. |

No inventes una contraseña ni la incrustes en una plantilla pública. Si el comando incluye una, ejecútalo en una sesión administrativa privada y elimina el archivo de log de instalación si hubiera registrado datos sensibles.

## 3. Instalar un agente de laboratorio

El siguiente ejemplo usa un MSI oficial de 4.14.8. Comprueba que esa sea la versión permitida por tu manager antes de descargarlo. Ejecuta PowerShell como administrador:

```powershell
New-Item -ItemType Directory -Force -Path C:\Temp | Out-Null
Invoke-WebRequest `
  -Uri https://packages.wazuh.com/4.x/windows/wazuh-agent-4.14.8-1.msi `
  -OutFile C:\Temp\wazuh-agent-4.14.8-1.msi

msiexec.exe /i C:\Temp\wazuh-agent-4.14.8-1.msi /q `
  WAZUH_MANAGER="wazuh-lab.example.test" `
  WAZUH_REGISTRATION_SERVER="wazuh-lab.example.test" `
  WAZUH_AGENT_NAME="win-lab-01" `
  WAZUH_AGENT_GROUP="lab-windows" `
  /l*v C:\Temp\wazuh-agent-install.log
```

Si tu entorno requiere contraseña, añade la variable que entrega el dashboard sin guardarla en este documento ni reutilizarla entre laboratorios. El grupo `lab-windows` debe existir; de lo contrario, el enrolamiento puede fallar.

Al finalizar, comprueba el código de salida de MSI antes de perseguir un problema de red:

```powershell
$LASTEXITCODE
Get-Content C:\Temp\wazuh-agent-install.log -Tail 40
```

Un código `0` indica que Windows Installer terminó correctamente. Un fallo de instalación y un agente desconectado son problemas diferentes: primero resuelve el MSI; después revisa enrolamiento y telemetría.

## 4. Validar servicio, logs y vista central

```powershell
Get-Service -Name WazuhSvc
Get-Content 'C:\Program Files (x86)\ossec-agent\ossec.log' -Tail 80
```

En una instalación de 64 bits, esa es la ruta habitual. Si el agente se instaló en otro directorio, localiza `ossec.log` en su ruta de instalación. Busca mensajes de conexión, espera o rechazo; no copies ni publiques `client.keys`.

Luego abre el dashboard y localiza `win-lab-01` en **Agents management → Summary**. Debe aparecer activo con el grupo previsto. Cuando se conecte, selecciona una fuente de Windows —por ejemplo, eventos de seguridad— y prueba su ingesta antes de afirmar que el endpoint está cubierto.

En el manager, `agent_control` aporta el contraste central:

```bash
sudo /var/ossec/bin/agent_control -i <AGENT_ID>
```

Revisa nombre, sistema operativo, versión, estado, hash de configuración y último keepalive. Si el grupo no coincide con lo esperado, corrige la asignación antes de habilitar fuentes como Security o Sysmon para una flota completa.

## 5. Preparar fuentes Windows sin adelantar el módulo de logs

El agente puede recolectar canales de eventos mediante `eventchannel`. Esta configuración ilustra el tipo de fuente que estudiaremos en M04; aplícala primero a un grupo de laboratorio y valida que el canal exista en el host:

```xml
<localfile>
  <location>Security</location>
  <log_format>eventchannel</log_format>
</localfile>
```

Para comprobar que Windows expone un canal antes de configurar la ingesta:

```powershell
Get-WinEvent -ListLog Security | Select-Object LogName, RecordCount, IsEnabled
```

Un canal habilitado no asegura que una detección esté lista. Solo confirma que existe una fuente de la que después podremos extraer campos, probar decoders y construir rules.

## Diagnóstico rápido

| Resultado | Lectura | Acción |
| --- | --- | --- |
| `WazuhSvc` no está en ejecución | La instalación o el arranque local fallaron. | Revisa el log MSI y `ossec.log`. |
| Los puertos fallan | La red no permite una fase del agente. | Diferencia 1514 (telemetría) y 1515 (enrolamiento). |
| El agente aparece desconectado | La identidad existe, pero no mantiene comunicación. | Revisa nombre, log y conectividad con 1514. |
| El agente está activo sin eventos útiles | El transporte funciona; la cobertura no. | Decide y configura la fuente de Windows que necesitas. |

## Retirada de un canario Windows

Primero confirma que el endpoint no necesita conservar el agente para un ejercicio o una investigación. Con el MSI original disponible y una sesión administrativa, Wazuh documenta esta desinstalación:

```powershell
msiexec.exe /x C:\Temp\wazuh-agent-4.14.8-1.msi /qn
```

No uses la desinstalación para “arreglar” una conexión sin haber leído `ossec.log` y el log MSI. Tras una retirada planificada, verifica y elimina el registro central solo cuando corresponda a la baja real del endpoint.

## Referencias

- [Guía de instalación de agentes](https://documentation.wazuh.com/current/installation-guide/wazuh-agent/index.html)
- [Variables de despliegue Windows](https://documentation.wazuh.com/current/user-manual/agent/agent-enrollment/deployment-variables/deployment-variables-windows.html)
- [Enrolamiento mediante configuración en Windows](https://documentation.wazuh.com/current/user-manual/agent/agent-enrollment/enrollment-methods/via-agent-configuration/windows-endpoint.html)
- [Desinstalar el agente](https://documentation.wazuh.com/current/installation-guide/uninstalling-wazuh/agent.html)
