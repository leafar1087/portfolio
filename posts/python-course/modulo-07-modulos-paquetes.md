# Módulo 07 — Módulos y Paquetes

> **Estándares:** ISO 12207 §5.2 · NIST SP 800-53 CM-7 (Mínima Funcionalidad) · CWE-114 (Importación de módulo no confiable)
> **Dependencias previas:** [Módulo 06](./modulo-06-poo.md)
> **Tiempo estimado:** 2–3 horas

---

## I. Teoría Técnica Avanzada

### 7.1 El Sistema de Importación de CPython — `sys.modules` como Caché

Cuando se ejecuta `import math`, CPython sigue este flujo exacto:

```
import math
     │
     ▼
1. Busca en sys.modules["math"]     ← caché en memoria
     │ encontrado → devuelve objeto
     │ no encontrado ↓
     ▼
2. Recorre sys.meta_path (finders)
     │ PathFinder busca en sys.path
     ▼
3. Localiza el archivo (.py, .pyc, .so, paquete/)
     ▼
4. Ejecuta el código del módulo (UNA SOLA VEZ)
     ▼
5. Almacena el resultado en sys.modules["math"]
     ▼
6. Vincula el nombre "math" en el namespace del llamador
```

**Implicación de seguridad:** `sys.modules` puede ser manipulado en tiempo de ejecución. Esto es una técnica de ataque real: _module shadowing_.

```python
import sys

# Ataque: reemplazar el módulo hashlib por uno malicioso
# import hashlib; sys.modules["hashlib"] = modulo_falso
# Cualquier código que haga "import hashlib" después recibirá el falso

# Mitigación: importar y verificar la integridad antes de confiar
import hashlib
_hashlib = sys.modules["hashlib"]   # Guardar referencia antes de que alguien lo reemplace
```

### 7.2 `__init__.py` — El Control de la API Pública

El archivo `__init__.py` define qué exporta un paquete. Su diseño determina la **API pública** del módulo y es crítico para la mantenibilidad:

```python
# paquete/__init__.py

# Forma 1: re-exportar selectivamente (API mínima — CM-7 Mínima Funcionalidad)
from .modelos import Usuario, Producto
from .servicios import ServicioUsuarios
from .excepciones import ErrorDominio, ErrorValidacion

# Definir __all__ controla lo que "from paquete import *" expone
__all__ = [
    "Usuario",
    "Producto",
    "ServicioUsuarios",
    "ErrorDominio",
    "ErrorValidacion",
]
# Todo lo no listado en __all__ se considera privado por convención
```

### 7.3 Importaciones Relativas vs. Absolutas

```python
# Dentro del paquete mi_app/

# ABSOLUTA: ruta completa desde la raíz del proyecto
from mi_app.modelos import Usuario

# RELATIVA: relativa al módulo actual
from .modelos import Usuario      # mismo directorio
from ..utils import formato       # directorio padre
from ..bd.repositorios import RepositorioBase   # subpaquete hermano
```

**Regla de estilo (PEP 8):** usar importaciones absolutas para código que será reutilizado por terceros; relativas para referencias _internas_ al paquete.

### 7.4 Namespace Packages (Python 3.3+) — Sin `__init__.py`

Un directorio sin `__init__.py` es un **namespace package**: Python lo reconoce como paquete pero no ejecuta ningún código de inicialización. Útil para repositorios monorepo:

```
empresa/
├── modulo_a/   ← Sin __init__.py → namespace package
│   └── core.py
└── modulo_b/   ← Sin __init__.py → namespace package
    └── utils.py
```

---

## II. Laboratorio Práctico — Step by Step

### Lab 7.1 — Estructura de Paquete Profesional

```
src/
└── mi_app/
    ├── __init__.py          ← API pública del paquete
    ├── modelos/
    │   ├── __init__.py
    │   ├── usuario.py
    │   └── producto.py
    ├── servicios/
    │   ├── __init__.py
    │   ├── usuarios.py
    │   └── productos.py
    ├── repositorios/
    │   ├── __init__.py
    │   ├── base.py          ← ABC RepositorioBase
    │   ├── memoria.py
    │   └── sqlite.py
    ├── excepciones/
    │   ├── __init__.py
    │   └── dominio.py
    └── utils/
        ├── __init__.py
        ├── validacion.py
        └── seguridad.py
```

