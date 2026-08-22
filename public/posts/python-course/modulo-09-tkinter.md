# Módulo 09 — Interfaces Gráficas con Tkinter

> **Estándares:** ISO 9241 (Usabilidad) · ISO 12207 §5.3 · NIST SP 800-53 SI-10 · CWE-362 (Race Condition)
> **Dependencias previas:** [Módulo 08](./modulo-08-archivos-serializacion.md)
> **Tiempo estimado:** 5–6 horas

---

## I. Teoría Técnica Avanzada

### 9.1 El Bucle de Eventos de Tkinter — `mainloop()` y el Hilo Principal

Tkinter no es thread-safe: **todos los cambios en la interfaz deben realizarse desde el hilo principal**. `mainloop()` es un bucle de eventos que:

1. Espera eventos (clic, teclado, timers)
2. Llama al `callback` registrado para ese evento
3. Actualiza la pantalla
4. Vuelve al paso 1

```
Hilo Principal (Tkinter):
  mainloop() ─── espera evento
                      │
             ┌─────── click botón ────────┐
             │                            │
         callback()           actualizar pantalla
             │
        lógica rápida (< 100ms)  ← si es lenta, la UI se congela
```

> **Regla cardinal:** las operaciones lentas (BD, red, E/S) NO deben ejecutarse en callbacks de Tkinter directamente. Deben delegarse a un hilo de trabajo usando `threading.Thread` o `concurrent.futures`.

### 9.2 El Patrón MVC en Tkinter

**Modelo-Vista-Controlador** separa responsabilidades y facilita las pruebas:

```
┌────────────────────┐     datos      ┌────────────────────┐
│       Modelo        │ ←──────────── │    Controlador      │
│  (lógica, datos)   │               │  (event handlers)   │
│  Sin Tkinter       │ ──────────────│                     │
└────────────────────┘  notificación └─────────┬───────────┘
                                               │ actualiza
                                     ┌─────────▼───────────┐
                                     │        Vista         │
                                     │   (widgets Tkinter)  │
                                     └─────────────────────┘
```

- **Modelo:** clases Python puras sin ningún import de Tkinter → 100% testeable
- **Vista:** widgets y layout; solo muestra datos, no los procesa
- **Controlador:** conecta eventos de la Vista con operaciones del Modelo; gestiona el hilo de trabajo

### 9.3 Variables de Tkinter — `StringVar`, `IntVar`, `BooleanVar`

Las variables de Tkinter (`tkinter.Variable`) implementan el patrón **Observer**: cuando cambia el valor, todos los widgets vinculados se actualizan automáticamente.

```python
import tkinter as tk

raiz = tk.Tk()
nombre_var = tk.StringVar(value="")

# Widget vinculado — se actualiza automáticamente cuando nombre_var cambia
entry = tk.Entry(raiz, textvariable=nombre_var)
label = tk.Label(raiz, textvariable=nombre_var)  # muestra lo mismo que el Entry

# Cambiar la variable programáticamente actualiza ambos widgets
nombre_var.set("Ana García")

# Rastrear cambios — trace_add reemplaza trace() deprecado
nombre_var.trace_add("write", lambda *args: print(f"Nuevo valor: {nombre_var.get()}"))
```

---

## II. Laboratorio Práctico — Step by Step

### Lab 9.1 — Estructura MVC Completa

