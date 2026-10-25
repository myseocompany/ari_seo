---
description: "SPECBOOT paso 3 — Crea worktree + rama, scaffolding de tests/docs/código, inicializa testing report. Args: <slug>"
---

Estás en el paso `apply` del ciclo SPECBOOT. Ver `SPECBOOT.md` del repo.

## Precondición

`$ARGUMENTS` = slug del feature. Debe existir `specs/active/<slug>/03-proposal.md` con `status: proposed` en `01-user-story.md`.

El usuario debió aprobar el proposal en el paso anterior. Si no hay confirmación clara en el chat, pídela ANTES de continuar.

## Acciones

### 1. Crear worktree y rama

Desde el repo raíz:

```bash
git fetch origin main
REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
WORKTREE="/private/tmp/${REPO_NAME}-<slug>"
git worktree add "$WORKTREE" -b feature/<slug> origin/main
```

Reporta el path del worktree. Para trabajar aislado en él desde OpenCode, mueve la sesión al worktree con `tools.opencode.session_move` (herramienta `execute`, con `directory` = path absoluto del worktree), o abre una nueva sesión de OpenCode directamente en ese directorio.

### 2. Copiar el spec al worktree

El worktree se creó desde `origin/main`, así que `specs/active/<slug>/` aún NO existe allí. Copia los 3 archivos ya creados (`01`, `02`, `03`) al worktree:

```bash
mkdir -p "$WORKTREE/specs/active/<slug>"
cp specs/active/<slug>/01-user-story.md "$WORKTREE/specs/active/<slug>/"
cp specs/active/<slug>/02-refined.md "$WORKTREE/specs/active/<slug>/"
cp specs/active/<slug>/03-proposal.md "$WORKTREE/specs/active/<slug>/"
```

### 3. Inicializar testing report

En el worktree, crear `specs/active/<slug>/04-testing-report.md` desde `specs/_templates/04-testing-report.md` con `report_started` = fecha de hoy.

### 4. Scaffolding en el worktree

Basado en la sección "Cambios propuestos" del `03-proposal.md`:

- **Tests primero**: crear los archivos `node:test` declarados en el plan (esqueletos con `test.todo('AC1: ...')`). Sin implementación aún.
- **Contratos**: si el proposal cambia JSON Schema, crear o actualizar el schema y las fixtures declaradas.
- **Módulos/CLI/adaptadores**: crear los archivos o exports mínimos que declara el proposal.
- **Docs**: si el proposal declara documentación, crear un stub con `TODO: completar en /verify`.

### 5. Implementación

Después del scaffolding, procede a implementar la funcionalidad respetando el proposal. Si durante la implementación descubres que el plan original no es viable, edita `03-proposal.md` añadiendo `## Cambios respecto al plan original` con la divergencia y la razón. NO borres el plan original.

### 6. Actualizar estado

Al terminar la implementación inicial (antes del loop de verify):

1. Actualiza `status: applied` en `01-user-story.md` del worktree.
2. Reporta al usuario:
   - Path del worktree.
   - Rama creada.
   - Archivos creados/modificados.
   - Cambios respecto al proposal (si los hubo).
   - Instrucción: correr `/verify <slug>` seguido de `/code_review <slug>`.

## Prohibido en este paso

- No pushear la rama al remoto (eso es responsabilidad de `/commit`).
- No fusionar con `main`.
- No borrar ni modificar `specs/done/` de features anteriores.
- No trabajar en el checkout principal — todo el trabajo va en el worktree.
