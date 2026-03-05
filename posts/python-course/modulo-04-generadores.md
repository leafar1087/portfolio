# Módulo 04 — Generadores y Optimización de Memoria

> **Estándares:** ISO 12207 §5.3 · NIST SP 800-53 SI-12 · CWE-400 (Consumo no controlado de recursos)
> **Dependencias previas:** [Módulo 03](./modulo-03-control-de-flujo.md)
> **Tiempo estimado:** 3–4 horas

---

## I. Teoría Técnica Avanzada

### 4.1 ¿Qué es un Generador? — Corrutinas de un Solo Hilo

Un **generador** es una función que, al encontrar `yield`, **suspende su ejecución** y devuelve el valor al llamador. La próxima llamada a `next()` reanuda la función exactamente donde se detuvo, conservando su estado local.

```
Llamador          Generador
  │                  │
  │ next() ─────────>│ ejecuta hasta yield
  │ <── valor ───────│ suspende (estado guardado)
  │                  │
  │ next() ─────────>│ reanuda desde yield
  │ <── valor ───────│ suspende de nuevo
  │                  │
  │ next() ─────────>│ llega al final → StopIteration
```

**Diferencia fundamental con una función normal:**

```python
# Función normal: construye toda la lista en memoria ANTES de devolver
def rangos_lista(n: int) -> list[int]:
    return [i * i for i in range(n)]   # 10M enteros en RAM si n=10_000_000

# Generador: produce un valor CADA VEZ que se le pide
def rangos_gen(n: int):
    for i in range(n):
        yield i * i                    # Solo 1 entero en memoria a la vez
```

### 4.2 Ciclo de Vida de un Generador

Un generador tiene cuatro estados:

| Estado          | Descripción                                                  |
| --------------- | ------------------------------------------------------------ |
| `GEN_CREATED`   | Función llamada, aún no iniciada. `next()` no se ha llamado. |
| `GEN_RUNNING`   | Ejecutándose actualmente (dentro de `next()`).               |
| `GEN_SUSPENDED` | Suspendido en un `yield`. Esperando el siguiente `next()`.   |
| `GEN_CLOSED`    | Terminado o cerrado con `.close()`.                          |

```python
import inspect

def contador():
    yield 1
    yield 2
    yield 3

gen = contador()
print(inspect.getgeneratorstate(gen))   # GEN_CREATED
next(gen)
print(inspect.getgeneratorstate(gen))   # GEN_SUSPENDED
list(gen)                               # agotar el generador
print(inspect.getgeneratorstate(gen))   # GEN_CLOSED
```

### 4.3 `yield from` — Delegación de Generadores

`yield from` delega la iteración a un sub-generador, pasando transparentemente valores y excepciones entre el llamador externo y el generador interno.

```python
def leer_archivos(rutas: list[str]):
    """Generador que itera sobre varios archivos transparentemente."""
    for ruta in rutas:
        with open(ruta, encoding="utf-8") as f:
            yield from f   # delega la iteración línea a línea al archivo

# El llamador no necesita saber que hay múltiples archivos
for linea in leer_archivos(["datos1.csv", "datos2.csv"]):
    procesar(linea)
```

### 4.4 Análisis de Memoria — Por Qué los Generadores Previenen DoS

Un servidor que procesa datasets sin generadores puede ser víctima de un ataque de **agotamiento de recursos**: el cliente envía un archivo enorme y el servidor intenta cargarlo todo en RAM.

```python
import tracemalloc

# \u2500\u2500\u2500 Benchmark: Lista vs. Generador para 10 millones de elementos \u2500\u2500\u2500

tracemalloc.start()
# Aproximación: lista de 10M enteros
lista = list(range(10_000_000))
mem_lista, _ = tracemalloc.get_traced_memory()
tracemalloc.stop()
print(f"Lista:     {mem_lista / 1_048_576:.1f} MB")   # ~400 MB

tracemalloc.start()
# Generador: no materializa ningún elemento
gen = (x for x in range(10_000_000))
mem_gen, _ = tracemalloc.get_traced_memory()
tracemalloc.stop()
print(f"Generador: {mem_gen / 1_024:.0f} KB")          # ~200 bytes
```

