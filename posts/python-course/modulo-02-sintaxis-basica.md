# Módulo 02 — Sintaxis Básica

> **Estándares:** ISO 12207 §5.3 · NIST SP 800-53 SI-10 · CWE-704
> **Dependencias previas:** [Módulo 01](./modulo-01-fundamentos.md)
> **Tiempo estimado:** 4–5 horas

---

## I. Teoría Técnica Avanzada

### 2.1 Objetos en Memoria — CPython Heap

En Python **todo es un objeto**. Un entero, una función, una clase: están en el heap de CPython con la misma estructura base.

```
Objeto Python en memoria:
┌──────────────────────────┐
│  ob_refcnt (int)         │  ← contador de referencias (gestión de memoria)
│  ob_type   (PyTypeObject*)│  ← puntero al tipo del objeto
│  ... datos del objeto ... │
└──────────────────────────┘
```

**Tipos inmutables vs. mutables:**

| Tipo                          | Mutable | Clave de dict | Hashable |
| ----------------------------- | ------- | ------------- | -------- |
| `int`, `float`, `bool`, `str` | No      | ✅            | ✅       |
| `tuple` (sin mutables dentro) | No      | ✅            | ✅       |
| `frozenset`                   | No      | ✅            | ✅       |
| `list`, `dict`, `set`         | **Sí**  | ❌            | ❌       |

> **Riesgo:** los mutables pasados como argumento pueden ser modificados por la función receptora, causando efectos secundarios ocultos.

### 2.2 Identidad vs. Igualdad

```python
a = [1, 2, 3]
b = [1, 2, 3]
c = a

print(a == b)   # True  — mismo contenido
print(a is b)   # False — objetos distintos en memoria
print(a is c)   # True  — misma referencia

# Interning de enteros (CPython cachea -5..256)
x, y = 256, 256
print(x is y)   # True  — cacheado
x, y = 257, 257
print(x is y)   # False — fuera del rango cacheado
```

> **Regla:** `==` para comparar valores; `is` solo con `None`, `True`, `False`.

### 2.3 Funciones — Objetos de Primera Clase

Las funciones son objetos: se pasan como argumentos, devuelven desde otras funciones y se almacenan en variables. Esto habilita decoradores (Módulo 14) y patrones funcionales (Módulo 12).

```python
def multiplicar(x: float, y: float) -> float:
    return x * y

# La función tiene atributos como cualquier objeto
print(type(multiplicar))    # <class 'function'>
print(multiplicar.__name__) # 'multiplicar'

# Se puede pasar como argumento
def aplicar(operacion, a, b):
    return operacion(a, b)

resultado = aplicar(multiplicar, 3, 4)   # 12.0
```

### 2.4 Sistema de Argumentos de Funciones

```
def f(pos1, pos2, /, normal, *, kw_only, **kwargs)
       ─────────    ──────    ─ ───────   ──────
       Posicional-  Normal:   │ Solo por  kwargs:
       solo (3.8+)  por pos.  │ nombre    dict extra
                   o nombre   │
                              Separador kw-only
```

---

## II. Laboratorio Práctico — Step by Step

### Lab 2.1 — Tipos, Operadores y Conversión Segura

```python
# tipos_operadores.py
entero:   int   = 42
decimal:  float = 3.14159
texto:    str   = "Python"
booleano: bool  = True       # bool es subclase de int: True==1, False==0


def convertir_entero_seguro(valor: str) -> int | None:
    """Convierte a int con validación previa (sin excepciones no controladas)."""
    if not isinstance(valor, str):
        return None
    limpio = valor.strip().lstrip('-')
    if not limpio.isdigit():
        return None
    resultado = int(valor.strip())
    if not (-2**31 <= resultado <= 2**31 - 1):
        return None   # Fuera de rango int32
    return resultado


# Operadores
division_entera = 17 // 5    # 3
modulo          = 17 % 5     # 2
potencia        = 2 ** 10    # 1024
# Expresión compuesta (precedencia: ** > * > +)
resultado = 2 + 3 * 4 ** 2   # 50
```

### Lab 2.2 — Funciones con Tipado Completo y Docstrings

```python
# funciones.py
def formatear_precio(
    valor: float,
    /,                         # posicional-solo
    moneda: str = "EUR",
    *,
    decimales: int = 2,        # keyword-only
    separador_miles: bool = True,
) -> str:
    """Formatea un precio con moneda.

    Args:
        valor: Cantidad numérica (posicional obligatorio).
        moneda: Código ISO 4217.
        decimales: Cifras decimales.
        separador_miles: Usar punto como separador de miles.

    Returns:
        Cadena formateada, e.g. ``'1.234,56 EUR'``.

    Raises:
        ValueError: Si ``valor`` es negativo.

    Examples:
        >>> formatear_precio(1234.567)
        '1.234,57 EUR'
    """
    if valor < 0:
        raise ValueError(f"El precio no puede ser negativo: {valor}")

    redondeado = round(valor, decimales)
    if not separador_miles:
        return f"{redondeado:.{decimales}f} {moneda}"

    parte_entera = int(redondeado)
    entero_fmt = f"{parte_entera:,}".replace(",", ".")
    if decimales > 0:
        frac = f"{redondeado - parte_entera:.{decimales}f}"[1:].replace(".", ",")
        return f"{entero_fmt}{frac} {moneda}"
    return f"{entero_fmt} {moneda}"
```

