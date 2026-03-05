# Módulo 14 — Decoradores

> **Estándares:** ISO 12207 §5.3 · NIST SP 800-53 AC-3 · CWE-284 (Control de acceso inadecuado)
> **Dependencias previas:** [Módulo 12](./modulo-12-funciones-avanzadas.md) · [Módulo 10](./modulo-10-bbdd.md)
> **Tiempo estimado:** 4 horas

---

## I. Teoría Técnica Avanzada

### 14.1 ¿Qué es un Decorador? — Composición de Funciones en Python

Un **decorador** es una función que recibe otra función (o clase) como argumento, añade comportamiento y devuelve una nueva función. Es azúcar sintáctica sobre el patrón de composición funcional:

```python
# Sin decorador (equivalente explícito):
def mi_funcion():
    pass
mi_funcion = decorador(mi_funcion)

# Con decorador (sintaxis @):
@decorador
def mi_funcion():
    pass
```

La ejecución es idéntica. El `@` simplemente es una notación más legible.

### 14.2 La Anatomía de un Decorador Completo

```python
import functools
import time
import logging

logger = logging.getLogger(__name__)


def cronometrar(func):
    """Decorador que mide el tiempo de ejecución de una función."""

    @functools.wraps(func)   # ← CRÍTICO: preserva __name__, __doc__, __annotations__
    def envoltura(*args, **kwargs):
        inicio = time.perf_counter()
        try:
            resultado = func(*args, **kwargs)
            return resultado
        finally:
            fin = time.perf_counter()
            logger.debug("%s ejecutó en %.4fs", func.__name__, fin - inicio)

    return envoltura


@cronometrar
def calcular(n: int) -> int:
    return sum(range(n))

# Sin @functools.wraps:
# calcular.__name__ → "envoltura" ← oculta el nombre real
# Con @functools.wraps:
# calcular.__name__ → "calcular"  ← correcto para logs y debugging
```

### 14.3 Decoradores con Parámetros (Fábrica de Decoradores)

```python
def reintentar(veces: int = 3, excepciones: tuple = (Exception,)):
    """Fábrica de decoradores: devuelve un decorador configurado."""

    def decorador(func):
        @functools.wraps(func)
        def envoltura(*args, **kwargs):
            for intento in range(1, veces + 1):
                try:
                    return func(*args, **kwargs)
                except excepciones as e:
                    if intento == veces:
                        raise
                    logger.warning("%s: intento %d/%d fallido", func.__name__, intento, veces)
        return envoltura

    return decorador   # ← devuelve el decorador, no la función envuelta


@reintentar(veces=3, excepciones=(ConnectionError,))
def consultar_api(url: str) -> dict:
    ...
```

### 14.4 Decoradores de Clase

```python
from dataclasses import dataclass

def singleton(cls):
    """Decorador que garantiza que solo existe una instancia de la clase."""
    instancias: dict = {}

    @functools.wraps(cls)
    def obtener_instancia(*args, **kwargs):
        if cls not in instancias:
            instancias[cls] = cls(*args, **kwargs)
        return instancias[cls]

    return obtener_instancia


@singleton
class ConfiguracionGlobal:
    def __init__(self) -> None:
        self.debug = False
        self.modo  = "produccion"

# ConfiguracionGlobal() siempre devuelve la misma instancia
```

---

## II. Laboratorio Práctico — Step by Step

### Lab 14.1 — Stack de Decoradores de Seguridad

