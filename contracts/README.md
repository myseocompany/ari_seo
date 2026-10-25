# Contratos compartidos

Los contratos usan JSON Schema Draft 2020-12 y constituyen la única frontera definida actualmente entre agentes.

| Productor | Contrato | Consumidor |
| --- | --- | --- |
| ARI Scout | `SEOBrief` | ARI Build |
| ARI Build | `PageArtifact` | ARI Launch |
| ARI Launch | `PublicationResult` | ARI Core / observabilidad futura |

`ScoutRequest` define la entrada inicial de ARI Core/operador hacia ARI Scout.

## Convenciones

- Los identificadores son UUID.
- `contract_version` comienza en `1.0.0` y usa versionado semántico.
- Las fechas usan ISO 8601 en UTC.
- `trace_id` nace al iniciar el flujo y se conserva sin cambios.
- `source_id` enlaza cada salida con su entrada inmediata.
- `errors` usa el tipo común `ContractError`; los códigos deben ser estables y aptos para automatización.
- Los estados terminales fallidos deben incluir al menos un error. Esta regla transversal podrá reforzarse en la capa de validación de dominio futura.

## Compatibilidad

Un consumidor puede aceptar cambios compatibles dentro de una versión mayor. Debe rechazar una versión mayor desconocida y reportar un error de contrato. Los esquemas no definen todavía transporte, almacenamiento ni reintentos.

