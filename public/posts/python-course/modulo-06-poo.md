# Módulo 06 — Programación Orientada a Objetos (POO)

> **Estándares:** ISO 12207 §5.3 · NIST SP 800-53 SA-8 · CWE-1041 (Código redundante)
> **Dependencias previas:** [Módulo 05](./modulo-05-excepciones.md)
> **Tiempo estimado:** 6–8 horas

---

## I. Teoría Técnica Avanzada

### 6.1 El Modelo de Objetos de CPython — `__dict__` y `__slots__`

Por defecto, cada instancia de una clase almacena sus atributos en un diccionario llamado `__dict__`. Este diccionario es flexible pero costoso en memoria:

```python
class PuntoNormal:
    def __init__(self, x: float, y: float) -> None:
        self.x = x
        self.y = y

p = PuntoNormal(1.0, 2.0)
print(p.__dict__)   # {'x': 1.0, 'y': 2.0}
print(p.__dict__.__sizeof__())   # ~232 bytes solo el diccionario
```

Con `__slots__`, Python reserva descriptores de tipo fijo en lugar de un dict:

```python
class PuntoOptimizado:
    __slots__ = ("x", "y")   # Solo estos atributos son permitidos

    def __init__(self, x: float, y: float) -> None:
        self.x = x
        self.y = y

# Resultado:
# - No tiene __dict__: p.__dict__ → AttributeError
# - Usa ~3×-5× menos memoria por instancia
# - Acceso a atributos ~20% más rápido (descriptor en lugar de lookup de dict)
# - No se pueden añadir atributos arbitrarios: p.z = 3 → AttributeError
```

**Cuándo usar `__slots__`:**

- Clases que se crean en cantidades de cientos de miles (coordenadas, vectores, eventos)
- Clases de datos inmutables donde el acceso dinámico no es necesario

### 6.2 MRO — Method Resolution Order (Herencia Múltiple)

Cuando una clase hereda de varias, Python usa el **algoritmo C3 de linealización** para determinar en qué orden buscar métodos. El resultado se ve con `MiClase.__mro__`:

```python
class A:
    def saludar(self):
        return "Hola desde A"

class B(A):
    def saludar(self):
        return "Hola desde B"

class C(A):
    def saludar(self):
        return "Hola desde C"

class D(B, C):   # D hereda de B y C, ambas de A
    pass

print(D.__mro__)
# (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>)
print(D().saludar())   # "Hola desde B" — B está antes que C en el MRO
```

**`super()` sigue el MRO**, no llama al padre directo:

```python
class D(B, C):
    def saludar(self):
        return super().saludar() + " (procesado por D)"
    # super() → encontrará B.saludar() siguiendo el MRO de D
```

### 6.3 Clases Abstractas (ABC) — Contratos de Interfaz

Una **Clase Abstracta Base (ABC)** define un contrato que las subclases deben cumplir. Si una subclase no implementa todos los `@abstractmethod`, no se puede instanciar.

```python
from abc import ABC, abstractmethod

class Repositorio(ABC):
    """Contrato que toda capa de persistencia debe cumplir (ISO 12207 §5.3)."""

    @abstractmethod
    def guardar(self, entidad) -> str:
        """Persiste la entidad y devuelve su ID."""
        ...

    @abstractmethod
    def obtener(self, id: str):
        """Recupera la entidad por su ID."""
        ...

    @abstractmethod
    def eliminar(self, id: str) -> bool:
        """Elimina la entidad. Devuelve True si existía."""
        ...

# Instanciar Repositorio directamente → TypeError:
# TypeError: Can't instantiate abstract class Repositorio with abstract methods
```

### 6.4 Dataclasses — Clases de Datos con Boilerplate Automático

```python
from dataclasses import dataclass, field
import uuid

@dataclass(frozen=True)   # frozen=True → inmutable (hashable)
class EventoAuditoria:
    """Evento de auditoría inmutable — generado una vez, nunca modificado."""

    accion:     str
    usuario_id: str
    recurso:    str
    timestamp:  float
    id:         str = field(default_factory=lambda: str(uuid.uuid4()), compare=False)
    metadatos:  dict = field(default_factory=dict, compare=False)

    def __post_init__(self) -> None:
        # La validación en __post_init__ se ejecuta incluso con frozen=True
        object.__setattr__(self, "accion", self.accion.lower().strip())
        if not self.usuario_id:
            raise ValueError("usuario_id no puede estar vacío")
```

