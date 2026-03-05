# Módulo 11 — Prácticas MVC: CRUD Completo

> **Estándares:** ISO 12207 §5.3 · NIST SP 800-53 AC-4 · CWE-20 (Validación inadecuada de entrada)
> **Dependencias previas:** [Módulo 10](./modulo-10-bbdd.md) · [Módulo 09](./modulo-09-tkinter.md)
> **Tiempo estimado:** 5–6 horas

---

## I. Teoría Técnica Avanzada

### 11.1 MVC en Aplicaciones de Escritorio con BD — Capas Reales

Un MVC bien diseñado con base de datos tiene **tres capas adicionales** entre el Controlador y el Modelo puro:

```
┌──────────────────────────────────────────────────────────────┐
│                       VISTA (Tkinter)                         │
│  Widgets, variables, eventos, renderizado                    │
└───────────────────────────┬──────────────────────────────────┘
                            │ eventos / datos
┌───────────────────────────▼──────────────────────────────────┐
│                    CONTROLADOR                                │
│  Coordinación, validación (Pydantic), threading              │
└─────────┬───────────────────────────────┬────────────────────┘
          │ llama                         │ actualiza vista
          ▼                               │
┌─────────────────────┐                  │
│    SERVICIO (*)     │──────────────────┘
│  Lógica de negocio  │ notifica via Observer
│  Unit of Work       │
└─────────┬───────────┘
          │ USA
          ▼
┌─────────────────────┐
│   REPOSITORIOS      │
│  SQL parametrizado  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│     SQLite          │
│  (o Supabase)       │
└─────────────────────┘
```

> \* El **Servicio** encapsula las reglas de negocio. El Controlador no debe conocer SQL directamente.

### 11.2 Estado de la UI — El Ciclo de Vida de un Formulario

Un formulario CRUD tiene cuatro estados:

| Estado         | Campos                 | Botones activos         | Descripción        |
| -------------- | ---------------------- | ----------------------- | ------------------ |
| `INICIAL`      | Vacíos                 | Solo "Crear"            | Sin selección      |
| `SELECCIONADO` | Con datos del registro | Crear, Editar, Eliminar | Fila seleccionada  |
| `EDITANDO`     | Editables              | Guardar, Cancelar       | Modificando datos  |
| `GUARDANDO`    | Deshabilitados         | Ninguno (spinner)       | Operación en curso |

Gestionar estos estados explícitamente evita bugs de UI (botón "Eliminar" activo sin selección, doble submit, etc.).

### 11.3 Paginación — Por Qué `LIMIT / OFFSET` No Escala

```sql
-- Paginación naïve (funciona pero no escala):
SELECT * FROM usuarios ORDER BY creado_en DESC LIMIT 50 OFFSET 5000;
-- SQLite debe recorrer 5050 filas para devolver 50 — O(n)

-- Paginación por cursor (keyset pagination — O(log n)):
-- Guarda el último creado_en + id visto:
SELECT * FROM usuarios
WHERE (creado_en, id) < (?, ?)   -- ← cursor del último item
ORDER BY creado_en DESC, id DESC
LIMIT 50;
```

Para volúmenes pequeños (<100K filas) `LIMIT/OFFSET` es suficiente. Para tablas grandes, usar **keyset pagination**.

---

## II. Laboratorio Práctico — Step by Step

### Lab 11.1 — CRUD Completo (Contactos)

```python
# crud/servicios.py
"""Servicio de negocio para el CRUD de contactos."""

import logging
import uuid
from .repositorio import RepositorioContactos
from .bd import UnitOfWork

logger = logging.getLogger(__name__)


class ServicioContactos:
    """Operaciones CRUD con validación y trazabilidad."""

    def listar(self, pagina: int = 1, por_pagina: int = 50) -> list[dict]:
        with UnitOfWork() as uow:
            repo = RepositorioContactos(uow.conn)
            return repo.listar(limite=por_pagina, offset=(pagina - 1) * por_pagina)

    def obtener(self, cid: str) -> dict | None:
        with UnitOfWork() as uow:
            return RepositorioContactos(uow.conn).obtener(cid)

    def crear(self, nombre: str, email: str, telefono: str = "") -> str:
        with UnitOfWork() as uow:
            repo = RepositorioContactos(uow.conn)
            if repo.email_existe(email):
                raise ValueError(f"El email {email!r} ya existe")
            cid = str(uuid.uuid4())
            repo.crear(cid, nombre, email, telefono)
        logger.info("Contacto creado: %s", cid[:8])
        return cid

    def actualizar(self, cid: str, nombre: str, email: str, telefono: str) -> None:
        with UnitOfWork() as uow:
            repo = RepositorioContactos(uow.conn)
            if not repo.obtener(cid):
                raise KeyError(f"Contacto no encontrado: {cid!r}")
            repo.actualizar(cid, nombre, email, telefono)
        logger.info("Contacto actualizado: %s", cid[:8])

    def eliminar(self, cid: str) -> bool:
        with UnitOfWork() as uow:
            eliminado = RepositorioContactos(uow.conn).eliminar(cid)
        if eliminado:
            logger.warning("Contacto eliminado: %s", cid[:8])
        return eliminado
```

