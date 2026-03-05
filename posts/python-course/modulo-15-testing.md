# Módulo 15 — Testing y DevSecOps

> **Estándares:** ISO 12207 §5.5 · NIST SP 800-53 SA-11 · CWE-1026 (Tests insuficientes)
> **Dependencias previas:** [Módulo 14](./modulo-14-decoradores.md) · [Módulo 10](./modulo-10-bbdd.md)
> **Tiempo estimado:** 5 horas

---

## I. Teoría Técnica Avanzada

### 15.1 La Pirámide de Testing

```
                /\
               /  \
              / E2E \        ← pocos, lentos, costosos
             /────────\
            / Integración \  ← algunos, verifican contratos entre capas
           /──────────────\
          /   Unitarios    \  ← muchos, rápidos, aislados
         /──────────────────\
          (base de la pirámide)
```

**Distribución ideal:**

- **Unitarios (70%):** prueban una sola función/clase sin dependencias externas. Se ejecutan en < 1ms.
- **Integración (20%):** prueban la interacción entre capas (Servicio + Repositorio + BD en memoria).
- **E2E (10%):** simulan el flujo completo de un usuario real. Solo para flujos críticos.

### 15.2 pytest — El Framework Estándar

```
Estructura de prueba (Given-When-Then / Arrange-Act-Assert):

def test_nombre_descriptivo():
    # ARRANGE (Given): preparar el estado inicial
    entrada = ...
    objeto  = ClaseAProbar()

    # ACT (When): ejecutar la acción a probar
    resultado = objeto.metodo(entrada)

    # ASSERT (Then): verificar el resultado esperado
    assert resultado == esperado
```

**Principio F.I.R.S.T.:**

| Letra | Principio       | Descripción                                             |
| ----- | --------------- | ------------------------------------------------------- |
| **F** | Fast            | < 1ms por test unitario                                 |
| **I** | Isolated        | Sin dependencias externas (BD, red, disco)              |
| **R** | Repeatable      | Mismo resultado siempre, independiente del entorno      |
| **S** | Self-validating | Pasa o falla — sin interpretación manual                |
| **T** | Timely          | Escrito junto con (o antes que) el código de producción |

### 15.3 Fixtures — Datos de Prueba Reutilizables

```python
import pytest

@pytest.fixture
def bd_temporal(tmp_path):
    """Fixture que crea una BD SQLite temporal para cada test.

    `tmp_path` es una fixture built-in de pytest que provee un directorio
    temporal que se elimina automáticamente tras el test.
    """
    from bd.unit_of_work import inicializar_bd, DB_RUTA
    import pathlib

    # Sobrescribir la ruta de BD para usar la temporal
    monkeypatch = None   # requires monkeypatch fixture — ver Lab 15.2
    ruta_bd = tmp_path / "test.db"
    yield ruta_bd
    # La BD se elimina automáticamente con tmp_path

@pytest.fixture
def servicio_con_bd_vacia(bd_temporal):
    """Fixture que devuelve un servicio de contactos sobre BD limpia."""
    from crud.servicios import ServicioContactos
    return ServicioContactos(ruta_bd=bd_temporal)
```

### 15.4 Mocking — Aislar Dependencias Externas

```python
from unittest.mock import MagicMock, patch, AsyncMock

# Mock de una llamada a API externa
with patch("modulo.requests.get") as mock_get:
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = {"datos": [1, 2, 3]}

    resultado = mi_funcion_que_llama_api("https://ejemplo.com")

mock_get.assert_called_once_with("https://ejemplo.com")
```

---

## II. Laboratorio Práctico — Step by Step

### Lab 15.1 — Suite de Tests Unitarios

