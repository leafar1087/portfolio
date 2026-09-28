---
content_type: module
course_slug: wazuh
course_title: Fundamentos de Wazuh
title: Laboratorio: enrolar un agente Linux
title_es: Laboratorio: enrolar un agente Linux
description: Deploy, enroll, and verify a Wazuh agent on a Linux endpoint.
description_es: Despliega, enrola y verifica un agente Wazuh en un endpoint Linux.
date: 2026-09-28
author: Rafael Pérez Llorca
tags: [wazuh, agente, linux, enrolamiento, laboratorio]
module_order: 7
publication_status: reviewed
version: 4.14.x
---

# Laboratorio: enrolar un agente Linux

El agente convierte un endpoint en una fuente de evidencia. Instalar el paquete no basta: el host debe resolver o alcanzar el manager, enrolarse con una identidad única y enviar datos que puedas ver desde la consola.

## 1. Definir valores del laboratorio

Este ejemplo usa nombres que no pertenecen a ninguna red real. Sustitúyelos por valores de tu entorno antes de ejecutar nada.

| Variable | Ejemplo | Uso |
| --- | --- | --- |
| Manager | `wazuh-lab.example.test` | Destino de telemetría y enrolamiento. |
| Nombre de agente | `ubuntu-lab-01` | Identidad visible en el dashboard. Debe ser única. |
| Grupo | `lab-linux` | Aplicar configuración común a endpoints equivalentes. |
| Puertos | 1514 y 1515 TCP | Comunicación continua y enrolamiento automático. |

Comprueba la red desde el endpoint antes de instalar. Un `timeout` suele apuntar a ruta o firewall; `refused` suele indicar que llegaste al host, pero el servicio no escucha ahí.

```bash
nc -zvw3 wazuh-lab.example.test 1514
nc -zvw3 wazuh-lab.example.test 1515
```

## 2. Añadir el repositorio e instalar el paquete

Para sistemas APT, la guía oficial del canal 4.x usa este repositorio firmado:

```bash
sudo apt-get install -y gnupg apt-transport-https curl
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH \
  | gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import
sudo chmod 644 /usr/share/keyrings/wazuh.gpg
echo 'deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main' \
  | sudo tee /etc/apt/sources.list.d/wazuh.list
sudo apt-get update
```

Instala y configura el agente con variables de despliegue. El grupo debe existir previamente en el manager. Si tu entorno exige contraseña de enrolamiento, obtén el comando generado desde **Agents management → Summary → Deploy new agent** y mantenlo fuera del historial o de scripts versionados.

```bash
sudo env \
  WAZUH_MANAGER='wazuh-lab.example.test' \
  WAZUH_REGISTRATION_SERVER='wazuh-lab.example.test' \
  WAZUH_AGENT_NAME='ubuntu-lab-01' \
  WAZUH_AGENT_GROUP='lab-linux' \
  apt-get install -y wazuh-agent

sudo systemctl daemon-reload
sudo systemctl enable --now wazuh-agent
```

El paquete instala el agente; las variables indican a qué manager conectarse y qué identidad solicitar. Si incluyes `WAZUH_REGISTRATION_PASSWORD`, trátala como secreto: no la sustituyas por una contraseña de ejemplo ni la conserves en un script.

### Alternativa RPM: RHEL, Rocky y AlmaLinux

El concepto es el mismo en distribuciones RPM: repositorio firmado, variables de despliegue y arranque controlado. Cambia el gestor de paquetes, no la necesidad de identificar el manager, el agente y el grupo.

```bash
sudo rpm --import https://packages.wazuh.com/key/GPG-KEY-WAZUH
sudo tee /etc/yum.repos.d/wazuh.repo >/dev/null <<'EOF'
[wazuh]
name=Wazuh repository
baseurl=https://packages.wazuh.com/4.x/yum/
gpgcheck=1
gpgkey=https://packages.wazuh.com/key/GPG-KEY-WAZUH
enabled=1
EOF

sudo env \
  WAZUH_MANAGER='wazuh-lab.example.test' \
  WAZUH_REGISTRATION_SERVER='wazuh-lab.example.test' \
  WAZUH_AGENT_NAME='rhel-lab-01' \
  WAZUH_AGENT_GROUP='lab-linux' \
  dnf install -y wazuh-agent
sudo systemctl enable --now wazuh-agent
```

