# SPECT-003 — Smoke test combinado

- Fecha: 2026-10-24
- Resultado: `partial` esperado
- Keyword primaria preservada: `crm para pymes`
- Costo incremental DataForSEO: USD 0 (caché)

## Gaps observados

- Search Console se omitió porque no existe `GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN` en el entorno.
- `https://example.com/sitemap.xml` respondió HTTP 404.

El resultado confirma que el pipeline no inventa señales propias: conserva el brief externo, registra ambos gaps y evita declarar `ready`. El smoke real de `update/merge` queda pendiente de una propiedad y sitemap autorizados.

## Verificación offline

- 25/25 pruebas pasan.
- Paginación GSC, errores de autenticación, sitemap index/urlset, ciclos, límites, `update`, `merge` y gaps están cubiertos sin red.
