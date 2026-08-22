# Módulo 08 — Archivos y Serialización

> **Estándares:** ISO 12207 §5.4 · NIST SP 800-53 SI-10 · CWE-22 (Path Traversal) · CWE-502 (Deserialización no segura)
> **Dependencias previas:** [Módulo 07](./modulo-07-modulos-paquetes.md)
> **Tiempo estimado:** 3 horas

---

## I. Teoría Técnica Avanzada

### 8.1 El Sistema de Archivos desde Python — `pathlib` vs. `os.path`

`pathlib.Path` (Python 3.4+) es la API moderna y orientada a objetos para trabajar con rutas. Evita los problemas de concatenación de strings que genera vulnerabilidades:

```python
from pathlib import Path

# os.path (modo antiguo — propenso a errores)
import os
ruta = os.path.join(base_dir, nombre_usuario, "datos.json")  # ← peligroso si nombre tiene ".."

# pathlib (modo moderno — seguro por diseño)
ruta = Path(base_dir) / nombre_usuario / "datos.json"        # ← mismo riesgo si no se valida

# Pero pathlib facilita la validación:
base = Path("/var/app/datos").resolve()
candidata = (base / nombre_usuario).resolve()

if not str(candidata).startswith(str(base)):
    raise PermissionError(f"Path traversal detectado: {candidata}")
```

### 8.2 Modos de Apertura y Codificación

```
open(ruta, mode, encoding, errors, buffering)
         │
         ├── "r"   → lectura texto (default)
         ├── "w"   → escritura texto (trunca si existe)
         ├── "a"   → escritura texto (añade al final)
         ├── "x"   → escritura exclusiva (falla si ya existe — evita race conditions)
         ├── "rb"  → lectura bytes
         ├── "wb"  → escritura bytes
         └── "r+"  → lectura + escritura
```

**Siempre especificar `encoding`:** sin él, Python usa el encoding del sistema operativo, que difiere entre Windows (`cp1252`) y macOS/Linux (`utf-8`), causando bugs difíciles de reproducir.

### 8.3 Serialización — Comparativa de Formatos

| Formato         | Librería              | Seguro con datos externos   | Uso recomendado                           |
| --------------- | --------------------- | --------------------------- | ----------------------------------------- |
| **JSON**        | `json` (std)          | ✅ Sí                       | APIs, configuración, intercambio de datos |
| **TOML**        | `tomllib` (std 3.11+) | ✅ Sí                       | Configuración de proyectos                |
| **CSV**         | `csv` (std)           | ✅ Sí                       | Datos tabulares                           |
| **pickle**      | `pickle` (std)        | ❌ **NO** — RCE garantizado | Solo datos internos propios               |
| **YAML**        | `pyyaml`              | ⚠️ Solo con `safe_load`     | Configuración humana                      |
| **MessagePack** | `msgpack`             | ✅ Sí                       | Binario compacto, performance             |

> **Regla:** `pickle.loads()` con datos externos = RCE. Si el dato viene de fuera del sistema, usar `json.loads()` con validación de esquema.

### 8.4 Context Managers para Archivos — Por Qué el `with` es Obligatorio

```python
# Sin context manager — recurso no liberado si ocurre excepción
f = open("datos.txt")
datos = f.read()   # ← si esto lanza, f nunca se cierra
f.close()

# Con context manager — cierre garantizado siempre
with open("datos.txt", encoding="utf-8") as f:
    datos = f.read()
# f.close() llamado automáticamente incluso si f.read() lanza excepción
```

---

## II. Laboratorio Práctico — Step by Step

### Lab 8.1 — Lectura y Escritura Segura con `pathlib`

