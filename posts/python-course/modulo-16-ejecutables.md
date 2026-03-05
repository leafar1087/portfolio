# Módulo 16 — Ejecutables y Distribución

> **Estándares:** ISO 12207 §6.1 · NIST SP 800-53 CM-7 · NIST SP 800-53 CM-14 · CWE-78 (Inyección de comandos)
> **Dependencias previas:** [Módulo 15](./modulo-15-testing.md) · [Módulo 07](./modulo-07-modulos-paquetes.md)
> **Tiempo estimado:** 3 horas

---

## I. Teoría Técnica Avanzada

### 16.1 ¿Cómo Empaqueta Python un Ejecutable?

PyInstaller no "compila" Python: **congela** el intérprete CPython y los módulos necesarios en un bundle. Existen dos modos:

```
Modo --onefile:
  dist/
  └── mi_app          ← binario único (descomprime a /tmp en el primer run)
      Contiene:
      ├── python3.12 (intérprete)
      ├── *.pyc       (bytecode de la aplicación)
      └── *.so/.dll   (extensiones nativas)

Modo --onedir (por defecto):
  dist/
  └── mi_app/
      ├── mi_app       ← ejecutable principal
      ├── _internal/   ← libs nativas y bytecode
      └── ...
```

**Implicaciones de seguridad:**

| Aspecto                                                  | Impacto                                             |
| -------------------------------------------------------- | --------------------------------------------------- |
| El bytecode `.pyc` es **descompilable** con `uncompyle6` | No es ofuscación real — no meter secretos en código |
| `--onefile` extrae a `/tmp` en cada ejecución            | Riesgo de TOCTOU en sistemas multiusuario           |
| Las dependencias van dentro del bundle                   | Actualizar deps requiere re-distribuir el binario   |
| No protege contra ingeniería inversa                     | Usar licencias de código, no ofuscación             |

### 16.2 `pyproject.toml` como Punto de Verdad

La configuración del punto de entrada en `pyproject.toml` define cómo se lanza la aplicación en todos los contextos (desarrollo, PyInstaller, pip install):

```toml
[project.scripts]
mi-app = "mi_app.app:main"   # pip install → crea `mi-app` en PATH
```

### 16.3 Distribución Alternativa — `zipapp`

Para aplicaciones sin extensiones nativas, `zipapp` es más ligero que PyInstaller:

```bash
# Crear un archivo .pyz ejecutable sin dependencias externas
python -m zipapp src/mi_app \
  --main "mi_app.app:main" \
  --output mi_app.pyz \
  --compress

python mi_app.pyz   # Ejecutar directamente
```

---

## II. Laboratorio Práctico — Step by Step

### Lab 16.1 — Estructura del Proyecto para Distribución

```
mi_app/
├── pyproject.toml          ← metadatos + punto de entrada
├── README.md
├── LICENSE
├── requirements.txt        ← dependencias ancladas con hashes
├── .pre-commit-config.yaml
├── src/
│   └── mi_app/
│       ├── __init__.py
│       └── app.py          ← función main() — punto de entrada
├── tests/
│   └── test_app.py
└── build/
    └── mi_app.spec         ← spec auto-generado de PyInstaller
```

### Lab 16.2 — Punto de Entrada Seguro

```python
# src/mi_app/app.py
"""Punto de entrada principal de la aplicación."""

import logging
import sys
import os
from pathlib import Path


def configurar_logging() -> None:
    """Configura logging con nivel apropiado según el entorno."""
    nivel = logging.DEBUG if os.getenv("MI_APP_DEBUG") == "1" else logging.INFO
    logging.basicConfig(
        level=nivel,
        format="%(asctime)s %(levelname)-8s [%(name)s] %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )


def verificar_entorno() -> None:
    """Verifica precondiciones de seguridad antes de iniciar."""
    if sys.version_info < (3, 10):
        print(
            f"Error: Se requiere Python >= 3.10 (detectado: {sys.version})",
            file=sys.stderr,
        )
        sys.exit(1)

    # Verificar que no se ejecuta como root (NIST CM-7 — privilegio mínimo)
    if hasattr(os, "getuid") and os.getuid() == 0:
        print(
            "Advertencia: Ejecutando como root. "
            "Se recomienda ejecutar como usuario sin privilegios.",
            file=sys.stderr,
        )


def main() -> int:
    """Función main — punto de entrada registrado en pyproject.toml."""
    configurar_logging()
    verificar_entorno()

    logger = logging.getLogger("mi_app")
    logger.info("Iniciando mi_app v1.0.0")

    try:
        # Importar y lanzar la interfaz gráfica (import tardío)
        from mi_app.gui.app import iniciar
        iniciar()
        return 0
    except KeyboardInterrupt:
        logger.info("Aplicación cerrada por el usuario")
        return 0
    except Exception as e:
        logger.critical("Error fatal no recuperable: %s", e, exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
```