---

## II. Laboratorio Práctico — Step by Step

### Lab 6.1 — Jerarquía con ABC e Inyección de Dependencias

```python
# poo/repositorios.py
"""Implementación del patrón Repository con ABC para máxima modularidad."""

from abc import ABC, abstractmethod
from typing import TypeVar, Generic, Iterator
import uuid
import sqlite3
from pathlib import Path

T = TypeVar("T")


class RepositorioBase(ABC, Generic[T]):
    """Contrato genérico para cualquier repositorio de datos.

    Diseño ISO 12207 §5.3: define la interfaz sin acoplar a la implementación.
    El servicio de negocio depende de esta abstracción, no de SQLite/Supabase.
    """

    @abstractmethod
    def guardar(self, entidad: T) -> str:
        """Persiste la entidad. Devuelve el UUID asignado."""
        ...

    @abstractmethod
    def obtener(self, id: str) -> T | None:
        """Recupera por UUID. Devuelve None si no existe."""
        ...

    @abstractmethod
    def eliminar(self, id: str) -> bool:
        """Elimina por UUID. Devuelve True si existía."""
        ...

    @abstractmethod
    def listar(self) -> Iterator[T]:
        """Itera sobre todas las entidades (generador)."""
        ...

    def existe(self, id: str) -> bool:
        """Comprueba si existe un ID. Implementación por defecto con obtener()."""
        return self.obtener(id) is not None


# \u2500\u2500\u2500 Implementación en memoria (para tests) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

class RepositorioMemoria(RepositorioBase[dict]):
    """Implementación en memoria — ideal para tests unitarios sin BD."""

    def __init__(self) -> None:
        self._almacen: dict[str, dict] = {}

    def guardar(self, entidad: dict) -> str:
        nuevo_id = str(uuid.uuid4())
        self._almacen[nuevo_id] = {**entidad, "id": nuevo_id}
        return nuevo_id

    def obtener(self, id: str) -> dict | None:
        return self._almacen.get(id)

    def eliminar(self, id: str) -> bool:
        if id in self._almacen:
            del self._almacen[id]
            return True
        return False

    def listar(self) -> Iterator[dict]:
        yield from self._almacen.values()
```

### Lab 6.2 — Herencia y Polimorfismo con `dataclasses`

```python
# poo/entidades.py
"""Entidades del dominio con dataclasses, herencia y validación."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
import uuid


@dataclass
class EntidadBase(ABC):
    """Base para todas las entidades del dominio."""

    id:         str      = field(default_factory=lambda: str(uuid.uuid4()), init=False)
    creado_en:  datetime = field(default_factory=datetime.utcnow, init=False)
    activo:     bool     = field(default=True, init=False)

    @abstractmethod
    def validar(self) -> None:
        """Valida las reglas de integridad de la entidad."""
        ...

    def desactivar(self) -> None:
        """Soft delete — mantiene el historial (RGPD §17 con audit trail)."""
        object.__setattr__(self, "activo", False)


@dataclass
class Usuario(EntidadBase):
    email:      str = ""
    nombre:     str = ""

    def __post_init__(self) -> None:
        self.validar()

    def validar(self) -> None:
        if not self.email or "@" not in self.email:
            raise ValueError(f"Email inválido: {self.email!r}")
        if len(self.nombre) < 2:
            raise ValueError(f"Nombre demasiado corto: {self.nombre!r}")
        # Normalización
        self.email = self.email.lower().strip()
        self.nombre = self.nombre.strip()


@dataclass
class Producto(EntidadBase):
    nombre:     str   = ""
    precio:     float = 0.0
    categoria:  str   = "general"

    def __post_init__(self) -> None:
        self.validar()

    def validar(self) -> None:
        if len(self.nombre) < 2:
            raise ValueError(f"Nombre de producto demasiado corto: {self.nombre!r}")
        if self.precio < 0:
            raise ValueError(f"Precio no puede ser negativo: {self.precio}")

    def con_iva(self, tasa: float = 0.21) -> float:
        """Calcula el precio con IVA incluido."""
        if not (0 <= tasa <= 1):
            raise ValueError(f"Tasa de IVA inválida: {tasa}")
        return round(self.precio * (1 + tasa), 2)


# \u2500\u2500\u2500 Polimorfismo \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

def resumen_entidad(entidad: EntidadBase) -> str:
    """Polimorfismo: acepta cualquier EntidadBase sin conocer el tipo concreto."""
    estado = "activa" if entidad.activo else "inactiva"
    nombre_tipo = type(entidad).__name__
    return f"[{nombre_tipo}] ID={entidad.id[:8]}... Estado={estado}"
```