```python
# decoradores/seguridad.py
"""Decoradores operacionales de seguridad para funciones de negocio."""

import functools
import logging
import sqlite3
import time
from collections import defaultdict
from pathlib import Path

logger = logging.getLogger("seguridad.decoradores")


# \u2500\u2500\u2500 1. Auditoría de llamadas \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

def auditar(accion: str):
    """Registra cada llamada con su resultado en el logger de auditoría."""
    def decorador(func):
        @functools.wraps(func)
        def envoltura(*args, **kwargs):
            usuario = kwargs.get("usuario_id", args[0] if args else "desconocido")
            try:
                resultado = func(*args, **kwargs)
                logger.info(
                    "AUDIT | accion=%s usuario=%s status=OK",
                    accion, usuario,
                )
                return resultado
            except Exception as e:
                logger.warning(
                    "AUDIT | accion=%s usuario=%s status=ERROR error=%s",
                    accion, usuario, type(e).__name__,
                )
                raise
        return envoltura
    return decorador


# \u2500\u2500\u2500 2. Rate limiting (ventana deslizante) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

def limitar_tasa(max_llamadas: int, ventana_segundos: float):
    """Rate limiting por clave (e.g. usuario_id o IP).

    Implementa ventana deslizante: registra timestamps de llamadas
    y rechaza si en los últimos `ventana_segundos` hay más de `max_llamadas`.
    """
    historial: dict[str, list[float]] = defaultdict(list)

    def decorador(func):
        @functools.wraps(func)
        def envoltura(*args, **kwargs):
            clave = str(kwargs.get("usuario_id", args[0] if args else "global"))
            ahora = time.monotonic()

            # Limpiar llamadas fuera de la ventana
            historial[clave] = [t for t in historial[clave] if ahora - t < ventana_segundos]

            if len(historial[clave]) >= max_llamadas:
                logger.warning("Rate limit excedido: clave=%s", clave)
                raise PermissionError(
                    f"Demasiadas solicitudes. Límite: {max_llamadas} cada {ventana_segundos}s"
                )

            historial[clave].append(ahora)
            return func(*args, **kwargs)

        return envoltura
    return decorador


# \u2500\u2500\u2500 3. RBAC — @require_permission \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

DB_PATH = Path("app_segura.db")

PERMISOS_POR_ROL: dict[str, frozenset[str]] = {
    "admin":  frozenset({"leer", "escribir", "eliminar", "administrar"}),
    "editor": frozenset({"leer", "escribir"}),
    "lector": frozenset({"leer"}),
}


def _obtener_roles(usuario_id: str) -> list[str]:
    """Consulta los roles del usuario en BD (caché en producción)."""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.execute("PRAGMA foreign_keys = ON")
        rows = conn.execute(
            """SELECT r.nombre FROM roles r
               JOIN usuarios_roles ur ON ur.rol_id = r.id
               WHERE ur.usuario_id = ?""",
            (usuario_id,),
        ).fetchall()
        conn.close()
        return [r[0] for r in rows]
    except sqlite3.Error:
        return []


class PermisoInsuficienteError(PermissionError):
    def __init__(self, usuario_id: str, permiso: str) -> None:
        self.usuario_id = usuario_id
        self.permiso    = permiso
        super().__init__(f"Usuario {usuario_id!r} no tiene permiso: {permiso!r}")


def require_permission(permiso: str):
    """Decorador RBAC: verifica permiso antes de ejecutar la función.

    Convención de llamada:
        La función decorada DEBE recibir `usuario_id` como primer argumento
        posicional o como keyword argument.

    Usage:
        @require_permission("eliminar")
        def eliminar_registro(usuario_id: str, registro_id: str) -> None:
            ...
    """
    def decorador(func):
        @functools.wraps(func)
        def envoltura(*args, **kwargs):
            usuario_id = kwargs.get("usuario_id") or (args[0] if args else None)

            if not usuario_id:
                raise ValueError("require_permission: falta usuario_id en los argumentos")

            roles = _obtener_roles(str(usuario_id))

            tiene_permiso = any(
                permiso in PERMISOS_POR_ROL.get(rol, frozenset())
                for rol in roles
            )

            if not tiene_permiso:
                logger.warning(
                    "RBAC DENIED | usuario=%s permiso=%s roles=%s funcion=%s",
                    usuario_id, permiso, roles, func.__name__,
                )
                raise PermisoInsuficienteError(str(usuario_id), permiso)

            logger.info(
                "RBAC OK | usuario=%s permiso=%s funcion=%s",
                usuario_id, permiso, func.__name__,
            )
            return func(*args, **kwargs)

        return envoltura
    return decorador
```

### Lab 14.2 — Composición de Decoradores en Producción

