---
description: "SPECBOOT paso 4b — Auto-review estructurado del feature contra el proposal. Args: <slug>"
---

Estás en el paso `code_review` del ciclo SPECBOOT. Ver `SPECBOOT.md` del repo.

## Precondición

`$ARGUMENTS` = slug del feature. Debes estar en el worktree del feature. `/verify` debió pasar antes (todos los verificadores en PASS y AC cubiertos).

## Acciones

### 1. Contexto

Lee:
- `specs/active/<slug>/02-refined.md` (AC, no-func, riesgos)
- `specs/active/<slug>/03-proposal.md` (plan técnico, alternativas)
- Diff completo del feature: `git diff origin/main...HEAD`

### 2. Review estructurado

Analiza el diff contra 6 ejes. Para cada uno, marca `OK`, `OBSERVACIÓN` (no bloqueante), o `BLOQUEANTE`.

- **Fidelidad al proposal** — ¿el código refleja el plan? Divergencias no documentadas = BLOQUEANTE.
- **Cobertura de AC** — ¿cada AC tiene su test correspondiente y assertions reales, no `->todo()`?
- **Contratos y compatibilidad** — ¿schemas, consumidores, fixtures y versiones permanecen coherentes?
- **Seguridad y costos** — ¿entradas validadas, secretos redactados, red y gasto limitados explícitamente?
- **Efectos colaterales** — ¿CLI, proveedores o artefactos modificados rompen consumidores existentes? Contratos alterados sin nota.
- **Deuda técnica** — código muerto, comentarios `TODO/FIXME` sin ticket, duplicación evidente, error handling defensivo innecesario.

### 3. Reglas del repo

Verifica cumplimiento de reglas de `AGENTS.md`:

- Si cambió un contrato, ¿actualizó schema, consumidores, fixtures y tests?
- Si puede alterar el brief dorado, ¿se revisó explícitamente su diff?
- ¿Los tests siguen siendo offline y sin credenciales?
- Si usa una integración real, ¿tiene presupuesto y autorización explícitos?

### 4. Opción escalar a revisión independiente

Si el diff excede 300 líneas o toca áreas críticas (auth, tenancy, migraciones grandes, pagos, prompts de agentes IA), sugiere al usuario escalar a una revisión independiente en lugar del auto-review — por ejemplo, disparar un subagente `general` con el diff y los artefactos del spec como contexto para un review con ojos frescos. Cita explícitamente por qué conviene escalar.

### 5. Reportar

En el chat, y en `specs/active/<slug>/04-testing-report.md` (sección Fallos encontrados):
- Tabla de 6 ejes con marca (OK/OBS/BLOQ) y una línea de justificación cada uno.
- Reglas de AGENTS.md: cumplimiento por ítem aplicable.
- Lista priorizada de observaciones y bloqueantes.
- Instrucción: si hay BLOQUEANTE → `implement changes` y luego `/verify` de nuevo. Si solo hay OBS o todo OK → marcar `status: ready` en `01-user-story.md` y correr `/archive <slug>` seguido de `/commit <slug>`.

## Prohibido

- No firmar OK en un eje sin haber inspeccionado el diff correspondiente.
- No omitir hallazgos por "el usuario tiene prisa".
- No proponer cambios estéticos como bloqueantes si no violan una regla del repo.
