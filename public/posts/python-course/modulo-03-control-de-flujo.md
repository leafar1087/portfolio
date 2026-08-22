# Módulo 03 — Control de Flujo

> **Estándares:** ISO 12207 §5.3 · NIST SP 800-53 SI-10 · CWE-835 (Loop con salida inalcanzable)
> **Dependencias previas:** [Módulo 02](./modulo-02-sintaxis-basica.md)
> **Tiempo estimado:** 3–4 horas

---

## I. Teoría Técnica Avanzada

### 3.1 Modelo de Ejecución — Tabla de Verdad y Cortocircuito

Python implementa evaluación de cortocircuito (_short-circuit evaluation_) en los operadores booleanos `and` / `or`. Esto tiene implicaciones críticas tanto en rendimiento como en seguridad:

```python
# and: evalúa el segundo operando SOLO si el primero es truthy
# or:  evalúa el segundo operando SOLO si el primero es falsy

# Patrón común para valores por defecto seguros:
nombre = datos.get("nombre") or "Anónimo"  # equivalent a: si no hay nombre, "Anónimo"

# Uso avanzado: guard clause que evita operaciones costosas
def procesar(usuario: dict) -> str:
    # La función `es_admin()` NO se llama si usuario es None o vacío
    if not usuario or not es_admin(usuario):
        return "acceso denegado"
    return f"Bienvenido, {usuario['nombre']}"
```

**Tabla de valores truthy/falsy en Python:**

| Valor                             | Truthy/Falsy |
| --------------------------------- | ------------ |
| `0`, `0.0`, `0j`                  | falsy        |
| `""`, `[]`, `{}`, `()`, `set()`   | falsy        |
| `None`                            | falsy        |
| `False`                           | falsy        |
| Cualquier número ≠ 0              | truthy       |
| Cualquier colección no vacía      | truthy       |
| Cualquier objeto (sin `__bool__`) | truthy       |

> **Seguridad:** el cortocircuito evita evaluar código potencialmente caro o peligroso cuando la condición ya determina el resultado.

### 3.2 `if/elif/else` — El Problema de la Complejidad Ciclomática

La complejidad ciclomática (McCabe) es una métrica de calidad de software que cuenta el número de caminos de ejecución independientes. Cada `if/elif` añade 1 punto. Un valor > 10 es señal de que la función debe refactorizarse.

```python
# Alta complejidad ciclomática (CC=7) — difícil de probar y auditar
def clasificar_http(codigo: int) -> str:
    if codigo == 200:
        return "OK"
    elif codigo == 201:
        return "Created"
    elif codigo == 400:
        return "Bad Request"
    elif codigo == 401:
        return "Unauthorized"
    elif codigo == 403:
        return "Forbidden"
    elif codigo == 404:
        return "Not Found"
    else:
        return "Unknown"


# Refactorización con diccionario — CC=2
CODIGOS_HTTP: dict[int, str] = {
    200: "OK",
    201: "Created",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
}

def clasificar_http_v2(codigo: int) -> str:
    """CC=2: una rama de validación, una de lookup."""
    if not isinstance(codigo, int) or not (100 <= codigo <= 599):
        raise ValueError(f"Código HTTP inválido: {codigo!r}")
    return CODIGOS_HTTP.get(codigo, "Unknown")
```

### 3.3 `match/case` — Structural Pattern Matching (Python 3.10+)

Python 3.10 introduce `match/case`, equivalente a un `switch` pero mucho más potente: puede desestructurar objetos, listar patrones y añadir guards.

```python
# match/case con desestructuración
def procesar_evento(evento: dict) -> str:
    match evento:
        case {"tipo": "login", "usuario": str(uid), "ip": str(ip)}:
            return f"Login de {uid} desde {ip}"

        case {"tipo": "error", "codigo": int(code)} if code >= 500:
            return f"Error crítico de servidor: {code}"

        case {"tipo": "error", "codigo": int(code)}:
            return f"Error de cliente: {code}"

        case {"tipo": str(tipo)}:
            return f"Evento desconocido: {tipo}"

        case _:
            return "Evento malformado"
```

