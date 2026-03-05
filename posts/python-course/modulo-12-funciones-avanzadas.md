# Módulo 12 — Funciones Avanzadas: Lambda, Map, Filter y Funcional

> **Estándares:** ISO 12207 §5.3 · NIST SP 800-53 SI-10 · CWE-400 (Expresiones sin límite)
> **Dependencias previas:** [Módulo 06](./modulo-06-poo.md) · [Módulo 04](./modulo-04-generadores.md)
> **Tiempo estimado:** 3 horas

---

## I. Teoría Técnica Avanzada

### 12.1 Funciones como Ciudadanos de Primera Clase

En Python, **las funciones son objetos**. Esto significa que pueden:

```python
# 1. Asignarse a variables
saludar = print

# 2. Pasarse como argumento
def aplicar(funcion, valor):
    return funcion(valor)

aplicar(str.upper, "hola")   # "HOLA"

# 3. Devolverse desde otras funciones
def multiplicador(n: int):
    def por_n(x: int) -> int:
        return x * n
    return por_n   # ← devuelve una función

doble = multiplicador(2)
triple = multiplicador(3)
print(doble(5))    # 10
print(triple(5))   # 15

# 4. Almacenarse en estructuras de datos
operaciones = {
    "suma":   lambda a, b: a + b,
    "resta":  lambda a, b: a - b,
    "prod":   lambda a, b: a * b,
}
operaciones["suma"](3, 4)   # 7
```

### 12.2 `lambda` — Funciones Anónimas y Cuándo NO Usarlas

```python
# Sintaxis: lambda parámetros: expresión (solo UNA expresión)
cuadrado = lambda x: x * x

# Equivalente con def (preferido si tiene nombre significativo):
def cuadrado(x: float) -> float:
    return x * x
```

**Cuándo usar `lambda`:**

| Situación                           | Ejemplo                                 | Uso correcto            |
| ----------------------------------- | --------------------------------------- | ----------------------- |
| `key=` en sort                      | `lista.sort(key=lambda x: x["precio"])` | ✅ Sí                   |
| Función simple en `map/filter`      | `map(lambda x: x*2, lista)`             | ⚠️ Preferir comprensión |
| Tabla de dispatch                   | `{"op": lambda a,b: a+b}`               | ✅ Sí                   |
| Lógica compleja de más de una línea | No es posible en lambda                 | ❌ Usar `def`           |

> **PEP 8:** asignar una lambda a una variable con nombre (`f = lambda x: x`) es peor que usar `def`. Solo usar lambda cuando la función es verdaderamente anónima (se pasa como argumento directamente).

### 12.3 `map`, `filter`, `reduce` — El Modelo Funcional

```
Datos de entrada
   [d1, d2, d3, d4, d5]
       │
       ▼
  filter(pred)      → elimina los que no cumplen la condición
   [d1, d3, d5]
       │
       ▼
  map(transform)    → transforma cada elemento
   [t1, t3, t5]
       │
       ▼
  reduce(f, acc)    → colapsa a un único valor
     resultado
```

```python
from functools import reduce

datos = [1, -2, 3, -4, 5, 0, 6]

# Pipeline funcional
positivos    = filter(lambda x: x > 0, datos)           # [1, 3, 5, 6]
cuadrados    = map(lambda x: x ** 2, positivos)         # [1, 9, 25, 36]
suma_total   = reduce(lambda acc, x: acc + x, cuadrados) # 71
```

**Alternativa con comprensiones (más Pythónica en muchos casos):**

```python
# Equivalente con generador — más legible:
suma_total = sum(x ** 2 for x in datos if x > 0)   # 71
```

### 12.4 `functools.partial` — Aplicación Parcial de Funciones

```python
from functools import partial

def potencia(base: float, exponente: float) -> float:
    return base ** exponente

cuadrado = partial(potencia, exponente=2)
cubo     = partial(potencia, exponente=3)

print(cuadrado(4))   # 16.0
print(cubo(2))       # 8.0
```

### 12.5 Closures — Captura de Variables del Ámbito Exterior

```python
def crear_contador(inicio: int = 0):
    """Closure: la función interna 'recuerda' el estado de `cuenta`."""
    cuenta = [inicio]   # Lista para que sea mutable desde el closure

    def incrementar(paso: int = 1) -> int:
        cuenta[0] += paso
        return cuenta[0]

    def resetear() -> None:
        cuenta[0] = inicio

    return incrementar, resetear

inc, reset = crear_contador(10)
print(inc())    # 11
print(inc(5))   # 16
reset()
print(inc())    # 11
```