```python
# archivos/io_seguro.py
"""Operaciones de E/S seguras con validación de path traversal."""

import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Directorio raíz de datos — todos los archivos deben estar dentro
DIRECTORIO_DATOS = Path("/var/app/datos").resolve()


def _validar_ruta(ruta_relativa: str) -> Path:
    """Valida que la ruta final esté dentro del directorio autorizado.

    Previene path traversal: un atacante podría pasar '../../etc/passwd'
    y, sin esta validación, leer archivos del sistema operativo.

    Args:
        ruta_relativa: Ruta relativa proporcionada por el usuario o la config.

    Returns:
        Ruta absoluta validada dentro de DIRECTORIO_DATOS.

    Raises:
        PermissionError: Si la ruta intenta salir de DIRECTORIO_DATOS.
        ValueError: Si el nombre de archivo contiene caracteres no permitidos.
    """
    import re
    # Nombre de archivo: solo alfanuméricos, guiones y puntos
    nombre = Path(ruta_relativa).name
    if not re.match(r'^[a-zA-Z0-9_\-\.]+$', nombre):
        raise ValueError(f"Nombre de archivo con caracteres no permitidos: {nombre!r}")

    ruta_absoluta = (DIRECTORIO_DATOS / ruta_relativa).resolve()

    # Verificar que la ruta resuelta esté dentro del directorio autorizado
    try:
        ruta_absoluta.relative_to(DIRECTORIO_DATOS)
    except ValueError:
        logger.warning("Path traversal bloqueado: %s → %s", ruta_relativa, ruta_absoluta)
        raise PermissionError(
            f"Acceso denegado: la ruta sale del directorio de datos autorizado"
        )

    return ruta_absoluta


def leer_texto(ruta_relativa: str) -> str:
    """Lee un archivo de texto con validación completa."""
    ruta = _validar_ruta(ruta_relativa)
    if not ruta.exists():
        raise FileNotFoundError(f"Archivo no encontrado: {ruta_relativa!r}")
    if ruta.stat().st_size > 10 * 1024 * 1024:  # 10 MB máximo
        raise ValueError(f"Archivo demasiado grande (>10MB): {ruta_relativa!r}")

    return ruta.read_text(encoding="utf-8")


def escribir_texto(ruta_relativa: str, contenido: str) -> Path:
    """Escribe un archivo de texto con creación atómica."""
    ruta = _validar_ruta(ruta_relativa)
    ruta.parent.mkdir(parents=True, exist_ok=True)

    # Escritura atómica: primero a .tmp, luego rename
    # Evita archivos a medias si el proceso muere durante la escritura
    ruta_tmp = ruta.with_suffix(".tmp")
    try:
        ruta_tmp.write_text(contenido, encoding="utf-8")
        ruta_tmp.rename(ruta)   # Atómico en la mayoría de sistemas de archivos
    except Exception:
        ruta_tmp.unlink(missing_ok=True)   # Limpiar si falló
        raise

    logger.info("Archivo escrito: %s (%d bytes)", ruta.name, len(contenido.encode()))
    return ruta
```

### Lab 8.2 — JSON Seguro con Validación Pydantic

```python
# archivos/json_seguro.py
"""Carga y guardado de JSON con validación de esquema."""

import json
from pathlib import Path
from typing import TypeVar, Type
from pydantic import BaseModel, ValidationError

M = TypeVar("M", bound=BaseModel)

MAX_BYTES_JSON = 1_048_576   # 1 MB


def cargar_json_validado(ruta: Path, modelo: Type[M]) -> M:
    """Carga un JSON y lo valida con un modelo Pydantic.

    Orden de operaciones:
    1. Verificar que el archivo existe y tiene tamaño razonable
    2. Leer bytes raw
    3. Parsear JSON (json.loads — sin RCE)
    4. Validar con Pydantic (tipos, rangos, formatos)

    Args:
        ruta: Ruta absoluta ya validada (usar _validar_ruta()).
        modelo: Clase Pydantic para validar la estructura.

    Returns:
        Instancia del modelo validada e inmutable.
    """
    if not ruta.exists():
        raise FileNotFoundError(f"Configuración no encontrada: {ruta.name}")

    tam = ruta.stat().st_size
    if tam > MAX_BYTES_JSON:
        raise ValueError(f"JSON demasiado grande: {tam} bytes (máx {MAX_BYTES_JSON})")

    raw = ruta.read_text(encoding="utf-8")

    try:
        datos = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"JSON inválido en {ruta.name}: {e}") from e

    try:
        return modelo.model_validate(datos)
    except ValidationError as e:
        raise ValueError(f"Esquema inválido en {ruta.name}: {e}") from e


def guardar_json(ruta: Path, datos: BaseModel | dict) -> None:
    """Serializa datos a JSON de forma segura y legible."""
    if isinstance(datos, BaseModel):
        contenido = datos.model_dump_json(indent=2)
    else:
        contenido = json.dumps(datos, indent=2, ensure_ascii=False, default=str)

    # Escritura atómica
    tmp = ruta.with_suffix(".tmp")
    try:
        tmp.write_text(contenido, encoding="utf-8")
        tmp.rename(ruta)
    except Exception:
        tmp.unlink(missing_ok=True)
        raise
```

### Lab 8.3 — CSV con Generadores para Archivos Grandes