### Lab 6.3 — Métodos Especiales (Dunder Methods)

```python
# poo/coleccion_segura.py
"""Colección personalizada con métodos dunder para integración con Python."""

from __future__ import annotations
from collections.abc import Iterator, Sequence
from typing import overload


class ColeccionSegura(Sequence):
    """Lista inmutable con validación de tipos en inserción."""

    def __init__(self, tipo_elemento: type, *elementos) -> None:
        self._tipo = tipo_elemento
        self._items: tuple = tuple(self._validar(e) for e in elementos)

    def _validar(self, elemento):
        if not isinstance(elemento, self._tipo):
            raise TypeError(
                f"Se esperaba {self._tipo.__name__}, "
                f"no {type(elemento).__name__}: {elemento!r}"
            )
        return elemento

    # Protocolo Sequence (abstractos obligatorios)
    def __len__(self) -> int:
        return len(self._items)

    def __getitem__(self, indice):
        return self._items[indice]

    # Representación
    def __repr__(self) -> str:
        return f"ColeccionSegura({self._tipo.__name__}, {list(self._items)!r})"

    def __str__(self) -> str:
        return str(list(self._items))

    # Igualdad
    def __eq__(self, otro: object) -> bool:
        if not isinstance(otro, ColeccionSegura):
            return NotImplemented
        return self._tipo == otro._tipo and self._items == otro._items

    # Operador +
    def __add__(self, otro: ColeccionSegura) -> ColeccionSegura:
        if self._tipo != otro._tipo:
            raise TypeError(f"No se pueden combinar colecciones de tipos distintos")
        nueva = ColeccionSegura.__new__(ColeccionSegura)
        nueva._tipo  = self._tipo
        nueva._items = self._items + otro._items
        return nueva

    # Hash (porque es inmutable)
    def __hash__(self) -> int:
        return hash((self._tipo, self._items))


# Uso
notas = ColeccionSegura(float, 7.5, 8.0, 9.5)
print(len(notas))       # 3
print(notas[0])         # 7.5
print(9.5 in notas)     # True

try:
    ColeccionSegura(float, "texto")   # TypeError: Se esperaba float, no str
except TypeError as e:
    print(e)
```

### Lab 6.4 — Integración con Supabase (Servicio con Inyección de Repositorio)

```python
# poo/servicios.py
"""Servicio de negocio desacoplado de la implementación de BD."""

from .repositorios import RepositorioBase
from .entidades import Usuario
import logging

logger = logging.getLogger(__name__)


class ServicioUsuarios:
    """Lógica de negocio de usuarios, desacoplada del repositorio.

    Gracias a inyección de dependencias, el mismo servicio funciona con:
    - RepositorioMemoria (tests unitarios — sin BD)
    - RepositorioSQLite  (desarrollo local)
    - RepositorioSupabase (producción)
    """

    def __init__(self, repositorio: RepositorioBase) -> None:
        self._repo = repositorio

    def registrar(self, email: str, nombre: str) -> str:
        """Registra un nuevo usuario. Devuelve el UUID asignado."""
        # Comprobación de duplicado
        for existente in self._repo.listar():
            if existente.get("email") == email.lower().strip():
                raise ValueError(f"El email {email!r} ya está registrado")

        usuario = Usuario(email=email, nombre=nombre)
        uid = self._repo.guardar({"email": usuario.email, "nombre": usuario.nombre})
        logger.info("Usuario registrado: %s (%s)", uid[:8], email)
        return uid

    def desactivar(self, uid: str) -> bool:
        """Soft delete del usuario por UUID."""
        existente = self._repo.obtener(uid)
        if not existente:
            return False
        existente["activo"] = False
        self._repo.guardar(existente)
        logger.warning("Usuario desactivado: %s", uid[:8])
        return True
```

