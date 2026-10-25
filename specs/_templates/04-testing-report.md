---
slug: <feature-slug>
report_started: <YYYY-MM-DD>
report_completed: <YYYY-MM-DD o vacío>
---

# Testing Report

## Verificadores automáticos

| Verificador | Comando | Resultado | Notas |
|---|---|---|---|
| Tests dirigidos | `node --test <archivo(s)>` | PASS/FAIL/N/A | <nº de tests> |
| Suite completa | `npm test` | PASS/FAIL | <nº de tests> |
| Brief dorado sincronizado | `npm run golden:update` + revisión del diff | PASS/N/A | <solo si puede cambiar> |
| Integración real | <comando opt-in> | PASS/FAIL/N/A | <autorización y presupuesto> |

## Cobertura de criterios de aceptación

Marcar cada AC del `02-refined.md`:

- [ ] **AC1** — <título AC>. Cubierto por: `test/<archivo>.test.js` (`<nombre del test>`).
- [ ] **AC2** — <título AC>. Cubierto por: <archivo::método>.

## Verificación manual (UI o integraciones externas)

Cuando aplique. Documentar entorno, fixture o proveedor usado y cualquier costo incurrido.

- [ ] Escenario 1: <descripción>. Resultado: <ok / falló / se corrigió>.
- [ ] Escenario 2: ...

## Fallos encontrados y decisiones

Cualquier fallo durante `/verify` o `/code_review` que llevó a `implement changes`:

- **Fallo 1**: <descripción>. Causa raíz: <análisis>. Decisión: <fix aplicado / diferido con justificación>.
- **Fallo 2**: ...

## Áreas NO cubiertas

Sinceridad total: qué queda sin probar y por qué.

- <ej. "Escenario de concurrencia real requiere carga sintética, no cubierto">.

## Estado final

- [ ] Todos los verificadores automáticos en verde.
- [ ] Todos los AC cubiertos por tests o verificación manual documentada.
- [ ] `/code_review` sin observaciones bloqueantes.
- [ ] Proposal actualizada si hubo divergencias.

Solo cuando las 4 cajas están marcadas, el feature pasa a `FEATURE READY` y se puede correr `/archive`.
