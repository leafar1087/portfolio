# Módulo 10 — Bases de Datos con SQLite

> **Estándares:** ISO 12207 §6.4 · NIST SP 800-53 SI-17 · RGPD Art. 32 · ENS [mp.info.3]
> **Dependencias previas:** [Módulo 09](./modulo-09-tkinter.md)
> **Tiempo estimado:** 6–8 horas

---

## I. Teoría Técnica Avanzada

### 10.1 El Modelo ACID y Por Qué Importa en Seguridad

**ACID** es el conjunto de propiedades que garantizan la consistencia de una base de datos relacional ante fallos:

| Propiedad        | Descripción                                  | Riesgo si se incumple                                       |
| ---------------- | -------------------------------------------- | ----------------------------------------------------------- |
| **Atomicidad**   | Una transacción es todo o nada               | Datos huérfanos: usuario creado sin su perfil               |
| **Consistencia** | La BD pasa de un estado válido a otro válido | Violación de constrains FK — integridad referencial rota    |
| **Aislamiento**  | Transacciones concurrentes no se interfieren | Dirty reads — un hilo lee datos que el otro aún no confirmó |
| **Durabilidad**  | Un commit persiste incluso tras un crash     | Pérdida de datos post-commit — corrompido en disco          |

**Cómo SQLite garantiza ACID:**

- **Journaling:** antes de modificar datos, escribe un registro en el journal (`WAL` o `DELETE` mode)
- `PRAGMA journal_mode = WAL` (Write-Ahead Log): mejor concurrencia, los readers no bloquean al writer

### 10.2 Normalización 3NF — Por Qué no `CREATE TABLE usuarios_con_todo`

La **Tercera Forma Normal (3NF)** elimina la redundancia y las anomalías de actualización:

```
1NF: Cada celda contiene un único valor atómico (sin listas en columnas)
2NF: Todos los atributos no-clave dependen de TODA la clave primaria
3NF: No hay dependencias transitivas (atributo A → B → C donde A es PK)
```

**Esquema violando 3NF (incorrecto):**

```sql
-- MAL: ciudad y país dependen del código postal, no del usuario
CREATE TABLE usuarios (
    id       TEXT PRIMARY KEY,
    nombre   TEXT,
    email    TEXT UNIQUE,
    cod_postal TEXT,
    ciudad   TEXT,    -- depende de cod_postal, no de id
    pais     TEXT     -- depende de cod_postal, no de id
);
```

**Esquema en 3NF (correcto):**

```sql
CREATE TABLE codigos_postales (
    codigo  TEXT PRIMARY KEY,
    ciudad  TEXT NOT NULL,
    pais    TEXT NOT NULL
);

CREATE TABLE usuarios (
    id         TEXT PRIMARY KEY,  -- UUID v4
    nombre     TEXT NOT NULL,
    email      TEXT UNIQUE NOT NULL,
    cod_postal TEXT REFERENCES codigos_postales(codigo)
);
```

### 10.3 UUID v4 vs. UUID v7 — Elección del Identificador

|                   | UUID v4                    | UUID v7                                   |
| ----------------- | -------------------------- | ----------------------------------------- |
| **Generación**    | Completamente aleatorio    | Prefijado con timestamp (ms) + aleatorio  |
| **Ordenación**    | No ordenable               | Ordenado cronológicamente                 |
| **Indexación**    | Peor rendimiento en B-Tree | Mejor rendimiento (inserciones ordenadas) |
| **Anti-IDOR**     | ✅ 122 bits aleatorios     | ✅ ~74 bits aleatorios (suficiente)       |
| **Disponible en** | `uuid.uuid4()` (std lib)   | Solo con `uuid6` library o Python 3.13+   |

Para **Python < 3.13**, UUID v7 se implementa manualmente:

```python
import time, os, struct

def uuid7() -> str:
    """Genera un UUID v7 (ordenable por tiempo) compatible con RFC 9562."""
    ms = int(time.time() * 1000)
    rand = int.from_bytes(os.urandom(10), "big")
    # Formato: 48 bits ts | 4 bits version(7) | 12 bits rand | 2 bits variant | 62 bits rand
    hi = (ms << 16) | (0x7000) | (rand >> 62 & 0x0FFF)
    lo = (0x8000_0000_0000_0000) | (rand & 0x3FFF_FFFF_FFFF_FFFF)
    hex_str = f"{hi:016x}{lo:016x}"
    return f"{hex_str[:8]}-{hex_str[8:12]}-{hex_str[12:16]}-{hex_str[16:20]}-{hex_str[20:]}"
```