**Impacto en producción:**

| Escenario                       | Lista       | Generador  | Diferencia   |
| ------------------------------- | ----------- | ---------- | ------------ |
| Exportar 1M filas de BD         | ~800 MB RAM | ~2 KB RAM  | **×400,000** |
| Parsear CSV de 2 GB             | OOM crash   | ~50 KB RAM | Extremo      |
| Pipeline de logs en tiempo real | Imposible   | Estable    | ∞            |

---

## II. Laboratorio Práctico — Step by Step

### Lab 4.1 — Generadores Básicos

```python
# generadores_basicos.py
from typing import Generator, Iterator


def fibonacci() -> Generator[int, None, None]:
    """Generador infinito de la secuencia Fibonacci."""
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b


def primeros_n(gen: Iterator, n: int) -> list:
    """Extrae los primeros n elementos de cualquier iterador."""
    resultado = []
    for i, valor in enumerate(gen):
        if i >= n:
            break
        resultado.append(valor)
    return resultado


# Uso: solo se calculan los primeros 10
print(primeros_n(fibonacci(), 10))
# [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]


def rango_seguro(inicio: int, fin: int, paso: int = 1) -> Generator[int, None, None]:
    """Generador de rango con validación de parámetros."""
    if paso == 0:
        raise ValueError("El paso no puede ser 0")
    if paso > 0 and inicio > fin:
        return   # Generador vacío
    if paso < 0 and inicio < fin:
        return   # Generador vacío

    actual = inicio
    while (paso > 0 and actual < fin) or (paso < 0 and actual > fin):
        yield actual
        actual += paso
```

### Lab 4.2 — Pipeline ETL con Generadores Encadenados

```python
# pipeline_etl.py
"""Pipeline ETL de alta eficiencia usando generadores encadenados."""

import csv
import io
import re
from typing import Generator, Iterator
from pathlib import Path

MAX_LINEAS = 500_000   # Límite de seguridad (NIST SI-12)


def leer_csv(ruta: Path) -> Generator[str, None, None]:
    """Etapa 1: Lee el archivo línea a línea sin cargarlo en memoria."""
    with open(ruta, encoding="utf-8", errors="replace") as f:
        for i, linea in enumerate(f):
            if i >= MAX_LINEAS:
                break          # Límite de seguridad contra archivos enormes
            yield linea.rstrip("\n")


def parsear_fila(lineas: Iterator[str]) -> Generator[dict, None, None]:
    """Etapa 2: Convierte cada línea CSV a un diccionario."""
    reader = csv.DictReader(lineas)   # DictReader también es un iterador
    for fila in reader:
        yield dict(fila)


def filtrar_activos(filas: Iterator[dict]) -> Generator[dict, None, None]:
    """Etapa 3: Filtra solo los registros activos."""
    for fila in filas:
        if fila.get("estado", "").lower() == "activo":
            yield fila


def normalizar_email(filas: Iterator[dict]) -> Generator[dict, None, None]:
    """Etapa 4: Normaliza emails a minúsculas."""
    for fila in filas:
        if "email" in fila and fila["email"]:
            fila["email"] = fila["email"].lower().strip()
        yield fila


def pipeline_usuarios(ruta: Path) -> Iterator[dict]:
    """Compone el pipeline completo — cada etapa es lazy."""
    lineas     = leer_csv(ruta)
    filas      = parsear_fila(lineas)
    activos    = filtrar_activos(filas)
    normalizados = normalizar_email(activos)
    return normalizados


# Uso: procesa 1M de filas con ~50 KB de RAM
# for usuario in pipeline_usuarios(Path("datos/usuarios.csv")):
#     insertar_en_bd(usuario)
```

### Lab 4.3 — Generadores como Corrutinas (send)

