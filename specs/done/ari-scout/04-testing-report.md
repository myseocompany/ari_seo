---
slug: ari-scout
report_started: 2026-10-24
report_completed: 2026-10-25
---

# Testing Report

## Verificadores automáticos

| Verificador | Comando | Resultado | Notas |
|---|---|---|---|
| Suite completa | `npm test` | PASS | 32/32 tests; ejecución offline |
| Brief dorado sincronizado | `npm run golden:update` y `git diff --exit-code -- fixtures/scout/en-us-golden.brief.json` | PASS | Sin diferencias |
| Integración real de Search Console | smoke opt-in | PASS | Propiedad `sc-domain:maquiempanadas.com`; fixture mínima saneada y versionada |

## Cobertura de criterios de aceptación

- [x] **AC1 — Preservación.** El histórico permanece bajo `specs/001-ari-scout/`.
- [x] **AC2 — Trazabilidad.** Cubierto por el mapa de `03-proposal.md` y la matriz RF del spec histórico.
- [x] **AC3 — Verificación reproducible.** Cubierto por `npm test` y `.github/workflows/ci.yml`.
- [x] **AC4 — Honestidad de estado.** Permaneció `applied` mientras hubo gates abiertos y pasó a `ready` solo después de cerrarlos.
- [x] **AC5 — Continuidad.** Documentado en `SPECBOOT.md`, `AGENTS.md` y este proposal.

## Verificación manual pendiente

- [x] Revisión humana completa: 8/8 criterios aprobados; ver `05-human-review.md`.
- [x] Competidores curados: cinco incluidos y dos excluidos por decisión humana.
- [x] Supuestos/límites ampliados, visibles y aprobados.
- [x] Smoke de Search Console sobre `sc-domain:maquiempanadas.com`.

## Revisión estructurada

| Eje | Estado | Justificación |
|---|---|---|
| Fidelidad al proposal | OK | La normalización documenta sus divergencias y los cambios de código surgidos de la revisión humana. |
| Cobertura de AC | OK | Los cinco AC tienen evidencia local. |
| Contratos y compatibilidad | OK | El contrato público permanece compatible; cambian selección, evidencia y presentación dentro de campos existentes. |
| Seguridad y costos | OK | Smoke real dentro del límite de USD 0.25; secretos ausentes de fixtures y archivos versionados. |
| Efectos colaterales | OK | El histórico permanece; el golden actualizado fija la deduplicación de competidores y los límites explícitos. |
| Deuda técnica | OBSERVACIÓN | Persisten los pendientes documentados en `tasks.md` y `roadmap.md`. |

## Áreas no cubiertas

- El contenido de páginas competidoras no se extrajo (`max_competitor_pages: 0`); la selección fue curada manualmente.
- El inventario completo del sitemap y el resultado real permanecen locales por volumen y sensibilidad; se versiona solo la fixture mínima saneada de Search Console.
- Features futuras SPECT-004 a SPECT-006.

## Estado final

- [x] Verificadores automáticos aplicables en verde.
- [x] AC de la normalización cubiertos.
- [x] Revisión documental sin bloqueantes propios.
- [x] Proposal actualizado con la divergencia retrospectiva.
- [x] Gates del ciclo histórico cerrado para SPECT-001 a SPECT-003; el trabajo futuro continúa en SPECT-004 a SPECT-006.

Todos los gates de la normalización retrospectiva están cerrados. El ciclo puede archivarse; SPECT-004 a SPECT-006 permanecen como incrementos futuros independientes.