```python
# tests/test_validaciones.py
"""Tests unitarios de las funciones de validación del módulo 13."""

import pytest
from validacion.modulo_13 import InputValidado
from regex.validador import (
    validar_email, validar_uuid, validar_nombre_archivo,
    detectar_sql_injection,
)


# \u2500\u2500 Tests de validar_email \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

@pytest.mark.parametrize("email,esperado", [
    ("usuario@dominio.com",      True),
    ("user.name+tag@sub.dom.es", True),
    ("@dominio.com",             False),   # sin usuario
    ("usuario@",                 False),   # sin dominio
    ("usuario@dominio",          False),   # sin TLD
    ("us@" + "a" * 300 + ".com", False),  # supera longitud máxima
    ("a" * 65 + "@b.com",        False),  # parte local > 64 chars
    ("",                         False),  # vacío
])
def test_validar_email(email: str, esperado: bool):
    assert validar_email(email) == esperado


@pytest.mark.parametrize("nombre,esperado", [
    ("informe_2024.pdf",   True),
    ("reporte-final.docx", True),
    ("../etc/passwd",       False),   # path traversal
    ("archivo/con/ruta",   False),   # separador de ruta
    ("nombre con espacios.txt", False),  # espacios no permitidos
    ("a" * 256 + ".txt",   False),   # supera longitud máxima
])
def test_validar_nombre_archivo(nombre: str, esperado: bool):
    assert validar_nombre_archivo(nombre) == esperado


@pytest.mark.parametrize("texto,es_inyeccion", [
    ("usuario_normal",  False),
    ("' OR '1'='1",     True),
    ("1; DROP TABLE u;", True),
    ("UNION SELECT *",  True),
    ("solo texto",      False),
])
def test_detectar_sql_injection(texto: str, es_inyeccion: bool):
    assert detectar_sql_injection(texto) == es_inyeccion
```

### Lab 15.2 — Tests de Integración con Fixture de BD

```python
# tests/test_servicio_contactos.py
"""Tests de integración: Servicio + Repositorio + SQLite en memoria."""

import pytest
import sqlite3
from pathlib import Path
from unittest.mock import patch

from crud.servicios import ServicioContactos
from crud.repositorio import RepositorioContactos


@pytest.fixture
def bd_en_memoria():
    """BD SQLite en memoria para tests de integración — sin disco."""
    conn = sqlite3.connect(":memory:")
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("""
        CREATE TABLE contactos (
            id       TEXT PRIMARY KEY,
            nombre   TEXT NOT NULL,
            email    TEXT UNIQUE NOT NULL COLLATE NOCASE,
            telefono TEXT DEFAULT ''
        )
    """)
    conn.commit()
    return conn


@pytest.fixture
def repo(bd_en_memoria):
    return RepositorioContactos(bd_en_memoria)


class TestRepositorioContactos:

    def test_crear_y_obtener(self, repo):
        repo.crear("uuid-1", "Ana García", "ana@test.com", "+34600000001")
        resultado = repo.obtener("uuid-1")
        assert resultado["nombre"] == "Ana García"
        assert resultado["email"] == "ana@test.com"

    def test_email_case_insensitive(self, repo):
        repo.crear("uuid-2", "Bob", "BOB@TEST.COM", "")
        assert repo.email_existe("bob@test.com") is True
        assert repo.email_existe("BOB@TEST.COM") is True

    def test_eliminar_existente(self, repo):
        repo.crear("uuid-3", "Carlo", "carlo@test.com", "")
        assert repo.eliminar("uuid-3") is True
        assert repo.obtener("uuid-3") is None

    def test_eliminar_inexistente_devuelve_false(self, repo):
        assert repo.eliminar("uuid-no-existe") is False

    def test_listar_con_limite(self, repo):
        for i in range(5):
            repo.crear(f"uuid-{i}", f"Usuario {i}", f"user{i}@test.com", "")
        resultado = repo.listar(limite=3, offset=0)
        assert len(resultado) == 3


class TestServicioContactos:
    """Tests del servicio con mock del repositorio."""

    def test_crear_duplicado_lanza_error(self, tmp_path):
        """Verifica que el servicio rechaza emails duplicados."""
        with patch("crud.servicios.UnitOfWork") as MockUoW:
            mock_repo = MockUoW.return_value.__enter__.return_value.conn
            mock_repo.execute.return_value.fetchone.return_value = {"email": "ana@test.com"}

            # El servicio debería detectar el duplicado y lanzar ValueError
            # (adaptado al mock — en tests reales usar bd_en_memoria)
```

### Lab 15.3 — Pipeline DevSecOps (pre-commit + bandit + safety)

