---
description: "SPECBOOT paso 5b — Redacta commit + body de PR con referencia al SPEC archivado. Args: <slug>"
---

Estás en el paso `commit` del ciclo SPECBOOT. Ver `SPECBOOT.md` del repo.

## Precondición

`$ARGUMENTS` = slug del feature. Debe existir `specs/done/<slug>/` (post `/archive`). Estás en el worktree del feature, rama `feature/<slug>`.

## Acciones

### 1. Verificar estado del worktree

```bash
git status
git diff --stat origin/main...HEAD
```

Todo cambio del feature debe estar staged o ya committeado. Cambios sueltos = detente y pregunta al usuario.

### 2. Redactar mensaje de commit

Formato conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.

Estructura:
- **Título** (≤72 chars, imperativo, en español si el repo lo usa)
- **Cuerpo**: 2-4 líneas explicando el **por qué**, no el qué. Referenciar `specs/done/<slug>/03-proposal.md`.

Ejemplo:
```
feat: enriquecer brief con señales del sitio

Incorpora señales reproducibles del sitio para mejorar la calidad del brief
sin introducir llamadas de red en el suite. Motivación y plan
técnico en specs/done/<slug>/03-proposal.md.
```

### 3. Preparar cuerpo de PR

Genera un borrador de body de PR (no lo pushees automáticamente):

```markdown
## Resumen
<2-3 líneas del proposal>

## Plan
Ver `specs/done/<slug>/03-proposal.md`.

## Criterios de aceptación cubiertos
- AC1: <título> — cubierto por `tests/...`
- AC2: ...

## Verificación
- `node --test <tests dirigidos>` — PASS (si aplica)
- `npm test` — PASS
- brief dorado sincronizado — PASS/N/A
- Ver `specs/done/<slug>/04-testing-report.md` para detalles.

## Riesgo operativo
<sección relevante del proposal>

## Test plan (para reviewer)
- [ ] <paso manual 1>
- [ ] <paso manual 2>
```

### 4. Crear commit

Si aún hay cambios pendientes de commit, hacer un commit final con el mensaje redactado. NO usar `--amend` de commits anteriores.

### 5. Reportar

En el chat:
- Hash del commit.
- Mensaje completo.
- Body de PR listo para copiar/pegar cuando el usuario decida hacer `gh pr create`.
- Recordatorio: `/commit` **no hace push ni crea PR automáticamente**. El usuario decide cuándo y cómo publicarlo, respetando `AGENTS.md`.

## Prohibido

- No `git push` sin autorización explícita del usuario.
- No `gh pr create` sin autorización explícita del usuario.
- No mergear a `main`.
- No usar `--amend` en commits ya pusheados.
- No commitear con `--no-verify` salvo instrucción explícita.