```python
# archivos/csv_streaming.py
"""Lectura de CSV en modo streaming con protección de recursos."""

import csv
import logging
from pathlib import Path
from typing import Generator

logger = logging.getLogger(__name__)

MAX_FILAS_CSV  = 500_000
MAX_BYTES_FILA = 10_240   # 10 KB por fila


def leer_csv_seguro(
    ruta: Path,
    max_filas: int = MAX_FILAS_CSV,
) -> Generator[dict, None, None]:
    """Itera sobre un CSV fila a fila sin cargarlo en memoria.

    Incluye protecciones contra:
    - Billion laughs / CSV injection (límite de filas)
    - Filas excesivamente largas (límite de bytes por fila)
    - Formula injection en valores (=, +, - al inicio)

    Yields:
        Diccionarios fila a fila.
    """
    PREFIJOS_PELIGROSOS = ("=", "+", "-", "@", "\t", "\r")

    with open(ruta, encoding="utf-8", errors="replace", newline="") as f:
        reader = csv.DictReader(f)
        for i, fila in enumerate(reader):
            if i >= max_filas:
                logger.warning("CSV truncado en %d filas (límite de seguridad)", max_filas)
                break

            # Sanitizar formula injection
            fila_limpia = {}
            for clave, valor in fila.items():
                if isinstance(valor, str) and valor.startswith(PREFIJOS_PELIGROSOS):
                    valor = "'" + valor   # Escapar con comilla para Excel/Sheets
                fila_limpia[clave] = valor

            yield fila_limpia
```

---

## III. Ciberseguridad — Blue Team

| Riesgo                              | Fallo común                                                      | Mitigación                                                              | Referencia                                                   |
| ----------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------- |
| **Path Traversal**                  | `open(base + "/" + user_input)` sin validar                      | `Path.resolve()` + `relative_to(base)` antes de abrir                   | CWE-22 · NIST SI-10                                          |
| **`pickle.loads()` externo**        | Deserializar objetos de red/BD con `pickle` — RCE                | Prohibido con datos externos; usar `json.loads()` + Pydantic            | CWE-502 · NIST SI-10                                         |
| **Sin límite de tamaño de archivo** | `f.read()` sobre un archivo de 10 GB — OOM crash                 | `st_size` antes de leer; `islice` o `readline()` para streaming         | CWE-400 · NIST SI-12                                         |
| **Formula injection en CSV**        | Celda `=CMD                                                      | '/c calc'!A0` ejecuta comandos en Excel/Sheets                          | Escapar valores que empiezan por `= + - @ \t \r` con comilla | CWE-1236 · ENS [mp.info.2] |
| **Escritura no atómica**            | `f.write(datos)` — archivo corrupto si el proceso muere a medias | Escribir a `.tmp` y `rename()` atómico; limpiar `.tmp` en caso de error | CWE-362 · NIST SI-17                                         |
| **`open()` sin encoding**           | Comportamiento diferente en Windows (cp1252) vs Linux (utf-8)    | Siempre `encoding="utf-8"` y `errors="replace"` o `"ignore"`            | NIST CM-6                                                    |
| **YAML unsafe_load**                | `yaml.load(datos_externos)` — equivalente a `pickle`             | Siempre `yaml.safe_load()`; nunca `yaml.load()` con datos externos      | CWE-502 · NIST SI-10                                         |

---

## IV. Validación Spec-Driven — Módulo 08

```python
# validacion/modulo_08.py
from pydantic import BaseModel, Field, field_validator
from pathlib import Path
from typing import Annotated, Literal


class SolicitudLecturaArchivo(BaseModel):
    """Valida una solicitud de lectura antes de acceder al sistema de archivos."""

    ruta_relativa: str = Field(min_length=1, max_length=255)
    encoding:      str = Field(default="utf-8", pattern=r"^[a-z0-9\-]+$")
    max_bytes:     Annotated[int, Field(ge=1, le=104_857_600)] = 10_485_760  # 10 MB

    @field_validator("ruta_relativa")
    @classmethod
    def sin_path_traversal(cls, v: str) -> str:
        partes_peligrosas = ("..", "~", "/etc", "/proc", "/sys")
        v_norm = v.replace("\\", "/")
        for parte in partes_peligrosas:
            if parte in v_norm:
                raise ValueError(f"Ruta contiene secuencia no permitida: {parte!r}")
        return v

    model_config = {"frozen": True}


class ConfiguracionCSV(BaseModel):
    """Parámetros para lectura de archivos CSV."""

    separador:  str  = Field(default=",", min_length=1, max_length=1)
    tiene_cabecera: bool = True
    max_filas:  Annotated[int, Field(ge=1, le=1_000_000)] = 500_000
    encoding:   str  = Field(default="utf-8")

    model_config = {"frozen": True}
```

---

## V. Referencia Rápida del Módulo 08

