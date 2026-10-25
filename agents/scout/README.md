# ARI Scout

## Propósito

Investigar oportunidades de posicionamiento orgánico y convertir evidencia SEO en un brief accionable y verificable.

## Responsabilidades futuras

- Investigar palabras clave, intención de búsqueda, competidores y SERP.
- Detectar oportunidades y agrupar keywords por tema.
- Proponer arquitectura de contenidos y enlaces internos.
- Documentar evidencia, supuestos y recomendaciones.
- Emitir un `SEOBrief` válido.

## Límites

ARI Scout no redacta la página final, no genera HTML o componentes, no publica y no coordina a otros agentes. Una recomendación de contenido no equivale a contenido definitivo.

## Contrato

- **Entrada futura:** una solicitud de investigación definida por ARI Core (fuera del alcance actual).
- **Salida:** [`SEOBrief`](../../contracts/seo-brief.schema.json).
- **Fallo:** debe representarse mediante `status: "failed"` y errores estructurados; un resultado parcial debe declarar explícitamente `status: "partial"`.

## Implementación inicial

`SPECT-001` implementa un corte vertical offline con proveedores de fixtures, ledger de evidencia, mapa de keywords, scoring explicable y emisión validada de `SEOBrief`.

```bash
npm ci
npm test
npm run scout
```

Para obtener JSON puro redirigible, sin la cabecera de `npm run`:

```bash
node src/scout/cli.js fixtures/scout/es-co-golden.json
```

Las fixtures son sintéticas y no deben interpretarse como métricas SEO reales. Search Console y la extracción web siguen fuera de este primer incremento.

## DataForSEO (SPECT-002)

El modo real requiere una cuenta de DataForSEO. Copia `.env.example` a `.env`, completa únicamente las credenciales y ajusta `examples/scout-request.json` antes de ejecutar:

```bash
cp -n .env.example .env
npm run scout:dataforseo
```

La solicitud de ejemplo limita la investigación a 30 keywords, 5 SERPs y USD 0.25 estimados. Revisa el pricing vigente de tu cuenta antes de subir esos límites. El output completo incluye `artifacts.usage` con costo reservado y reportado.

## Sitio propio y Search Console (SPECT-003)

Configura `site_url` y, si la propiedad difiere, `search_console_site_url` en la solicitud. Añade un token OAuth temporal de lectura como `GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN` y ejecuta el pipeline combinado:

```bash
npm run scout:live
```

Sin token, Scout continúa y declara el gap; con más de una página posicionada para la misma consulta marca la oportunidad como `merge`. El inventario parte de `/sitemap.xml`; usa `SCOUT_SITEMAP_URL` si está en otra ruta.

