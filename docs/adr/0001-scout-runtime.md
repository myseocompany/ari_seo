# ADR 0001 — Runtime inicial de ARI Scout

- Estado: aceptado
- Fecha: 2026-10-24

## Decisión

Implementar SPECT-001 en JavaScript ESM sobre Node.js 20. Usar el test runner nativo y Ajv Draft 2020-12 para validar contratos.

## Motivos

- Node.js 20 está disponible en el entorno actual.
- El corte vertical necesita principalmente transformación de JSON y un CLI.
- El test runner nativo reduce infraestructura inicial.
- Ajv permite que JSON Schema siga siendo la frontera real, no documentación duplicada en validadores manuales.

## Consecuencias

- Los adaptadores futuros deben exponer objetos del dominio, no respuestas de SDK.
- El código del dominio no depende de Ajv ni de clientes externos.
- Cambiar de runtime requeriría conservar los contratos y fixtures como pruebas de compatibilidad.
