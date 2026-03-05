# Módulo 05 — Manejo de Excepciones

> **Estándares:** ISO 12207 §5.4 · NIST SP 800-53 SI-11 · CWE-755 (Manejo inadecuado de excepciones)
> **Dependencias previas:** [Módulo 04](./modulo-04-generadores.md)
> **Tiempo estimado:** 3 horas

---

## I. Teoría Técnica Avanzada

### 5.1 La Jerarquía de Excepciones en CPython

Las excepciones son **clases**; la herencia determina cuáles se capturan:

```
BaseException
├── SystemExit                  ← sys.exit() — no capturar salvo limpieza
├── KeyboardInterrupt           ← Ctrl+C — no capturar salvo limpieza
├── GeneratorExit               ← gen.close() — no capturar
└── Exception                  ← RAÍZ de las excepciones de aplicación
    ├── StopIteration           ← iteradores agotados
    ├── ArithmeticError
    │   ├── ZeroDivisionError
    │   └── OverflowError
    ├── LookupError
    │   ├── IndexError          ← lista[i] fuera de rango
    │   └── KeyError            ← dict['clave'] inexistente
    ├── OSError (IOError)
    │   ├── FileNotFoundError
    │   └── PermissionError
    ├── ValueError              ← valor correcto de tipo pero incorrecto de semántica
    ├── TypeError               ← tipo incorrecto
    └── RuntimeError
        └── RecursionError
```

> **Regla de oro:** capturar siempre la excepción más específica posible. `except Exception` como captura general debe limitarse al nivel más alto de la aplicación para logging y terminación ordenada.

### 5.2 El Flujo `try/except/else/finally`

```python
try:
    resultado = operacion_riesgosa()
except ValueError as e:
    # Se ejecuta SI se lanza ValueError en el try
    manejar_valor_invalido(e)
except (TypeError, KeyError) as e:
    # Se ejecuta SI se lanza TypeError O KeyError
    manejar_tipo_o_clave(e)
else:
    # Se ejecuta SOLO SI el try terminó SIN excepción
    # Aquí va el código que depende del éxito del try
    usar_resultado(resultado)
finally:
    # Se ejecuta SIEMPRE — con o sin excepción
    # Limpieza de recursos: cerrar archivos, conexiones, etc.
    limpiar_recursos()
```

**Por qué `else` importa en seguridad:**

```python
# Sin else: el código post-try puede ejecutarse aunque hubo excepción parcial
try:
    conexion = abrir_bd()
    datos = leer_datos(conexion)
    procesar(datos)   # ← ¿Se ejecuta si falla leer_datos()? Depende del except
except Exception:
    pass

# Con else: separación clara entre "si tuvo éxito" y "limpiar de todas formas"
try:
    conexion = abrir_bd()
    datos = leer_datos(conexion)
except OSError as e:
    logger.error("Error de BD: %s", e)
else:
    procesar(datos)    # Solo se ejecuta si NO hubo excepción
finally:
    conexion.close()   # Se ejecuta SIEMPRE
```

### 5.3 Excepciones Personalizadas con Contexto

```python
class ErrorDominio(Exception):
    """Excepción base del dominio de la aplicación."""
    pass

class ErrorValidacion(ErrorDominio):
    """Dato inválido según las reglas de negocio."""

    def __init__(self, campo: str, valor, motivo: str) -> None:
        self.campo  = campo
        self.valor  = valor
        self.motivo = motivo
        super().__init__(f"[{campo}] {motivo}: {valor!r}")

class ErrorAutenticacion(ErrorDominio):
    """Fallo de autenticación o autorización."""
    pass

class ErrorConexionBD(ErrorDominio):
    """Fallo de conectividad con la base de datos."""

    def __init__(self, mensaje: str, intentos: int = 1) -> None:
        self.intentos = intentos
        super().__init__(f"Error BD tras {intentos} intento(s): {mensaje}")
```

### 5.4 Encadenamiento de Excepciones — `raise from`