```python
# servicios/operaciones_sensibles.py
"""Funciones de negocio protegidas con stack de decoradores."""

from decoradores.seguridad import auditar, limitar_tasa, require_permission


@auditar("exportar_datos")
@limitar_tasa(max_llamadas=5, ventana_segundos=60.0)
@require_permission("administrar")
def exportar_datos_usuarios(usuario_id: str, formato: str = "json") -> bytes:
    """Exporta todos los usuarios (solo para admins, máx 5 veces/minuto).

    El orden de los decoradores importa — se aplican de ABAJO hacia ARRIBA:
    1. require_permission  → ¿tiene el permiso?
    2. limitar_tasa        → ¿dentro del límite de frecuencia?
    3. auditar             → registrar la llamada (resultado o error)
    """
    # Solo llega aquí si pasó los 3 filtros
    if formato not in ("json", "csv"):
        raise ValueError(f"Formato no soportado: {formato!r}")
    return b"datos_exportados"


@auditar("leer_perfil")
@require_permission("leer")
def obtener_perfil(usuario_id: str, perfil_id: str) -> dict:
    """Lee un perfil — cualquier usuario autenticado con rol lector o superior."""
    return {"id": perfil_id, "nombre": "Ana García"}
```

### Lab 14.3 — Validación Pydantic con Decorador

```python
# decoradores/validacion.py
"""Decorador que valida entrada/salida con modelos Pydantic."""

import functools
from typing import Type, TypeVar
from pydantic import BaseModel, ValidationError

M = TypeVar("M", bound=BaseModel)


def validar_entrada(modelo: Type[M]):
    """Valida el primer argumento keyword `datos` con el modelo Pydantic dado.

    Usage:
        @validar_entrada(UsuarioIn)
        def crear_usuario(datos: UsuarioIn) -> str:
            ...

        # El llamador puede pasar un dict y se validará automáticamente:
        crear_usuario(datos={"email": "a@b.com", "nombre": "Ana"})
    """
    def decorador(func):
        @functools.wraps(func)
        def envoltura(*args, **kwargs):
            if "datos" in kwargs and isinstance(kwargs["datos"], dict):
                try:
                    kwargs["datos"] = modelo.model_validate(kwargs["datos"])
                except ValidationError as e:
                    raise ValueError(f"Datos de entrada inválidos: {e}") from e
            return func(*args, **kwargs)
        return envoltura
    return decorador
```

---

## III. Ciberseguridad — Blue Team

| Riesgo                                  | Fallo común                                                                    | Mitigación                                                                              | Referencia          |
| --------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ------------------- |
| **Sin `@functools.wraps`**              | Decorador que borra `__name__`, `__doc__` — debugging imposible en producción  | Siempre `@functools.wraps(func)` en el `envoltura` interno                              | CWE-1059            |
| **RBAC sin verificación en BD**         | Roles almacenados en JWT/sesión sin revalidar — escalada de privilegios        | Consultar BD en cada request; cachear con TTL corto (30s)                               | CWE-284 · NIST AC-3 |
| **Sin logging en denegación de acceso** | RBAC silencioso — los intentos de acceso no quedan registrados                 | `logger.warning` en cada denegación con usuario, permiso y función                      | NIST AU-2           |
| **Rate limit no persistente**           | `defaultdict` en memoria — se resetea al reiniciar el proceso                  | En producción usar Redis con `EXPIRE`; el dict en memoria aplica solo en single-process | CWE-307 · NIST AC-7 |
| **Orden incorrecto de decoradores**     | `@auditar` antes de `@require_permission` — audita incluso intentos bloqueados | El más externo (primero en el código) ejecuta antes; diseñar el orden conscientemente   | ISO 12207 §5.3      |

---

## IV. Validación Spec-Driven — Módulo 14

```python
# validacion/modulo_14.py
from pydantic import BaseModel, Field
from typing import Annotated, Literal


class RegistroUsuarioIn(BaseModel):
    email:          str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    nombre_completo: Annotated[str, Field(min_length=2, max_length=120)]
    contrasena:     Annotated[str, Field(min_length=12, max_length=128)]
    rol_inicial:    Literal["lector", "editor", "admin"] = "lector"
    model_config = {"frozen": True}


class SolicitudPermiso(BaseModel):
    """Para auditar solicitudes de cambio de permisos."""
    usuario_solicitante_id: str = Field(min_length=36, max_length=36)
    usuario_objetivo_id:    str = Field(min_length=36, max_length=36)
    permiso:  Literal["leer", "escribir", "eliminar", "administrar"]
    accion:   Literal["conceder", "revocar"]
    model_config = {"frozen": True}
```

---

## V. Referencia Rápida del Módulo 14