### Lab 2.3 — Colecciones con Patrones Seguros

```python
# colecciones.py
from typing import NamedTuple

# \u2500\u2500\u2500 NamedTuple: inmutable + legible \u2500
class CoordenadasGPS(NamedTuple):
    latitud:  float
    longitud: float
    altitud:  float = 0.0

    def es_valida(self) -> bool:
        return -90 <= self.latitud <= 90 and -180 <= self.longitud <= 180

madrid = CoordenadasGPS(40.4168, -3.7038)
print(madrid.latitud)       # acceso por nombre
print(madrid[0])            # acceso por índice
print(madrid.es_valida())   # True


# \u2500\u2500\u2500 Diccionarios con whitelist (previene mass assignment) \u2500
CAMPOS_PERMITIDOS = frozenset({"nombre", "email", "telefono", "activo"})

def normalizar_usuario(datos_raw: dict) -> dict:
    """Filtra y normaliza solo los campos permitidos."""
    # Whitelist: ignorar cualquier campo no reconocido
    filtrado = {k: v for k, v in datos_raw.items() if k in CAMPOS_PERMITIDOS}

    if "email" in filtrado:
        filtrado["email"] = filtrado["email"].lower().strip()
    if "nombre" in filtrado:
        filtrado["nombre"] = filtrado["nombre"].strip().title()
    return filtrado


# El campo 'admin' es ignorado silenciosamente
datos = {"nombre": "ana GARCÍA", "email": "  Ana@Ejemplo.COM  ", "admin": True}
print(normalizar_usuario(datos))
# {'nombre': 'Ana García', 'email': 'ana@ejemplo.com'}


# \u2500\u2500\u2500 Listas — copia defensiva para no mutar argumentos \u2500
def estadisticas_notas(notas_orig: list[float]) -> dict[str, float]:
    """Procesa notas SIN modificar la lista original."""
    notas = notas_orig.copy()                       # copia superficial
    validas = [n for n in notas if 0.0 <= n <= 10.0]
    if not validas:
        raise ValueError("No hay notas en rango [0, 10]")
    return {
        "media":     round(sum(validas) / len(validas), 2),
        "maxima":    max(validas),
        "minima":    min(validas),
        "validas":   len(validas),
        "invalidas": len(notas) - len(validas),
    }
```

### Lab 2.4 — Integración con el Stack (Supabase)

```python
# api/usuarios.py
from pydantic import BaseModel, EmailStr, Field
from typing import Annotated


class UsuarioEntrada(BaseModel):
    """Esquema de entrada validado para operaciones Supabase."""

    nombre: Annotated[str, Field(min_length=2, max_length=100, strip_whitespace=True)]
    email:  EmailStr
    notas:  list[Annotated[float, Field(ge=0.0, le=10.0)]] = Field(default_factory=list)
    metadatos: dict[str, str] = Field(default_factory=dict)

    model_config = {"frozen": True}


def preparar_insert(usuario: UsuarioEntrada) -> dict:
    """Transforma el modelo validado al formato de INSERT de Supabase."""
    return {
        "nombre":      usuario.nombre,
        "email":       usuario.email,
        "notas_json":  list(usuario.notas),
        "metadatos":   dict(list(usuario.metadatos.items())[:5]),
    }
```

---

## III. Ciberseguridad — Blue Team

| Riesgo                         | Fallo común                                                  | Mitigación                                                                      | Referencia               |
| ------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------ |
| **`eval()` con input externo** | `eval(input("Operación:"))` — ejecución de código arbitrario | Prohibido. Usar `ast.literal_eval()` solo para literales Python                 | CWE-78 · NIST SI-10      |
| **Mass assignment**            | `Modelo(**request.body)` sin filtrar                         | Whitelist de campos con `frozenset`; modelo Pydantic con campos explícitos      | CWE-915 · NIST SI-10     |
| **Mutación de argumentos**     | `def f(lst): lst.append(x)` — muta la lista del llamador     | Recibir y devolver copias para tipos mutables: `lista.copy()`, `deepcopy()`     | CWE-476 · NIST SI-16     |
| **Type confusion**             | `"5" + 5` → `TypeError` no capturado                         | Anotaciones + `mypy --strict` en CI; conversión explícita con validación previa | CWE-704 · NIST SI-10     |
| **Desbordamiento de entero**   | `int(user_input)` sin rango                                  | Validar rango: `-2**31 <= val <= 2**31-1` antes de operar                       | CWE-190 · NIST SI-10     |
| **Diccionario sin filtro**     | Aceptar cualquier clave del cliente                          | `frozenset` de campos permitidos antes de procesar                              | CWE-915 · ENS [op.acc.4] |

---