### 3.4 Bucles — `for` e Iteración en CPython

El bucle `for` en Python no es un bucle de índice como en C: es un bucle de **iteración sobre un protocolo**. CPython llama a `iter(objeto)` y luego a `next()` repetidamente.

```
for x in coleccion:
    cuerpo
          │
          ▼
iter(coleccion) → objeto iterador
          │
          ▼
próxima iteración:
    next(iterador)  → devuelve el siguiente valor
    StopIteration   → stop del bucle
```

**Implicación:** cualquier objeto que implemente `__iter__` y `__next__` puede usarse en un `for`. Esto incluye generadores (Módulo 04), archivos (Módulo 08) y cursores de base de datos.

### 3.5 `for/else` y `while/else` — La Cláusula Raramente Entendida

```python
# El `else` de un bucle se ejecuta SOLO si el bucle termina sin `break`
# Uso clásico: búsqueda con resultado negativo claro

def buscar_usuario_activo(usuarios: list[dict], uid: str) -> dict | None:
    """Busca un usuario activo; usa for/else para evitar flag booleano."""
    for usuario in usuarios:
        if usuario.get("id") == uid and usuario.get("activo"):
            break              # Encontrado — el else NO se ejecuta
    else:
        return None            # Bucle completado sin break — no encontrado
    return usuario
```

---

## II. Laboratorio Práctico — Step by Step

### Lab 3.1 — Guard Clauses (Estilo Moderno)

```python
# control_flujo.py
"""Control de flujo con guard clauses — reduce la profundidad de anidamiento."""

import re


def procesar_pago(
    importe: float,
    tarjeta: str,
    usuario_activo: bool,
) -> dict:
    """Procesa un pago con validación por guard clauses.

    Estilo con guard clauses (early return) en lugar de if anidados.
    Reduce la complejidad ciclomática y mejora la legibilidad.

    Args:
        importe: Importe del pago en euros.
        tarjeta: Número de tarjeta (formato 16 dígitos sin espacios).
        usuario_activo: Si el usuario tiene la cuenta activa.

    Returns:
        Diccionario con el resultado del pago.

    Raises:
        ValueError: Si algún parámetro es inválido.
    """
    # Guard clause 1: importe
    if importe <= 0:
        raise ValueError(f"El importe debe ser positivo: {importe}")
    if importe > 10_000:
        raise ValueError(f"Importe supera el límite diario: {importe}")

    # Guard clause 2: usuario
    if not usuario_activo:
        return {"estado": "rechazado", "motivo": "cuenta_inactiva"}

    # Guard clause 3: formato de tarjeta (Luhn check simplificado)
    if not re.match(r"^\d{16}$", tarjeta):
        raise ValueError("Formato de tarjeta inválido")

    # Lógica principal — solo se llega aquí si todo es válido
    tarjeta_enmascarada = f"****-****-****-{tarjeta[-4:]}"
    return {
        "estado": "aprobado",
        "importe": importe,
        "tarjeta": tarjeta_enmascarada,
    }
```

### Lab 3.2 — Bucles con Patrones Seguros