---

## II. Laboratorio Práctico — Step by Step

### Lab 10.1 — Schema 3NF con Migraciones

```python
# bd/schema.py
"""Definición del esquema de BD en 3NF con migraciones versionadas."""

SCHEMA_V1 = """
-- Dominio: roles de usuario
CREATE TABLE IF NOT EXISTS roles (
    id     TEXT PRIMARY KEY,
    nombre TEXT UNIQUE NOT NULL CHECK(nombre GLOB '[a-z_]*')
);

-- Credenciales de autenticación (separadas de datos personales — RGPD)
CREATE TABLE IF NOT EXISTS usuarios (
    id              TEXT PRIMARY KEY,
    email           TEXT UNIQUE NOT NULL COLLATE NOCASE,
    hash_contrasena TEXT NOT NULL,
    activo          INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0,1)),
    creado_en       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- Datos personales separados de credenciales (3NF + RGPD minimización)
CREATE TABLE IF NOT EXISTS perfiles (
    id              TEXT PRIMARY KEY,
    usuario_id      TEXT NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_completo TEXT NOT NULL,
    telefono        BLOB,           -- Almacenado cifrado AES-256-GCM
    ultima_modificacion TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- Relación M:N usuarios ↔ roles
CREATE TABLE IF NOT EXISTS usuarios_roles (
    usuario_id TEXT REFERENCES usuarios(id) ON DELETE CASCADE,
    rol_id     TEXT REFERENCES roles(id)    ON DELETE RESTRICT,
    asignado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    PRIMARY KEY (usuario_id, rol_id)
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_usuarios_email
    ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_roles_usuario
    ON usuarios_roles(usuario_id);

-- Datos de arranque
INSERT OR IGNORE INTO roles (id, nombre) VALUES
    ('01-lector',  'lector'),
    ('02-editor',  'editor'),
    ('03-admin',   'admin');
"""
```

### Lab 10.2 — Unit of Work con Repositorios

```python
# bd/unit_of_work.py
"""Patrón Unit of Work: transacciones ACID entre múltiples repositorios."""

import sqlite3
import logging
import uuid
from contextlib import contextmanager
from pathlib import Path
from .schema import SCHEMA_V1

logger = logging.getLogger(__name__)
DB_RUTA = Path("app_segura.db")


class UnitOfWork:
    """Gestiona una transacción SQLite compartida entre repositorios.

    ACID garantizado:
    - Commit solo si TODAS las operaciones tienen éxito.
    - Rollback automático ante cualquier excepción.
    - FK y WAL habilitados en cada conexión.
    """

    def __enter__(self) -> "UnitOfWork":
        self._conn = sqlite3.connect(DB_RUTA, detect_types=sqlite3.PARSE_DECLTYPES)
        self._conn.row_factory = sqlite3.Row
        self._conn.execute("PRAGMA foreign_keys = ON")
        self._conn.execute("PRAGMA journal_mode = WAL")
        self.usuarios = RepositorioUsuarios(self._conn)
        self.perfiles = RepositorioPerfiles(self._conn)
        self.roles    = RepositorioRoles(self._conn)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> bool:
        if exc_type is None:
            self._conn.commit()
            logger.debug("UoW → commit OK")
        else:
            self._conn.rollback()
            logger.warning("UoW → rollback por %s: %s", exc_type.__name__, exc_val)
        self._conn.close()
        return False   # No suprimir la excepción


def inicializar_bd() -> None:
    """Crea las tablas si no existen (idempotente)."""
    with UnitOfWork() as uow:
        uow._conn.executescript(SCHEMA_V1)
    logger.info("Base de datos inicializada: %s", DB_RUTA)


# \u2500\u2500\u2500 Repositorios \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

class RepositorioUsuarios:
    """CRUD sobre la tabla `usuarios`."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        self._c = conn

    def crear(self, email: str, hash_pw: str) -> str:
        uid = str(uuid.uuid4())
        self._c.execute(
            "INSERT INTO usuarios (id, email, hash_contrasena) VALUES (?, ?, ?)",
            (uid, email.lower().strip(), hash_pw),
        )
        return uid

    def obtener_por_email(self, email: str) -> dict | None:
        row = self._c.execute(
            "SELECT id, email, activo FROM usuarios WHERE email = ?",
            (email.lower().strip(),),
        ).fetchone()
        return dict(row) if row else None

    def desactivar(self, uid: str) -> None:
        self._c.execute("UPDATE usuarios SET activo=0 WHERE id=?", (uid,))


class RepositorioPerfiles:
    """CRUD sobre la tabla `perfiles`."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        self._c = conn

    def crear(self, usuario_id: str, nombre: str,
              telefono_blob: bytes | None = None) -> str:
        pid = str(uuid.uuid4())
        self._c.execute(
            "INSERT INTO perfiles (id, usuario_id, nombre_completo, telefono) "
            "VALUES (?, ?, ?, ?)",
            (pid, usuario_id, nombre, telefono_blob),
        )
        return pid

    def obtener(self, usuario_id: str) -> dict | None:
        row = self._c.execute(
            "SELECT * FROM perfiles WHERE usuario_id = ?", (usuario_id,)
        ).fetchone()
        return dict(row) if row else None


class RepositorioRoles:
    """Gestión de roles y relación usuarios_roles."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        self._c = conn

    def asignar(self, usuario_id: str, nombre_rol: str) -> None:
        rol = self._c.execute(
            "SELECT id FROM roles WHERE nombre = ?", (nombre_rol,)
        ).fetchone()
        if not rol:
            raise ValueError(f"Rol desconocido: {nombre_rol!r}")
        self._c.execute(
            "INSERT OR IGNORE INTO usuarios_roles (usuario_id, rol_id) VALUES (?, ?)",
            (usuario_id, rol["id"]),
        )

    def listar_roles(self, usuario_id: str) -> list[str]:
        rows = self._c.execute(
            """SELECT r.nombre FROM roles r
               JOIN usuarios_roles ur ON ur.rol_id = r.id
               WHERE ur.usuario_id = ?""",
            (usuario_id,),
        ).fetchall()
        return [r["nombre"] for r in rows]
```

