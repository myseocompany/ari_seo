# Backlog — ARI Scout

Las prioridades siguen el orden de ejecución del [`roadmap.md`](roadmap.md). Los criterios de cada incremento están en su SPECT; la evaluación de repositorios reutilizables está en [`reuse-assessment.md`](reuse-assessment.md).

## P0 — fundación (SPECT-001)

- [x] Elegir runtime y registrar ADR.
- [x] Crear `contracts/scout-request.schema.json`.
- [x] Añadir validador de contratos y pruebas de los esquemas usados por Scout.
- [x] Definir modelos internos normalizados y puertos de proveedores.
- [x] Implementar estados terminales y catálogo inicial de errores.
- [x] Persistir el brief dorado y fijarlo con un test de regresión.
- [x] **Revisión humana del brief dorado.** Aprobada 8/8 el 2026-10-25; evidencia en [`../done/ari-scout/05-human-review.md`](../done/ari-scout/05-human-review.md).

## P1 — camino feliz DataForSEO (SPECT-002)

- [x] Implementar cliente con autenticación, timeout y retries.
- [x] Implementar adquisición de keywords con DataForSEO Labs.
- [x] Implementar adquisición y normalización de SERP orgánica.
- [x] Añadir fixtures para el corte offline.
- [x] Reemplazar las envolturas escritas a mano por grabaciones saneadas de respuestas reales.
- [x] Implementar selección determinista de keyword, intención y competidores.
- [x] Ensamblar y validar `SEOBrief` con fixtures.

## P2 — señales propias (SPECT-003)

- [x] Implementar Search Console con paginación y ventana estable.
- [x] Implementar inventario desde sitemap index/urlset.
- [x] Detectar `update` y canibalización `merge`.
- [x] Propagar gaps de señales propias al brief.
- [x] Ejecutar smoke test con una propiedad real autorizada (`sc-domain:maquiempanadas.com`, 2026-10-25).
- [x] Grabar fixture mínima saneada de Search Console desde una respuesta real; queries, dominio y métricas sustituidos conservando forma y tipos (`fixtures/search-console/search-analytics-live.json`). El sitemap real fue ejercitado en el smoke y su inventario permanece como artefacto local por volumen.

## P3 — enriquecimiento de competidores (SPECT-004)

Estrategia de dos niveles decidida en [ADR 0002](../../docs/adr/0002-estrategia-de-extraccion.md).

- [ ] Implementar extracción por HTTP directo con `robots.txt`, timeout y límite de tamaño.
- [ ] Definir el criterio de "evidencia utilizable" que escala a Apify.
- [ ] Definir selector/configuración de Actor sin acoplar el dominio.
- [ ] Implementar extracción limitada de páginas públicas.
- [ ] Normalizar títulos, encabezados y secciones relevantes.
- [ ] Añadir `EXTRACTION_BLOCKED` y `EXTRACTION_TOO_LARGE` al catálogo de errores.
- [ ] Implementar degradación `ready`/`partial` ante fallos.
- [ ] Grabar fixtures de ambos niveles de extracción.

## P4 — controles operativos (SPECT-006)

- [x] Implementar presupuesto estimado y costo reportado por ejecución.
- [x] Implementar caché y TTL por operación.
- [x] Añadir CI que falle sin red ni credenciales.
- [ ] Añadir logs/métricas estructurados y redacción central de secretos.
- [ ] Crear CLI o endpoint local y guía de operación.
- [ ] Permitir pasar el topic por parámetro al corte offline, hoy limitado al request embebido en la fixture.
- [ ] Ejecutar piloto y documentar resultados.

## Deuda conocida

- [ ] El outline de `recommended_page` sigue siendo una plantilla por idioma, no derivada de los hallazgos. `spec.md` exige derivación para `ready`; SPECT-001 autoriza plantillas en v0. El conflicto está sin resolver y requiere decisión de producto.
- [ ] El clustering produce agrupaciones pequeñas cuando el vocabulario de la solicitud es corto; con la fixture dorada genera dos clusters, uno de ellos unitario.
- [ ] `normalizeTerm` fija `toLocaleLowerCase("es")` aunque el corte dorado ya es `en-US`.