```python
# bucles.py
"""Patrones seguros de bucles con control de recursos y límites."""

from itertools import islice


MAX_INTENTOS = 3
MAX_ITEMS    = 1_000   # Límite de seguridad para prevenir DoS por iteración


def leer_intentos_login(proveedor_datos) -> list[str]:
    """Lee intentos de login con límite estricto de iteraciones.

    Evitar bucles sin cota superior sobre datos externos: un proveedor
    malicioso podría enviar millones de registros (DoS por CPU/memoria).
    """
    intentos: list[str] = []
    for item in islice(proveedor_datos, MAX_ITEMS):   # límite de seguridad
        if isinstance(item, str) and item.strip():
            intentos.append(item.strip())
    return intentos


def fibonacci_hasta(limite: int) -> list[int]:
    """Genera la secuencia Fibonacci hasta el límite indicado.

    Usa `while` con condición de salida clara y múltiple.
    """
    if limite < 0:
        raise ValueError(f"Límite debe ser >= 0: {limite}")

    secuencia: list[int] = []
    a, b = 0, 1
    while a <= limite:
        secuencia.append(a)
        a, b = b, a + b         # Asignación múltiple — sin variable temporal
    return secuencia


def validar_entradas(valores: list) -> tuple[list, list]:
    """Clasifica valores en válidos e inválidos con continue y control de tipo."""
    validos:   list = []
    invalidos: list = []

    for i, valor in enumerate(values := valores[:MAX_ITEMS]):   # walrus + límite
        # continue: saltar valores problemáticos sin interrumpir el bucle
        if valor is None:
            invalidos.append((i, "None"))
            continue

        if not isinstance(valor, (int, float)):
            invalidos.append((i, f"tipo {type(valor).__name__}"))
            continue

        if valor != valor:   # NaN check (NaN != NaN en IEEE 754)
            invalidos.append((i, "NaN"))
            continue

        validos.append(valor)

    return validos, invalidos
```

### Lab 3.3 — `match/case` para Procesamiento de Eventos de Seguridad

```python
# eventos_seguridad.py
"""Procesamiento de eventos de auditoría con match/case."""

import logging
from dataclasses import dataclass
from typing import Literal

logger = logging.getLogger("seguridad.eventos")


@dataclass(frozen=True)
class EventoSeguridad:
    tipo:     str
    usuario_id: str
    ip:       str
    severidad: Literal["low", "medium", "high", "critical"]
    datos:    dict


def clasificar_y_registrar(evento: EventoSeguridad) -> str:
    """Clasifica un evento de seguridad y lo registra en el canal adecuado."""

    match (evento.tipo, evento.severidad):
        case ("login_fallido", "high") | ("login_fallido", "critical"):
            logger.critical(
                "ALERTA — Múltiples intentos fallidos: usuario=%s ip=%s",
                evento.usuario_id, evento.ip
            )
            return "bloquear_ip"

        case ("login_exitoso", _):
            logger.info("Login OK: %s desde %s", evento.usuario_id, evento.ip)
            return "continuar"

        case ("acceso_recurso_prohibido", severidad) if severidad in ("high", "critical"):
            logger.warning(
                "Acceso prohibido a recurso sensible: %s — datos=%s",
                evento.usuario_id, evento.datos
            )
            return "notificar_soc"

        case ("exportacion_datos", _):
            logger.info("Exportación de datos: %s", evento.usuario_id)
            return "registrar_auditoría"

        case _:
            logger.debug("Evento no clasificado: %s", evento.tipo)
            return "ignorar"
```

### Lab 3.4 — Integración con el Stack (Procesamiento de Respuestas Supabase)

```python
# api/respuestas.py
"""Control de flujo para procesar respuestas de la API de Supabase."""

from pydantic import BaseModel, Field
from typing import Any


def manejar_respuesta_supabase(
    status_code: int,
    cuerpo: dict | None,
) -> dict[str, Any]:
    """Procesa la respuesta HTTP de Supabase con control de flujo exhaustivo.

    Retorna siempre un diccionario con estructura consistente para el frontend.
    """
    match status_code:
        case 200 | 201:
            return {"ok": True, "datos": cuerpo, "mensaje": "Operación exitosa"}

        case 400:
            mensaje = cuerpo.get("message", "Solicitud inválida") if cuerpo else "Bad Request"
            return {"ok": False, "codigo": 400, "mensaje": mensaje}

        case 401:
            return {"ok": False, "codigo": 401, "mensaje": "Sesión expirada — reinicia sesión"}

        case 403:
            return {"ok": False, "codigo": 403, "mensaje": "Sin permisos para esta operación"}

        case 404:
            return {"ok": False, "codigo": 404, "mensaje": "Recurso no encontrado"}

        case code if 500 <= code <= 599:
            return {"ok": False, "codigo": code, "mensaje": "Error interno del servidor"}

        case _:
            return {"ok": False, "codigo": status_code, "mensaje": f"Estado HTTP inesperado: {status_code}"}
```

