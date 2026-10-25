# SPECT-002 — Smoke test DataForSEO

- Fecha: 2026-10-24
- Locale: `es-CO`
- Location: `Colombia`
- Tema: `software CRM para pymes`
- Límite configurado: USD 0.25
- Resultado: `ready`

## Resultado normalizado

- 19 candidatos de keyword.
- 5 SERPs válidas.
- 10 URLs competidoras en el brief.
- 24 observaciones de evidencia.
- keyword primaria: `crm para pymes`.
- 4 keywords secundarias.
- costo total reportado en las 6 respuestas válidas adquiridas: USD 0.02428.

La ejecución final tuvo costo incremental cero porque reutilizó las seis respuestas guardadas en caché.

## Hallazgo y corrección

La primera integración asumía que Organic Live Advanced aceptaba varias tasks en un request. La API real respondió `40000: You can set only one task at a time`. El adaptador fue corregido para enviar una task por request hasta `max_serp_queries`; el suite fue actualizado y la repetición produjo un brief `ready`.

## Verificaciones

- Las credenciales no aparecen en output ni errores.
- El resultado valida contra `SEOBrief` 1.0.0.
- El dominio propio no aparece como competidor.
- Los resultados no orgánicos no se convierten en competidores.
- 19/19 pruebas offline pasan después de la corrección.