```python
# corutinas.py
"""Uso avanzado de generadores con send() para corrutinas bidireccionales."""

from typing import Generator


def acumulador_seguro(
    limite_max: float = 1_000_000
) -> Generator[float, float, str]:
    """Corrutina que acumula valores y los devuelve como media móvil.

    Yields:
        Media acumulada actual.
    Receives (via send):
        Nuevo valor a acumular.
    Returns:
        Mensaje de cierre al agotar el generador.
    """
    total   = 0.0
    conteo  = 0

    while True:
        valor = yield (total / conteo if conteo > 0 else 0.0)

        if valor is None:
            break

        if not isinstance(valor, (int, float)) or valor != valor:  # NaN
            continue   # Ignorar valores no válidos

        total += valor
        conteo += 1

        if total > limite_max:
            return f"Límite de acumulación alcanzado: {total:.2f}"


# Uso
gen = acumulador_seguro(limite_max=100_000)
next(gen)          # Inicializar la corrutina (avanzar hasta el primer yield)
print(gen.send(10.0))   # 10.0
print(gen.send(20.0))   # 15.0
print(gen.send(30.0))   # 20.0
```

---

## III. Ciberseguridad — Blue Team

| Riesgo                                          | Fallo común                                                     | Mitigación                                                       | Referencia           |
| ----------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------- |
| **DoS por carga completa en memoria**           | `datos = list(cursor.fetchall())` con millones de filas         | Usar `cursor.fetchmany(1000)` o generadores; límite `MAX_ROWS`   | CWE-400 · NIST SI-12 |
| **Generador sin límite superior**               | `yield from requests.get(url).iter_content()` sin tamaño máximo | `islice(gen, MAX_ITEMS)` o counter dentro del generador          | CWE-400 · NIST SI-12 |
| **Estado mutable compartido**                   | Generador que modifica listas externas como efecto secundario   | Los generadores deben ser funciones puras; solo `yield` datos    | CWE-476              |
| **`StopIteration` no manejado**                 | `next(gen)` sin `default` en código crítico                     | Usar `next(gen, None)` o envolver en `try/except StopIteration`  | CWE-248              |
| **Generador de líneas de archivo sin encoding** | `open(f)` sin `encoding="utf-8"` — diferente en cada OS         | Siempre especificar `encoding` y `errors="replace"` o `"ignore"` | NIST SI-10           |
| **Pipeline sin límite de lineas**               | Parsear un CSV de 100 GB enviado por el cliente                 | `MAX_LINEAS = 500_000` + log de warning si se alcanza el límite  | CWE-400 · NIST SI-12 |

---

## IV. Validación Spec-Driven — Módulo 04

```python
# validacion/modulo_04.py
"""Esquemas Pydantic para configuración de pipelines y generadores."""

from pydantic import BaseModel, Field, field_validator
from pathlib import Path
from typing import Annotated, Literal


class ConfiguracionPipeline(BaseModel):
    """Valida los parámetros de un pipeline ETL antes de ejecutarlo."""

    ruta_entrada: Path
    formato:      Literal["csv", "json", "jsonl", "tsv"]
    max_filas:    Annotated[int, Field(ge=1, le=10_000_000)] = 500_000
    encoding:     str = Field(default="utf-8", pattern=r"^[a-z0-9\-]+$")
    separador:    str = Field(default=",", min_length=1, max_length=1)

    @field_validator("ruta_entrada")
    @classmethod
    def archivo_existe(cls, v: Path) -> Path:
        if not v.exists():
            raise ValueError(f"El archivo no existe: {v}")
        if not v.is_file():
            raise ValueError(f"La ruta no es un archivo: {v}")
        if v.stat().st_size == 0:
            raise ValueError(f"El archivo está vacío: {v}")
        return v

    @field_validator("ruta_entrada")
    @classmethod
    def extension_valida(cls, v: Path) -> Path:
        extensiones = {".csv", ".json", ".jsonl", ".tsv", ".txt"}
        if v.suffix.lower() not in extensiones:
            raise ValueError(f"Extensión no permitida: {v.suffix}")
        return v

    model_config = {"frozen": True}


class LimitesMemoria(BaseModel):
    """Define los límites de consumo de memoria para un proceso de streaming."""

    max_mb_ram:     Annotated[int, Field(ge=10, le=4096)]   = 256
    max_filas:      Annotated[int, Field(ge=100, le=10_000_000)] = 500_000
    chunk_size:     Annotated[int, Field(ge=100, le=50_000)] = 1_000

    model_config = {"frozen": True}
```