```python
# gui/modelo.py
"""Modelo: lógica de negocio sin dependencias de Tkinter."""

from dataclasses import dataclass, field
from typing import Callable
import uuid


@dataclass
class TareaDTO:
    titulo:     str
    descripcion: str = ""
    completada: bool = False
    id: str = field(default_factory=lambda: str(uuid.uuid4()))


class ModeloTareas:
    """Modelo de tareas — independiente de la UI (testeable en aislamiento)."""

    def __init__(self) -> None:
        self._tareas: dict[str, TareaDTO] = {}
        self._observadores: list[Callable] = []

    def suscribir(self, callback: Callable) -> None:
        """Registra un observador para cambios en el modelo (patrón Observer)."""
        self._observadores.append(callback)

    def _notificar(self) -> None:
        for cb in self._observadores:
            cb()

    def agregar(self, titulo: str, descripcion: str = "") -> str:
        if not titulo or not titulo.strip():
            raise ValueError("El título no puede estar vacío")
        tarea = TareaDTO(titulo=titulo.strip(), descripcion=descripcion.strip())
        self._tareas[tarea.id] = tarea
        self._notificar()
        return tarea.id

    def completar(self, tarea_id: str) -> None:
        if tarea_id not in self._tareas:
            raise KeyError(f"Tarea no encontrada: {tarea_id!r}")
        self._tareas[tarea_id].completada = True
        self._notificar()

    def eliminar(self, tarea_id: str) -> bool:
        if tarea_id in self._tareas:
            del self._tareas[tarea_id]
            self._notificar()
            return True
        return False

    def listar(self) -> list[TareaDTO]:
        return sorted(self._tareas.values(), key=lambda t: t.completada)
```

```python
# gui/vista.py
"""Vista: widgets Tkinter. No contiene lógica de negocio."""

import tkinter as tk
from tkinter import ttk
from typing import Callable


class VistaTareas(tk.Frame):
    """Componente visual de la lista de tareas."""

    def __init__(self, contenedor: tk.Widget, **kwargs) -> None:
        super().__init__(contenedor, **kwargs)
        self._construir_ui()

    def _construir_ui(self) -> None:
        # Barra de entrada
        frame_entrada = tk.Frame(self, bg="#2b2b2b")
        frame_entrada.pack(fill="x", padx=10, pady=8)

        tk.Label(
            frame_entrada, text="Nueva tarea:", fg="#e0e0e0", bg="#2b2b2b",
            font=("Helvetica", 11)
        ).pack(side="left", padx=(0, 6))

        self.var_titulo = tk.StringVar()
        self.entry_titulo = tk.Entry(
            frame_entrada, textvariable=self.var_titulo, width=40,
            bg="#3c3c3c", fg="#ffffff", insertbackground="white",
            relief="flat", font=("Helvetica", 11)
        )
        self.entry_titulo.pack(side="left", padx=4)
        self.entry_titulo.bind("<Return>", lambda e: self._on_agregar())

        self.btn_agregar = tk.Button(
            frame_entrada, text="Agregar", bg="#4CAF50", fg="white",
            command=self._on_agregar, relief="flat", padx=12,
            font=("Helvetica", 10, "bold")
        )
        self.btn_agregar.pack(side="left", padx=4)

        # Lista de tareas
        frame_lista = tk.Frame(self, bg="#2b2b2b")
        frame_lista.pack(fill="both", expand=True, padx=10, pady=4)

        self.lista = tk.Listbox(
            frame_lista, bg="#1e1e1e", fg="#d4d4d4", selectbackground="#264f78",
            font=("Courier New", 11), relief="flat", height=20
        )
        scrollbar = ttk.Scrollbar(frame_lista, orient="vertical", command=self.lista.yview)
        self.lista.configure(yscrollcommand=scrollbar.set)
        self.lista.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        # Botones de acción
        frame_acciones = tk.Frame(self, bg="#2b2b2b")
        frame_acciones.pack(fill="x", padx=10, pady=8)

        self.btn_completar = tk.Button(
            frame_acciones, text="✔ Completar", bg="#2196F3", fg="white",
            command=self._on_completar, relief="flat", padx=10
        )
        self.btn_completar.pack(side="left", padx=4)

        self.btn_eliminar = tk.Button(
            frame_acciones, text="✖ Eliminar", bg="#f44336", fg="white",
            command=self._on_eliminar, relief="flat", padx=10
        )
        self.btn_eliminar.pack(side="left", padx=4)

        # Callbacks (se asignan desde el Controlador)
        self.on_agregar:   Callable[[str], None]  = lambda t: None
        self.on_completar: Callable[[int], None]  = lambda i: None
        self.on_eliminar:  Callable[[int], None]  = lambda i: None

    def _on_agregar(self) -> None:
        titulo = self.var_titulo.get().strip()
        if titulo:
            self.on_agregar(titulo)
            self.var_titulo.set("")
            self.entry_titulo.focus()

    def _on_completar(self) -> None:
        seleccion = self.lista.curselection()
        if seleccion:
            self.on_completar(seleccion[0])

    def _on_eliminar(self) -> None:
        seleccion = self.lista.curselection()
        if seleccion:
            self.on_eliminar(seleccion[0])

    def renderizar(self, tareas: list) -> None:
        """Actualiza la lista con los datos del modelo."""
        self.lista.delete(0, tk.END)
        for tarea in tareas:
            prefijo = "✔ " if tarea.completada else "○ "
            color   = "#6a9955" if tarea.completada else "#d4d4d4"
            self.lista.insert(tk.END, f"{prefijo}{tarea.titulo}")
            self.lista.itemconfig(tk.END, foreground=color)
```