```python
def obtener_usuario(uid: str) -> dict:
    try:
        return bd.buscar(uid)
    except KeyError as e:
        # raise ... from ... enlaza causalmente las excepciones
        raise ErrorDominio(f"Usuario {uid!r} no encontrado") from e
        # El traceback mostrará: "The above exception was the direct cause of..."
```

---

## II. Laboratorio Práctico — Step by Step

### Lab 5.1 — Jerarquía de Excepciones del Dominio

```python
# excepciones/dominio.py
"""Excepciones del dominio con contexto estructurado."""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


class ErrorDominio(Exception):
    """Raíz de todas las excepciones de la aplicación."""
    pass


@dataclass
class DetalleValidacion:
    campo:  str
    valor:  Any
    motivo: str
    timestamp: datetime = field(default_factory=datetime.utcnow)


class ErrorValidacion(ErrorDominio):
    """Violación de una regla de negocio o de esquema."""

    def __init__(self, detalles: list[DetalleValidacion]) -> None:
        self.detalles = detalles
        resumen = "; ".join(f"{d.campo}: {d.motivo}" for d in detalles)
        super().__init__(f"Error de validación: {resumen}")

    @classmethod
    def de_campo(cls, campo: str, valor: Any, motivo: str) -> "ErrorValidacion":
        """Constructor de conveniencia para un único campo."""
        return cls([DetalleValidacion(campo, valor, motivo)])


class ErrorAutenticacion(ErrorDominio):
    """Credenciales inválidas o sesión expirada."""
    CODIGO_HTTP = 401


class ErrorAutorizacion(ErrorDominio):
    """Sin permisos para la acción solicitada."""
    CODIGO_HTTP = 403


class ErrorRecursoNoEncontrado(ErrorDominio):
    """Recurso solicitado no existe en el sistema."""
    CODIGO_HTTP = 404

    def __init__(self, tipo_recurso: str, identificador: Any) -> None:
        self.tipo     = tipo_recurso
        self.id       = identificador
        super().__init__(f"{tipo_recurso} no encontrado: {identificador!r}")


class ErrorConexionExterna(ErrorDominio):
    """Fallo de conectividad con un servicio externo (BD, API, etc.)."""

    def __init__(self, servicio: str, causa: Exception, intentos: int = 1) -> None:
        self.servicio = servicio
        self.intentos = intentos
        super().__init__(f"Error conectando a {servicio!r} tras {intentos} intento(s)")
        self.__cause__ = causa
```

### Lab 5.2 — Context Manager para Manejo Seguro de Recursos

```python
# excepciones/contextos.py
"""Context managers para gestión segura de recursos con trazabilidad de errores."""

import logging
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

from .dominio import ErrorConexionExterna

logger = logging.getLogger(__name__)


@contextmanager
def conexion_bd(ruta: Path) -> Generator[sqlite3.Connection, None, None]:
    """Gestiona una conexión SQLite con rollback automático y logging de errores.

    Uso:
        with conexion_bd(Path("app.db")) as conn:
            conn.execute("INSERT INTO ...")
        # Si el bloque termina sin error → commit automático
        # Si hay excepción → rollback + excepción re-lanzada
    """
    conn: sqlite3.Connection | None = None
    try:
        conn = sqlite3.connect(ruta, detect_types=sqlite3.PARSE_DECLTYPES)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA journal_mode = WAL")
        yield conn
        conn.commit()
        logger.debug("BD: commit exitoso en %s", ruta.name)

    except sqlite3.IntegrityError as e:
        if conn:
            conn.rollback()
        logger.warning("BD: IntegrityError — rollback: %s", e)
        raise   # Re-lanzar para que el llamador la gestione

    except sqlite3.Error as e:
        if conn:
            conn.rollback()
        logger.error("BD: error inesperado — rollback: %s", e)
        raise ErrorConexionExterna("SQLite", e) from e

    finally:
        if conn:
            conn.close()


@contextmanager
def suprimir_con_log(*tipos_excepcion: type[Exception], logger_name: str = __name__):
    """Suprime excepciones específicas registrándolas en el logger.

    SOLO usar en operaciones opcionales donde el fallo es aceptable.
    Nunca suprimir excepciones en el path crítico de la aplicación.
    """
    log = logging.getLogger(logger_name)
    try:
        yield
    except tipos_excepcion as e:
        log.warning("Excepción suprimida intencionalmente (no crítica): %s: %s",
                    type(e).__name__, e)
```