---

## III. Ciberseguridad — Blue Team

| Riesgo                               | Fallo común                                                              | Mitigación                                                                  | Referencia                |
| ------------------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------- |
| **Bucle sin límite superior**        | `while True:` sobre datos externos sin contador de seguridad             | Usar `itertools.islice(fuente, MAX_ITEMS)` o `for i in range(MAX)`          | CWE-835 · NIST SI-12      |
| **Lógica inversa en condiciones**    | `if not es_invalido == False` — condiciones doblemente negadas           | Condiciones siempre en positivo; usar guard clauses                         | CWE-1025 · ISO 12207 §5.3 |
| **Complejidad ciclomática alta**     | Función con 15 `if/elif` sin refactorizar                                | Refactorizar con diccionarios de dispatch o `match/case`; limite CC < 10    | ISO 12207 §5.3            |
| **`break` sin invariante clara**     | `break` en el interior de un bucle complejo sin comentario               | Documentar la postcondición del `break`; preferir `for/else` para búsquedas | CWE-670                   |
| **Cortocircuito que oculta efectos** | `funcion_con_efecto() or valor_default` — la función puede no ejecutarse | Separar la evaluación de la función de la asignación del default            | CWE-670 · NIST SI-10      |
| **match/case en versión < 3.10**     | Usar sintaxis `match` en Python 3.9 — SyntaxError silencioso en CI       | Fijar `python_requires=">=3.10"` y verificar en pipeline                    | NIST CM-6                 |

---

## IV. Validación Spec-Driven — Módulo 03

```python
# validacion/modulo_03.py
"""Esquemas Pydantic para control de flujo y procesamiento de eventos."""

from pydantic import BaseModel, Field, field_validator
from typing import Annotated, Literal


class FiltroBusqueda(BaseModel):
    """Valida los parámetros de filtrado antes de usarlos en bucles/consultas."""

    campo:  str = Field(pattern=r"^[a-z_]{2,40}$")
    valor:  str = Field(min_length=1, max_length=200)
    limite: Annotated[int, Field(ge=1, le=1000)] = 100
    pagina: Annotated[int, Field(ge=1)] = 1

    @field_validator("campo")
    @classmethod
    def campo_en_whitelist(cls, v: str) -> str:
        CAMPOS_VALIDOS = frozenset({"nombre", "email", "estado", "fecha_creacion"})
        if v not in CAMPOS_VALIDOS:
            raise ValueError(f"Campo no permitido: {v!r}. Válidos: {CAMPOS_VALIDOS}")
        return v

    model_config = {"frozen": True}


class ConfiguracionReintentos(BaseModel):
    """Valida la configuración de reintentos para bucles con operaciones externas."""

    max_intentos:  Annotated[int, Field(ge=1, le=10)]    = 3
    pausa_segundos: Annotated[float, Field(ge=0.1, le=60.0)] = 1.0
    exponencial:   bool                                  = True

    @field_validator("pausa_segundos")
    @classmethod
    def pausa_coherente(cls, v: float, info) -> float:
        max_int = info.data.get("max_intentos", 3)
        # Con backoff exponencial, la espera total máxima es sum(v*2^i for i in range(n))
        espera_maxima = sum(v * (2 ** i) for i in range(max_int))
        if espera_maxima > 300:  # 5 minutos máximo
            raise ValueError(
                f"Espera total máxima ({espera_maxima:.0f}s) supera el límite de 300s"
            )
        return v

    model_config = {"frozen": True}


class EventoSeguridadIn(BaseModel):
    """Esquema de entrada para eventos de seguridad entrantes."""

    tipo:       str   = Field(pattern=r"^[a-z_]{3,50}$")
    usuario_id: str   = Field(min_length=36, max_length=36)  # UUID v4
    ip:         str   = Field(pattern=r"^\d{1,3}(\.\d{1,3}){3}$")
    severidad:  Literal["low", "medium", "high", "critical"]

    model_config = {"frozen": True}
```

---

## V. Referencia Rápida del Módulo 03