### Lab 10.3 — Servicio de Negocio + Hardening SQL Injection

```python
# bd/servicio_usuarios.py
"""Servicio de negocio de usuarios con hardening completo."""

import logging
from .unit_of_work import UnitOfWork

logger = logging.getLogger(__name__)


def registrar_usuario(
    email: str,
    hash_pw: str,
    nombre: str,
    telefono_blob: bytes | None = None,
    rol: str = "lector",
) -> str:
    """Crea usuario + perfil + rol en una única transacción ACID.

    Hardening:
    - SOLO parámetros posicionales (?) — inmune a SQL Injection.
    - UUID v4 como PK — mitiga ataques IDOR.
    - Transacción atómica — sin datos huérfanos.
    """
    with UnitOfWork() as uow:
        # Verificar duplicado antes de insertar (excepción controlada)
        existente = uow.usuarios.obtener_por_email(email)
        if existente:
            raise ValueError(f"El email {email!r} ya está registrado")

        uid = uow.usuarios.crear(email, hash_pw)       # Paso 1: credenciales
        uow.perfiles.crear(uid, nombre, telefono_blob) # Paso 2: perfil RGPD
        uow.roles.asignar(uid, rol)                    # Paso 3: rol inicial
        # __exit__ hace commit si llegamos aquí sin excepción

    logger.info("Usuario registrado: %s (%s)", uid[:8], email)
    return uid


# \u2500\u2500\u2500 Demostración de POR QUÉ los parámetros posicionales son obligatorios \u2500\u2500\u2500

def buscar_usuario_seguro(email: str) -> dict | None:
    """CORRECTO: parámetro posicional (?) — inmune a SQL Injection."""
    from .unit_of_work import UnitOfWork
    with UnitOfWork() as uow:
        return uow.usuarios.obtener_por_email(email)


# EJEMPLO EDUCATIVO — NUNCA HACER ESTO EN PRODUCCIÓN
def buscar_usuario_VULNERABLE(email: str):
    """VULNERABLE: concatenación de string — susceptible a SQL Injection.

    Si email = "' OR '1'='1", la query devuelve TODOS los usuarios.
    Si email = "'; DROP TABLE usuarios; --", borra la tabla.

    Este código es solo educativo. Nunca usar en producción.
    """
    import sqlite3
    conn = sqlite3.connect("app.db")
    # ¡PELIGROSO! — el email del usuario forma parte de la query:
    query = f"SELECT * FROM usuarios WHERE email = '{email}'"
    return conn.execute(query).fetchone()
```

---

## III. Ciberseguridad — Blue Team

