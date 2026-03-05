# Módulo 13 — Expresiones Regulares (Regex)

> **Estándares:** ISO 12207 §5.4 · NIST SP 800-53 SI-10 · CWE-185 (Regex incorrecta) · CWE-400 (ReDoS)
> **Dependencias previas:** [Módulo 03](./modulo-03-control-de-flujo.md)
> **Tiempo estimado:** 3 horas

---

## I. Teoría Técnica Avanzada

### 13.1 El Motor de Regex en CPython — NFA vs. DFA

CPython usa un motor **NFA (Non-deterministic Finite Automaton)** para procesar expresiones regulares. La implicación crítica es que ciertas regexes sobre ciertos inputs pueden provocar **backtracking exponencial** (ReDoS).

```
Input: "aaaaaaaaaaaaaaaaaaaab"
Regex: ^(a+)+$

NFA traversal:
  (a+) intenta capturar 1 a → falla en 'b' → retrocede
  (a+) intenta capturar 2 a → falla en 'b' → retrocede
  ...
  2^n intentos para n caracteres 'a' → O(2^n) tiempo
```

**Regla anti-ReDoS:** nunca usar grupos repetidos anidados (`(a+)+`, `(a|aa)+`) sobre input externo sin límite de longitud.

### 13.2 Anatomía de una Expresión Regular

```
^(?P<protocolo>https?)://(?P<dominio>[a-z0-9.-]{1,253})/(?P<ruta>[^<>"{}\s]{0,2048})$
│  │            │       │   │          │               │   │        │              │
│  └─ grupo     │       │   └─ charset │               │   └─ grupo │              │
│     nombrado  │       │     de char  │               │     nombrado│             │
└─ anchor       └─ ?    │              └─ cuantificador│             └─ cuantificador
   inicio          literal              (1 a 253)      └─ clase negada
                   regex
```

**Cuantificadores clave:**

| Cuantificador | Significado | Greedy   | Lazy      |
| ------------- | ----------- | -------- | --------- |
| `*`           | 0 o más     | `a*`     | `a*?`     |
| `+`           | 1 o más     | `a+`     | `a+?`     |
| `?`           | 0 o 1       | `a?`     | `a??`     |
| `{n,m}`       | entre n y m | `a{2,5}` | `a{2,5}?` |

> **Regla de seguridad:** en input externo, preferir cuantificadores con **límite máximo explícito** (`{1,100}` en lugar de `+` o `*`).

### 13.3 Grupos y Capturas

```python
import re

# Grupo nombrado → acceso por nombre en lugar de índice
patron = re.compile(
    r"(?P<anio>\d{4})-(?P<mes>\d{2})-(?P<dia>\d{2})"
)

m = patron.match("2024-03-15")
if m:
    print(m.group("anio"))   # "2024"
    print(m.group("mes"))    # "03"
    print(m.groupdict())     # {'anio': '2024', 'mes': '03', 'dia': '15'}

# Grupo no capturador (?:...) → agrupación sin captura
patron_tel = re.compile(r"(?:\+34)?[6-9]\d{8}")
```

---

## II. Laboratorio Práctico — Step by Step

### Lab 13.1 — Biblioteca de Patrones Seguros

```python
# regex/patrones.py
"""Patrones de validación compilados — inmutables y reutilizables."""

import re
from typing import Pattern

# Compilar en módulo-load (no en cada llamada) — ahorra ~10μs por uso
EMAIL: Pattern[str] = re.compile(
    r"^[a-zA-Z0-9._%+\-]{1,64}@[a-zA-Z0-9.\-]{1,253}\.[a-zA-Z]{2,63}$"
)

# UUID v4
UUID_V4: Pattern[str] = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    re.IGNORECASE,
)

# Teléfono internacional (E.164 simplificado)
TELEFONO_E164: Pattern[str] = re.compile(r"^\+?[1-9]\d{6,14}$")

# Contraseña segura
CONTRASENA_SEGURA: Pattern[str] = re.compile(
    r"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$"
)

# IPv4 básico (para logging — no usar para routing)
IPV4: Pattern[str] = re.compile(
    r"^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$"
)

# SQL Injection básico — para logging de alertas, NO como única defensa
SQL_INJECTION_ALERT: Pattern[str] = re.compile(
    r"(?:--|;|\/\*|\*\/|xp_|UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO|'.*')",
    re.IGNORECASE,
)

# Nombre de archivo seguro (sin path traversal)
NOMBRE_ARCHIVO_SEGURO: Pattern[str] = re.compile(r"^[a-zA-Z0-9_\-\.]{1,255}$")

# Fecha ISO 8601
FECHA_ISO8601: Pattern[str] = re.compile(
    r"^(?P<anio>\d{4})-(?P<mes>0[1-9]|1[0-2])-(?P<dia>0[1-9]|[12]\d|3[01])$"
)
```

