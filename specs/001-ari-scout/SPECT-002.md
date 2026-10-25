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

## Fuera de alcance

- Search Console e inventario real del sitio (SPECT-003).
- Extracción de páginas competidoras (SPECT-004).
- Síntesis LLM (SPECT-005).
- scheduling y ejecución multi-tenant (SPECT-006).