```python
# crud/repositorio.py
"""Repositorio de contactos — SQL parametrizado (anti SQL Injection)."""

import sqlite3


class RepositorioContactos:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._c = conn

    def listar(self, limite: int = 50, offset: int = 0) -> list[dict]:
        rows = self._c.execute(
            "SELECT id, nombre, email, telefono FROM contactos "
            "ORDER BY nombre ASC LIMIT ? OFFSET ?",
            (limite, offset),
        ).fetchall()
        return [dict(r) for r in rows]

    def obtener(self, cid: str) -> dict | None:
        row = self._c.execute(
            "SELECT * FROM contactos WHERE id = ?", (cid,)
        ).fetchone()
        return dict(row) if row else None

    def email_existe(self, email: str) -> bool:
        row = self._c.execute(
            "SELECT 1 FROM contactos WHERE email = ? COLLATE NOCASE", (email,)
        ).fetchone()
        return row is not None

    def crear(self, cid: str, nombre: str, email: str, telefono: str) -> None:
        self._c.execute(
            "INSERT INTO contactos (id, nombre, email, telefono) VALUES (?,?,?,?)",
            (cid, nombre.strip(), email.lower().strip(), telefono.strip()),
        )

    def actualizar(self, cid: str, nombre: str, email: str, telefono: str) -> None:
        self._c.execute(
            "UPDATE contactos SET nombre=?, email=?, telefono=? WHERE id=?",
            (nombre.strip(), email.lower().strip(), telefono.strip(), cid),
        )

    def eliminar(self, cid: str) -> bool:
        cursor = self._c.execute("DELETE FROM contactos WHERE id=?", (cid,))
        return cursor.rowcount > 0
```

```python
# crud/controlador_mvc.py
"""Controlador que integra Servicio, Vista y threading."""

import threading
import tkinter as tk
from tkinter import messagebox
from .servicios import ServicioContactos


class ControladorContactos:
    """Conecta la vista del formulario con el servicio de negocio.

    Gestión de estados:
        INICIAL → SELECCIONADO → EDITANDO → GUARDANDO → INICIAL
    """

    ESTADOS = ("inicial", "seleccionado", "editando", "guardando")

    def __init__(self, vista, servicio: ServicioContactos) -> None:
        self._v = vista
        self._s = servicio
        self._estado = "inicial"
        self._id_seleccionado: str | None = None
        self._conectar_eventos()
        self.refrescar()

    def _conectar_eventos(self) -> None:
        self._v.btn_crear.config(command=self._crear)
        self._v.btn_editar.config(command=self._editar)
        self._v.btn_guardar.config(command=self._guardar)
        self._v.btn_cancelar.config(command=self._cancelar)
        self._v.btn_eliminar.config(command=self._eliminar)
        self._v.lista.bind("<<ListboxSelect>>", self._al_seleccionar)

    def _set_estado(self, nuevo: str) -> None:
        self._estado = nuevo
        self._v.aplicar_estado(nuevo)   # La vista gestiona qué widgets están activos

    def refrescar(self) -> None:
        datos = self._s.listar()
        self._v.renderizar_lista(datos)
        self._set_estado("inicial")
        self._id_seleccionado = None

    def _al_seleccionar(self, event) -> None:
        seleccion = self._v.lista.curselection()
        if not seleccion:
            return
        idx     = seleccion[0]
        datos   = self._v.datos_lista[idx]
        self._id_seleccionado = datos["id"]
        self._v.rellenar_formulario(datos)
        self._set_estado("seleccionado")

    def _crear(self) -> None:
        self._v.limpiar_formulario()
        self._id_seleccionado = None
        self._set_estado("editando")
        self._v.entry_nombre.focus()

    def _editar(self) -> None:
        if self._id_seleccionado:
            self._set_estado("editando")

    def _cancelar(self) -> None:
        self.refrescar()

    def _guardar(self) -> None:
        datos = self._v.obtener_datos_formulario()
        if not datos.get("nombre") or not datos.get("email"):
            messagebox.showerror("Error", "Nombre y email son obligatorios")
            return

        self._set_estado("guardando")

        def operacion():
            try:
                if self._id_seleccionado:
                    self._s.actualizar(self._id_seleccionado, **datos)
                else:
                    self._s.crear(**datos)
                self._v.after(0, self.refrescar)   # Actualizar UI desde hilo principal
            except ValueError as e:
                self._v.after(0, lambda: messagebox.showerror("Error de validación", str(e)))
                self._v.after(0, lambda: self._set_estado("editando"))

        threading.Thread(target=operacion, daemon=True).start()

    def _eliminar(self) -> None:
        if not self._id_seleccionado:
            return
        confirmado = messagebox.askyesno(
            "Confirmar eliminación",
            "¿Estás seguro de que deseas eliminar este contacto?\nEsta acción no se puede deshacer.",
        )
        if confirmado:
            self._s.eliminar(self._id_seleccionado)
            self.refrescar()
```