```
Anatomía de decorador:
  def decorador(func):
      @functools.wraps(func)     ← SIEMPRE incluir
      def envoltura(*args, **kwargs):
          # antes
          resultado = func(*args, **kwargs)
          # después
          return resultado
      return envoltura

Decorador con parámetros:
  def fabrica(param):
      def decorador(func):
          @functools.wraps(func)
          def envoltura(*args, **kwargs):
              ...
          return envoltura
      return decorador

  @fabrica(param=valor)
  def mi_funcion(): ...

Composición (orden de ejecución — de ABAJO hacia ARRIBA):
  @A
  @B
  @C
  def f(): ...
  # Equivale a: f = A(B(C(f)))
  # Ejecución: A.__enter__ → B.__enter__ → C.__enter__ → f → C.__exit__ → B.__exit__ → A.__exit__

Decoradores estándar:
  @property              → getter/setter como atributo
  @classmethod           → recibe cls en lugar de self
  @staticmethod          → sin cls ni self
  @functools.lru_cache   → memoización
  @functools.wraps       → preservar metadatos
  @dataclasses.dataclass → generar __init__, __repr__, etc.
```

---

**Anterior:** [13 — Expresiones Regulares](./modulo-13-regex.md)
**Siguiente:** [15 — Testing DevSecOps](./modulo-15-testing.md)

## _ISO 12207 · NIST CSF 2.0 · ENS — pildorasinformaticas_

## VI. Métricas de Cumplimiento ENS/RGPD

| Control                                     | Referencia                    | Implementación en este módulo                                                | Estado |
| ------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------- | ------ |
| RBAC verificado en BD (no solo en token)    | ENS [op.acc.4] · NIST AC-3    | `@require_permission` consulta roles en cada request                         | ✅     |
| Logging de denegación de acceso             | NIST AU-2 · ENS [op.mon.1]    | `logger.warning()` en cada `PermisoInsuficienteError` con usuario + permiso  | ✅     |
| Rate limiting por usuario individual        | NIST AC-7 · CWE-307           | `@limitar_tasa` con clave por `usuario_id`; no por IP (puede ser compartida) | ✅     |
| Auditoría de acciones sensibles             | ENS [op.mon.3] · RGPD Art. 30 | `@auditar` en toda función que accede o modifica datos personales            | ✅     |
| `@functools.wraps` en todos los decoradores | ISO 12207 §5.3 · CWE-1059     | Preservar `__name__`, `__doc__`, `__annotations__` para trazabilidad         | ✅     |

---

## VII. Práctica Profesional

> **Escenario:** Una plataforma B2B de facturación expone una API interna con operaciones de diferente sensibilidad: lectura libre para lectores, escritura para editores, y eliminación/exportación restringida a admins. El equipo de cumplimiento exige un audit log de cada operación sensible para RGPD Art. 30.

**Requerimiento del cliente:**

- RBAC consultado en BD en cada request (token JWT no es suficiente)
- Rate limit: máx 10 escrituras/minuto por usuario
- Audit log: quién, qué operación, cuándo, resultado (OK o DENIED)
- Decoradores componibles sin modificar el código de negocio

```python
# facturacion/api_interna.py
"""Endpoints de facturación con stack de decoradores de seguridad."""

from decoradores.seguridad import auditar, limitar_tasa, require_permission


@auditar("emitir_factura")
@limitar_tasa(max_llamadas=10, ventana_segundos=60.0)
@require_permission("escribir")
def emitir_factura(usuario_id: str, datos_factura: dict) -> str:
    """Emite una factura — solo editores y admins, máx 10/min."""
    # Aquí solo llega si pasó los 3 filtros en orden (permit → rate → audit)
    return f"FACTURA-{datos_factura.get('cliente_id', 'X')}-001"


@auditar("exportar_facturas")
@limitar_tasa(max_llamadas=3, ventana_segundos=3600.0)
@require_permission("administrar")
def exportar_facturas(usuario_id: str, periodo: str) -> bytes:
    """Exporta todas las facturas — solo admins, máx 3 exportaciones/hora."""
    return b"datos_csv"


# El audit log queda en el logger "seguridad.decoradores":
# INFO AUDIT | accion=emitir_factura usuario=<uuid> status=OK
# WARNING AUDIT | accion=exportar_facturas usuario=<uuid> status=ERROR error=PermisoInsuficienteError
```

\_ISO 12207 · NIST CSF 2.0 · ENS
