---
description: "SPECBOOT paso 2 — Produce el proposal técnico a partir de la refined US. Args: <slug>"
---

Estás en el paso `propose` del ciclo SPECBOOT. Ver `SPECBOOT.md` del repo.

## Entrada

`$ARGUMENTS` = slug del feature. Debe existir `specs/active/<slug>/02-refined.md` con `status: refined` en `01-user-story.md`.

Si el status es distinto de `refined`, detente y explica cuál es el paso correcto.

**Lee**:
- `specs/active/<slug>/01-user-story.md`
- `specs/active/<slug>/02-refined.md`
- `SPECBOOT.md` del repo (para conocer verificadores y convenciones)
- `AGENTS.md` del repo (para reglas específicas de contratos, fixtures, red y costos)
- Solo archivos del código directamente relevantes a la feature (no leer todo el repo).

## Salida

Crear `specs/active/<slug>/03-proposal.md` copiando de `specs/_templates/03-proposal.md` y completando:

- **Resumen** — 2-3 líneas: qué y cómo
- **Cambios propuestos** — lista de archivos/componentes con razón (sin código, solo topología)
- **Contratos afectados** — endpoints, resources, eventos, prompts. Si no aplica, decirlo explícitamente.
- **Alternativas descartadas** — al menos una, con la razón. Sin esto el proposal es incompleto.
- **Plan de tests** — qué tests van a cubrir cada AC del refined
- **Impacto operativo** — compatibilidad, reversibilidad, costos de proveedor, datos/fixtures y documentación
- **Estimación** — complejidad, tiempo LLM, riesgo de regresión

## Reglas especiales

- Si cambia un JSON Schema, declarar versión, compatibilidad, consumidores, fixtures y tests afectados.
- Si toca proveedores reales, declarar presupuesto, límites, redacción de secretos y estrategia offline.
- Si cambia un artefacto dorado, declarar cómo se revisará y aprobará su diff.

## Después de escribir

1. Actualiza `status: proposed` en `01-user-story.md`.
2. Actualiza `proposed_at` en `03-proposal.md`.
3. Reporta al usuario:
   - Resumen ejecutivo del proposal.
   - Alternativas consideradas.
   - Riesgos operativos principales.
   - Pregunta explícita: **¿apruebas el plan para correr `/apply`?**

## Prohibido en este paso

- No crear ramas ni worktrees.
- No escribir código de implementación.
- No escribir tests reales — solo el plan de tests.
- No modificar archivos fuera de `specs/active/<slug>/`.