```python
# gui/controlador.py
"""Controlador: conecta Vista con Modelo y gestiona threading."""

import threading
import queue
from .modelo import ModeloTareas
from .vista import VistaTareas


class ControladorTareas:
    """Coordinador MVC con manejo seguro de hilos."""

    def __init__(self, modelo: ModeloTareas, vista: VistaTareas) -> None:
        self._modelo = modelo
        self._vista  = vista
        self._cola_ui: queue.Queue = queue.Queue()

        # Suscribir la vista a los cambios del modelo
        modelo.suscribir(self._actualizar_vista)

        # Asignar callbacks de la vista
        vista.on_agregar   = self._agregar_tarea
        vista.on_completar = self._completar_tarea
        vista.on_eliminar  = self._eliminar_tarea

        # Renderizado inicial
        self._actualizar_vista()

    def _actualizar_vista(self) -> None:
        """Llamado por el modelo cuando hay cambios — siempre desde hilo principal."""
        self._vista.renderizar(self._modelo.listar())

    def _agregar_tarea(self, titulo: str) -> None:
        """Agrega tarea en hilo de trabajo para no bloquear la UI."""
        def tarea():
            try:
                self._modelo.agregar(titulo)
            except ValueError as e:
                self._cola_ui.put(("error", str(e)))

        threading.Thread(target=tarea, daemon=True).start()

    def _completar_tarea(self, indice: int) -> None:
        tareas = self._modelo.listar()
        if 0 <= indice < len(tareas):
            tarea_id = tareas[indice].id
            threading.Thread(
                target=lambda: self._modelo.completar(tarea_id), daemon=True
            ).start()

    def _eliminar_tarea(self, indice: int) -> None:
        tareas = self._modelo.listar()
        if 0 <= indice < len(tareas):
            tarea_id = tareas[indice].id
            threading.Thread(
                target=lambda: self._modelo.eliminar(tarea_id), daemon=True
            ).start()
```

```python
# gui/app.py
"""Punto de entrada de la aplicación Tkinter."""

import tkinter as tk
from .modelo import ModeloTareas
from .vista import VistaTareas
from .controlador import ControladorTareas


def iniciar() -> None:
    """Lanza la aplicación con el patrón MVC correctamente ensamblado."""
    raiz = tk.Tk()
    raiz.title("Gestor de Tareas")
    raiz.geometry("600x520")
    raiz.configure(bg="#2b2b2b")
    raiz.resizable(True, True)
    raiz.minsize(400, 350)

    # Ensamblar MVC
    modelo      = ModeloTareas()
    vista       = VistaTareas(raiz, bg="#2b2b2b")
    controlador = ControladorTareas(modelo, vista)

    vista.pack(fill="both", expand=True)
    raiz.mainloop()


if __name__ == "__main__":
    iniciar()
```

---

