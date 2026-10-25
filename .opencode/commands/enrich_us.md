---
description: "SPECBOOT paso 1 — Refina una user story cruda en refined US con AC, no-funcionales, riesgos y supuestos. Args: <slug-existente-o-descripción-cruda>"
---

Estás en el paso `enrich_us` del ciclo SPECBOOT. Ver `SPECBOOT.md` del repo para el flujo completo.

## Entrada

`$ARGUMENTS` puede ser:

1. **Un slug existente**: si `specs/active/<slug>/01-user-story.md` ya existe, léelo y produce el refinamiento.
2. **Texto crudo de una US**: en ese caso, genera un slug en kebab-case (2-4 palabras, describiendo la capacidad), crea `specs/active/<slug>/01-user-story.md` desde `specs/_templates/01-user-story.md` con el texto crudo pegado en la sección `## Contexto crudo`, y luego procede al refinamiento.

Verifica el `status` en el frontmatter de `01-user-story.md`. Solo procede si `status: raw`. Si es cualquier otro estado, detente y avísale al usuario.

## Salida

Crear `specs/active/<slug>/02-refined.md` copiando de `specs/_templates/02-refined.md` y completando todas las secciones:

- **Actor** — quién ejecuta / quién se beneficia
- **Valor** — problema real, cuantificado si es posible
- **Criterios de aceptación** — Gherkin, cada uno verificable programáticamente
- **Requisitos no funcionales** — performance, seguridad, red/costos, observabilidad y compatibilidad
- **Supuestos** — marcados con `[CONFIRMAR]` los que no estén verificados
- **Riesgos** — blast radius, reversibilidad, dependencias externas y consumidores afectados
- **Fuera de alcance** — explícito para prevenir scope creep

Después de escribir:

1. Actualiza el frontmatter de `specs/active/<slug>/01-user-story.md`: `status: refined`.
2. Actualiza el frontmatter de `02-refined.md`: `refined_at: <fecha de hoy>`.
3. Reporta al usuario en el chat:
   - Slug del feature.
   - Lista de supuestos `[CONFIRMAR]` — pide validación explícita.
   - Riesgos identificados que merezcan discusión ANTES de correr `/propose`.

## Prohibido en este paso

- No proponer implementación técnica.
- No listar archivos a modificar.
- No escribir código, tests, ni crear ramas.
- No inventar criterios de aceptación que el usuario no pueda validar. Si algo no está claro, marcarlo como `[CONFIRMAR]` en supuestos.

## Siguiente paso

Cuando el usuario confirme los supuestos y ajuste riesgos, correr `/propose <slug>`.