### Lab 13.2 — Validador con Límites Anti-ReDoS

```python
# regex/validador.py
"""Validaciones seguras con límites de longitud anti-ReDoS."""

import re
import logging
from .patrones import (
    EMAIL, UUID_V4, TELEFONO_E164,
    CONTRASENA_SEGURA, IPV4, NOMBRE_ARCHIVO_SEGURO,
    SQL_INJECTION_ALERT,
)

logger = logging.getLogger("seguridad.validacion")

# Límite de longitud ANTES de aplicar cualquier regex — previene ReDoS
MAX_LONGITUDES = {
    "email":      320,
    "uuid":       36,
    "telefono":   16,
    "contrasena": 128,
    "ip":         45,
    "archivo":    255,
}


def _longitud_ok(campo: str, valor: str) -> bool:
    """Verifica longitud máxima antes de ejecutar la regex."""
    limite = MAX_LONGITUDES.get(campo, 1000)
    if len(valor) > limite:
        logger.warning("Campo %r supera longitud máxima: %d > %d", campo, len(valor), limite)
        return False
    return True


def validar_email(valor: str) -> bool:
    return _longitud_ok("email", valor) and bool(EMAIL.match(valor))


def validar_uuid(valor: str) -> bool:
    return _longitud_ok("uuid", valor) and bool(UUID_V4.match(valor))


def validar_telefono(valor: str) -> bool:
    return _longitud_ok("telefono", valor) and bool(TELEFONO_E164.match(valor))


def validar_contrasena(valor: str) -> bool:
    return _longitud_ok("contrasena", valor) and bool(CONTRASENA_SEGURA.match(valor))


def validar_nombre_archivo(valor: str) -> bool:
    """Valida el nombre y detecta path traversal."""
    if ".." in valor or "/" in valor or "\\" in valor:
        logger.warning("Path traversal en nombre de archivo: %r", valor)
        return False
    return _longitud_ok("archivo", valor) and bool(NOMBRE_ARCHIVO_SEGURO.match(valor))


def detectar_sql_injection(valor: str) -> bool:
    """Detecta patrones de SQL Injection para logging de alertas.

    IMPORTANTE: Esta detección es adicional, no reemplaza el uso de
    consultas parametrizadas como defensa principal.
    """
    if SQL_INJECTION_ALERT.search(valor):
        logger.warning("Posible SQL Injection detectado en input: %r", valor[:100])
        return True
    return False
```

### Lab 13.3 — Extracción Estructurada de Logs

```python
# regex/parser_logs.py
"""Parser de líneas de log con grupos nombrados para análisis."""

import re
from dataclasses import dataclass
from datetime import datetime
from typing import Iterator


@dataclass(frozen=True)
class EntradaLog:
    timestamp: datetime
    nivel:     str
    modulo:    str
    mensaje:   str
    ip:        str | None = None


PATRON_LOG = re.compile(
    r"^(?P<fecha>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\s+"
    r"(?P<nivel>DEBUG|INFO|WARNING|ERROR|CRITICAL)\s+"
    r"\[(?P<modulo>[^\]]{1,100})\]\s+"
    r"(?:ip=(?P<ip>\d{1,3}(?:\.\d{1,3}){3})\s+)?"
    r"(?P<mensaje>.{1,2000})$"
)


def parsear_lineas_log(lineas: Iterator[str]) -> Iterator[EntradaLog]:
    """Parsea líneas de log estructurado usando grupos nombrados."""
    for linea in lineas:
        linea = linea.strip()
        if not linea or linea.startswith("#"):
            continue

        m = PATRON_LOG.match(linea)
        if not m:
            continue   # Línea mal formada — no crash, solo omitir

        datos = m.groupdict()
        try:
            ts = datetime.fromisoformat(datos["fecha"])
        except ValueError:
            continue

        yield EntradaLog(
            timestamp = ts,
            nivel     = datos["nivel"],
            modulo    = datos["modulo"],
            mensaje   = datos["mensaje"].strip(),
            ip        = datos.get("ip"),
        )
```

