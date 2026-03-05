# Módulo 01 — Fundamentos e Instalación del Entorno

> **Vídeos:** 0, 1, 2, 2B, 2C — Canal pildorasinformaticas
> **Estándares:** ISO 12207 §5.1 · NIST SP 800-53 CM-6 (Configuración de componentes)
> **Dependencias previas:** Ninguna
> **Tiempo estimado:** 2–3 horas

---

## I. Teoría Técnica Avanzada

### 1.1 ¿Qué es CPython y por qué importa?

Python no es un único programa: es una **especificación del lenguaje** que tiene múltiples implementaciones. La más usada y la implementación de referencia es **CPython**, escrita en C, que es la que se descarga desde [python.org](https://python.org).

```
Código fuente .py
       │
       ▼
   Lexer / Parser          ← Convierte texto a tokens y AST (Abstract Syntax Tree)
       │
       ▼
   Compilador CPython       ← Convierte AST a bytecode (.pyc)
       │
       ▼
   PVM (Python Virtual Machine)  ← Ejecuta bytecode instrucción a instrucción
       │
       ▼
   Sistema operativo / Hardware
```

**Por qué es relevante para el desarrollador:**

1. **Bytecode:** Python no compila a código máquina nativo; compila a bytecode. Esto lo hace portable (mismo `.pyc` en cualquier OS con el mismo Python) pero más lento que C/Rust para cómputo intensivo.
2. **GIL (Global Interpreter Lock):** CPython tiene un mutex global que impide que dos hilos ejecuten bytecode Python simultáneamente. Esto simplifica la gestión de memoria pero limita el paralelismo en tareas CPU-bound (para las que se usa `multiprocessing` en lugar de `threading`).
3. **Reference Counting + Garbage Collector:** CPython gestiona la memoria automáticamente mediante conteo de referencias. Cuando el contador de una variable llega a 0, la memoria se libera inmediatamente. El GC adicional detecta ciclos de referencias (objetos que se apuntan mutuamente sin referencia externa).

```python
import sys

# Ver el número de referencias de un objeto en tiempo real
x = [1, 2, 3]
y = x             # 2 referencias al mismo objeto
print(sys.getrefcount(x))   # 3 (x, y, y el argumento de getrefcount)
del y
print(sys.getrefcount(x))   # 2
```

### 1.2 Tipado Dinámico vs. Tipado Estático

Python es **dinámicamente tipado**: las variables son referencias a objetos, no contenedores de tipo fijo. El tipo es del objeto, no de la variable.

```python
# En Python, `variable` es solo un nombre (etiqueta) que apunta a un objeto
x = 42          # x apunta a un objeto int con valor 42
x = "hola"      # x ahora apunta a un objeto str; el int 42 puede ser recolectado
x = [1, 2, 3]   # x ahora apunta a una lista
```

**Tipado estático opcional con anotaciones (PEP 484):**

A partir de Python 3.5, se pueden añadir anotaciones de tipo que no son validadas en tiempo de ejecución por el intérprete, pero sí por herramientas como `mypy`:

```python
def calcular_iva(precio: float, tasa: float = 0.21) -> float:
    """Calcula el precio con IVA incluido."""
    return precio * (1 + tasa)

# mypy puede detectar errores antes de ejecutar:
resultado: float = calcular_iva("cien", 0.21)  # mypy error: str vs float
```

### 1.3 PEP 8 — La Convención de Estilo como Estándar de Auditoría

PEP 8 no es una preferencia personal: es el estándar de legibilidad de la comunidad CPython y un requisito implícito en auditorías de código bajo ENS. Los puntos críticos:

| Regla PEP 8            | Correcto               | Incorrecto                |
| ---------------------- | ---------------------- | ------------------------- |
| Indentación            | 4 espacios             | Tabs o 2 espacios         |
| Longitud de línea      | ≤ 79 caracteres        | Líneas de 200 chars       |
| Nombres de variables   | `snake_case`           | `camelCase`, `MAYÚSCULAS` |
| Nombres de clases      | `PascalCase`           | `snake_class`             |
| Constantes             | `MAYÚSCULAS_CON_GUIÓN` | `constante`               |
| Espacios en operadores | `x = a + b`            | `x=a+b`                   |

### 1.4 Versiones de Python y el Ciclo EOL (End of Life)

Usar versiones EOL es un **riesgo de seguridad documentado** (NIST SP 800-53 SI-2: Flaw Remediation):

| Versión     | Estado    | Fin de soporte                  |
| ----------- | --------- | ------------------------------- |
| Python 3.8  | **EOL**   | 2024-10 — No usar en producción |
| Python 3.9  | **EOL**   | 2025-10                         |
| Python 3.10 | Seguridad | 2026-10                         |
| Python 3.11 | Activo    | 2027-10                         |
| Python 3.12 | Activo    | 2028-10                         |
| Python 3.13 | Activo    | 2029-10                         |

---

## II. Laboratorio Práctico — Step by Step

### Lab 1.1 — Instalación y Verificación del Entorno

```bash
# 1. Verificar la versión instalada
python3 --version
# Output esperado: Python 3.12.x

# 2. Verificar dónde está el intérprete
which python3
# /usr/bin/python3  ← intérprete del sistema (NO usar para proyectos)

# 3. Verificar pip
pip3 --version
```

### Lab 1.2 — Entorno Virtual (Obligatorio por Proyecto)

El entorno virtual aísla las dependencias de cada proyecto, evitando conflictos de versiones y filtraciones de paquetes del sistema.

```bash
# 1. Crear el entorno virtual (una vez por proyecto)
python3 -m venv .venv

# 2. Activar el entorno
source .venv/bin/activate           # macOS / Linux
# .venv\Scripts\activate.bat        # Windows CMD
# .venv\Scripts\Activate.ps1        # Windows PowerShell

# 3. Verificar que el intérprete activo es el del entorno
which python
# .../mi-proyecto/.venv/bin/python  ← CORRECTO

# 4. Instalar dependencias
pip install requests pydantic bcrypt python-dotenv

# 5. Anclar versiones (crítico para reproducibilidad y auditoría)
pip freeze > requirements.txt

# 6. Desactivar cuando se termina
deactivate
```

### Lab 1.3 — Estructura de Proyecto Profesional

```
mi-proyecto/
├── .venv/                  # NO commitear (añadir a .gitignore)
├── src/
│   └── mi_paquete/
│       ├── __init__.py
│       └── main.py
├── tests/
│   └── test_main.py
├── docs/
├── .env                    # Secretos locales — NO commitear
├── .env.example            # Plantilla sin valores reales — SÍ commitear
├── .gitignore
├── pyproject.toml          # Configuración del proyecto (PEP 517/518)
├── requirements.txt        # Dependencias ancladas
└── README.md
```

**`.gitignore` mínimo para proyectos Python:**

```gitignore
# Entorno virtual
.venv/
venv/
env/

# Secretos
.env
*.env.local

# Bytecode
__pycache__/
*.pyc
*.pyo

# Distribución
dist/
build/
*.egg-info/

# IDE
.vscode/
.idea/
*.DS_Store
```

### Lab 1.4 — Primer Programa con Validación Pydantic

Incluso en el primer programa, aplicamos validación de entrada:

```python
# src/mi_paquete/main.py
"""Módulo principal del proyecto — Hola Mundo validado."""

from pydantic import BaseModel, Field
from typing import Annotated


class ConfiguracionSaludo(BaseModel):
    """Esquema de configuración validado para el saludo inicial."""

    nombre: Annotated[str, Field(min_length=1, max_length=100, strip_whitespace=True)]
    idioma: str = Field(default="es", pattern=r"^[a-z]{2}$")
    mayusculas: bool = False

    model_config = {"frozen": True}


def saludar(config: ConfiguracionSaludo) -> str:
    """Genera un saludo basado en la configuración validada.

    Args:
        config: Configuración validada por Pydantic.

    Returns:
        Cadena de saludo formateada.

    Examples:
        >>> cfg = ConfiguracionSaludo(nombre="Mundo")
        >>> saludar(cfg)
        'Hola, Mundo'
    """
    mensajes = {
        "es": f"Hola, {config.nombre}",
        "en": f"Hello, {config.nombre}",
        "fr": f"Bonjour, {config.nombre}",
    }
    mensaje = mensajes.get(config.idioma, mensajes["es"])
    return mensaje.upper() if config.mayusculas else mensaje


if __name__ == "__main__":
    # Validación en la frontera del sistema
    config = ConfiguracionSaludo(nombre="Mundo", idioma="es")
    print(saludar(config))
```

### Lab 1.5 — Verificación del Bytecode

```python
import dis
import py_compile

# Ver el bytecode del primer programa
def suma_simple(a: int, b: int) -> int:
    return a + b

dis.dis(suma_simple)
# Salida (CPython 3.12):
#  RESUME
#  LOAD_FAST    0 (a)
#  LOAD_FAST    1 (b)
#  BINARY_OP    0 (+)
#  RETURN_VALUE
```

---

## III. Ciberseguridad — Blue Team

| Riesgo                           | Descripción del Fallo                                                 | Mitigación                                                                                  | Referencia                  |
| -------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------- |
| **Versión EOL**                  | Usar Python ≤ 3.9 sin parches de seguridad                            | Fijar `python_requires=">=3.10"` en `pyproject.toml`, auditar con `pip audit`               | NIST SI-2 · ENS [op.pl.4]   |
| **Credenciales hardcoded**       | `API_KEY = "tok_live_xxx"` en el código fuente                        | Usar `python-dotenv`; secrets en gestor (Vault/AWS SSM); nunca `git add .env`               | NIST SC-8 · ENS [mp.info.3] |
| **Intérprete de sistema**        | Instalar paquetes globalmente con `pip install --user`                | Un `venv` por proyecto; `pip install` siempre con el entorno activo                         | NIST CM-6 · ENS [op.exp.1]  |
| **Dependencias sin anclar**      | `pip install requests` sin versión fija — actualizaciones silenciosas | `pip freeze > requirements.txt`; usar `pip-compile` de pip-tools                            | NIST SA-10 · ENS [op.pl.2]  |
| **GIL y threading inseguro**     | Compartir estado mutable entre hilos sin locks                        | Usar `threading.Lock()` para secciones críticas; preferir `asyncio` o `multiprocessing`     | NIST SI-16                  |
| **`exec()` con entrada externa** | `exec(input("Código: "))` — ejecución arbitraria                      | **Prohibido** `exec`/`eval` con datos externos; usar `ast.literal_eval` solo para literales | NIST SI-10 · CWE-78         |

---

## IV. Validación Spec-Driven — Módulo 01

```python
# validacion/modulo_01.py
"""Esquemas de validación para la configuración del entorno del proyecto."""

from pydantic import BaseModel, Field, field_validator
from pathlib import Path
from typing import Annotated
import os


class ConfiguracionEntorno(BaseModel):
    """Valida la configuración del entorno antes de iniciar la aplicación.

    Uso típico en el punto de entrada:
        config = ConfiguracionEntorno(
            nombre_proyecto=os.getenv("PROJECT_NAME", ""),
            nivel_log=os.getenv("LOG_LEVEL", "INFO"),
        )
    """

    nombre_proyecto: Annotated[
        str,
        Field(min_length=2, max_length=64, pattern=r"^[a-zA-Z0-9_-]+$")
    ]
    nivel_log: str = Field(
        default="INFO",
        pattern=r"^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$"
    )
    modo_debug: bool = False
    version_python_minima: str = Field(default="3.10")

    @field_validator("modo_debug")
    @classmethod
    def no_debug_en_produccion(cls, v: bool) -> bool:
        """Prohíbe el modo debug si se detecta entorno de producción."""
        entorno = os.getenv("ENVIRONMENT", "development")
        if v and entorno == "production":
            raise ValueError(
                "modo_debug=True está prohibido en entorno de producción (ENS [op.exp.1])"
            )
        return v

    model_config = {"frozen": True}


# Ejemplo de uso en el punto de entrada principal
if __name__ == "__main__":
    from pydantic import ValidationError

    try:
        config = ConfiguracionEntorno(
            nombre_proyecto="mi-app-python",
            nivel_log="INFO",
        )
        print(f"Entorno configurado: {config.nombre_proyecto}")
    except ValidationError as e:
        print(f"Error de configuración: {e}")
        raise SystemExit(1)
```

---

## V. Referencia Rápida del Módulo 01

```
Comandos esenciales:
  python3 --version              → Verificar versión
  python3 -m venv .venv          → Crear entorno virtual
  source .venv/bin/activate      → Activar entorno (macOS/Linux)
  pip install <paquete>          → Instalar dependencia
  pip freeze > requirements.txt  → Anclar dependencias
  pip install -r requirements.txt → Reproducir entorno
  python3 -m py_compile script.py → Verificar sintaxis sin ejecutar
  python3 -m dis script.py       → Inspeccionar bytecode

Archivos del entorno:
  .venv/          → Entorno virtual (en .gitignore)
  .env            → Secretos locales (en .gitignore)
  .env.example    → Plantilla pública (en repositorio)
  pyproject.toml  → Configuración del proyecto
  requirements.txt → Dependencias ancladas
```

---

## VI. Métricas de Cumplimiento ENS/RGPD

| Control                                 | Referencia                     | Implementación en este módulo                                       | Estado |
| --------------------------------------- | ------------------------------ | ------------------------------------------------------------------- | ------ |
| Entorno de desarrollo reproducible      | ENS [op.pl.1] Planificación    | `venv` + `pip freeze > requirements.txt` anclado                    | ✅     |
| Versión Python en soporte activo        | NIST CM-6 Configuración base   | EOL table en §1.4; `python_requires` en pyproject.toml              | ✅     |
| Privacidad desde el diseño              | RGPD Art. 25 Privacy-by-Design | Estructura de proyecto con separación de capas desde el inicio      | ✅     |
| Trazabilidad de cambios                 | ISO 12207 §6.3                 | `.gitignore` + estructura de proyecto versionada                    | ✅     |
| Sin datos personales en logs de entorno | RGPD Art. 5(1)(c) Minimización | `pip freeze` no expone credenciales; variables de entorno en `.env` | ✅     |

---

## VII. Práctica Profesional

> **Escenario:** Una Fintech con 8 desarrolladores necesita estandarizar el entorno Python 3.12 garantizando reproducibilidad entre máquinas locales, CI y producción, cumpliendo ISO 12207 §4.5.

**Requerimiento del cliente:**

- Python 3.12 obligatorio (soporte hasta 2028)
- Reproducibilidad total: mismo resultado en cualquier máquina
- Variables sensibles (API keys) fuera del repositorio

**Solución técnica mínima viable:**

```bash
# 1. Crear entorno aislado
python3.12 -m venv .venv && source .venv/bin/activate

# 2. Instalar dependencias y anclarlas con hashes
pip install pydantic httpx cryptography
pip freeze > requirements.txt

# 3. Variables de entorno fuera del repo
cp .env.example .env   # .env en .gitignore obligatorio

# 4. Verificar en CI (GitHub Actions):
# python -m venv .venv && pip install -r requirements.txt --require-hashes
```

**Estructura de proyecto entregable:**

```
fintech-backend/
├── .env.example        ← plantilla sin valores reales
├── .gitignore          ← incluye .env, .venv, __pycache__
├── pyproject.toml      ← python_requires=">=3.12"
├── requirements.txt    ← con hashes SHA-256
└── src/
    └── mi_app/         ← código fuente (no en raíz)
```

---

**Módulo siguiente:** [02 — Sintaxis Básica](./modulo-02-sintaxis-basica.md)

\_ISO 12207 · NIST CSF 2.0 · ENS