```yaml
# .pre-commit-config.yaml
repos:
  # \u2500\u2500\u2500 Checks básicos \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-toml
      - id: check-json
      - id: check-merge-conflict
      - id: detect-private-key # ← bloquea commits con claves privadas
      - id: check-added-large-files
        args: ["--maxkb=500"]

  # \u2500\u2500\u2500 Análisis estático de seguridad con Bandit \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.8
    hooks:
      - id: bandit
        args: ["-c", "pyproject.toml"]
        files: ^src/

  # \u2500\u2500\u2500 Auditoría de dependencias con Safety \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  - repo: local
    hooks:
      - id: safety-check
        name: Safety — Auditoría de CVEs en dependencias
        entry: python -m safety check --full-report
        language: system
        files: requirements.*\.txt$
        pass_filenames: false

  # \u2500\u2500\u2500 Tipado estático \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.10.0
    hooks:
      - id: mypy
        additional_dependencies: ["pydantic>=2.6"]
        args: ["--ignore-missing-imports"]

  # \u2500\u2500\u2500 Formateo (ruff — reemplaza flake8+isort+black) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.4.5
    hooks:
      - id: ruff
        args: ["--fix"]
      - id: ruff-format
```

```toml
# pyproject.toml — configuración de Bandit
[tool.bandit]
targets    = ["src"]
skips      = ["B101"]           # B101: assert en tests — OK
severity   = "medium"           # bloquear severidad >= medium
confidence = "medium"
exclude_dirs = ["tests", ".venv", "docs"]
```

### Lab 15.4 — GitHub Actions CI/CD con Seguridad

```yaml
# .github/workflows/ci-seguridad.yml
name: CI — Calidad y Seguridad

on:
  push: { branches: [main, develop] }
  pull_request: { branches: [main] }

jobs:
  test-y-seguridad:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.11", "3.12"]

    steps:
      - uses: actions/checkout@v4

      - name: Configurar Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
          cache: pip

      - name: Instalar dependencias
        run: |
          pip install -e ".[dev]"
          pip install bandit safety

      - name: Bandit — Análisis estático de seguridad
        run: bandit -r src/ -c pyproject.toml --exit-zero -f json -o bandit-report.json

      - name: Safety — Auditoría de CVEs
        run: safety check --full-report

      - name: mypy — Verificación de tipos
        run: mypy src/ --ignore-missing-imports

      - name: pytest — Suite de tests con cobertura
        run: pytest tests/ -v --tb=short --cov=src --cov-report=xml --cov-fail-under=80

      - name: Subir reporte de cobertura
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage.xml
```

---

## III. Ciberseguridad — Blue Team

| Riesgo                                     | Fallo común                                                         | Mitigación                                                                       | Referencia                |
| ------------------------------------------ | ------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------- |
| **Tests que tocan producción**             | Tests sin mocking que usan la BD real o llaman APIs externas        | Fixtures con BD en memoria (`:memory:`); `mock.patch` para dependencias externas | CWE-1026 · ISO 12207 §5.5 |
| **Sin limite de cobertura**                | CI pasa con 0% de cobertura — código sin probar llega a producción  | `--cov-fail-under=80` en pytest; cobertura mínima obligatoria en CI              | NIST SA-11                |
| **Secretos en el código**                  | `API_KEY = "sk-live-..."` hardcodeado en el código fuente           | `detect-private-key` en pre-commit; `python-dotenv` + `.env` en `.gitignore`     | CWE-798 · NIST IA-5       |
| **Vulnerabilidades en deps no detectadas** | Nueva CVE en `requests` no detectada hasta que falla en producción  | `safety check` en pre-commit y CI; Dependabot en GitHub                          | NIST SA-10                |
| **Tests que prueban implementación**       | Acceden a atributos privados `_interno` — frágiles ante refactoring | Probar solo la interfaz pública; usar fixtures, no inspección interna            | ISO 12207 §5.5            |
| **Falsos negativos de Bandit**             | `# nosec` para silenciar bandit sin justificación documentada       | `# nosec B601 — justificación detallada` obligatorio si se necesita suprimir     | NIST SA-11                |

---

## IV. Validación Spec-Driven — Módulo 15

```python
# validacion/modulo_15.py
from pydantic import BaseModel, Field
from typing import Annotated, Literal
from pathlib import Path


class ConfiguracionCI(BaseModel):
    """Valida la configuración del pipeline antes de ejecutarlo."""

    cobertura_minima:  Annotated[int, Field(ge=60, le=100)] = 80
    timeout_segundos:  Annotated[int, Field(ge=30, le=600)] = 120
    python_version:    Literal["3.10", "3.11", "3.12", "3.13"] = "3.12"
    entorno:           Literal["local", "ci", "staging"] = "local"
    severidad_bandit:  Literal["low", "medium", "high"] = "medium"

    model_config = {"frozen": True}
```

