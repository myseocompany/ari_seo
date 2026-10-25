---
slug: <feature-slug>
proposed_at: <YYYY-MM-DD>
---

# Proposal — Plan técnico

## Resumen

En 2-3 líneas: qué se hace y cómo.

## Cambios propuestos

Lista de archivos y componentes a crear/modificar. No pegar código — solo la topología del cambio.

- `src/<área>/<módulo>.js` — <razón>
- `contracts/<contrato>.schema.json` — <cambio de contrato, si aplica>
- `fixtures/<área>/<fixture>.json` — <evidencia reproducible, si aplica>
- `test/<área>.test.js` — <qué escenarios>

## Contratos afectados

Schemas, formatos de CLI, interfaces de proveedores y artefactos publicados. Detallar cambios de firma, payload, versión o comportamiento.

- Schema `<nombre>`: <antes> → <después>
- CLI/comando `<nombre>`: <antes> → <después>
- Ninguno / No aplica

## Alternativas descartadas

Al menos una opción que se consideró y por qué no se eligió. Sin esto, el proposal es un "aquí está la solución" y no un plan.

- **Alternativa A**: <descripción>. Descartada porque <razón>.
- **Alternativa B**: <descripción>. Descartada porque <razón>.

## Plan de tests

Qué tests se van a escribir. Deben cubrir todos los AC del `02-refined.md`.

- **Integración offline**: `test/<área>.test.js`
  - <cubre AC1, AC2>
- **Unit**: `test/<módulo>.test.js`
  - <cubre lógica interna>
- **Regresión / manual**: <si aplica, qué se verifica en UI>

## Impacto operativo

- **Compatibilidad**: impacto sobre contratos, CLI y consumidores existentes.
- **Rollback**: cómo volver al comportamiento o versión previa.
- **Red y costos**: llamadas externas, presupuesto, límites y modo offline.
- **Datos y fixtures**: caché, fixtures grabadas y artefactos dorados afectados.
- **Documentación**: qué se actualiza en `README.md`, `docs/` o documentación de contratos/agentes.

## Estimación

- **Complejidad**: baja / media / alta.
- **Tiempo estimado LLM**: <horas de trabajo agéntico>.
- **Riesgo de regresión**: bajo / medio / alto — con áreas específicas.

## Cambios respecto al plan original

*(Esta sección se rellena durante `/apply` si la realidad diverge del plan. No borrar el plan original — anexar lo que cambió y por qué.)*