### Lab 16.3 — Spec de PyInstaller con Hardening

```python
# build/mi_app.spec
"""Configuración de PyInstaller generada con pyinstaller --name mi_app src/mi_app/app.py"""

block_cipher = None

a = Analysis(
    ["../src/mi_app/app.py"],
    pathex=["../src"],
    binaries=[],
    datas=[
        # Incluir archivos de datos no-Python necesarios
        # ("../src/mi_app/assets", "assets"),
    ],
    hiddenimports=[
        # Módulos que PyInstaller no detecta automáticamente
        "pydantic.v1",
        "cryptography.hazmat.primitives",
    ],
    hookspath=[],
    hooksconfig={},
    excludes=[
        # Excluir módulos innecesarios para reducir tamaño y superficie de ataque
        "tkinter.test",
        "unittest",
        "xmlrpc",
        "http.server",        # No incluir servidores HTTP en cliente de escritorio
        "ftplib",
        "telnetlib",          # Protocolos inseguros — CM-7 Mínima Funcionalidad
        "imaplib",
        "poplib",
        "smtplib",
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="mi_app",
    debug=False,           # Nunca True en distribución
    bootloader_ignore_signals=False,
    strip=True,            # Eliminar símbolos de debug — reduce tamaño y superficie
    upx=True,              # Compresión UPX
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,         # Sin ventana de consola (aplicación GUI)
    disable_windowed_traceback=True,  # No mostrar traceback al usuario final
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,   # Rellenar con Apple Developer ID en macOS
    entitlements_file=None,
)
```

### Lab 16.4 — Script de Build con Verificación de Integridad

```bash
#!/bin/bash
# build/build.sh — Pipeline de build reproducible con verificación de hash
set -euo pipefail

VERSION=$(python -c "import tomllib; f=open('pyproject.toml','rb'); d=tomllib.load(f); print(d['project']['version'])")
APP_NAME="mi_app"

echo "=== Build v${VERSION} ==="

# 1. Tests completos
echo "[1/5] Ejecutando tests..."
pytest tests/ --tb=short --cov=src --cov-fail-under=80 -q

# 2. Auditoría de seguridad
echo "[2/5] Bandit — análisis de seguridad..."
bandit -r src/ -c pyproject.toml --exit-zero

echo "[3/5] Safety — auditoría de CVEs..."
python -m safety check --full-report

# 3. PyInstaller
echo "[4/5] Generando ejecutable..."
pyinstaller build/mi_app.spec --distpath dist/ --workpath build/work --noconfirm

# 4. Hash de integridad del ejecutable
echo "[5/5] Generando checksums..."
cd dist/
sha256sum "${APP_NAME}" > "${APP_NAME}_v${VERSION}.sha256"
echo "SHA-256: $(cat ${APP_NAME}_v${VERSION}.sha256)"

echo ""
echo "✅ Build completado: dist/${APP_NAME} (v${VERSION})"
```

### Lab 16.5 — `requirements.txt` con Hashes (Supply Chain Security)

```bash
# Generar requirements.txt con hashes para verificación de integridad
pip-compile pyproject.toml --generate-hashes --output-file requirements.txt

# El resultado ancla versiones exactas y verifica hashes SHA-256:
# pydantic==2.6.4 \
#     --hash=sha256:a12345... \
#     --hash=sha256:b67890...
```

```
# requirements.txt (fragmento)
pydantic==2.6.4 \
    --hash=sha256:b8e5798cabc1abe5b4c15bb...
cryptography==42.0.5 \
    --hash=sha256:7c8e1d2a4b9f3...
```