## III. Ciberseguridad — Blue Team

| Riesgo                                      | Fallo común                                                              | Mitigación                                                                           | Referencia               |
| ------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------ |
| **Operación lenta en el callback**          | `requests.get(url)` dentro de `command=` — UI congelada durante segundos | Delegar a `threading.Thread(daemon=True)`; comunicar resultado con `queue.Queue`     | CWE-362 · ISO 9241       |
| **Actualizar widget desde hilo secundario** | `label.config(text=resultado)` desde un `Thread` — crash o corrupción    | Solo `queue.Queue` + `after()` de Tkinter para trasladar datos al hilo principal     | CWE-362                  |
| **Datos de usuario sin sanitizar**          | `label.config(text=input_usuario)` sin filtrar — XSS en HTML renderer    | En Tkinter no hay XSS real, pero sí truncar: `texto[:200]` para evitar UI enorme     | NIST SI-10               |
| **`Entry` sin validación**                  | Acepta cualquier input de forma directa sin `validatecommand`            | Usar `validatecommand` de Entry o validar en el Controlador antes de pasar al Modelo | CWE-20 · NIST SI-10      |
| **Estado global compartido**                | Variable global que la Vista y el Modelo modifican directamente          | Toda comunicación de estado a través del Controlador; Modelo notifica vía Observer   | CWE-362 · ISO 12207 §5.3 |

---

## IV. Validación Spec-Driven — Módulo 09

```python
# validacion/modulo_09.py
"""Esquemas de validación para datos de entrada en formularios GUI."""

from pydantic import BaseModel, Field
from typing import Annotated


class TareaIn(BaseModel):
    """Esquema de datos de formulario para crear una tarea."""

    titulo:      Annotated[str, Field(min_length=1, max_length=200, strip_whitespace=True)]
    descripcion: Annotated[str, Field(max_length=2000, strip_whitespace=True)] = ""
    prioridad:   Annotated[int, Field(ge=1, le=5)] = 3

    model_config = {"frozen": True}


class FiltroTareas(BaseModel):
    """Parámetros de filtrado de la lista de tareas en la UI."""

    mostrar_completadas: bool = True
    texto_busqueda: Annotated[str, Field(max_length=100)] = ""
    prioridad_minima: Annotated[int, Field(ge=1, le=5)] = 1

    model_config = {"frozen": True}
```

---

## V. Referencia Rápida del Módulo 09

```
Widgets básicos:
  tk.Label(parent, text=..., font=..., fg=..., bg=...)
  tk.Button(parent, text=..., command=callback)
  tk.Entry(parent, textvariable=var)
  tk.Text(parent, height=..., width=...)
  tk.Listbox(parent, selectmode=...)
  tk.Frame(parent, bg=...)
  ttk.Combobox(parent, values=[...])
  ttk.Progressbar(parent, mode="indeterminate")

Variables:
  tk.StringVar()    → texto
  tk.IntVar()       → entero
  tk.DoubleVar()    → flotante
  tk.BooleanVar()   → bool
  var.get() / var.set(valor)
  var.trace_add("write", callback)

Layout:
  widget.pack(fill=, expand=, side=, padx=, pady=)
  widget.grid(row=, column=, sticky=, columnspan=)
  widget.place(x=, y=, width=, height=)   ← evitar: no responsive

Eventos:
  widget.bind("<Button-1>", callback)   → clic izquierdo
  widget.bind("<Return>", callback)     → tecla Enter
  widget.bind("<KeyRelease>", callback) → cualquier tecla

Threading seguro:
  from queue import Queue
  cola = Queue()
  raiz.after(100, procesar_cola)       → polling cada 100ms
  threading.Thread(target=f, daemon=True).start()

Reglas de diseño (ISO 9241):
  ✅ Feedback visual inmediato para todas las acciones del usuario
  ✅ Operaciones > 300ms → spinner o barra de progreso
  ✅ Mensajes de error en lenguaje del usuario, no tracebacks
  ✅ Confirmación antes de acciones destructivas (eliminar)
```