### Lab 7.2 — `__init__.py` con Inicialización Segura

```python
# src/mi_app/__init__.py
"""Paquete principal de mi_app.

Expone la API pública del sistema. Todo lo no listado en __all__
es un detalle de implementación y puede cambiar sin previo aviso.
"""

import logging
import sys

__version__ = "1.0.0"
__author__  = "Equipo de Desarrollo"

# Verificar versión mínima de Python en la inicialización del paquete
if sys.version_info < (3, 10):
    raise RuntimeError(
        f"mi_app requiere Python ≥ 3.10 (tienes {sys.version_info.major}.{sys.version_info.minor})"
    )

# Configurar logging básico del paquete (sin handlers — el usuario los configura)
logging.getLogger(__name__).addHandler(logging.NullHandler())

# API pública — importaciones tardías para evitar importar todo al inicio
from .modelos.usuario   import Usuario
from .modelos.producto  import Producto
from .excepciones.dominio import ErrorDominio, ErrorValidacion

__all__ = [
    "__version__",
    "Usuario",
    "Producto",
    "ErrorDominio",
    "ErrorValidacion",
]
```

### Lab 7.3 — `importlib` Seguro para Carga Dinámica

```python
# utils/cargador_plugins.py
"""Carga plugins dinámicamente con lista blanca estricta."""

import importlib
import importlib.util
import logging
from pathlib import Path
from types import ModuleType

logger = logging.getLogger(__name__)

# Lista blanca de módulos cargables dinámicamente
PLUGINS_AUTORIZADOS: frozenset[str] = frozenset({
    "mi_app.plugins.exportador_csv",
    "mi_app.plugins.exportador_json",
    "mi_app.plugins.exportador_excel",
})


def cargar_plugin(nombre_modulo: str) -> ModuleType:
    """Carga un plugin verificando que está en la lista blanca.

    Args:
        nombre_modulo: Nombre completo del módulo (e.g. 'mi_app.plugins.exportador_csv').

    Returns:
        Módulo Python cargado.

    Raises:
        ValueError: Si el módulo no está autorizado.
        ImportError: Si el módulo no puede cargarse.
    """
    # Validar contra la lista blanca ANTES de intentar importar
    if nombre_modulo not in PLUGINS_AUTORIZADOS:
        logger.warning("Intento de carga de plugin no autorizado: %r", nombre_modulo)
        raise ValueError(
            f"Plugin {nombre_modulo!r} no está en la lista de plugins autorizados"
        )

    try:
        modulo = importlib.import_module(nombre_modulo)
        logger.info("Plugin cargado: %s", nombre_modulo)
        return modulo
    except ImportError as e:
        logger.error("Error cargando plugin autorizado %r: %s", nombre_modulo, e)
        raise


def inspeccionar_modulo(modulo: ModuleType) -> dict:
    """Devuelve metadatos de un módulo cargado para auditoría."""
    return {
        "nombre":    modulo.__name__,
        "archivo":   getattr(modulo, "__file__", "built-in"),
        "version":   getattr(modulo, "__version__", "sin versión"),
        "exporta":   getattr(modulo, "__all__", []),
    }
```

### Lab 7.4 — `pyproject.toml` — Paquete Redistribuible

```toml
# pyproject.toml
[build-system]
requires      = ["hatchling"]
build-backend = "hatchling.build"

[project]
name        = "mi-app"
version     = "1.0.0"
description = "Aplicación Python con Security-by-Design"
readme      = "README.md"
license     = { file = "LICENSE" }
requires-python = ">=3.10"

authors = [{ name = "Equipo de Desarrollo" }]

dependencies = [
    "pydantic>=2.6",
    "python-dotenv>=1.0",
    "bcrypt>=4.1",
    "cryptography>=42.0",
]

[project.optional-dependencies]
dev  = ["pytest>=8.0", "mypy>=1.10", "bandit>=1.7", "pre-commit>=3.7"]
docs = ["mkdocs>=1.5", "mkdocs-material>=9.5"]

[tool.hatch.build.targets.wheel]
packages = ["src/mi_app"]

[tool.mypy]
python_version        = "3.12"
strict                = true
ignore_missing_imports = true

[tool.bandit]
exclude_dirs = ["tests", ".venv"]
```

---

## III. Ciberseguridad — Blue Team