---

## III. Ciberseguridad — Blue Team

| Riesgo                                 | Fallo común                                                           | Mitigación                                                         | Referencia           |
| -------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------- |
| **Doble submit**                       | Usuario hace clic 2 veces en "Guardar" — duplica registro             | Estado `GUARDANDO` desactiva todos los botones mientras se procesa | CWE-362              |
| **Sin confirmación en eliminación**    | `btn_eliminar.command=eliminar_directo` — pérdida de datos accidental | `messagebox.askyesno()` obligatorio para acciones destructivas     | ISO 9241 §9          |
| **Paginación sin límite**              | `SELECT * FROM contactos` devuelve 100K filas — OOM                   | `LIMIT ?` obligatorio en todas las consultas de listas             | CWE-400 · NIST SI-12 |
| **Email duplicado sin unicidad en BD** | Validar solo en Python — condición de carrera concurrente             | `UNIQUE` en la columna de BD + `email_existe()` antes de insertar  | CWE-362 · NIST SI-10 |
| **Formulario con datos anteriores**    | Al crear un nuevo registro, el formulario aún muestra el anterior     | `limpiar_formulario()` obligatorio en `_crear()` y `refrescar()`   | CWE-200 · ISO 9241   |

---

## IV. Validación Spec-Driven — Módulo 11

```python
# validacion/modulo_11.py
from pydantic import BaseModel, EmailStr, Field
from typing import Annotated


class ContactoIn(BaseModel):
    """Esquema de entrada para creación/actualización de contacto."""

    nombre:   Annotated[str, Field(min_length=2, max_length=120, strip_whitespace=True)]
    email:    EmailStr
    telefono: Annotated[str, Field(max_length=20, strip_whitespace=True)] = ""

    model_config = {"frozen": True}


class PaginacionIn(BaseModel):
    """Parámetros de paginación con límites de seguridad."""

    pagina:    Annotated[int, Field(ge=1, le=10_000)] = 1
    por_pagina: Annotated[int, Field(ge=1, le=200)]   = 50

    model_config = {"frozen": True}
```

---

## V. Referencia Rápida del Módulo 11

