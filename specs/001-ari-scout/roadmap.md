# Roadmap de ARI Scout

Los estados siguen el vocabulario definido en [`plan.md`](plan.md#vocabulario-de-estado). Ningún incremento pasa a `Completado` con una casilla abierta en su Definition of Done.

| SPECT | Incremento | Estado | Qué falta |
| --- | --- | --- | --- |
| 001 | Pipeline offline, evidencia, scoring y contratos | `Implementado` | Revisión humana del brief dorado. |
| 002 | DataForSEO keywords + SERP, presupuesto, caché y retry | `Implementado` | Logs y métricas estructurados con redacción de secretos. |
| 003 | Search Console e inventario/canibalización del sitio | `Implementado` | Smoke real con propiedad autorizada y las fixtures grabadas que produciría. |
| 004 | Enriquecimiento de competidores: HTTP directo → Apify | `Pendiente` | Todo. Estrategia decidida en [ADR 0002](../../docs/adr/0002-estrategia-de-extraccion.md). |
| 005 | Síntesis LLM controlada, prompts versionados y evals | `Pendiente` | Todo. |
| 006 | Operación, observabilidad, piloto y conexión con ARI Core | `Pendiente` | Parcial: presupuesto, caché y CI ya existen. |

Después de SPECT-003 quedan tres incrementos previstos. El número puede cambiar si el piloto separa una necesidad operacional material.

## Corte de prueba actual

El pipeline offline se ejercita sobre el cluster `empanada machine` en `en-US`, el primer mercado y landing priorizados en [la propuesta de oportunidades](../../docs/propuesta-landings-maquiempanadas.md). Antes usaba `es-CO`/`software CRM para pymes`; el cambio destapó que el vocabulario de clustering, las stopwords, los patrones de intención y el outline estaban fijados a un único idioma.