### Lab 5.3 — Hardening contra Inyección de Dependencias

```python
# excepciones/hardening.py
"""Carga segura de módulos y deserialización de datos externos."""

import importlib
import json
import logging
from typing import Any

logger = logging.getLogger("seguridad.dependencias")

# Whitelist de módulos autorizados (frozenset es inmutable y eficiente para lookup)
MODULOS_PERMITIDOS: frozenset[str] = frozenset({
    "math",
    "statistics",
    "decimal",
    "fractions",
    "datetime",
    "collections",
    "functools",
})


def cargar_modulo_seguro(nombre_modulo: str):
    """Carga un módulo Python solo si está en la lista blanca.

    Riesgo mitigado: sin esta validación, un input externo podría cargar
    `os`, `subprocess`, `socket` — módulos con acceso al sistema operativo.

    Args:
        nombre_modulo: Nombre del módulo Python a cargar.

    Returns:
        El módulo cargado.

    Raises:
        ValueError: Si el módulo no está en la lista blanca.
        ImportError: Si el módulo no puede importarse (log automático).
    """
    if nombre_modulo not in MODULOS_PERMITIDOS:
        logger.warning(
            "Intento de carga de módulo no autorizado: %r", nombre_modulo
        )
        raise ValueError(
            f"Módulo {nombre_modulo!r} no permitido. "
            f"Lista blanca: {sorted(MODULOS_PERMITIDOS)}"
        )
    try:
        return importlib.import_module(nombre_modulo)
    except ImportError as e:
        logger.error("Error importando módulo permitido %r: %s", nombre_modulo, e)
        raise


ESQUEMA_MINIMO = frozenset({"tipo", "version", "datos"})

def deserializar_seguro(raw_json: str) -> dict:
    """Deserializa JSON con validación de esquema mínimo.

    Evita el uso de pickle.loads() con datos externos (RCE garantizado).
    json.loads() solo puede construir tipos primitivos de Python.

    Args:
        raw_json: Cadena JSON recibida del exterior.

    Returns:
        Diccionario Python validado.

    Raises:
        ValueError: Si el JSON es inválido o no cumple el esquema mínimo.
    """
    if not isinstance(raw_json, str):
        raise ValueError(f"Se esperaba str, no {type(raw_json).__name__!r}")
    if len(raw_json) > 1_048_576:  # 1 MB máximo
        raise ValueError("Payload demasiado grande (>1MB)")

    try:
        datos = json.loads(raw_json)
    except json.JSONDecodeError as e:
        raise ValueError(f"JSON inválido: {e}") from e

    if not isinstance(datos, dict):
        raise ValueError(f"Se esperaba un objeto JSON, no {type(datos).__name__!r}")

    campos_faltantes = ESQUEMA_MINIMO - datos.keys()
    if campos_faltantes:
        raise ValueError(f"Campos obligatorios ausentes: {campos_faltantes}")

    return datos
```

### Lab 5.4 — Reintentos con Backoff Exponencial

