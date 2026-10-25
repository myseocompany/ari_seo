---
description: "SPECBOOT paso 5a — Mueve specs/active/<slug>/ a specs/done/<slug>/ y marca el feature como archivado. Args: <slug>"
---

Estás en el paso `archive` del ciclo SPECBOOT. Ver `SPECBOOT.md` del repo.

## Precondición

`$ARGUMENTS` = slug del feature. Debes estar en el worktree del feature con:

- `status: ready` en `specs/active/<slug>/01-user-story.md`
- Todos los verificadores en PASS (según `04-testing-report.md`)
- `/code_review` sin observaciones bloqueantes

Si alguna precondición no se cumple, detente y avísale al usuario.

## Acciones

### 1. Verificar completitud del testing report

Lee `specs/active/<slug>/04-testing-report.md`. La sección **Estado final** debe tener las 4 cajas marcadas:

- [x] Todos los verificadores automáticos en verde.
- [x] Todos los AC cubiertos por tests o verificación manual documentada.
- [x] `/code_review` sin observaciones bloqueantes.
- [x] Proposal actualizada si hubo divergencias.

Si falta alguna, detén y reporta cuál falta.

### 2. Mover artefactos

```bash
mkdir -p specs/done/<slug>
git mv specs/active/<slug>/* specs/done/<slug>/
rmdir specs/active/<slug>
```

### 3. Actualizar estados

- Frontmatter de `specs/done/<slug>/01-user-story.md`: `status: archived`.
- Frontmatter de `specs/done/<slug>/04-testing-report.md`: `report_completed: <fecha de hoy>`.

### 4. Reportar

En el chat:
- Confirmación de movimiento.
- Path final: `specs/done/<slug>/`.
- Instrucción: correr `/commit <slug>` para preparar el commit y el cuerpo del PR.

## Prohibido

- No archivar si el testing report no está completo.
- No mover archivos fuera del worktree del feature.
- No borrar archivos — solo moverlos con `git mv`.