---

## II. Laboratorio Práctico — Step by Step

### Lab 12.1 — Pipelines de Transformación Segura

```python
# funcional/pipeline.py
"""Composición funcional de transformaciones con tipos seguros."""

from typing import Callable, TypeVar, Iterator, Iterable
from functools import reduce

T = TypeVar("T")
U = TypeVar("U")


def pipeline(*funciones: Callable) -> Callable:
    """Compone funciones de izquierda a derecha.

    Usage:
        procesar = pipeline(limpiar, validar, normalizar)
        resultado = procesar(dato_crudo)
    """
    if not funciones:
        raise ValueError("Pipeline necesita al menos una función")
    return reduce(lambda f, g: lambda x: g(f(x)), funciones)


def safe_map(
    func: Callable[[T], U],
    iterable: Iterable[T],
    en_error: Callable[[T, Exception], U | None] | None = None,
) -> Iterator[U]:
    """map() que no revienta si un elemento falla.

    Args:
        func: Función de transformación.
        iterable: Datos de entrada.
        en_error: Callback opcional para manejar errores por elemento.
                  Si devuelve None, el elemento se omite.
    """
    for item in iterable:
        try:
            resultado = func(item)
            yield resultado
        except Exception as e:
            if en_error:
                resultado = en_error(item, e)
                if resultado is not None:
                    yield resultado
            # Si no hay manejador, simplemente omite el elemento


def safe_filter(
    pred: Callable[[T], bool],
    iterable: Iterable[T],
) -> Iterator[T]:
    """filter() que omite elementos donde el predicado lanza excepción."""
    for item in iterable:
        try:
            if pred(item):
                yield item
        except Exception:
            pass   # Omitir silenciosamente elementos problemáticos
```

### Lab 12.2 — Tabla de Dispatch Segura

```python
# funcional/dispatch.py
"""Tabla de dispatch funcional para reemplazar if/elif con muchas ramas."""

from typing import Callable, Any
from functools import partial


# Tabla de operaciones matemáticas seguras
OPERACIONES_MATEMATICAS: dict[str, Callable[[float, float], float]] = {
    "suma":   lambda a, b: a + b,
    "resta":  lambda a, b: a - b,
    "prod":   lambda a, b: a * b,
    "div":    lambda a, b: a / b if b != 0 else float("nan"),
    "potencia": pow,
    "mod":    lambda a, b: a % b if b != 0 else float("nan"),
}


def ejecutar_operacion(op: str, a: float, b: float) -> float:
    """Ejecuta una operación de forma segura usando tabla de dispatch.

    Reemplaza un if/elif con 6 ramas (CC=7) por una tabla (CC=2).

    Args:
        op: Nombre de la operación (clave en la tabla).
        a, b: Operandos.

    Returns:
        Resultado de la operación.

    Raises:
        ValueError: Si la operación no está en la tabla.
    """
    if op not in OPERACIONES_MATEMATICAS:
        raise ValueError(
            f"Operación desconocida: {op!r}. "
            f"Disponibles: {sorted(OPERACIONES_MATEMATICAS)}"
        )
    return OPERACIONES_MATEMATICAS[op](a, b)


# Tabla de transformadores de texto para pipelines ETL
TRANSFORMADORES_TEXTO: dict[str, Callable[[str], str]] = {
    "minusculas":   str.lower,
    "mayusculas":   str.upper,
    "strip":        str.strip,
    "capitalizar":  str.capitalize,
    "invertir":     lambda s: s[::-1],
    "sin_espacios": lambda s: s.replace(" ", "_"),
}


def transformar_texto(texto: str, *operaciones: str) -> str:
    """Aplica una cadena de transformaciones usando la tabla de dispatch."""
    resultado = texto
    for op in operaciones:
        if op not in TRANSFORMADORES_TEXTO:
            raise ValueError(f"Transformación desconocida: {op!r}")
        resultado = TRANSFORMADORES_TEXTO[op](resultado)
    return resultado

# Uso:
# transformar_texto("  Hola Mundo  ", "strip", "minusculas", "sin_espacios")
# → "hola_mundo"
```

### Lab 12.3 — `functools` para Cache y Memoización