## IV. Validación Spec-Driven — Módulo 02

```python
# validacion/modulo_02.py
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Annotated


class OperacionAritmetica(BaseModel):
    """Valida una operación aritmética antes de ejecutarla."""

    operando_a: float = Field(ge=-1e15, le=1e15)
    operando_b: float = Field(ge=-1e15, le=1e15)
    operador:   str   = Field(pattern=r"^[+\-*/]$")

    @model_validator(mode="after")
    def no_division_por_cero(self) -> "OperacionAritmetica":
        if self.operador == "/" and self.operando_b == 0:
            raise ValueError("División por cero no está permitida")
        return self

    def ejecutar(self) -> float:
        ops = {"+": self.operando_a + self.operando_b,
               "-": self.operando_a - self.operando_b,
               "*": self.operando_a * self.operando_b,
               "/": self.operando_a / self.operando_b}
        return ops[self.operador]

    model_config = {"frozen": True}


class ListaNotas(BaseModel):
    """Valida una lista de notas académicas."""

    notas:      list[Annotated[float, Field(ge=0.0, le=10.0)]]
    asignatura: Annotated[str, Field(min_length=2, max_length=80)]

    @field_validator("notas")
    @classmethod
    def lista_no_vacia(cls, v: list) -> list:
        if not v:
            raise ValueError("La lista de notas no puede estar vacía")
        return v

    @property
    def media(self) -> float:
        return round(sum(self.notas) / len(self.notas), 2)

    model_config = {"frozen": True}
```

---

## V. Referencia Rápida del Módulo 02

```
Tipos inmutables (seguros para compartir): int, float, str, tuple, frozenset, bytes
Tipos mutables (pasar copias):             list, dict, set, bytearray

isinstance(x, int)          → True si x es int o subclase
type(x) is int              → True solo si x es exactamente int

Slicing:  seq[start:stop:step]
          seq[::-1]    → invertir
          seq[::2]     → cada dos elementos

Operadores:  //  %  **  @  :=
```

---

**Anterior:** [01 — Fundamentos](./modulo-01-fundamentos.md)
**Siguiente:** [03 — Control de Flujo](./modulo-03-control-de-flujo.md)

---

## VI. Métricas de Cumplimiento ENS/RGPD

| Control                            | Referencia                      | Implementación en este módulo                                              | Estado |
| ---------------------------------- | ------------------------------- | -------------------------------------------------------------------------- | ------ |
| Tipado estático obligatorio        | ENS [mp.sw.1] Desarrollo seguro | Type hints en todas las funciones; mypy validación                         | ✅     |
| Minimización de datos en variables | RGPD Art. 5(1)(c)               | No almacenar más campos de los necesarios; inmutabilidad con `frozen=True` | ✅     |
| Validación de entrada externa      | NIST SI-10 · ENS [mp.info.2]    | Pydantic en la frontera del sistema, nunca raw dict a lógica               | ✅     |
| Control de asignación masiva       | CWE-915 · NIST AC-3             | Whitelist de campos aceptados en modelos Pydantic                          | ✅     |
| Sin confusión de tipos en APIs     | CWE-704 · ISO 12207 §5.3        | Anotaciones de tipo + validación runtime en la frontera                    | ✅     |

---

## VII. Práctica Profesional

> **Escenario:** Una plataforma e-commerce recibe datos de formulario HTML (diccionarios sin tipar) que deben sanitizarse antes de insertarse en la BD. El equipo de seguridad exige que ningún dato externo toque la capa de persistencia sin pasar por un esquema validado.

**Requerimiento del cliente:**

- Validar tipos, longitudes y formatos con esquema declarativo
- Rechazar campos no declarados (evitar mass assignment)
- Normalizar emails a minúsculas antes de persistir

```python
# solucion/formulario_pedido.py
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Annotated, Literal


class PedidoIn(BaseModel):
    """Esquema que actúa como barrera entre HTTP y la BD."""

    nombre_cliente: Annotated[str, Field(min_length=2, max_length=100, strip_whitespace=True)]
    email:          EmailStr
    producto_id:    Annotated[str, Field(min_length=36, max_length=36)]  # UUID
    cantidad:       Annotated[int, Field(ge=1, le=100)]
    metodo_pago:    Literal["tarjeta", "transferencia", "bizum"]

    @field_validator("nombre_cliente")
    @classmethod
    def sin_caracteres_html(cls, v: str) -> str:
        import re
        if re.search(r"[<>\"']", v):
            raise ValueError("Nombre contiene caracteres HTML no permitidos")
        return v

    model_config = {
        "frozen": True,         # Inmutable una vez validado
        "extra": "forbid",      # Rechazar campos no declarados (anti mass-assignment)
    }


# Uso en el endpoint (Flask/FastAPI/handler):
def procesar_pedido(datos_raw: dict) -> str:
    pedido = PedidoIn.model_validate(datos_raw)   # ← punto de barrera
    # Solo si llega aquí los datos son seguros
    return guardar_en_bd(pedido)
```

\_ISO 12207 · NIST CSF 2.0 · ENS