---

## III. Ciberseguridad — Blue Team

| Riesgo                                | Fallo común                                                         | Mitigación                                                                                                 | Referencia           |
| ------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------- |
| **ReDoS**                             | `re.match(r"^(a+)+$", input_externo)` — grupos anidados sin límite  | Validar longitud antes de aplicar regex; evitar cuantificadores anidados; usar `re.timeout` (Python 3.11+) | CWE-400 · NIST SI-10 |
| **Regex demasiado permisiva**         | `r".+"` para validar email — acepta cualquier cosa                  | Usar constraints estrictos: `[a-zA-Z0-9._%+\-]{1,64}@...`                                                  | CWE-185 · NIST SI-10 |
| **`re.match` vs. `re.fullmatch`**     | `re.match(r"\d+", "123abc")` → match (True)                         | Usar `^` y `$` o `re.fullmatch()` para que la regex cubra el string completo                               | CWE-185              |
| **Regex como única defensa SQL**      | Usar regex para detectar SQL Injection en lugar de consultas param. | Regex para alertas/logging; la defensa real son los parámetros posicionales                                | CWE-89 · NIST SI-10  |
| **No compilar patrones reutilizados** | `re.match(patron, valor)` en bucle — compila en cada iteración      | `re.compile()` al nivel de módulo; reutilizar el objeto `Pattern`                                          | NIST SI-12           |

---

## IV. Validación Spec-Driven — Módulo 13

```python
# validacion/modulo_13.py
from pydantic import BaseModel, Field, field_validator
from typing import Annotated
from .regex.validador import validar_email, validar_uuid, validar_nombre_archivo


class InputValidado(BaseModel):
    """Valida múltiples campos con regex antes de procesarlos."""

    email:          str = Field(max_length=320)
    usuario_id:     str = Field(max_length=36)
    nombre_archivo: str | None = Field(default=None, max_length=255)

    @field_validator("email")
    @classmethod
    def email_valido(cls, v: str) -> str:
        if not validar_email(v):
            raise ValueError(f"Email inválido: {v!r}")
        return v.lower()

    @field_validator("usuario_id")
    @classmethod
    def uuid_valido(cls, v: str) -> str:
        if not validar_uuid(v):
            raise ValueError(f"UUID inválido: {v!r}")
        return v.lower()

    model_config = {"frozen": True}
```

---

## V. Referencia Rápida del Módulo 13

```
Metacaracteres:
  .   → cualquier carácter (excepto \n por defecto)
  ^   → inicio de string (o línea con re.MULTILINE)
  $   → fin de string (o línea con re.MULTILINE)
  *   → 0 o más (greedy)     *? → lazy
  +   → 1 o más (greedy)     +? → lazy
  ?   → 0 o 1 (greedy)       ?? → lazy
  {n,m} → entre n y m        {n,m}? → lazy
  []  → clase de caracteres   [^...] → clase negada
  |   → alternativa
  ()  → grupo capturador      (?:...) → no capturador
  (?P<nombre>...) → grupo nombrado

Clases predefinidas:
  \d → [0-9]        \D → [^0-9]
  \w → [a-zA-Z0-9_] \W → negado
  \s → espacio      \S → no espacio
  \b → límite de palabra

Funciones clave:
  re.compile(patron, flags)   → compilar
  patron.match(s)             → desde el inicio
  patron.fullmatch(s)         → string completo
  patron.search(s)            → en cualquier posición
  patron.findall(s)           → todos los matches como lista
  patron.finditer(s)          → todos como iterador
  patron.sub(repl, s)         → reemplazar
  m.group("nombre")           → grupo nombrado
  m.groupdict()               → todos los grupos como dict

Flags:
  re.IGNORECASE / re.I
  re.MULTILINE  / re.M
  re.DOTALL     / re.S    ← . incluye \n

Anti-ReDoS:
  1. len(valor) <= LIMITE  antes de aplicar regex
  2. Evitar (a+)+ y (a|aa)+
  3. Cuantificadores con límite: {1,100} en vez de +
```