```python
# funcional/cache.py
"""Memoización y cache con functools para optimización de rendimiento."""

import functools
import time
import logging

logger = logging.getLogger(__name__)


@functools.lru_cache(maxsize=128)
def fibonacci_memo(n: int) -> int:
    """Fibonacci con memoización automática (lru_cache).

    Sin cache: O(2^n) — con cache: O(n) — diferencia dramática para n>35.

    Note: Solo funciona con argumentos hashables (int, str, tuple — no list/dict).
    """
    if n < 0:
        raise ValueError(f"n debe ser >= 0: {n}")
    if n <= 1:
        return n
    return fibonacci_memo(n - 1) + fibonacci_memo(n - 2)


@functools.cache   # Python 3.9+ — equivale a lru_cache(maxsize=None)
def calcular_permutaciones(n: int, r: int) -> int:
    """P(n, r) con cache ilimitado — útil para n, r pequeños y fijos."""
    if r > n:
        return 0
    return functools.reduce(lambda acc, x: acc * x, range(n - r + 1, n + 1), 1)


def cache_con_ttl(segundos_ttl: int = 300):
    """Decorador de caché con tiempo de expiración (TTL).

    No es thread-safe para producción — usar `cachetools` para entornos concurrentes.
    """
    def decorador(func):
        _cache: dict = {}

        @functools.wraps(func)
        def envoltura(*args, **kwargs):
            clave = (args, tuple(sorted(kwargs.items())))
            ahora = time.monotonic()

            if clave in _cache:
                valor, expira_en = _cache[clave]
                if ahora < expira_en:
                    logger.debug("Cache hit: %s%s", func.__name__, args)
                    return valor

            resultado = func(*args, **kwargs)
            _cache[clave] = (resultado, ahora + segundos_ttl)
            logger.debug("Cache miss → computed: %s%s", func.__name__, args)
            return resultado

        envoltura.cache_clear = lambda: _cache.clear()
        return envoltura
    return decorador


@cache_con_ttl(segundos_ttl=60)
def obtener_configuracion(entorno: str) -> dict:
    """Simulación de carga de config desde disco/red — cacheada por 60s."""
    logger.info("Cargando configuración para entorno: %s...", entorno)
    time.sleep(0.1)   # Simula operación lenta
    return {"entorno": entorno, "debug": entorno == "dev"}
```

---

## III. Ciberseguridad — Blue Team

| Riesgo                                     | Fallo común                                                          | Mitigación                                                                          | Referencia           |
| ------------------------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------- |
| **`eval()` disfrazado de dispatch**        | `eval(f"operacion_{nombre}(a, b)")` como alternativa al if           | Tabla de dispatch con whitelist explícita; jamás `eval`/`exec` con input externo    | CWE-78 · NIST CM-7   |
| **lru_cache con datos sensibles**          | `@lru_cache` sobre función que devuelve tokens o sesiones            | Usar `maxsize` pequeño y `cache_clear()` en logout; nunca cachear tokens de usuario | CWE-312 · NIST SC-28 |
| **Funciones de orden superior sin tipo**   | `aplicar(func, datos)` sin validar que `func` sea un callable seguro | Type hints + validar que la función esté en una whitelist antes de `aplicar()`      | CWE-20 · NIST SI-10  |
| **`reduce()` sin valor inicial**           | `reduce(f, [])` sin `initial` — `TypeError` en lista vacía           | Siempre `reduce(f, iterable, valor_inicial)` con tercer argumento                   | CWE-248              |
| **Closures que retienen datos en memoria** | Closure que captura una lista grande que nunca se libera             | Documentar el ciclo de vida del closure; usar `WeakRef` si captura objetos grandes  | CWE-400 · NIST SI-12 |

---

## IV. Validación Spec-Driven — Módulo 12

```python
# validacion/modulo_12.py
"""Esquemas para operaciones funcionales auditables."""

from pydantic import BaseModel, Field
from typing import Annotated, Literal


class SolicitudOperacion(BaseModel):
    """Valida una solicitud de operación matemática antes del dispatch."""

    operacion: Literal["suma", "resta", "prod", "div", "potencia", "mod"]
    operando_a: float
    operando_b: float

    model_config = {"frozen": True}


class ConfiguracionPipeline(BaseModel):
    """Define un pipeline de transformaciones de texto."""

    transformaciones: list[Literal[
        "minusculas", "mayusculas", "strip",
        "capitalizar", "invertir", "sin_espacios"
    ]]
    max_longitud_entrada: Annotated[int, Field(ge=1, le=10_000)] = 1_000

    model_config = {"frozen": True}
```

---

## V. Referencia Rápida del Módulo 12

