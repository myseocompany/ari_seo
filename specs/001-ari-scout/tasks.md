# Backlog inicial — ARI Scout

La secuencia y los criterios del primer corte vertical están en [`SPECT-001.md`](SPECT-001.md). La evaluación de repositorios reutilizables está en [`reuse-assessment.md`](reuse-assessment.md).

## P0 — fundación

- [x] Elegir runtime y registrar ADR.
- [x] Crear `contracts/scout-request.schema.json`.
- [x] Añadir validador de contratos y pruebas de los esquemas usados por Scout.
- [x] Definir modelos internos normalizados y puertos de proveedores.
- [x] Implementar estados terminales y catálogo inicial de errores.

## P1 — camino feliz DataForSEO

- [x] Implementar cliente con autenticación, timeout y retries.
- [x] Implementar adquisición de keywords con DataForSEO Labs.
- [x] Implementar adquisición y normalización de SERP orgánica.
- [x] Añadir fixtures sintéticas para el corte offline.
- [x] Implementar selección determinista de keyword, intención y competidores.
- [x] Ensamblar y validar `SEOBrief` con fixtures.

## P3 — enriquecimiento Apify

- [ ] Definir selector/configuración de Actor sin acoplar el dominio.
- [ ] Implementar extracción limitada de páginas públicas.
- [ ] Normalizar títulos, encabezados y secciones relevantes.
- [ ] Implementar degradación `ready`/`partial` ante fallos.

## P2 — señales propias

- [x] Implementar Search Console con paginación y ventana estable.
- [x] Implementar inventario desde sitemap index/urlset.
- [x] Detectar `update` y canibalización `merge`.
- [x] Propagar gaps de señales propias al brief.
- [ ] Ejecutar smoke test con una propiedad real autorizada.

## P4 — controles operativos

- [x] Implementar presupuesto estimado y costo reportado por ejecución.
- [x] Implementar caché y TTL por operación.
- [ ] Añadir logs/métricas estructurados y redacción de secretos.
- [ ] Crear CLI o endpoint local y guía de operación.
- [ ] Ejecutar piloto `es-CO` y documentar resultados.