---

## V. Referencia Rápida del Módulo 15

```
pytest:
  pytest tests/                  → ejecutar toda la suite
  pytest tests/ -v               → verbose (ver nombres de tests)
  pytest tests/ -k "nombre"      → filtrar por nombre
  pytest tests/ --tb=short       → tracebacks cortos
  pytest tests/ --cov=src        → cobertura
  pytest tests/ -x               → parar al primer fallo
  pytest tests/ -m "unitario"    → filtrar por marca

Fixtures:
  @pytest.fixture                → fixture de test
  @pytest.fixture(scope="module") → compartido en el módulo
  tmp_path                       → directorio temporal built-in
  monkeypatch                    → parchear objetos en tests
  caplog                         → capturar logs en tests

Mocking:
  from unittest.mock import MagicMock, patch, call
  @patch("modulo.dependencia")   → decorar el test
  with patch(...) as mock: ...   → context manager

Markers:
  @pytest.mark.parametrize("var,esperado", [...])
  @pytest.mark.skip(reason="...")
  @pytest.mark.xfail             → se espera que falle
  @pytest.mark.slow              → custom marker

Pipeline DevSecOps:
  pre-commit install             → instalar hooks localmente
  pre-commit run --all-files     → ejecutar todos los hooks
  bandit -r src/ -c pyproject.toml
  safety check --full-report
  mypy src/ --ignore-missing-imports
  pytest --cov=src --cov-fail-under=80
```

---

**Anterior:** [14 — Decoradores](./modulo-14-decoradores.md)
**Siguiente:** [16 — Ejecutables y Distribución](./modulo-16-ejecutables.md)

_ISO 12207 · NIST CSF 2.0 · ENS — pildorasinformaticas_

---

## VI. Métricas de Cumplimiento ENS/RGPD

| Control                                      | Referencia                  | Implementación en este módulo                                          | Estado |
| -------------------------------------------- | --------------------------- | ---------------------------------------------------------------------- | ------ |
| Cobertura mínima de código auditada          | ISO 12207 §5.5 · NIST SA-11 | `--cov-fail-under=80` en CI; cobertura < 80% bloquea el merge          | ✅     |
| Análisis estático de seguridad en pre-commit | ENS [op.exp.3] · NIST SA-11 | Bandit en cada commit; bloquea severity >= medium                      | ✅     |
| Auditoría de CVEs en dependencias            | NIST SA-10 · ENS [op.pl.2]  | `safety check` en pre-commit y en CI/CD pipeline                       | ✅     |
| Sin secretos en el repositorio               | RGPD Art. 25 · CWE-798      | `detect-private-key` hook en pre-commit bloquea el commit              | ✅     |
| Tests sin acceso a BD/red reales             | ISO 12207 §5.5 · CWE-1026   | BD `:memory:` en tests de integración; `mock.patch` para APIs externas | ✅     |

---

## VII. Práctica Profesional

> **Escenario:** Un equipo de 3 desarrolladores trabaja en una app Python conectada a Supabase. El CTO exige que ningún código arrive a `main` sin tests, auditoría de seguridad y verificación de tipos. El pipeline completo debe ejecutarse en < 2 minutos en CI.

**Requerimiento:** Pre-commit (ruff + mypy + bandit) + CI (pytest ≥80% + safety) en GitHub Actions.

```bash
# Setup de 3 comandos
pip install pytest pytest-cov mypy bandit safety ruff pre-commit
pre-commit install
pre-commit run --all-files && pytest tests/ --cov=src --cov-fail-under=80 -q && safety check
```

| Fase                  | Herramienta  | Tiempo         |
| --------------------- | ------------ | -------------- |
| Formateo y linting    | ruff         | < 2s           |
| Verificación de tipos | mypy         | 10–20s         |
| Análisis de seguridad | bandit       | 5–15s          |
| Tests con cobertura   | pytest --cov | 20–60s         |
| Auditoría de CVEs     | safety       | 10–20s         |
| **Total**             |              | **< 2 min** ✅ |