Para `yum`, sustituye `dnf`. Antes de masificar este comando, prueba un canario: un repositorio accesible no prueba que la versión elegida sea compatible con el manager ni que el grupo exista.

## 3. Alternativa: enrolar mediante configuración del agente

La instalación puede producirse sin enrolar todavía. En ese caso, el administrador puede declarar el manager, nombre y grupos en `/var/ossec/etc/ossec.conf`, siguiendo el método oficial de configuración del agente:

```xml
<client>
  <server>
    <address>wazuh-lab.example.test</address>
  </server>
  <enrollment>
    <agent_name>ubuntu-lab-01</agent_name>
    <groups>lab-linux</groups>
  </enrollment>
</client>
```

Después reinicia el servicio:

```bash
sudo systemctl restart wazuh-agent
```

El grupo debe existir en el manager antes del enrolamiento. Este método no autoriza copiar `client.keys` desde otro host: cada endpoint obtiene su propia identidad.

## 4. Comprobar el endpoint

```bash
sudo systemctl status wazuh-agent --no-pager
sudo /var/ossec/bin/wazuh-control status
sudo tail -n 80 /var/ossec/logs/ossec.log
```

Busca una conexión aceptada o mensajes que expliquen por qué no se produjo. `systemctl` confirma el servicio principal; `wazuh-control status` ayuda a ver procesos internos como logcollector y agentd. Ninguno de los dos sustituye la confirmación central.

## 5. Confirmar desde el manager y el dashboard

En el manager, el listado siguiente debe incluir el nombre y estado activo del endpoint:

```bash
sudo /var/ossec/bin/agent_control -l | grep 'ubuntu-lab-01'
```

En el dashboard, abre **Agents management → Summary**, localiza `ubuntu-lab-01` y comprueba versión, grupo y estado. A continuación genera una marca de prueba en una fuente que ya hayas configurado para recolectar; la próxima lección explica cómo verificar el recorrido completo.

Para revisar la identidad y la configuración recibida desde el manager, consulta el agente por su ID:

```bash
sudo /var/ossec/bin/agent_control -i <AGENT_ID>
```

Comprueba nombre, sistema operativo, versión, estado, hash de configuración y última comunicación. Es una comprobación más precisa que asumir que un grupo se aplicó porque aparece en una lista.

## Diagnóstico rápido

| Síntoma | Evidencia local | Hipótesis | Siguiente paso |
| --- | --- | --- | --- |
| Servicio inactivo | `systemctl status wazuh-agent`. | Instalación o configuración local. | Leer `ossec.log` antes de reiniciar. |
| Servicio activo, sin conexión | Log con espera o rechazo. | DNS, ruta, puerto o identidad. | Probar 1514/1515 y comparar el nombre configurado. |
| Figura en dashboard, sin eventos | Agente conectado. | La fuente de logs no está configurada o no produce datos. | Validar el log local y `localfile`. |
| Identidad duplicada | Nombre repetido en el dashboard. | Reutilización de VM o nombre no único. | Dar una identidad nueva; no copies `client.keys` entre equipos. |

## Retirada de un canario Linux

La retirada empieza por confirmar que el host deja de ser parte del laboratorio y que no necesitas su evidencia local. En Debian/Ubuntu, la desinstalación de paquete es:

```bash
sudo systemctl disable --now wazuh-agent
sudo apt-get remove wazuh-agent
```

`remove` puede conservar archivos de configuración. Usa `--purge` solo si has decidido eliminar deliberadamente esa configuración; no borres `/var/ossec/` como respuesta a un problema de conexión. Después confirma en el manager que el registro se retira mediante el método autorizado de dashboard o CLI.

## Referencias

- [Desplegar agentes Wazuh en Linux](https://documentation.wazuh.com/current/installation-guide/wazuh-agent/wazuh-agent-package-linux.html)
- [Requisitos de enrolamiento](https://documentation.wazuh.com/current/user-manual/agent/agent-enrollment/requirements.html)
- [Variables de despliegue Linux](https://documentation.wazuh.com/current/user-manual/agent/agent-enrollment/deployment-variables/deployment-variables-linux.html)
- [Enrolamiento Linux mediante configuración](https://documentation.wazuh.com/current/user-manual/agent/agent-enrollment/enrollment-methods/via-agent-configuration/linux-endpoint.html)