---

## III. Ciberseguridad — Blue Team

| Riesgo                                 | Fallo común                                                                   | Mitigación                                                                          | Referencia                 |
| -------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------- |
| **Secretos hardcodeados en el bundle** | `API_KEY = "sk-live-..."` en código — descompilable con `uncompyle6`          | Variables de entorno o archivos de configuración externos; nunca secretos en código | CWE-798 · NIST IA-5        |
| **Ejecutar como root**                 | `sudo ./mi_app` o instalador que eleva privilegios innecesariamente           | Verificar `os.getuid() == 0` y advertir; aplicar principio de mínimo privilegio     | NIST CM-7 · CWE-250        |
| **Módulos peligrosos en el bundle**    | `http.server`, `telnetlib`, `xmlrpc.server` incluidos sin necesidad           | `excludes` en la spec de PyInstaller para eliminar módulos no usados                | NIST CM-7                  |
| **Sin verificación de integridad**     | Distribuir binario sin hash — atacante puede reemplazarlo                     | Publicar `sha256sum` junto al ejecutable; verificar antes de instalar               | NIST SI-7 · ENS [op.exp.8] |
| **Supply chain — deps sin anclar**     | `requirements.txt` sin hashes — versión maliciosa de una lib puede instalarse | `pip-compile --generate-hashes`; verificar hashes en CI antes del build             | NIST SA-10 · CWE-829       |
| **`debug=True` en distribución**       | `EXE(debug=True)` en la spec — traceback e info interna expuesta al usuario   | `debug=False` y `disable_windowed_traceback=True` siempre en builds de producción   | CWE-209                    |

---

## IV. Validación Spec-Driven — Módulo 16

```python
# validacion/modulo_16.py
from pydantic import BaseModel, Field, field_validator
from pathlib import Path
from typing import Annotated, Literal


class ConfiguracionBuild(BaseModel):
    """Valida los parámetros del pipeline de build antes de ejecutarlo."""

    nombre_app:    Annotated[str, Field(min_length=2, max_length=50, pattern=r'^[a-z_\-]+$')]
    version:       Annotated[str, Field(pattern=r'^\d+\.\d+\.\d+$')]
    modo:          Literal["onefile", "onedir"] = "onefile"
    cobertura_min: Annotated[int, Field(ge=60, le=100)] = 80
    plataforma:    Literal["linux", "macos", "windows"] = "linux"

    @field_validator("version")
    @classmethod
    def version_semver(cls, v: str) -> str:
        partes = [int(p) for p in v.split(".")]
        if any(p < 0 for p in partes):
            raise ValueError("Los componentes de versión deben ser >= 0")
        return v

    model_config = {"frozen": True}
```

---

## V. Referencia Rápida del Módulo 16

```
PyInstaller:
  pyinstaller src/app.py                      → básico (onedir)
  pyinstaller src/app.py --onefile            → binario único
  pyinstaller src/app.py --name mi_app        → nombre del ejecutable
  pyinstaller src/app.py --windowed           → sin consola (GUI)
  pyinstaller build/mi_app.spec               → desde spec file
  pyinstaller ... --strip --upx               → optimizar tamaño

Spec file — claves:
  Analysis(hiddenimports=[...])  → módulos no detectados
  Analysis(excludes=[...])       → excluir módulos no necesarios
  Analysis(datas=[...])          → incluir archivos de datos
  EXE(debug=False)               → producción
  EXE(console=False)             → sin ventana de consola

Distribución segura:
  sha256sum mi_app > mi_app.sha256   → generar hash
  sha256sum -c mi_app.sha256         → verificar hash
  pip-compile --generate-hashes      → hashes en requirements.txt

pyproject.toml — punto de entrada:
  [project.scripts]
  mi-app = "mi_app.app:main"

zipapp (alternativa sin extensiones nativas):
  python -m zipapp src/ --main "app:main" --output app.pyz --compress

Verificaciones antes de distribuir:
  ✅ Tests pasan con cobertura ≥ 80%
  ✅ Bandit: sin vulnerabilidades medium/high
  ✅ Safety: sin CVEs en dependencias
  ✅ debug=False en spec
  ✅ sha256sum publicado junto al binario
  ✅ Sin secretos en el código fuente
```