---

## III. Ciberseguridad — Blue Team

| Riesgo                                                    | Fallo común                                                           | Mitigación                                                                                | Referencia          |
| --------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------- |
| **Atributos públicos mutables**                           | `usuario.rol = "admin"` desde código externo                          | Usar `@property` con setter privado; `frozen=True` en dataclasses                         | CWE-915 · NIST AC-3 |
| **Herencia de clases de terceros sin control**            | Sub-clasificar directamente clases de BD o frameworks                 | Preferir composición sobre herencia para clases externas; ABCs para contratos propios     | ISO 12207 §5.3      |
| **`__eq__` sin `__hash__`**                               | Definir `__eq__` hace que el objeto sea unhashable por defecto        | Si defines `__eq__`, define también `__hash__`; o usar `frozen=True`                      | CWE-704             |
| **Instanciación de ABCs**                                 | Subclase que no implementa todos los `@abstractmethod`                | ABCs lanzan `TypeError` al instanciar — catch en tests de integración                     | CWE-1041            |
| **Código en `__init__` que puede fallar silenciosamente** | Constructor que captura excepciones sin re-lanzar                     | Usar `__post_init__` con validación explícita; que falle claramente                       | CWE-390             |
| **MRO sorpresivo en herencia múltiple**                   | Método definido en C que llama a `super()` y activa B inesperadamente | Documentar el `__mro__` en la docstring de clases con herencia múltiple; tests explícitos | ISO 12207 §5.3      |

---

## IV. Validación Spec-Driven — Módulo 06

```python
# validacion/modulo_06.py
"""Esquemas Pydantic que complementan las entidades de dominio."""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Annotated, Literal


class UsuarioIn(BaseModel):
    """Esquema de entrada para creación de usuario — validación en la frontera."""

    email:  EmailStr
    nombre: Annotated[str, Field(min_length=2, max_length=100, strip_whitespace=True)]
    rol:    Literal["admin", "editor", "lector"] = "lector"

    model_config = {"frozen": True}


class ProductoIn(BaseModel):
    """Esquema de entrada para productos."""

    nombre:    Annotated[str, Field(min_length=2, max_length=200)]
    precio:    Annotated[float, Field(ge=0.0, le=1_000_000.0)]
    categoria: Annotated[str, Field(min_length=2, max_length=50)] = "general"

    @field_validator("nombre")
    @classmethod
    def sin_caracteres_especiales(cls, v: str) -> str:
        import re
        if re.search(r"[<>\"'%;()&+]", v):
            raise ValueError("Nombre contiene caracteres no permitidos")
        return v.strip()

    model_config = {"frozen": True}
```

---

## V. Referencia Rápida del Módulo 06

```
Conceptos clave:
  __dict__          → atributos de instancia (dict por defecto)
  __slots__         → atributos fijos (sin __dict__, más eficiente)
  __mro__           → orden de resolución de métodos
  super()           → llamada al siguiente en el MRO

ABC:
  from abc import ABC, abstractmethod
  class MiABC(ABC):
      @abstractmethod
      def metodo(self) -> tipo: ...

Dataclasses:
  @dataclass                  → genera __init__, __repr__, __eq__
  @dataclass(frozen=True)     → + __hash__ + inmutabilidad
  @dataclass(slots=True)      → + __slots__ (Python 3.10+)
  field(default_factory=...)  → valor mutable por defecto seguro

Métodos dunder clave:
  __init__     __repr__     __str__
  __eq__       __hash__     __lt__ / __le__ / __gt__ / __ge__
  __len__      __getitem__  __contains__
  __enter__    __exit__     (context managers)
  __iter__     __next__     (protocolo iterador)

Reglas de diseño:
  - Composición > Herencia para clases externas
  - ABCs para definir contratos propios (ISO 12207)
  - Una responsabilidad por clase (SRP)
  - Inyectar dependencias en __init__ (no crearlas internamente)
```

