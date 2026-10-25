# ADR 0004 — Plano de control y plano de ejecución

- Estado: aceptado
- Fecha: 2026-10-25
- Reemplaza: [ADR 0003](0003-anfitrion-y-runtime-de-ari-seo.md), rechazado en su decisión de portar el motor a PHP, congelar `ari_seo` y archivar los contratos
- Revisa: [ADR 0001](0001-scout-runtime.md), que queda plenamente vigente — Node.js 20 es el runtime del plano de ejecución
- Decide sobre: SPECT-006, SPECT-007 y el hogar del grupo de landing pages (ARI Build / ARI Launch)

## Contexto

El objetivo del sistema cambió: el dueño construye una **agencia de agentes IA** y su primer producto es un **grupo que crea landing pages** de principio a fin — en los términos del roadmap, `ARI Build` y `ARI Launch`. El ADR 0003 se escribió bajo el objetivo anterior («una operadora no técnica opera Scout») y por eso decide la pregunta que hoy importa menos: el runtime de ~900 líneas de un motor que es el 15 % del sistema.

Antes de decidir, cinco modelos independientes (GLM-5.1, DeepSeek-V4.1-Flash, Big Pickle, Claude Opus 5 y Codex GPT-5.6) auditaron el repo y el ADR 0003 con el mismo encargo. Los cinco llegaron por separado al mismo veredicto: **replantear**. Hallazgos unánimes:

1. `contracts/` es la interfaz `Scout → Build → Launch`. Con agentes LLM como siguiente producto, su valor sube en lugar de bajar; archivarlo (decisión 5 del ADR 0003) destruiría la única frontera diseñada para el objetivo nuevo.
2. AriCRM (`velo_wa`) debe ser el anfitrión de la **experiencia**. El diagnóstico de producto del ADR 0003 sobrevive: la operadora necesita UI, historial, aprobación auditable y gasto visible.
3. No hay base para portar el motor a PHP ni para congelar `ari_seo` antes de que existan Build y Launch.
4. El panel encontró defectos reales que un port habría duplicado en un segundo lenguaje: normalización fijada a `"es"` para cualquier locale (`src/scout/normalize.js:4`, verificado), presupuesto inauditable por construcción (el acierto de caché retorna antes de `reserve()`/`report()`, `src/scout/dataforseo-client.js:32-34`, verificado), outline de plantilla fija que incumple el umbral de `spec.md`, y un `SEOBrief` cuyo 99,6 % del peso es evidencia — inconsumible como entrada de un agente LLM (medido por el panel).

Los informes del panel se revisaron el 2026-10-25 en `.cache/panel-audits/` (efímero, no versionado); este ADR registra lo esencial para no depender de ellos.

## Decisión

1. **Dos planos.** AriCRM (`velo_wa`) es el **plano de control**: UI, autenticación, tenancy, cuotas, aprobación y jobs. `ari_seo` es el **plano de ejecución**: Node.js 20, hoy Scout, mañana también Build y Launch.
2. **`contracts/` es una ABI viva**, no un archivo histórico: se conserva, se versiona y se valida en ambos planos. Evoluciona (v0.2) para separar el brief decisorio de la evidencia por referencia, y para añadir provenance (`model`, `prompt_version`, `run_id`, `brief_hash`) y estados de revisión.
3. **Seam inicial: CLI.** AriCRM invoca a Scout con un Job que ejecuta el CLI de Node (`Process::run`), con JSON por stdin/stdout y exit codes estables. Sin servicio permanente, sin puerto, sin healthcheck: una dependencia binaria del contenedor, como `ffmpeg`. La evolución a servicio o worker interno es una decisión posterior guiada por los datos del piloto.
4. **No portar el motor a PHP.** La decisión de runtime queda diferida hasta tener datos del piloto: costo operativo real del seam, calidad del brief y carga del desarrollador. El spike de paridad PHP del ADR 0003 (A-04) pasa a ser opcional y no bloqueante.
5. **`ari_seo` no se congela.** Recibe ARI Build y ARI Launch como módulos (`src/build/`, `src/launch/`) con prompts versionados y evals, reutilizando SPECBOOT, fixtures y golden. La extracción a un repo propio queda como opción si el grupo crece; nunca al revés — extraerlo de AriCRM sería lo caro.
6. **`Task` de AriCRM es salida, no ejecución** (A-05 del ADR 0003): el brief aprobado se materializa en tareas; la ejecución usa entidades propias (`seo_sites`, `seo_runs`, `seo_briefs`, `seo_reviews`).
7. **El diagnóstico de producto del ADR 0003 se absorbe aquí**: la operadora no técnica necesita UI, historial, aprobación auditable y gasto visible con techo por corrida y mensual. Es requisito funcional del plano de control, no detalle de implementación.

## Motivos

- El objetivo nuevo activa la cláusula de invalidación del propio ADR 0003: si Build y Launch van a ser agentes con contratos, los JSON Schema deben conservarse y el motor gana valor como unidad autónoma.
- La simetría «el port se paga una vez, el seam se opera para siempre» no resiste el tipo de seam elegido: un CLI invocado por Job son ~30 líneas sin operación permanente. Ninguna de las dos auditorías internas del ADR 0003 midió esto; el panel lo zanjó.
- `velo_wa` está en su pico de actividad (35 specs activas, 221 commits en octubre, medido por el panel): abrir un port transversal ahí compite por el único recurso escaso — la atención del dueño.
- Los contratos validados con Ajv son la única validación estructurada disponible hoy para salidas de LLM; Build los necesita para existir.
- El port habría duplicado defectos medidos (locale, presupuesto, outline) en un segundo lenguaje, antes de que el pipeline completo exista.

## Consecuencias

- **SPECT-007 queda reconciliado con este ADR**: define el contrato multi-tenant al que converge la integración; el corte inicial es el seam CLI tras flag, sin esperar la API completa de SPECT-006.
- La integración con AriCRM puede empezar como corte vertical mínimo (job idempotente + UI de lista/ejecución/preview/aprobación tras flag) y converger después al contrato completo de SPECT-007.
- **Correcciones inmediatas sobre el motor**, condición para escalar: bug de locale en `normalize.js`, contabilidad honesta del presupuesto (reportar en aciertos de caché, ledger persistente, techo mensual), outline derivado de los hallazgos, guard SSRF en el sitemap, re-grabar fixtures SERP del corte actual, fixture de sitemap, y compilar los 5 schemas con contract tests.
- **`SEOBrief` v2 antes de Build**: el brief decisorio debe caber en el contexto de un LLM (≤10 KB) con la evidencia por referencia; el 99,6 % de evidencia actual no cabe y no aporta a la redacción.
- Verificar que la imagen de runtime de `velo_wa` incluye Node (la de build sí, por Vite); si no lo trae, es un cambio de imagen, no de arquitectura.
- El piloto mide por separado usabilidad (tiempo, errores, autonomía, tasa de aprobación) y calidad SEO (cambios pedidos, utilidad del outline, aceptación editorial), como pide la auditoría A-08 del ADR 0003.
- SPECBOOT incorpora un gate de superficie de usuario con persona declarada — consecuencia absorbida del diagnóstico del ADR 0003.
- El port a PHP solo se reabre con datos del piloto que lo justifiquen; en ese caso se evaluaría portar Scout únicamente, nunca Build ni Launch.
- El ADR 0003 se conserva íntegro como registro del razonamiento y de sus dos auditorías internas; el ADR 0001 queda vigente en su principio de fondo: los adaptadores exponen objetos de dominio y el dominio no depende de clientes externos.