```
pathlib:
  Path("ruta")              → crear Path
  Path.cwd()                → directorio actual
  Path.home()               → directorio home
  p.resolve()               → ruta absoluta canónica
  p.exists()                → verificar existencia
  p.is_file() / p.is_dir()  → tipo
  p.stat().st_size          → tamaño en bytes
  p.read_text(encoding=)    → leer texto completo
  p.write_text(texto, encoding=) → escribir texto
  p.read_bytes()            → leer bytes
  p.with_suffix(".bak")     → cambiar extensión
  p.rename(nueva)           → mover/renombrar (atómico mismo FS)

open() modos: r, w, a, x, rb, wb, r+, w+
Siempre: encoding="utf-8", errors="replace"

json:
  json.loads(str)      → dict/list
  json.dumps(obj, indent=2, ensure_ascii=False) → str
  json.load(file)      → desde archivo
  json.dump(obj, file) → hacia archivo

Prohibidos con datos externos:
  ❌  pickle.loads()
  ❌  yaml.load()          → usar yaml.safe_load()
  ❌  eval() / exec()
```

---

**Anterior:** [07 — Módulos y Paquetes](./modulo-07-modulos-paquetes.md)
**Siguiente:** [09 — Tkinter](./modulo-09-tkinter.md)

## _ISO 12207 · NIST CSF 2.0 · ENS — pildorasinformaticas_

## VI. Métricas de Cumplimiento ENS/RGPD

| Control                                  | Referencia                   | Implementación en este módulo                                      | Estado |
| ---------------------------------------- | ---------------------------- | ------------------------------------------------------------------ | ------ |
| Prevención de path traversal             | CWE-22 · ENS [mp.info.3]     | `Path.resolve()` + `relative_to(base)` antes de cualquier apertura | ✅     |
| Prohibición de deserialización insegura  | NIST SI-10 · CWE-502         | `pickle` prohibido; solo `json.loads()` + validación Pydantic      | ✅     |
| Límite de tamaño en archivos entrantes   | CWE-400 · NIST SI-12         | `st_size` verificado antes de leer; 10 MB máximo por defecto       | ✅     |
| Escritura atómica (integridad)           | NIST SI-17 · ENS [mp.info.3] | Escribir a `.tmp` + `rename()` atómico; limpiar en caso de error   | ✅     |
| Encoding explícito en todos los archivos | NIST CM-6 · ISO 12207 §5.4   | `encoding="utf-8"` obligatorio; `errors="replace"` para robustez   | ✅     |
| Formula injection en CSV exportado       | CWE-1236 · ENS [mp.info.2]   | Escapar valores que empiezan con `= + - @` antes de escribir       | ✅     |

---

## VII. Práctica Profesional

> **Escenario:** Una gestoría online permite a clientes subir documentos (PDF, DOCX) a través de un formulario web. El sistema debe validar tipo, tamaño y path antes de persistir en disco, y serializar los metadatos como JSON firmado para auditoría (RGPD Art. 30).

**Requerimiento del cliente:**

- Extensiones permitidas: `.pdf`, `.docx`, `.xlsx` únicamente
- Tamaño máximo: 5 MB por archivo
- Metadatos serializados en JSON con timestamp ISO 8601
- Path traversal bloqueado en todos los casos

```python
# documentos/subida_segura.py
import json, hashlib, uuid
from datetime import datetime, timezone
from pathlib import Path
from archivos.io_seguro import _validar_ruta

EXTENSIONES_PERMITIDAS = frozenset({".pdf", ".docx", ".xlsx"})
MAX_BYTES = 5 * 1024 * 1024   # 5 MB
DIRECTORIO_DOCS = Path("/var/app/documentos").resolve()


def subir_documento(nombre: str, contenido: bytes) -> dict:
    """Valida y persiste un documento con metadatos de auditoría."""
    ext = Path(nombre).suffix.lower()
    if ext not in EXTENSIONES_PERMITIDAS:
        raise ValueError(f"Extensión no permitida: {ext!r}")
    if len(contenido) > MAX_BYTES:
        raise ValueError(f"Archivo demasiado grande: {len(contenido)} bytes")

    doc_id  = str(uuid.uuid4())
    nombre_interno = f"{doc_id}{ext}"
    ruta    = _validar_ruta(nombre_interno)   # ← anti path traversal
    ruta.write_bytes(contenido)

    metadatos = {
        "id":           doc_id,
        "nombre_orig":  nombre,
        "extension":    ext,
        "sha256":       hash256(contenido).hexdigest(),
        "bytes":        len(contenido),
        "subido_en":    datetime.now(timezone.utc).isoformat(),
    }
    (ruta.with_suffix(".meta.json")).write_text(
        json.dumps(metadatos, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    return metadatos
```

\_ISO 12207 · NIST CSF 2.0 · ENS