| Riesgo                                | Fallo común                                                               | Mitigación                                                               | Referencia                     |
| ------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------ |
| **SQL Injection**                     | `f"WHERE email = '{email}'"` — el atacante controla la query              | SIEMPRE `(?, valor)` — nunca concatenación o f-strings en SQL            | CWE-89 · NIST SI-10            |
| **IDOR — Enumeración de IDs**         | `GET /usuario/1` → `/usuario/2` — IDs secuenciales predecibles            | UUID v4/v7 como PK — 2¹²² combinaciones hacen la enumeración imposible   | CWE-639 · NIST AC-3            |
| **FK desactivadas**                   | SQLite no activa `FOREIGN KEYS` por defecto — datos huérfanos silenciosos | `PRAGMA foreign_keys = ON` en CADA conexión nueva                        | CWE-20 · NIST SI-17            |
| **Datos personales con credenciales** | Tabla única con nombre, email y contraseña                                | Separar `usuarios` (credenciales) y `perfiles` (datos personales — RGPD) | RGPD Art. 25 · ENS [mp.info.3] |
| **Datos huérfanos por fallo parcial** | INSERT en `usuarios` sin INSERT en `perfiles` si el segundo falla         | Usar UnitOfWork — todo en la misma transacción; rollback automático      | NIST SI-17 · CWE-362           |
| **Teléfono en texto plano**           | `telefono TEXT` almacenado como string                                    | Columna `BLOB`, cifrar con AES-256-GCM antes de persistir (ver §4.5)     | RGPD Art. 32 · ENS [mp.info.3] |

---

## IV. Validación Spec-Driven — Módulo 10

```python
# validacion/modulo_10.py
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Annotated, Literal
import re


class RegistroUsuarioIn(BaseModel):
    """Entrada validada para registro de usuario — frontera del sistema."""

    email:          EmailStr
    contrasena:     Annotated[str, Field(min_length=12, max_length=128)]
    nombre_completo: Annotated[str, Field(min_length=2, max_length=120, strip_whitespace=True)]
    telefono:       str | None = Field(default=None, pattern=r"^\+?[1-9]\d{6,14}$")
    rol_inicial:    Literal["lector", "editor", "admin"] = "lector"

    @field_validator("contrasena")
    @classmethod
    def fortaleza_contrasena(cls, v: str) -> str:
        errores = []
        if not re.search(r"[A-Z]", v): errores.append("mayúscula")
        if not re.search(r"[a-z]", v): errores.append("minúscula")
        if not re.search(r"\d", v):    errores.append("dígito")
        if not re.search(r"[^A-Za-z0-9]", v): errores.append("carácter especial")
        if errores:
            raise ValueError(f"Contraseña requiere: {', '.join(errores)}")
        return v

    @field_validator("nombre_completo")
    @classmethod
    def sin_inyeccion_html(cls, v: str) -> str:
        if re.search(r"[<>\"'%;()&+]", v):
            raise ValueError("Nombre contiene caracteres no permitidos")
        return v

    model_config = {"frozen": True}


class ConsultaUsuarioIn(BaseModel):
    """Parámetros de búsqueda — con validación de UUID para evitar IDOR."""

    usuario_id: str = Field(min_length=36, max_length=36)

    @field_validator("usuario_id")
    @classmethod
    def es_uuid_valido(cls, v: str) -> str:
        import uuid as _uuid
        try:
            _uuid.UUID(v, version=4)
        except ValueError:
            raise ValueError(f"ID de usuario inválido (se esperaba UUID v4): {v!r}")
        return v

    model_config = {"frozen": True}
```

---

## V. Referencia Rápida del Módulo 10

```
Conexión segura:
  conn = sqlite3.connect("app.db")
  conn.execute("PRAGMA foreign_keys = ON")   # OBLIGATORIO
  conn.execute("PRAGMA journal_mode = WAL")  # RECOMENDADO
  conn.row_factory = sqlite3.Row             # Acceso por nombre de columna

Consultas seguras:
  conn.execute("SELECT * FROM t WHERE id = ?", (uid,))    ✅
  conn.execute(f"... WHERE id = '{uid}'")                 ❌ SQL Injection

Transacciones:
  conn.commit()   → confirmar
  conn.rollback() → revertir
  with UnitOfWork() as uow:   → ACID automático

Tipos de datos SQLite:
  TEXT    → strings, UUIDs, fechas ISO 8601
  INTEGER → enteros (incluye BOOLEAN como 0/1)
  REAL    → flotantes
  BLOB    → bytes binarios (para cifrado)
  NULL    → valor nulo

Pragmas clave:
  PRAGMA foreign_keys = ON   → activar FK (desactivadas por defecto)
  PRAGMA journal_mode = WAL  → mejor concurrencia
  PRAGMA integrity_check     → verificar consistencia de la BD

Herramientas:
  sqlite3 app.db ".schema"   → ver esquema desde terminal
  sqlite3 app.db ".tables"   → listar tablas
```

