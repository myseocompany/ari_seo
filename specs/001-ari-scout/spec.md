# SPECBOOT 001 — ARI Scout

## Estado

- Fase SDLC: especificación
- Estado: listo para planificación técnica
- Propietario: ARI Scout
- Contrato de salida: `contracts/seo-brief.schema.json` (`1.0.0`)

## Problema

ARI SEO necesita convertir una solicitud de investigación en un `SEOBrief` verificable. Hoy existe el contrato de salida, pero no existe un agente ejecutable, un contrato de entrada ni una política de adquisición de datos.

## Objetivo del MVP

Recibir un tema, mercado e idioma; obtener evidencia SEO; analizar intención, keywords y competidores; y emitir un `SEOBrief` válido, trazable y apto para ARI Build.

## Fuera de alcance

- Redactar contenido final o construir páginas.
- Publicar, modificar un CMS o coordinar ARI Build/Launch.
- Monitorear rankings de forma continua.
- Crear backlinks o automatizar acciones sobre sitios de terceros.
- Evadir bloqueos, CAPTCHA, autenticación o condiciones de uso.

## Actores

- **ARI Core (futuro):** inicia una ejecución y aporta identidad/trazabilidad.
- **Operador:** define tema, mercado, idioma, dominio y presupuesto.
- **ARI Build:** consume únicamente briefs con `status: "ready"`.

## Entrada propuesta: `ScoutRequest`

Campos obligatorios:

- `topic`: tema o producto a investigar.
- `locale`: idioma BCP 47, por ejemplo `es-CO`.
- `location`: ubicación objetivo resoluble por el proveedor SEO.
- `trace_id`: UUID de la ejecución.

Campos opcionales:

- `site_url`: dominio propio para contexto y enlaces internos.
- `seed_keywords`: términos iniciales.
- `competitor_domains`: competidores conocidos.
- `target_audience`: audiencia descrita en texto.
- `conversion_goal`: resultado de negocio esperado.
- `max_serp_results`: máximo de resultados orgánicos a analizar; por defecto 10.
- `max_competitor_pages`: máximo de páginas a extraer; por defecto 5.
- `provider_budget_usd`: techo duro estimado por ejecución.

La entrada debe formalizarse como JSON Schema antes de implementar el adaptador HTTP o CLI.

## Decisión de proveedores

### DataForSEO — fuente primaria

Se usa para datos estructurados de keywords y SERP:

- resultados orgánicos por keyword, ubicación, idioma y dispositivo;
- ideas/variantes y señales cuantitativas disponibles;
- dominios y URLs competidoras observadas en la SERP.

DataForSEO es obligatorio para que un brief llegue a `ready`. Las credenciales se inyectan mediante variables de entorno y nunca aparecen en artefactos, logs o errores.

### Apify — enriquecimiento opcional

Se usa para extraer contenido público de las páginas competidoras seleccionadas cuando el título, snippet y estructura de SERP no sean suficientes. Debe ejecutarse con límites de páginas, tiempo, concurrencia y costo.

La indisponibilidad de Apify no invalida por sí sola un brief. Si existe evidencia suficiente de DataForSEO, el flujo puede producir `ready` y registrar la omisión como supuesto; si la evidencia es insuficiente, produce `partial`.

### Política de adquisición

1. Resolver ubicación/idioma y validar presupuesto.
2. Consultar ideas y métricas de keywords en DataForSEO.
3. Consultar la SERP de un conjunto acotado de términos candidatos.
4. Seleccionar competidores orgánicos, excluyendo anuncios y duplicados.
5. Invocar Apify solo si el enriquecimiento está habilitado y aporta evidencia faltante.
6. Normalizar respuestas de proveedor a modelos internos antes del análisis.

No se permite depender de la forma cruda de respuesta de ningún proveedor fuera de su adaptador.

## Requisitos funcionales

### RF-01 — Validación

El agente rechaza entradas inválidas antes de generar costos. Debe validar UUID, locale, URL, límites positivos y presupuesto.

### RF-02 — Investigación reproducible

Cada observación conserva proveedor, operación, fecha, locale, location, keyword y URL cuando aplique. El brief no debe presentar como hecho una señal sin procedencia.

### RF-03 — Selección de keyword primaria

El agente puntúa candidatos con señales de relevancia temática, intención, demanda, competencia y correspondencia con el objetivo. Debe conservar la explicación de la selección para auditoría, aunque el contrato público inicialmente solo contenga el resultado.

