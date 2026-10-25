# SPECT-002 — Adaptador DataForSEO

## Estado

Implementado y verificado offline y contra DataForSEO real el 2026-10-24. El resultado del smoke test está en [`SPECT-002-smoke.md`](SPECT-002-smoke.md).

## Resultado

Reemplazar las señales sintéticas de keywords y SERP de SPECT-001 por adquisiciones reales y opt-in de DataForSEO, conservando exactamente los modelos normalizados y el ensamblaje del `SEOBrief`.

```text
ScoutRequest
  → DataForSEO Labs: keyword suggestions
  → selección acotada de consultas
  → DataForSEO SERP: organic live advanced (una task por request)
  → normalización + ledger + presupuesto
  → pipeline SPECT-001
```

## Endpoints

- `POST /v3/dataforseo_labs/google/keyword_suggestions/live`
- `POST /v3/serp/google/organic/live/advanced`

Referencias oficiales:

- https://docs.dataforseo.com/v3/dataforseo_labs-google-keyword_suggestions-live/
- https://docs.dataforseo.com/v3/serp-google-organic-live-advanced/
- https://docs.dataforseo.com/v3/auth/

## Configuración

Variables obligatorias solo para el modo real:

- `DATAFORSEO_LOGIN`
- `DATAFORSEO_PASSWORD`

`DATAFORSEO_USER` se acepta como alias compatible de `DATAFORSEO_LOGIN`.

Variables opcionales:

- `DATAFORSEO_BASE_URL` (default `https://api.dataforseo.com`)
- `DATAFORSEO_TIMEOUT_MS` (default `20000`)
- `DATAFORSEO_MAX_RETRIES` (default `2`)
- `DATAFORSEO_CACHE_DIR` (default `.cache/ari-scout/dataforseo`)
- `DATAFORSEO_CACHE_TTL_SECONDS` (default `86400`)
- `DATAFORSEO_ESTIMATE_KEYWORDS_USD` (default conservador `0.05` por task)
- `DATAFORSEO_ESTIMATE_SERP_USD` (default conservador `0.01` por task)

Los estimados protegen el techo antes de llamar. El costo reportado por DataForSEO se registra además como costo real. Los defaults no constituyen precios contractuales y deben calibrarse contra la cuenta.

## Reglas

- Nunca registrar `Authorization`, login o password.
- Rechazar la ejecución antes de red si faltan credenciales.
- Reservar presupuesto estimado antes de cada request.
- Enviar una task por request SERP, según la restricción observada del endpoint Live Advanced, hasta `max_serp_queries`.
- Reintentar solamente timeouts, HTTP 429 y 5xx.
- No reintentar autenticación, request inválido o códigos de task no retryable.
- Cachear por endpoint + payload normalizado; nunca por credenciales.
- Preservar `null` cuando una métrica no existe.
- Incluir endpoint, task id, costo y tiempo observado en telemetría interna.

## Criterios de aceptación

1. La autenticación Basic se forma correctamente sin aparecer en errores.
2. Keywords se normalizan desde una respuesta fixture de DataForSEO.
3. Solo items `organic` se convierten en competidores SERP.
4. Las llamadas SERP de una task respetan `max_serp_queries`.
5. Un techo insuficiente lanza `BUDGET_EXHAUSTED` antes de `fetch`.
6. HTTP 429/5xx y timeout tienen retry acotado; HTTP 401 no.
7. Una segunda llamada idéntica usa caché y no consume red/presupuesto nuevamente.
8. Un task status distinto de `20000` produce un error estable y sanitizado.
9. El pipeline real resultante valida como `SEOBrief` o falla explícitamente por evidencia.
10. El suite por defecto no usa red ni credenciales.

## Alcance

### Incluido

- cliente HTTP con autenticación Basic, timeout, retry acotado y clasificación de errores;
- adquisición de keywords vía DataForSEO Labs y de SERP orgánica vía Live Advanced;
- normalización a los modelos internos de SPECT-001, sin filtrar tipos crudos al dominio;
- presupuesto estimado por request y registro del costo reportado;
- caché por endpoint más payload normalizado, con TTL;
- fixtures grabadas y saneadas de respuestas reales.

### Fuera de alcance

- Search Console e inventario real del sitio (SPECT-003).
- Extracción de páginas competidoras (SPECT-004).
- Síntesis LLM (SPECT-005).
- scheduling y ejecución multi-tenant (SPECT-006).

## Definition of Done

- [x] cliente con autenticación, timeout y retry acotado;
- [x] normalización de keywords y SERP contra el modelo interno;
- [x] presupuesto reservado antes de cada request y costo reportado registrado;
- [x] caché por endpoint y payload, nunca por credenciales;
- [x] fixtures grabadas y saneadas de respuestas reales en `fixtures/dataforseo/`, producidas por `scripts/record-dataforseo-fixtures.mjs`;
- [x] smoke test contra la API real documentado en [`SPECT-002-smoke.md`](SPECT-002-smoke.md);
- [x] suite por defecto sin red ni credenciales;
- [x] criterios de aceptación 1 a 10 automatizados;
- [ ] logs y métricas estructurados con redacción central de secretos (abierto, P4 en [`tasks.md`](tasks.md)).

## Incumplimiento de gate

Este incremento se implementó y se ejecutó contra la API real el 2026-10-24, el mismo día que SPECT-001, **antes de completar la revisión humana del brief dorado** que SPECT-001 declaraba bloqueante. La desviación quedó registrada y el gate fue cerrado retrospectivamente el 2026-10-25; ver [`../done/ari-scout/05-human-review.md`](../done/ari-scout/05-human-review.md).

Las fixtures de este SPECT fueron inicialmente escritas a mano, incumpliendo el requisito de `spec.md` de usar grabaciones saneadas. Esa decisión causó el fallo documentado en el smoke test: el stub asumía que Organic Live Advanced acepta varias tasks por request y el suite pasaba en verde contra una API imaginaria. Corregido el 2026-10-24 con grabaciones reales.