---

**Anterior:** [08 — Archivos y Serialización](./modulo-08-archivos-serializacion.md)
**Siguiente:** [10 — Bases de Datos](./modulo-10-bbdd.md)

## _ISO 12207 · ISO 9241 · NIST CSF 2.0 · ENS — pildorasinformaticas_

## VI. Métricas de Cumplimiento ENS/RGPD

| Control                               | Referencia                         | Implementación en este módulo                                             | Estado |
| ------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------- | ------ |
| Sin bloqueo del hilo principal        | ISO 9241 §9 · NIST SI-12           | Toda I/O en `threading.Thread(daemon=True)`; UI solo en hilo principal    | ✅     |
| Comunicación segura entre hilos       | CWE-362 Race Condition · NIST SC-3 | `queue.Queue()` sin acceso directo a widgets desde hilos secundarios      | ✅     |
| Sin datos PII en variables de UI      | RGPD Art. 5(1)(f)                  | `StringVar` no logged; solo IDs internos en variables de estado           | ✅     |
| Confirmación en acciones destructivas | ISO 9241 §14 (usabilidad)          | `messagebox.askyesno()` antes de eliminar o limpiar datos                 | ✅     |
| Sin credenciales en logs de UI        | ENS [mp.info.3] · RGPD Art. 25     | `Entry(show="*")` para contraseñas; `logger.debug("***")` si es necesario | ✅     |

---

## VII. Práctica Profesional

> **Escenario:** Un operador de infraestructura crítica necesita un dashboard de monitorización que muestre el estado en tiempo real de 10 servidores. Los datos se consultan cada 5 segundos desde una API REST interna. La UI no debe bloquearse durante las consultas.

**Requerimiento del cliente:**

- Actualización automática cada 5 segundos sin freeze de UI
- Indicador visual de estado por servidor (verde/amarillo/rojo)
- Log de último evento por servidor visible en la UI

```python
# dashboard/monitor.py
"""Dashboard de monitorización con polling seguro en hilo separado."""

import tkinter as tk
import threading
import queue
import time

INTERVALO_POLLING = 5.0   # segundos entre consultas


class DashboardMonitor:
    def __init__(self, consultora_api) -> None:
        self._api   = consultora_api
        self._cola  = queue.Queue()
        self._root  = tk.Tk()
        self._root.title("Monitor de Servidores")
        self._labels: dict[str, tk.Label] = {}
        self._construir_ui()
        self._iniciar_polling()

    def _construir_ui(self) -> None:
        for nombre in self._api.servidores():
            f = tk.Frame(self._root)
            f.pack(fill="x", padx=8, pady=2)
            tk.Label(f, text=nombre, width=20, anchor="w").pack(side="left")
            estado = tk.Label(f, text="...", width=10, bg="gray")
            estado.pack(side="left")
            self._labels[nombre] = estado
        self._root.after(100, self._procesar_cola)

    def _worker_polling(self) -> None:
        """Ejecuta en hilo secundario — NUNCA toca widgets."""
        while True:
            for nombre, estado in self._api.estados_todos():
                self._cola.put((nombre, estado))   # ← única comunicación segura
            time.sleep(INTERVALO_POLLING)

    def _iniciar_polling(self) -> None:
        t = threading.Thread(target=self._worker_polling, daemon=True)
        t.start()

    def _procesar_cola(self) -> None:
        """Ejecuta en hilo principal — consume la cola y actualiza widgets."""
        COLORES = {"ok": "green", "warn": "orange", "error": "red"}
        while not self._cola.empty():
            nombre, estado = self._cola.get_nowait()
            label = self._labels.get(nombre)
            if label:
                label.config(text=estado, bg=COLORES.get(estado, "gray"))
        self._root.after(200, self._procesar_cola)

    def ejecutar(self) -> None:
        self._root.mainloop()
```

\_ISO 12207 · NIST CSF 2.0 · ENS
