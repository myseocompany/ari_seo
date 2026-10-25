# ARI Build

## Propósito

Transformar un brief SEO aprobado en un paquete de página listo para validación y publicación.

## Responsabilidades futuras

- Generar contenido, estructura visual, HTML y componentes.
- Aplicar SEO on-page, metadatos y datos estructurados.
- Definir enlaces internos.
- Optimizar rendimiento, accesibilidad y experiencia móvil.
- Emitir un `PageArtifact` trazable hasta el brief de origen.

## Límites

ARI Build no realiza investigación SEO primaria, no redefine silenciosamente la intención del brief, no publica y no decide el destino de despliegue. Las desviaciones del brief deben quedar registradas.

## Contrato

- **Entrada:** [`SEOBrief`](../../contracts/seo-brief.schema.json) con estado `ready`.
- **Salida:** [`PageArtifact`](../../contracts/page-artifact.schema.json).
- **Fallo:** debe representarse mediante estado y errores estructurados; no se debe emitir un artefacto `ready` si faltan archivos requeridos.

No existe implementación en esta etapa.