| Riesgo                                        | Fallo común                                                                   | Mitigación                                                                         | Referencia                 |
| --------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------- |
| **Module shadowing**                          | Un archivo local `logging.py` o `os.py` sombrea el módulo std                 | Nunca nombrar archivos propios igual que módulos estándar; usar nombres de dominio | CWE-114 · NIST CM-7        |
| **Carga dinámica sin whitelist**              | `importlib.import_module(usuario_input)` sin validar                          | Whitelist `frozenset` de módulos permitidos antes de importar                      | CWE-114 · NIST CM-7        |
| **`__init__.py` que expone innecesariamente** | Re-exportar TODO desde el `__init__` — principio de mínima exposición violado | Usar `__all__` explícito; exponer solo la API pública mínima                       | NIST CM-7 · ISO 12207 §5.2 |
| **Dependencias no ancladas**                  | `"requests"` sin versión en `dependencies` — actualizaciones silenciosas      | Fijar versiones con rangos seguros: `"requests>=2.31,<3.0"`                        | NIST SA-10                 |
| **`sys.modules` manipulable**                 | Código de tests que parchea `sys.modules` sin limpiar después                 | Usar `unittest.mock.patch` que restaura automáticamente al salir del `with`        | NIST SI-7                  |

---

## IV. Validación Spec-Driven — Módulo 07

```python
# validacion/modulo_07.py
from pydantic import BaseModel, Field, field_validator
from typing import Annotated


class NombreModulo(BaseModel):
    """Valida un nombre de módulo Python antes de cargarlo dinámicamente."""

    nombre: Annotated[str, Field(min_length=3, max_length=100)]

    @field_validator("nombre")
    @classmethod
    def formato_modulo_python(cls, v: str) -> str:
        import re
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_.]*$', v):
            raise ValueError(
                f"Nombre de módulo inválido: {v!r}. "
                "Solo letras, números, guiones bajos y puntos."
            )
        if v.startswith(".") or v.endswith("."):
            raise ValueError("El nombre no puede empezar o terminar con punto")
        return v

    model_config = {"frozen": True}
```

---

## V. Referencia Rápida del Módulo 07

```
Importaciones:
  import modulo                     → importa el módulo
  import modulo as alias            → con alias
  from modulo import nombre         → importa un nombre específico
  from modulo import *              → importa __all__ (evitar en producción)
  from . import modulo              → relativa (mismo paquete)
  from .. import modulo             → relativa (paquete padre)

Inspección:
  sys.modules                       → caché de módulos cargados
  importlib.import_module(nombre)   → importación dinámica
  importlib.reload(modulo)          → recargar (desarrollo)
  dir(modulo)                       → nombres exportados
  vars(modulo)                      → namespace completo

pyproject.toml clave:
  requires-python = ">=3.10"
  dependencies = ["pydantic>=2.6"]
  [project.optional-dependencies] dev = [...]

Reglas:
  ✅ __all__ explícito en __init__.py
  ✅ Nombres de archivo distintos a módulos estándar
  ✅ Whitelist antes de importlib.import_module
  ✅ Versiones ancladas en dependencies
```

---

## V. Comunicaciones HTTP Seguras — `httpx` y TLS

### 7.5 Cliente HTTP Hardened con `httpx`

`requests` es la librería HTTP más usada en Python, pero `httpx` es su sucesor moderno con soporte HTTP/2, timeouts granulares y API asíncrona. Ambas deben configurarse cuidadosamente para entornos de producción:

```python
# http/cliente_seguro.py
"""Cliente HTTP hardened para APIs externas (Supabase, Cloudflare, etc.)."""

import httpx
import logging
from functools import lru_cache

logger = logging.getLogger("http.cliente")

# Timeouts granulares (en segundos):
# - connect: tiempo para establecer la conexión TCP
# - read:    tiempo entre paquetes de datos
# - write:   tiempo para enviar el request body
# - pool:    tiempo de espera por una conexión libre del pool
TIMEOUTS = httpx.Timeout(connect=5.0, read=30.0, write=10.0, pool=5.0)


@lru_cache(maxsize=1)
def obtener_cliente_supabase(url: str, anon_key: str) -> httpx.Client:
    """Singleton del cliente HTTP con configuración de seguridad.

    Configuraciones críticas:
    - verify=True  → validación TLS obligatoria (NUNCA False en producción)
    - timeout      → timeout explícito para evitar conexiones colgadas (DoS)
    - http2=True   → reduce latencia con multiplexación de conexiones
    - limits        → limita conexiones para evitar agotamiento de recursos
    """
    return httpx.Client(
        base_url=url,
        headers={
            "apikey":        anon_key,
            "Authorization": f"Bearer {anon_key}",
            "Content-Type":  "application/json",
            "Accept":        "application/json",
        },
        verify=True,         # TLS obligatorio — ENS [mp.com.2]
        http2=True,
        timeout=TIMEOUTS,
        limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
        follow_redirects=False,  # No seguir redirects automáticamente
    )


def get_json(cliente: httpx.Client, endpoint: str, params: dict | None = None) -> dict:
    """Petición GET con manejo explícito de errores HTTP."""
    try:
        r = cliente.get(endpoint, params=params)
        r.raise_for_status()   # Lanza HTTPStatusError en 4xx/5xx
        return r.json()
    except httpx.TimeoutException as e:
        logger.error("Timeout en GET %s: %s", endpoint, e)
        raise ConnectionError(f"Timeout al conectar con {endpoint}") from e
    except httpx.HTTPStatusError as e:
        logger.warning("HTTP %d en GET %s", e.response.status_code, endpoint)
        raise
    except httpx.RequestError as e:
        logger.error("Error de red en GET %s: %s", endpoint, e)
        raise ConnectionError(f"Error de red: {e}") from e
```

**Tabla comparativa de configuraciones:**

| Parámetro          | Valor incorrecto | Valor correcto                | Riesgo mitigado                    |
| ------------------ | ---------------- | ----------------------------- | ---------------------------------- |
| `verify`           | `False`          | `True`                        | MITM — CWE-295                     |
| `timeout`          | Sin timeout      | `Timeout(connect=5, read=30)` | DoS por conexión colgada — CWE-400 |
| `follow_redirects` | `True`           | `False`                       | SSRF redirect — CWE-918            |
| `max_connections`  | Sin límite       | `20`                          | Resource exhaustion — CWE-400      |

---

## VI. Métricas de Cumplimiento ENS/RGPD

| Control                                    | Referencia                 | Implementación en este módulo                                        | Estado |
| ------------------------------------------ | -------------------------- | -------------------------------------------------------------------- | ------ |
| TLS obligatorio en comunicaciones externas | ENS [mp.com.2] · NIST SC-8 | `verify=True` en todos los clientes HTTP; prohibido `verify=False`   | ✅     |
| Whitelist de módulos dinámicos             | NIST CM-7 · CWE-114        | `frozenset` de módulos permitidos antes de `importlib.import_module` | ✅     |
| API pública mínima                         | NIST CM-7 · ISO 12207 §5.2 | `__all__` explícito; solo exponer lo necesario                       | ✅     |
| Dependencias con versiones ancladas        | NIST SA-10 · ENS [op.pl.2] | `pyproject.toml` con rangos seguros `"httpx>=0.27,<1.0"`             | ✅     |
| Timeout en todas las llamadas externas     | NIST SI-12 · CWE-400       | `httpx.Timeout` granular (connect/read/write/pool)                   | ✅     |

---

## VII. Práctica Profesional

> **Escenario:** Un portal SaaS necesita un cliente HTTP reutilizable para llamar a la API REST de Supabase desde múltiples módulos. El equipo de seguridad exige: TLS validado, timeouts explícitos, rate limiting y logging de cada petición fallida.

**Requerimiento del cliente:**

- Singleton del cliente (sin recrear conexiones en cada request)
- Timeout de conexión: 5s / lectura: 30s
- Log estructurado en cada error HTTP con código + endpoint
- Sin `verify=False` en ningún entorno (incluido staging)

```python
# Uso correcto del cliente en cualquier módulo de la app:
import os
from http.cliente_seguro import obtener_cliente_supabase, get_json

cliente = obtener_cliente_supabase(
    url=os.environ["SUPABASE_URL"],
    anon_key=os.environ["SUPABASE_ANON_KEY"],
)

# La gestión de errores de red está centralizada en get_json()
usuarios = get_json(cliente, "/rest/v1/usuarios", params={"activo": "eq.true"})
```

\_ISO 12207 · NIST CSF 2.0 · ENS