```python
# excepciones/reintentos.py
"""Decorador de reintentos con backoff exponencial para operaciones externas."""

import functools
import logging
import time
from typing import Callable, TypeVar

F = TypeVar("F", bound=Callable)
logger = logging.getLogger(__name__)


def reintentar(
    *excepciones: type[Exception],
    veces: int = 3,
    pausa: float = 1.0,
    exponencial: bool = True,
) -> Callable[[F], F]:
    """Reintenta una función si ocurre alguna de las excepciones indicadas.

    Args:
        *excepciones: Tipos de excepción que activan el reintento.
        veces: Número máximo de intentos (incluye el primero).
        pausa: Pausa base en segundos entre intentos.
        exponencial: Si True, la pausa se duplica en cada intento.

    Example:
        @reintentar(ConnectionError, OSError, veces=3, pausa=0.5)
        def consultar_api(url: str) -> dict:
            ...
    """
    if not excepciones:
        raise ValueError("Especifica al menos una excepción para reintentar")
    if veces < 1:
        raise ValueError(f"'veces' debe ser >= 1: {veces}")

    def decorador(func: F) -> F:
        @functools.wraps(func)
        def envoltura(*args, **kwargs):
            ultimo_error: Exception | None = None
            for intento in range(1, veces + 1):
                try:
                    return func(*args, **kwargs)
                except excepciones as e:
                    ultimo_error = e
                    if intento == veces:
                        break   # No dormir en el último intento
                    espera = pausa * (2 ** (intento - 1)) if exponencial else pausa
                    logger.warning(
                        "%s: intento %d/%d falló (%s). Reintentando en %.1fs...",
                        func.__name__, intento, veces, e, espera,
                    )
                    time.sleep(espera)
            logger.error("%s: todos los intentos fallaron: %s", func.__name__, ultimo_error)
            raise ultimo_error
        return envoltura   # type: ignore[return-value]
    return decorador
```

---

## III. Ciberseguridad — Blue Team

| Riesgo                                  | Fallo común                                                          | Mitigación                                                                               | Referencia               |
| --------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------ |
| **`except Exception: pass`**            | Silenciar todas las excepciones — errores invisibles en producción   | El `except` genérico solo en el nivel más alto; siempre `logger.error()` antes de `pass` | CWE-755 · NIST SI-11     |
| **Traceback expuesto al cliente**       | `return str(e)` en una API — revela rutas internas, tipos, SQL       | Devolver mensaje genérico al cliente; detalles solo en el logger interno                 | CWE-209 · ENS [op.mon.1] |
| **`pickle.loads()` con datos externos** | Deserializar objetos de red con `pickle` — RCE garantizado           | Usar `json.loads()` con validación de esquema mínimo                                     | CWE-502 · NIST SI-10     |
| **Inyección de dependencias**           | `importlib.import_module(user_input)` sin lista blanca               | Whitelist `frozenset` de módulos permitidos antes del import                             | CWE-114 · NIST CM-7      |
| **Capturar `BaseException`**            | `except BaseException:` captura `SystemExit` y `KeyboardInterrupt`   | Capturar solo `Exception`; dejar que el runtime gestione las señales del sistema         | CWE-755                  |
| **Excepción sin causa enlazada**        | `raise NuevoError()` desde un `except` — se pierde la causa original | Usar `raise NuevoError() from exc_original` para mantener la cadena de causas            | CWE-390                  |

---

## IV. Validación Spec-Driven — Módulo 05

```python
# validacion/modulo_05.py
"""Esquemas Pydantic para configuración de manejo de errores."""

from pydantic import BaseModel, Field
from typing import Annotated, Literal


class ConfiguracionReintentos(BaseModel):
    """Valida los parámetros de reintentos antes de configurarlos."""

    max_intentos:   Annotated[int, Field(ge=1, le=10)]        = 3
    pausa_base_seg: Annotated[float, Field(ge=0.1, le=30.0)]  = 1.0
    estrategia:     Literal["fijo", "lineal", "exponencial"]  = "exponencial"
    excepciones_objetivo: list[str] = Field(
        default=["ConnectionError", "TimeoutError"],
        min_length=1
    )

    model_config = {"frozen": True}


class RespuestaError(BaseModel):
    """Estructura de respuesta de error para APIs (sin detalles internos)."""

    codigo:  int   = Field(ge=400, le=599)
    tipo:    str   = Field(min_length=3, max_length=50)
    mensaje: str   = Field(min_length=5, max_length=500)
    request_id: str | None = None   # Para trazabilidad sin exponer internos

    model_config = {"frozen": True}
```

---

## V. Referencia Rápida del Módulo 05