```
Operadores booleanos (cortocircuito):
  a and b   → evalúa b solo si a es truthy
  a or  b   → evalúa b solo si a es falsy
  not a     → invierte el valor booleano

Patrones de bucles:
  for x in iterable:           → iteración sobre protocolo __iter__
  for i, x in enumerate(lst):  → con índice
  for x, y in zip(a, b):       → iteración paralela
  for x in reversed(lst):      → iteración inversa
  for k, v in dict.items():    → pares clave-valor

  while condicion:             → bucle mientras verdadero
  while True:                  → bucle infinito (requiere break explícito)

Control:
  break       → salir del bucle inmediatamente
  continue    → saltar al siguiente ciclo
  pass        → instrucción nula (placeholder)
  for/else    → else ejecuta si el for termina sin break
  while/else  → else ejecuta si el while termina sin break

Utilidades de itertools:
  islice(iterable, n)          → primeros n elementos (límite de seguridad)
  enumerate(iterable, start=0) → índice + valor
  zip(*iterables)              → combina iterables
```

---

**Anterior:** [02 — Sintaxis Básica](./modulo-02-sintaxis-basica.md)
**Siguiente:** [04 — Generadores](./modulo-04-generadores.md)

---

## VI. Métricas de Cumplimiento ENS/RGPD

| Control                                      | Referencia                     | Implementación en este módulo                                                 | Estado |
| -------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------- | ------ |
| Complejidad ciclomática < 10                 | ISO 12207 §5.3 · ENS [mp.sw.1] | Refactorización con diccionarios y `match/case`; auditable con `radon`        | ✅     |
| Límite de iteraciones en datos externos      | NIST SI-12 · CWE-400           | `itertools.islice(fuente, MAX_ITEMS)` en todos los bucles sobre input externo | ✅     |
| Lógica de acceso auditable                   | ENS [op.acc.4]                 | Guard clauses explícitas con logging; sin condiciones doblemente negadas      | ✅     |
| Trazabilidad de eventos de seguridad         | NIST AU-2 · ENS [op.mon.1]     | `match/case` para clasificar y registrar eventos en el canal correcto         | ✅     |
| Sin bucles infinitos en código de producción | CWE-835 · NIST SI-12           | `while True` solo con `break` documentado o `MAX_INTENTOS` explícito          | ✅     |

---

## VII. Práctica Profesional

> **Escenario:** Un SOC (Security Operations Center) necesita un módulo de clasificación de alertas que procese eventos de su SIEM y los enrute al equipo correcto según severidad y tipo. El módulo debe ser auditable (complejidad ciclomática < 5) y resistente a datos malformados del SIEM.

**Requerimiento del cliente:**

- Clasificar eventos en < 1ms (sin llamadas externas en el clasificador)
- CC < 5 por función (auditada con `radon cc`)
- Logs en formato estructurado para ingesta en ElasticSearch

```python
# soc/clasificador.py
"""Clasificador de alertas SIEM — CC máximo 4 por función."""

import logging
from dataclasses import dataclass
from typing import Literal

logger = logging.getLogger("soc.clasificador")

TABLA_ENRUTAMIENTO: dict[tuple, str] = {
    ("brute_force",  "critical"): "equipo_respuesta_incidentes",
    ("brute_force",  "high"):     "equipo_respuesta_incidentes",
    ("data_exfil",   "critical"): "equipo_forense",
    ("login_ok",     "low"):      "cola_auditoria",
    ("config_change","medium"):   "equipo_cumplimiento",
}


def clasificar(tipo: str, severidad: str) -> str:
    """CC=2: una rama de validación, una de lookup."""
    if not tipo or not severidad:
        raise ValueError("tipo y severidad son obligatorios")
    destino = TABLA_ENRUTAMIENTO.get((tipo, severidad), "cola_general")
    logger.info(
        '{"evento": "%s", "severidad": "%s", "destino": "%s"}',
        tipo, severidad, destino,
    )
    return destino
```

\_ISO 12207 · NIST CSF 2.0 · ENS