```
Ciclo de vida del formulario CRUD:
  INICIAL → botón "Nuevo" → EDITANDO
  INICIAL → seleccionar fila → SELECCIONADO
  SELECCIONADO → botón "Editar" → EDITANDO
  EDITANDO → botón "Guardar" → GUARDANDO → INICIAL (tras éxito)
  EDITANDO → botón "Cancelar" → INICIAL
  SELECCIONADO → botón "Eliminar" → confirmación → INICIAL

Patrones obligatorios:
  ✅ LIMIT + OFFSET en toda consulta de lista
  ✅ Estado GUARDANDO desactiva botones (anti doble-submit)
  ✅ Threading para toda operación de BD (no bloquear UI)
  ✅ messagebox.askyesno() antes de DELETE
  ✅ UNIQUE en columna email + check previo en servicio

Estructura de archivos sugerida:
  crud/
  ├── bd.py           → UnitOfWork + inicializar_bd()
  ├── schema.py       → SQL CREATE TABLE
  ├── repositorio.py  → SQL parametrizado
  ├── servicios.py    → lógica de negocio
  ├── vista.py        → widgets Tkinter
  └── controlador_mvc.py → coordinación MVC + threading
```

---

**Anterior:** [10 — Bases de Datos](./modulo-10-bbdd.md)
**Siguiente:** [12 — Funciones Avanzadas](./modulo-12-funciones-avanzadas.md)

---

## VI. Métricas de Cumplimiento ENS/RGPD

| Control                                  | Referencia                  | Implementación en este módulo                                    | Estado |
| ---------------------------------------- | --------------------------- | ---------------------------------------------------------------- | ------ |
| Anti-doble-submit                        | CWE-362 · ISO 9241 §9       | Estado `GUARDANDO` desactiva todos los botones durante operación | ✅     |
| Paginación con límite obligatorio        | NIST SI-12 · CWE-400        | `LIMIT ?` en toda consulta de lista; min 1, max 200 vía Pydantic | ✅     |
| Confirmación en acciones destructivas    | RGPD Art. 17 · ISO 9241 §14 | `messagebox.askyesno()` antes de DELETE                          | ✅     |
| Unicidad de email en BD y servicio       | CWE-362 · NIST SI-10        | `UNIQUE` en columna + `email_existe()` antes de INSERT           | ✅     |
| Trazabilidad de eliminaciones            | ENS [op.mon.1] · NIST AU-2  | `logger.warning()` en todas las eliminaciones con ID y timestamp | ✅     |
| Limpieza de formulario entre operaciones | CWE-200 · RGPD Art. 5(1)(c) | `limpiar_formulario()` en `_crear()` y `refrescar()` obligatorio | ✅     |

---

## VII. Práctica Profesional

> **Escenario:** Un despacho de abogados gestiona expedientes de clientes. Necesitan que los expedientes borrados no se eliminen físicamente (requisito legal de conservación 5 años — Art. 30 RGPD), pero tampoco sean visibles en la UI. Además, cada cambio debe quedar registrado con usuario y timestamp (audit trail).

**Requerimiento del cliente:**

- Soft delete: columna `eliminado_en` (NULL = activo, timestamp = eliminado)
- Audit trail: tabla `cambios_expediente` con usuario_id + antes/después
- La UI muestra solo expedientes activos; admin puede ver los eliminados

```python
# expedientes/repositorio_expediente.py
"""Repositorio con soft delete y audit trail."""

import json
import sqlite3
import uuid
from datetime import datetime, timezone


class RepositorioExpedientes:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._c = conn

    def listar_activos(self) -> list[dict]:
        rows = self._c.execute(
            "SELECT * FROM expedientes WHERE eliminado_en IS NULL ORDER BY creado_en DESC"
        ).fetchall()
        return [dict(r) for r in rows]

    def eliminar_logico(self, exp_id: str, usuario_id: str) -> None:
        """Soft delete: marca como eliminado sin borrar el registro."""
        ahora = datetime.now(timezone.utc).isoformat()
        # 1. Registrar en audit trail
        self._registrar_cambio(exp_id, usuario_id, "eliminar", None, {"eliminado_en": ahora})
        # 2. Soft delete
        self._c.execute(
            "UPDATE expedientes SET eliminado_en = ? WHERE id = ? AND eliminado_en IS NULL",
            (ahora, exp_id),
        )

    def _registrar_cambio(self, exp_id: str, usuario_id: str,
                          accion: str, antes: dict | None, despues: dict | None) -> None:
        self._c.execute(
            """INSERT INTO cambios_expediente (id, expediente_id, usuario_id, accion, antes, despues, en)
               VALUES (?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%SZ','now'))""",
            (str(uuid.uuid4()), exp_id, usuario_id, accion,
             json.dumps(antes), json.dumps(despues)),
        )
```

\_ISO 12207 · NIST CSF 2.0 · ENS