```
Bloques de excepción:
  try / except / else / finally
  except (TypeError, ValueError) as e   → capturar múltiples tipos
  raise ErrorPropio() from exc_original  → encadenar causas
  raise                                  → re-lanzar la excepción actual

Excepciones personalizadas:
  class MiError(Exception): pass         → mínimo
  Usar dataclasses para contexto rico

Context managers:
  with contextmanager + yield            → crear context managers como generadores
  __enter__ / __exit__                   → protocolo completo

Módulos útiles:
  contextlib.contextmanager              → CMs desde generadores
  contextlib.suppress(*exc)              → suprimir excepciones (con cuidado)
  traceback.format_exc()                 → traceback como string para logging
  sys.exc_info()                         → (tipo, valor, traceback) actual

Reglas de seguridad:
  ❌ except Exception: pass
  ❌ return str(e)  ← en APIs públicas
  ❌ pickle.loads(datos_externos)
  ✅ except Exception: logger.error(); raise
  ✅ raise ErrorPublico("mensaje genérico") from e_interno
  ✅ json.loads() con validación de esquema
```

---

## VI. Métricas de Cumplimiento ENS/RGPD

| Control                                    | Referencia                  | Implementación en este módulo                                                    | Estado |
| ------------------------------------------ | --------------------------- | -------------------------------------------------------------------------------- | ------ |
| Logs de auditoría en excepciones           | ENS [op.mon.1] · NIST AU-2  | `logger.error()` obligatorio antes de cualquier `raise`; nunca `pass` silencioso | ✅     |
| Sin exponer detalles internos al cliente   | RGPD Art. 32 · CWE-209      | Mensaje genérico al usuario; detalles solo en logger interno                     | ✅     |
| Prohibición de `pickle` con datos externos | NIST SI-10 · CWE-502        | `json.loads()` + Pydantic como única deserialización aceptada                    | ✅     |
| Whitelist de módulos dinámicos             | NIST CM-7 · CWE-114         | `frozenset` de módulos permitidos antes de `importlib.import_module`             | ✅     |
| Reintentos auditados en servicios externos | ENS [op.exp.7] · NIST SI-17 | Decorador `@reintentar` con logging en cada intento fallido                      | ✅     |

---

## VII. Práctica Profesional

> **Escenario:** Un proveedor de pagos necesita integrar un servicio externo de verificación de IBAN. El servicio externo tiene una disponibilidad del 99,5% (falla ~43 h/año). El sistema debe manejar fallos de forma auditada sin exponer detalles técnicos al usuario final.

**Requerimiento del cliente:**

- Reintentos transparentes: 3 intentos con backoff 1s-2s-4s
- Logs de auditoría por cada intento (timestamp, intento N, error)
- Respuesta al usuario: mensaje normalizado, nunca traceback

```python
# pagos/verificador_iban.py
import logging
from excepciones.reintentos import reintentar
from excepciones.dominio import ErrorConexionExterna

logger = logging.getLogger("pagos.iban")


@reintentar(ConnectionError, TimeoutError, veces=3, pausa=1.0, exponencial=True)
def verificar_iban(iban: str) -> dict:
    """Llama al servicio externo con reintentos auditados."""
    import httpx
    try:
        r = httpx.get(
            f"https://api.ibanvalidator.example/v1/{iban}",
            timeout=5.0,
            verify=True,        # TLS obligatorio
        )
        r.raise_for_status()
        return r.json()
    except httpx.HTTPError as e:
        raise ConnectionError(f"IBAN API no disponible: {e}") from e


def validar_iban_seguro(iban: str) -> dict:
    """Wrapper público: normaliza errores para el usuario."""
    try:
        return verificar_iban(iban)
    except ConnectionError as e:
        logger.error("IBAN verificación fallida tras 3 intentos: %s", e)
        raise ErrorConexionExterna("IBAN Validator", e, intentos=3) from e
```

---

**Anterior:** [04 — Generadores](./modulo-04-generadores.md)
**Siguiente:** [06 — POO](./modulo-06-poo.md)

\_ISO 12207 · NIST CSF 2.0 · ENS
