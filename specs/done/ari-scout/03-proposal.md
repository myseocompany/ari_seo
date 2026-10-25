---
slug: ari-scout
proposed_at: 2026-10-24
---

# Proposal — Normalización retrospectiva

## Resumen

Crear una capa canónica SPECBOOT que indexe el ciclo histórico de ARI Scout, sin moverlo ni duplicarlo. La capa registra alcance, trazabilidad, resultados verificables y gates abiertos; permanece en `active` hasta que se satisfagan los gates que requieren intervención humana o una integración autorizada.

## Cambios propuestos

- `specs/done/ari-scout/01-user-story.md` — preservar la solicitud y el origen histórico.
- `specs/done/ari-scout/02-refined.md` — expresar criterios verificables para la normalización.
- `specs/done/ari-scout/03-proposal.md` — mapear requisitos, código y evidencia sin duplicarlos.
- `specs/done/ari-scout/04-testing-report.md` — registrar verificadores y bloqueos reales.
- `README.md` — enlazar el ciclo normalizado activo.
- `scripts/generate-golden-review.mjs` y `docs/golden-brief-review.html` — ofrecer una revisión humana legible y reproducible del JSON dorado.

## Mapa de trazabilidad

| Área | Requisito/plan histórico | Implementación o contrato | Evidencia |
|---|---|---|---|
| Entrada y salida | `spec.md`, RF-01 y contratos | `contracts/scout-request.schema.json`, `contracts/seo-brief.schema.json`, `src/scout/contracts.js` | `test/scout.test.js` |
| Pipeline offline | `SPECT-001.md` | `src/scout/domain.js`, `src/scout/run.js`, fixture y brief dorados | `test/scout.test.js` |
| DataForSEO | `SPECT-002.md` | cliente, provider, normalización, presupuesto y caché bajo `src/scout/` | `test/dataforseo.test.js` y fixtures grabadas |
| Señales propias | `SPECT-003.md` | `search-console-client.js`, `sitemap-provider.js` | `test/site-signals.test.js` |
| Estrategia de extracción | `roadmap.md`, SPECT-004 pendiente | `docs/adr/0002-estrategia-de-extraccion.md` | sin implementación todavía |
| Operación | `plan.md`, `tasks.md` | `.github/workflows/ci.yml`, CLI y scripts existentes | CI y suite completa |

La matriz detallada RF → tests continúa en `specs/001-ari-scout/spec.md#trazabilidad-de-requisitos`.

## Contratos afectados

Ninguno. La normalización no modifica schemas, CLI, proveedores, fixtures ni artefactos generados.

## Alternativas descartadas

- **Mover `specs/001-ari-scout/` a `specs/done/`:** descartado porque sugeriría que todos los gates están cerrados y rompería enlaces existentes.
- **Copiar todo el histórico dentro del nuevo directorio:** descartado porque crearía fuentes de verdad duplicadas y divergentes.
- **Rehacer implementación y tests:** descartado porque la evidencia reproducible existente sigue siendo válida.

## Plan de tests

- Ejecutar `npm test` sin credenciales.
- Regenerar el brief dorado y comprobar que no produce diff.
- Verificar enlaces y rutas citadas en los cuatro artefactos.
- Revisar que el estado permanezca `applied` mientras haya gates bloqueantes abiertos.

## Impacto operativo

- Sin cambios de runtime, contratos, dependencias, red ni costos.
- Rollback: retirar únicamente la carpeta normalizada y su enlace de README; el histórico permanece intacto.
- Los trabajos futuros siguen su propio SPECBOOT y referencian el histórico cuando corresponda.

## Gates para pasar a `ready`

1. Revisión humana: completada y aprobada 8/8 (ver `05-human-review.md`).
2. Fixture mínima de Search Console grabada y saneada en `fixtures/search-console/search-analytics-live.json`; completado el 2026-10-25.
3. Repetir `/verify` y `/code_review` después de incorporar esa evidencia.

## Estimación

- Complejidad: baja.
- Riesgo de regresión: bajo; solo documentación.
- Riesgo documental: medio si se archiva antes de cerrar los gates anteriores.

## Cambios respecto al plan original

La intención inicial era cerrar retrospectivamente el ciclo. La auditoría mostró gates todavía abiertos; por integridad del proceso se normaliza como `applied`, no como `ready` o `archived`.