```
Funciones de orden superior:
  map(func, iterable)               → itera transformando
  filter(pred, iterable)            → itera filtrando
  sorted(iterable, key=func)        → ordena
  min/max(iterable, key=func)       → mínimo/máximo

functools:
  functools.reduce(f, iter, init)   → colapsa a un valor
  functools.partial(f, *args)       → aplicación parcial
  functools.lru_cache(maxsize=128)  → memoización automática
  functools.cache                   → lru_cache(maxsize=None)
  functools.wraps(func)             → preservar metadatos en decoradores
  functools.singledispatch          → sobrecarga por tipo de argumento

Lambda:
  lambda x: expr                    → función anónima (1 expresión)
  ✅ key=lambda x: x["campo"]       → en sort/min/max
  ✅ {"op": lambda a,b: a+b}        → tabla de dispatch
  ❌ f = lambda x: expr             → usar def si tiene nombre significativo

Closures:
  def fabrica():
      estado = [0]
      def interno(): estado[0] += 1; return estado[0]
      return interno

Comprensiones (alternativa más Pythónica):
  [f(x) for x in iter]             → equivale a map
  [x for x in iter if pred(x)]     → equivale a filter
  sum(f(x) for x in iter if pred)  → equivale a filter+map+sum
```

---

**Anterior:** [11 — Prácticas MVC](./modulo-11-practicas-mvc.md)
**Siguiente:** [13 — Expresiones Regulares](./modulo-13-regex.md)

---

## VI. Métricas de Cumplimiento ENS/RGPD

| Control                                            | Referencia                  | Implementación en este módulo                                            | Estado |
| -------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------ | ------ |
| Prohibición de `eval()`/`exec()` con input externo | NIST CM-7 · CWE-78          | Tabla de dispatch con whitelist explícita; `eval` nunca como alternativa | ✅     |
| Cache sin datos de sesión sensibles                | RGPD Art. 5(1)(f) · CWE-312 | `lru_cache` solo en datos públicos; `cache_clear()` en logout            | ✅     |
| Funciones de orden superior tipadas                | ISO 12207 §5.3 · CWE-20     | Type hints en todos los callables recibidos como argumentos              | ✅     |
| `reduce()` con valor inicial                       | CWE-248 · NIST SI-10        | Siempre 3 argumentos: `reduce(f, iter, valor_inicial)`                   | ✅     |
| Trazabilidad en dispatch de operaciones            | ENS [op.mon.1]              | Logging antes y después de operaciones sensibles via `@auditar`          | ✅     |

---

## VII. Práctica Profesional

> **Escenario:** Una aseguradora necesita un motor de reglas de negocio para calcular el score de riesgo de un cliente en base a múltiples criterios (edad, historial, zona geográfica). Las reglas cambian trimestralmente y deben poderse actualizar sin redeployar el código (configurable via JSON externo).

**Requerimiento del cliente:**

- Reglas definidas en JSON (no en código Python hardcodeado)
- Motor debe validar las reglas antes de aplicarlas (evitar inyección de lógica)
- Resultado auditado: qué reglas aplicaron + score resultante

```python
# motor_reglas/motor.py
"""Motor de reglas de negocio configurable por JSON."""

from typing import Any
from functools import reduce

# Operadores permitidos (whitelist contra inyección de lógica)
_OPERADORES: dict[str, Any] = {
    "gte":  lambda v, t: v >= t,
    "lte":  lambda v, t: v <= t,
    "eq":   lambda v, t: v == t,
    "in":   lambda v, t: v in t,
}

# Modificadores de score permitidos
_MODIFICADORES: dict[str, Any] = {
    "suma":  lambda acc, delta: acc + delta,
    "resta": lambda acc, delta: acc - delta,
    "max":   max,
}


def _aplicar_regla(dato: dict, regla: dict) -> int | None:
    """Aplica una regla y devuelve el delta de score, o None si no aplica."""
    campo    = regla.get("campo")
    operador = regla.get("operador")
    umbral   = regla.get("umbral")
    delta    = regla.get("delta", 0)

    if campo not in dato or operador not in _OPERADORES:
        return None   # Regla inválida o campo ausente — skip seguro

    if _OPERADORES[operador](dato[campo], umbral):
        return delta
    return None


def calcular_score(dato: dict, reglas: list[dict]) -> dict:
    """Calcula score de riesgo aplicando reglas de la whitelist."""
    deltas_aplicados = [
        {"id": r.get("id", "?"), "delta": d}
        for r in reglas
        if (d := _aplicar_regla(dato, r)) is not None
    ]
    score = reduce(lambda acc, x: acc + x["delta"], deltas_aplicados, 500)
    return {"score": max(0, min(1000, score)), "reglas_aplicadas": deltas_aplicados}
```

\_ISO 12207 · NIST CSF 2.0 · ENS
