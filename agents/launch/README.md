# ARI Launch

## Propósito

Validar y publicar un artefacto de página en un destino autorizado, y registrar el resultado técnico de la operación.

## Responsabilidades futuras

- Ejecutar validaciones previas a publicación.
- Integrarse con CMS o sistemas de despliegue.
- Publicar y verificar URL, respuesta HTTP e indexabilidad.
- Gestionar sitemap y directivas de indexación.
- Registrar resultados, estados y errores posteriores a la publicación.
- Emitir un `PublicationResult` trazable hasta el artefacto y brief originales.

## Límites

ARI Launch no investiga keywords, no genera ni corrige contenido de forma autónoma y no altera el artefacto recibido. Si la validación falla, debe detener la publicación y reportar el resultado.

## Contrato

- **Entrada:** [`PageArtifact`](../../contracts/page-artifact.schema.json) con estado `ready`.
- **Salida:** [`PublicationResult`](../../contracts/publication-result.schema.json).
- **Fallo:** una publicación fallida o parcial debe conservar evidencia de las verificaciones realizadas y errores estructurados.

No existe implementación en esta etapa.