### RF-04 — Intención de búsqueda

Clasifica la intención dentro del enum existente del `SEOBrief`. La clasificación combina características de SERP y páginas posicionadas; no depende únicamente de una inferencia del modelo.

### RF-05 — Clustering

Agrupa keywords secundarias sin duplicados. Un término no puede pertenecer a varios clusters salvo que la ejecución registre una razón explícita en su evidencia interna.

### RF-06 — Competidores

Selecciona únicamente URLs observadas para las consultas analizadas. Conserva el orden/ranking observado y evita confundir el dominio propio con un competidor.

### RF-07 — Recomendación de página

Emite tipo de página, título de trabajo, slug, outline, objetivo de conversión y enlaces internos sugeridos cuando exista `site_url` y evidencia suficiente.

### RF-08 — Estados

- `ready`: salida válida y umbrales mínimos de evidencia cumplidos.
- `partial`: salida válida pero falta una fuente o señal relevante; incluye al menos un error/advertencia estructurada.
- `failed`: no puede emitirse un brief utilizable; incluye al menos un error.
- `draft`: reservado para persistencia intermedia, nunca se entrega a ARI Build.

### RF-09 — Idempotencia lógica

Una repetición con la misma entrada, configuración y snapshots de proveedor debe producir el mismo resultado normalizado. Cambios por datos vivos deben ser explicables mediante timestamps de evidencia.

### RF-10 — Presupuesto

El agente estima el siguiente bloque de llamadas antes de ejecutarlo. Si el techo se agotaría, detiene nuevas adquisiciones y produce `partial` o `failed` sin sobrepasarlo deliberadamente.

## Requisitos no funcionales

- Adaptadores con timeouts, retry exponencial con jitter y clasificación de errores retryable/no retryable.
- Logs estructurados con `trace_id`, operación y duración; sin secretos ni cuerpos completos de terceros.
- Fixtures grabadas y sanitizadas para pruebas; el test suite por defecto no consume APIs pagadas.
- Caché por proveedor/operación/parámetros con TTL configurable.
- Límites de concurrencia independientes por proveedor.
- Cumplimiento de robots, términos aplicables y política interna para extracción de páginas públicas.

## Umbral mínimo de evidencia para `ready`

- al menos una keyword primaria y una secundaria;
- al menos una SERP obtenida para locale/location solicitados;
- al menos tres resultados orgánicos únicos, salvo que la SERP real contenga menos;
- evidencia fechada y atribuida a cada adquisición externa;
- outline y recomendación derivados de los hallazgos;
- salida válida contra `seo-brief.schema.json`.

## Errores estables iniciales

- `INVALID_REQUEST`
- `UNSUPPORTED_LOCALE`
- `LOCATION_NOT_FOUND`
- `BUDGET_EXHAUSTED`
- `DATAFORSEO_AUTH_FAILED`
- `DATAFORSEO_RATE_LIMITED`
- `DATAFORSEO_UPSTREAM_ERROR`
- `APIFY_AUTH_FAILED`
- `APIFY_RATE_LIMITED`
- `APIFY_EXTRACTION_FAILED`
- `INSUFFICIENT_EVIDENCE`
- `CONTRACT_VALIDATION_FAILED`

## Criterios de aceptación

1. Una solicitud válida con fixtures de DataForSEO produce un `SEOBrief` `ready` válido.
2. Una solicitud inválida no realiza llamadas externas y produce un error estable.
3. Un fallo de Apify con evidencia SEO suficiente aún puede producir `ready` y deja trazabilidad de la omisión.
4. Un fallo total de DataForSEO nunca produce `ready`.
5. El presupuesto limita nuevas llamadas y nunca expone credenciales.
6. La misma fixture produce una salida normalizada determinista.
7. Toda salida `failed` contiene al menos un error y todo `ready` tiene `errors: []`.

## Preguntas que no bloquean SPECBOOT

- Lenguaje/runtime de la implementación.
- Persistencia y transporte que usará ARI Core.
- Modelo LLM y política de prompts para síntesis.
- TTL y presupuesto por defecto definitivos.

## Referencias de proveedor

- DataForSEO SERP API: https://docs.dataforseo.com/v3/serp/overview/
- DataForSEO Keywords Data API: https://docs.dataforseo.com/v3/keywords_data/overview/
- Apify Actors: https://docs.apify.com/platform/actors/

