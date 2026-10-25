# Roadmap de ARI Scout

Los estados siguen el vocabulario definido en [`plan.md`](plan.md#vocabulario-de-estado). Ningún incremento pasa a `Completado` con una casilla abierta en su Definition of Done.

| SPECT | Incremento | Estado | Qué falta |
| --- | --- | --- | --- |
| 001 | Pipeline offline, evidencia, scoring y contratos | `Completado` | — |
| 002 | DataForSEO keywords + SERP, presupuesto, caché y retry | `Implementado` | Logs y métricas estructurados con redacción de secretos. |
| 003 | Search Console e inventario/canibalización del sitio | `Completado` | — |
| 004 | Enriquecimiento de competidores: HTTP directo → Apify | `Pendiente` | Todo. Estrategia decidida en [ADR 0002](../../docs/adr/0002-estrategia-de-extraccion.md). |
| 005 | Síntesis LLM controlada, prompts versionados y evals | `Pendiente` | Todo. |
| 006 | Operación, observabilidad, piloto y conexión con ARI Core | `Pendiente` | Parcial: presupuesto, caché y CI ya existen. |
| 007 | Integración multi-tenant con AriCRM | `Pendiente` | Depende de la API y operación estable de SPECT-006. Gobernado por [ADR 0004](../../docs/adr/0004-plano-de-control-y-plano-de-ejecucion.md): corte vertical con seam CLI primero, contrato completo después. |

Después de SPECT-003 quedan cuatro incrementos previstos. SPECT-007 mantiene la integración comercial y multi-tenant fuera del alcance operativo de SPECT-006.

## Corte de prueba actual

El pipeline offline se ejercita sobre el cluster `empanada machine` en `en-US`, el primer mercado y landing priorizados en [la propuesta de oportunidades](../../docs/propuesta-landings-maquiempanadas.md). Antes usaba `es-CO`/`software CRM para pymes`; el cambio destapó que el vocabulario de clustering, las stopwords, los patrones de intención y el outline estaban fijados a un único idioma.