---

## V. Referencia Rápida del Módulo 04

```
Sintaxis básica:
  def gen(): yield valor        → función generadora
  (x for x in iter)            → expresión generadora
  yield from sub_gen            → delegar a sub-generador
  gen.send(valor)               → enviar valor a corrutina
  gen.throw(ExcType)            → lanzar excepción dentro del generador
  gen.close()                   → cerrar el generador (lanza GeneratorExit)

Inspección:
  inspect.getgeneratorstate(g)  → GEN_CREATED/RUNNING/SUSPENDED/CLOSED
  next(gen, default)            → siguiente valor o default si StopIteration

Utilidades:
  itertools.islice(gen, n)      → primeros n valores (límite de seguridad)
  itertools.chain(g1, g2)       → concatenar generadores
  itertools.chain.from_iterable → aplanar iterables de iterables
  itertools.tee(gen, n)         → n copias independientes de un generador

Regla de oro:
  Si los datos caben en RAM → lista o dict
  Si los datos son grandes o infinitos → generador
  Si los datos son un pipeline de transformaciones → generadores encadenados
```

---

**Anterior:** [03 — Control de Flujo](./modulo-03-control-de-flujo.md)
**Siguiente:** [05 — Excepciones](./modulo-05-excepciones.md)

---

## VI. Métricas de Cumplimiento ENS/RGPD

| Control                                   | Referencia                          | Implementación en este módulo                                                      | Estado |
| ----------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------- | ------ |
| Prevención DoS por agotamiento de memoria | NIST SI-12 · CWE-400                | Generadores lazy; `islice(fuente, MAX_ITEMS)` en todo input externo                | ✅     |
| Límite de recursos en pipelines           | ENS [mp.com.1] Gestión de capacidad | `MAX_LINEAS`, `MAX_BYTES` como constantes documentadas y validadas                 | ✅     |
| Sin estado global mutable en generadores  | CWE-476 · ISO 12207 §5.3            | Generadores como funciones puras; estado solo vía `yield`/`send`                   | ✅     |
| Trazabilidad de truncado de datos         | ENS [op.mon.1]                      | Log de `WARNING` cuando se alcanza el límite `MAX_ITEMS`                           | ✅     |
| Minimización de datos en tránsito         | RGPD Art. 5(1)(c)                   | Solo los campos necesarios pasan por el pipeline; no materializar antes de filtrar | ✅     |

---

## VII. Práctica Profesional

> **Escenario:** Un departamento de RRHH necesita exportar 500.000 registros de empleados desde PostgreSQL (Supabase) a CSV para auditoría. El proceso no puede superar 256 MB de RAM y debe completarse en < 5 minutos. Los datos de empleados contienen PII (RGPD).

**Requerimiento del cliente:**

- RAM máxima: 256 MB
- Timeout: 300 segundos
- PII (email, teléfono) debe anonimizarse antes de escribir el CSV

```python
# exportador/pipeline_rrhh.py
"""Exportación de empleados con anonimización PII vía generadores."""

import csv, io, hashlib
from itertools import islice
from pathlib import Path

MAX_FILAS = 500_000


def _anonimizar(valor: str) -> str:
    """SHA-256 truncado — referenciable pero no reversible."""
    return hashlib.sha256(valor.encode()).hexdigest()[:12]


def exportar_empleados(cursor, ruta_salida: Path) -> int:
    """Escribe CSV anonimizado sin cargar todos los registros en RAM."""
    escritas = 0
    with open(ruta_salida, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "departamento", "email_hash", "telefono_hash"])
        for fila in islice(cursor, MAX_FILAS):
            writer.writerow([
                fila["id"],
                fila["departamento"],
                _anonimizar(fila["email"]),
                _anonimizar(fila.get("telefono", "")),
            ])
            escritas += 1
    return escritas
```

\_ISO 12207 · NIST CSF 2.0 · ENS