---

**Anterior:** [12 — Funciones Avanzadas](./modulo-12-funciones-avanzadas.md)
**Siguiente:** [14 — Decoradores](./modulo-14-decoradores.md)

## _ISO 12207 · NIST CSF 2.0 · ENS — pildorasinformaticas_

## VI. Métricas de Cumplimiento ENS/RGPD

| Control                                            | Referencia                 | Implementación en este módulo                                            | Estado |
| -------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------ | ------ |
| Validación de longitud antes de regex (anti-ReDoS) | NIST SI-10 · CWE-400       | `len(valor) <= MAX_LONGITUD` antes de cualquier `re.match()`             | ✅     |
| Regex compiladas como constantes de módulo         | NIST CM-6 · ISO 12207 §5.3 | `re.compile()` a nivel de módulo; no en cada llamada                     | ✅     |
| `re.fullmatch()` en validaciones de seguridad      | CWE-185 · NIST SI-10       | Usar `fullmatch` o `^...$`; nunca `match` parcial en validaciones        | ✅     |
| Regex como alerta, no como defensa SQL             | CWE-89 · NIST SI-10        | SQL Injection detectado para logging; la defensa real son parámetros `?` | ✅     |
| Nombre de archivo validado antes de apertura       | CWE-22 · ENS [mp.info.3]   | `NOMBRE_ARCHIVO_SEGURO` patrón + verificación de path traversal          | ✅     |

---

## VII. Práctica Profesional

> **Escenario:** Un portal de salud procesa formularios con datos de pacientes (nombre, teléfono, NIF, dirección de email). Los datos deben validarse antes de persistir, con detección de posibles ataques de inyección. El portal es accesible desde España (ENS Alto + RGPD Art. 9).

**Requerimiento del cliente:**

- Validar: email, teléfono E.164, NIF español, nombre (sin HTML)
- Longitud máxima validada antes de aplicar regex (anti-ReDoS)
- Log de alerta si se detecta SQL Injection o HTML injection

```python
# salud/validador_formulario.py
"""Validación de formulario de paciente con patrones compilados."""

import re, logging
logger = logging.getLogger("salud.validacion")

# Patrones compilados en import-time (no en cada llamada)
_EMAIL    = re.compile(r"^[a-zA-Z0-9._%+\-]{1,64}@[a-zA-Z0-9.\-]{1,253}\.[a-zA-Z]{2,10}$")
_TELEFONO = re.compile(r"^\+?[1-9]\d{6,14}$")
_NIF_ES   = re.compile(r"^[0-9]{8}[A-Z]$")            # NIF español
_HTML_INJ = re.compile(r"[<>\"'%;()]")

LIMITES = {"email": 320, "telefono": 16, "nif": 9, "nombre": 120}


def validar_campo(campo: str, valor: str) -> str:
    """Valida un campo y devuelve el valor normalizado o lanza ValueError."""
    if len(valor) > LIMITES.get(campo, 500):
        raise ValueError(f"{campo}: supera longitud máxima")

    if campo == "email":
        if not _EMAIL.fullmatch(valor):
            raise ValueError("Email inválido")
        return valor.lower().strip()

    if campo == "telefono":
        if not _TELEFONO.fullmatch(valor):
            raise ValueError("Teléfono inválido (E.164)")
        return valor

    if campo == "nif":
        if not _NIF_ES.fullmatch(valor.upper()):
            raise ValueError("NIF inválido")
        return valor.upper()

    if campo == "nombre":
        if _HTML_INJ.search(valor):
            logger.warning("HTML injection en campo nombre: %r", valor[:50])
            raise ValueError("Nombre contiene caracteres no permitidos")
        return valor.strip()

    return valor
```

\_ISO 12207 · NIST CSF 2.0 · ENS