---

**Anterior:** [05 — Excepciones](./modulo-05-excepciones.md)
**Siguiente:** [07 — Módulos y Paquetes](./modulo-07-modulos-paquetes.md)

---

## VI. Métricas de Cumplimiento ENS/RGPD

| Control                                    | Referencia                     | Implementación en este módulo                                                | Estado |
| ------------------------------------------ | ------------------------------ | ---------------------------------------------------------------------------- | ------ |
| Contratos de interfaz documentados         | ISO 12207 §5.3 · ENS [mp.sw.1] | ABCs con `@abstractmethod` como contratos inmutables                         | ✅     |
| Inmutabilidad de datos procesados          | RGPD Art. 5(1)(f) Integridad   | `@dataclass(frozen=True)` para entidades de dominio                          | ✅     |
| Principio de mínima exposición (atributos) | NIST CM-7 · CWE-915            | `@property` con solo getter; `__slots__` sin `__dict__`                      | ✅     |
| Inyección de dependencias auditables       | ISO 12207 §5.3                 | Repositorios inyectados en `__init__`; no creados internamente               | ✅     |
| Separación de PII de lógica de negocio     | RGPD Art. 25                   | `Usuario` (credenciales) ≠ `Perfil` (datos personales) como clases separadas | ✅     |

---

## VII. Práctica Profesional

> **Escenario:** Una startup necesita migrar de SQLite (desarrollo local) a Supabase/PostgreSQL (producción) sin modificar la lógica de negocio ni los tests. El equipo usa DIP (Dependency Inversion Principle) vía inyección de dependencias.

**Requerimiento del cliente:**

- Mismo servicio funciona con SQLite (dev) y Supabase REST (prod)
- Los tests unitarios no deben tocar nunca la BD real
- Cambiar de proveedor de BD en 1 línea de configuración

```python
# adapters/supabase_repo.py
"""Repositorio Supabase que implementa el mismo ABC que el repositorio SQLite."""

import httpx
from poo.repositorios import RepositorioBase


class RepositorioSupabase(RepositorioBase[dict]):
    """Implementa RepositorioBase usando la API REST de Supabase."""

    def __init__(self, url: str, anon_key: str, tabla: str) -> None:
        self._url      = f"{url}/rest/v1/{tabla}"
        self._headers  = {
            "apikey":        anon_key,
            "Authorization": f"Bearer {anon_key}",
            "Content-Type":  "application/json",
        }

    def guardar(self, entidad: dict) -> str:
        import uuid
        entidad["id"] = str(uuid.uuid4())
        with httpx.Client(verify=True, timeout=10.0) as c:
            c.post(self._url, json=entidad, headers=self._headers).raise_for_status()
        return entidad["id"]

    def obtener(self, id: str) -> dict | None:
        with httpx.Client(verify=True, timeout=5.0) as c:
            r = c.get(f"{self._url}?id=eq.{id}", headers=self._headers)
            filas = r.json()
            return filas[0] if filas else None

    def eliminar(self, id: str) -> bool:
        with httpx.Client(verify=True, timeout=5.0) as c:
            r = c.delete(f"{self._url}?id=eq.{id}", headers=self._headers)
            return r.status_code == 204

    def listar(self):
        with httpx.Client(verify=True, timeout=10.0) as c:
            yield from c.get(self._url, headers=self._headers).json()


# En main.py: un solo cambio para pasar de dev a prod
# repo = RepositorioMemoria()                             ← tests
# repo = RepositorioSQLite(Path("app.db"))                ← dev local
# repo = RepositorioSupabase(URL, KEY, "usuarios")        ← producción
```

\_ISO 12207 · NIST CSF 2.0 · ENS