---

**Anterior:** [15 — Testing DevSecOps](./modulo-15-testing.md)
**Índice:** [← Volver al índice](./index.md)

---

## VI. Cierre del Manual — Recapitulación de Estándares

Esta colección de 16 módulos aplica de forma transversal:

| Estándar                                    | Módulos principales        |
| ------------------------------------------- | -------------------------- |
| **ISO 12207** — Ciclo de vida del software  | 07, 11, 15, 16             |
| **NIST SP 800-53** — Controles de seguridad | 01, 02, 05, 10, 13, 14     |
| **RGPD / LOPDGDD** — Protección de datos    | 10, 11, 14                 |
| **ENS** — Esquema Nacional de Seguridad     | 08, 10, 13, 16             |
| **CWE** — Debilidades de software comunes   | Toda la suite de Blue Team |
| **ACID / 3NF** — Integridad de datos        | 10, 11                     |

---

## VII. Métricas de Cumplimiento ENS/RGPD

| Control                                     | Referencia                 | Implementación en este módulo                                       | Estado |
| ------------------------------------------- | -------------------------- | ------------------------------------------------------------------- | ------ |
| Hash de integridad del ejecutable publicado | NIST SI-7 · ENS [op.exp.8] | `sha256sum` generado y publicado junto al binario en cada release   | ✅     |
| Módulos peligrosos excluidos del bundle     | NIST CM-7 · ENS [op.pl.1]  | `excludes` en spec: telnetlib, http.server, smtplib, xmlrpc         | ✅     |
| Sin secretos en código empaquetado          | RGPD Art. 25 · CWE-798     | Variables de entorno; `os.environ`; `.env` excluido del bundle      | ✅     |
| Ejecución sin privilegios de root           | NIST CM-7 · CWE-250        | `os.getuid() == 0` verificado en startup; advertencia si se detecta | ✅     |
| Dependencias con hashes en requirements.txt | NIST SA-10 · CWE-829       | `pip-compile --generate-hashes`; verificación en CI antes del build | ✅     |
| `debug=False` en toda distribución          | CWE-209 · ENS [mp.sw.1]    | `EXE(debug=False, disable_windowed_traceback=True)` obligatorio     | ✅     |

---

## VIII. Práctica Profesional

> **Escenario:** Una empresa distribuye una aplicación de escritorio Python a 200 empleados en Windows, macOS y Linux. El equipo de seguridad exige verificar la integridad del binario antes de la instalación y garantizar que ninguna versión maliciosa pueda instalarse (supply chain attack prevention).

**Requerimiento del cliente:**

- Hash SHA-256 publicado en la intranet junto a cada release
- Script de verificación que el instalador ejecuta automáticamente
- Instrucciones de verificación para el usuario final

**Script de verificación para usuarios finales:**

```bash
#!/bin/bash
# verificar_integridad.sh — ejecutar antes de instalar
set -euo pipefail

BINARIO="${1:?Especifica el binario: ./verificar_integridad.sh mi_app}"
HASH_FILE="${BINARIO}.sha256"

if [ ! -f "$HASH_FILE" ]; then
    echo "❌ ERROR: No se encontró el archivo de hash: $HASH_FILE"
    echo "   Descárgalo desde la intranet junto al binario."
    exit 1
fi

echo "🔍 Verificando integridad de: $BINARIO"
if sha256sum -c "$HASH_FILE" 2>/dev/null; then
    echo "✅ Integridad verificada. El binario no ha sido alterado."
else
    echo "❌ FALLO DE INTEGRIDAD: El binario puede haber sido modificado."
    echo "   NO instales este archivo. Notifica al equipo de seguridad."
    exit 2
fi
```

**Pipeline de release con publicación de hash:**

```bash
# build/release.sh — ejecutado por CI en cada tag de release
pyinstaller build/mi_app.spec --noconfirm --distpath dist/
cd dist/
sha256sum mi_app > mi_app.sha256
# Publicar ambos archivos juntos en la intranet/portal de descargas
scp mi_app mi_app.sha256 deploy@intranet:/var/www/releases/
```

\_ISO 12207 · NIST CSF 2.0 · ENS · RGPD
