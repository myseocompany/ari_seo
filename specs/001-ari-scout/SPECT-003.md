# SPECT-003 — Search Console e inventario del sitio

## Estado

Implementado y verificado offline el 2026-10-24. El smoke combinado sin credenciales propias se documenta en [`SPECT-003-smoke.md`](SPECT-003-smoke.md); queda pendiente probar una propiedad real autorizada.

## Resultado

Incorporar señales propias del sitio para que Scout decida entre `build`, `update`, `merge`, `watch` y `reject` en lugar de proponer siempre una URL nueva.

```text
ScoutRequest.site_url
  ├── Google Search Console: query + page + clicks/impressions/position
  └── Sitemap: URLs indexables conocidas
                 ↓
       SiteSignals + SiteInventory
                 ↓
       KeywordMap y SEOBrief
```

## Fuentes

- Search Analytics Query API: https://developers.google.com/webmaster-tools/v1/searchanalytics/query
- Autorización: https://developers.google.com/webmaster-tools/v1/how-tos/authorizing
- Protocolo Sitemap: https://www.sitemaps.org/protocol.html

## Entrada adicional

- `search_console_site_url`: propiedad exacta de Search Console; permite una URL-prefix property o `sc-domain:example.com`.
- `limits.max_gsc_rows`: default 25.000, máximo 100.000.
- `limits.max_site_urls`: default 10.000, máximo 50.000.

Si `search_console_site_url` no está presente, se usa `site_url`. Search Console es opcional para ejecutar Scout, pero su ausencia debe quedar visible como gap.

## Search Console

- Ventana inicial: 28 días completos, terminando tres días antes de la ejecución.
- Dimensiones: `query`, `page`.
- Paginación con `rowLimit` y `startRow`.
- Conservar clicks, impressions, CTR y position sin redondear el dato fuente.
- Autenticación Bearer inyectada; el token nunca se registra ni se cachea.
- HTTP 401/403 no se reintenta; 429/5xx sí, de forma acotada.

## Inventario

- Empezar por `/sitemap.xml` o por una URL inyectada.
- Soportar `urlset` y `sitemapindex`.
- Resolver índices de forma acotada y evitar ciclos.
- Aceptar únicamente HTTP(S), con timeout y límite de tamaño.
- Normalizar URLs y conservar `lastmod` si existe.
- El inventario no prueba indexación; solo registra URLs declaradas.

## Decisiones

- Una query con una página existente: `update`.
- Una query con varias páginas: `merge` y señal de canibalización.
- Query sin página pero con SERP: `build`.
- Query sin evidencia SERP suficiente: `watch`.
- El dominio propio se excluye de competidores.
- Los enlaces internos sugeridos provienen únicamente de URLs observadas en Search Console o Sitemap.

## Criterios de aceptación

1. El cliente pagina hasta el límite configurado.
2. Credenciales y tokens no aparecen en errores.
3. Una misma query con dos páginas produce `merge`.
4. Una query con una página produce `update`.
5. Sitemap index y urlset se resuelven con límites y sin ciclos.
6. XML inválido, timeout o tamaño excesivo produce un error estable.
7. La ausencia de GSC permite continuar con un gap explícito.
8. Las URLs propias no aparecen como competidores.
9. El suite normal no usa red ni credenciales.
10. El brief combinado continúa validando contra `SEOBrief`.

## Fuera de alcance

- Inspección individual de indexación.
- Google Analytics.
- Crawling/render de todas las páginas.
- Corrección automática de canibalización.