---

**Anterior:** [09 — Tkinter](./modulo-09-tkinter.md)
**Siguiente:** [11 — Prácticas MVC](./modulo-11-practicas-mvc.md)

## _ISO 12207 · RGPD · NIST CSF 2.0 · ENS — pildorasinformaticas_

## VI. Métricas de Cumplimiento ENS/RGPD

| Control                                | Referencia                     | Implementación en este módulo                                          | Estado |
| -------------------------------------- | ------------------------------ | ---------------------------------------------------------------------- | ------ |
| 3NF — sin dependencias transitivas     | NIST SI-17 · ISO 12207 §5.3    | `usuarios` + `perfiles` + `codigos_postales` como tablas separadas     | ✅     |
| UUID v4 como PK (anti-IDOR)            | NIST AC-3 · CWE-639            | `uuid.uuid4()` en todos los INSERT; no `INTEGER AUTOINCREMENT`         | ✅     |
| FK habilitadas explícitamente          | NIST SI-17 · CWE-20            | `PRAGMA foreign_keys = ON` en cada conexión nueva                      | ✅     |
| Separación PII / credenciales          | RGPD Art. 5(1)(c) Minimización | `perfiles` separado de `usuarios`; teléfono en BLOB cifrado            | ✅     |
| Transacciones ACID obligatorias        | ENS [mp.info.3] · CWE-362      | UnitOfWork garantiza commit/rollback atómico en cada operación         | ✅     |
| SQL parametrizado en todos los accesos | NIST SI-10 · CWE-89            | Solo `(?, valor)` en todos los repositorios; prohibido f-string en SQL | ✅     |
| Right to Erasure (RGPD Art. 17)        | RGPD Art. 17 · ENS [mp.info.3] | `ON DELETE CASCADE` en `perfiles` y `usuarios_roles`                   | ✅     |

---

## VII. Práctica Profesional

> **Escenario:** Una clínica privada necesita un sistema de registro de pacientes cumpliendo RGPD Art. 9 (datos de salud = categoría especial). El esquema debe separar datos de identificación de datos clínicos, usar UUID no predecibles, y garantizar que un borrado del paciente elimine todos sus datos (Right to Erasure — Art. 17).

**Requerimiento del cliente:**

- Separación estricta: `pacientes` (id, email) ≠ `historial_clinico` (diagnósticos)
- UUID v4 en toda la clave primaria
- `ON DELETE CASCADE` en historial_clinico → pacientes
- Acceso a historial solo con rol médico verificado en BD

```python
# clinica/schema.py
SCHEMA_CLINICA = """
CREATE TABLE IF NOT EXISTS pacientes (
    id        TEXT PRIMARY KEY,               -- UUID v4
    email     TEXT UNIQUE NOT NULL COLLATE NOCASE,
    activo    INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0,1)),
    creado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- RGPD Art. 9: datos de salud en tabla separada con acceso restringido
CREATE TABLE IF NOT EXISTS historial_clinico (
    id          TEXT PRIMARY KEY,              -- UUID v4
    paciente_id TEXT NOT NULL
                REFERENCES pacientes(id) ON DELETE CASCADE,  -- Art. 17
    fecha       TEXT NOT NULL,
    diagnostico BLOB NOT NULL,                 -- Cifrado AES-256-GCM
    creado_por  TEXT NOT NULL                  -- UUID del médico
);

-- Solo médicos con rol 'medico' pueden leer historial_clinico
-- Verificado vía @require_permission("historial:leer") del módulo 14
"""


def registrar_paciente(email: str) -> str:
    """Registra un paciente con UUID v4 en transacción ACID."""
    import uuid
    from clinica.unit_of_work import UnitOfWork
    with UnitOfWork() as uow:
        pid = str(uuid.uuid4())
        uow.conn.execute(
            "INSERT INTO pacientes (id, email) VALUES (?, ?)",
            (pid, email.lower().strip()),
        )
    return pid
```

\_ISO 12207 · NIST CSF 2.0 · ENS
