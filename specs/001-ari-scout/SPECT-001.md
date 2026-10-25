# SPECT-001 — Discovery Slice de ARI Scout

## Estado

Implementado y verificado el 2026-10-24. El brief dorado está persistido y fijado por test; **pendiente su revisión humana**, que era gate bloqueante para iniciar `SPECT-002` y no se respetó.

La fixture dorada migró de `es-CO`/`software CRM para pymes` a `en-US`/`empanada machine` el 2026-10-24 para que el corte offline ejerza el mercado y el idioma de la primera landing priorizada.

## Resultado del incremento

Construir el primer corte vertical verificable de ARI Scout:

```text
ScoutRequest
  → adquisición normalizada (fixtures)
  → SourceLedger
  → KeywordMap
  → selección explicable
  → SEOBrief válido
```

Este SPECT termina cuando el flujo completo funciona sin red usando datos grabados y sanitizados. No incluye todavía llamadas pagadas, crawling con navegador, generación del artículo ni publicación.

## Por qué este es el primer corte

El riesgo principal no es conectarse a una API: es transformar señales externas en una decisión reproducible y trazable. Implementar primero los adaptadores reales escondería ese riesgo detrás de respuestas variables y costos por llamada.

## Patrones reutilizados

La revisión de repositorios externos se documenta en [`reuse-assessment.md`](reuse-assessment.md). SPECT-001 adapta tres patrones de `kennyzir/7deer_skills` (MIT), sin copiar su dominio Roblox ni su scraping directo de Google:

1. **Ledger de evidencia:** cada conclusión referencia una fuente estable y fechada.
2. **Gaps explícitos:** un dato ausente permanece desconocido; no se sustituye con una estimación del modelo.
3. **Handoff por estado:** un artefacto solo avanza cuando cumple condiciones observables.

## Alcance

### Incluido

- contrato JSON Schema de `ScoutRequest`;
- modelos internos `SourceObservation`, `KeywordCandidate`, `SerpSnapshot`, `KeywordCluster` y `ScoredOpportunity`;
- puertos de adquisición, sin SDK específico de proveedor;
- repositorio de fixtures para un caso `es-CO`;
- normalización, deduplicación y clustering determinista;
- clasificación inicial de intención basada en señales explícitas;
- score de oportunidad explicable;
- ensamblaje y validación de `SEOBrief`;
- estados `ready`, `partial` y `failed`;
- tests del camino feliz y degradaciones.

### Excluido

- credenciales y llamadas reales a DataForSEO, Search Console o Apify;
- llamadas directas a Google SERP;
- inferencias LLM no deterministas;
- UI, persistencia, colas y scheduling;
- contenido final, imágenes, CMS y backlinks.

## Contrato de entrada

Crear `contracts/scout-request.schema.json` con:

| Campo | Tipo | Regla |
| --- | --- | --- |
| `request_id` | UUID | obligatorio |
| `trace_id` | UUID | obligatorio y propagado al brief |
| `topic` | string | obligatorio, no vacío |
| `locale` | BCP 47 | obligatorio; fixture inicial `es-CO` |
| `location` | string | obligatorio |
| `site_url` | URI HTTPS | opcional |
| `seed_keywords` | string[] | opcional, únicas |
| `competitor_domains` | hostname[] | opcional, únicos |
| `target_audience` | string | opcional |
| `conversion_goal` | string | opcional |
| `limits.max_keywords` | integer | 1–100; default 50 |
| `limits.max_serp_queries` | integer | 1–20; default 10 |
| `limits.max_competitor_pages` | integer | 0–10; default 5 |
| `limits.provider_budget_usd` | number | >= 0 |

La validación ocurre antes de invocar cualquier puerto.

## Puertos del dominio

```text
SiteSignalsProvider
  get_site_queries(request) → SiteQuerySignal[]

KeywordProvider
  expand_keywords(request) → KeywordSignal[]

SerpProvider
  get_serp(keyword, locale, location) → SerpSnapshot

PageExtractor
  extract(url) → PageSnapshot
```

SPECT-001 proporciona implementaciones `Fixture*Provider`. Los adaptadores reales llegarán en SPECT posteriores. Ningún tipo crudo de proveedor puede aparecer fuera de su adaptador.

## Artefactos internos

### SourceLedger

Cada observación contiene:

- `source_id` estable;
- `provider` y operación;
- parámetros relevantes normalizados;
- `observed_at` real de la fixture;
- URL cuando aplique;
- payload normalizado o referencia a la fixture;
- limitaciones y freshness;
- checksum de la entrada normalizada.

### KeywordMap

Cada candidato contiene:

- término canónico y variantes;
- locale y ubicación;
- intención;
- señales de demanda disponibles;
- señales de competencia disponibles;
- features de SERP;
- source IDs;
- cluster;
- disposition: `build`, `update`, `merge`, `watch` o `reject`;
- score y desglose.

Ambos artefactos son internos. `SEOBrief` sigue siendo la única salida pública hacia ARI Build.

## Algoritmo v0

### 1. Normalización

- Unicode NFKC, trim y espacios colapsados.
- Comparación case-insensitive; conservar presentación original.
- No fusionar automáticamente términos semánticamente distintos.
- URLs canónicas sin fragmento y con hostname en minúsculas.

### 2. Evidencia

- Registrar primero observaciones de sitio, keywords y SERP.
- Toda métrica y URL competidora debe referenciar al menos un `source_id`.
- Un dato faltante se representa como ausencia/gap, nunca como cero.

### 3. Intención

Clasificar con reglas versionadas basadas en modificadores y tipos de resultado. En caso ambiguo usar `mixed`. La capa LLM futura podrá proponer una clasificación, pero no eliminar las señales ni la explicación.

### 4. Clustering

Agrupar mediante tokens normalizados y coincidencia de resultados SERP presente en fixtures. El orden de entrada no puede cambiar la salida. Cada keyword tiene un cluster primario.

### 5. Score de oportunidad

Puntaje 0–100 con componentes visibles:

| Componente | Peso máximo |
| --- | ---: |
| Relevancia al topic/negocio | 30 |
| Demanda observada | 25 |
| Oportunidad competitiva | 20 |
| Ajuste de intención/conversión | 15 |
| Gap del sitio | 10 |

Reglas:

- un componente sin evidencia aporta `unknown`, no cero;
- el resultado conserva score bruto, cobertura de evidencia y explicación;
- no se permite `ready` con cobertura inferior al umbral de la especificación;
- empates se resuelven por relevancia, demanda y término canónico, en ese orden.

### 6. Ensamblaje

- seleccionar keyword primaria por score elegible;
- construir secundarias y clusters sin duplicados;
- derivar competidores solo de SERPs observadas;
- producir recomendación de página y outline mediante reglas/plantillas v0;
- validar la salida contra `seo-brief.schema.json`.

## Política de estados

| Condición | Estado |
| --- | --- |
| Contrato de entrada inválido | `failed` |
| No existe SERP válida | `failed` |
| Existe SERP pero faltan señales no bloqueantes | `partial` |
| Umbral de evidencia y contrato satisfechos | `ready` |
| Salida no valida contra JSON Schema | `failed` |

`draft` puede existir durante ejecución, pero no se devuelve como resultado terminal.

## Fixture dorada y brief dorado

Dos artefactos distintos, antes confundidos bajo el mismo nombre:

| Artefacto | Archivo | Qué es |
| --- | --- | --- |
| **Fixture dorada** | `fixtures/scout/en-us-golden.json` | La **entrada**: `ScoutRequest` más las señales sintéticas de sitio, keywords y SERP. |
| **Brief dorado** | `fixtures/scout/en-us-golden.brief.json` | La **salida aprobada**: el `SEOBrief` que el pipeline produce sobre esa fixture con reloj e identificador fijos. |

El brief dorado es el artefacto que la revisión humana aprueba. Está versionado y fijado por el test `pipeline output matches the approved golden brief`: cualquier cambio de normalización, scoring, clustering o ensamblaje que altere la salida rompe el suite. Para aprobar una desviación intencional se ejecuta `npm run golden:update` y el diff del brief queda registrado en el commit.

La fixture dorada debe estar marcada como sintética y contener:

- una solicitud `en-US` sobre el cluster `empanada machine`;
- 20–30 keywords candidatas (actualmente 23 únicas más una duplicada para probar deduplicación);
- al menos 5 SERPs y 3 resultados orgánicos por SERP;
- una consulta propia de sitio para probar `update`;
- duplicados, URL propia en SERP y una métrica ausente;
- un competidor repetido en varias SERPs;
- cobertura de las cuatro intenciones y de las disposiciones `build`, `update` y `watch`.

No usar nombres, volúmenes o rankings inventados como si fueran observaciones reales. Todos los dominios usan el TLD reservado `.example`.

## Tests de aceptación

1. `ScoutRequest` válido pasa schema; casos inválidos fallan antes de usar proveedores.
2. Dos ejecuciones sobre las mismas fixtures producen JSON semánticamente idéntico, excepto identificadores/timestamps inyectados y controlados.
3. Toda keyword elegida y URL competidora puede rastrearse a `source_id`.
4. Una keyword existente del sitio obtiene disposition `update` o `merge`, no crea automáticamente otra página.
5. El dominio propio nunca aparece como competidor.
6. Métricas ausentes no se convierten en cero.
7. Sin SERP válida, el resultado es `failed` y contiene `INSUFFICIENT_EVIDENCE`.
8. Con una fuente opcional ausente, el resultado puede ser `partial` sin inventar datos.
9. El `SEOBrief` feliz valida contra el contrato vigente y conserva el `trace_id`.
10. Los tests no acceden a red ni requieren secretos.

## Definition of Done

- [x] contratos y fixtures versionados;
- [x] implementación del corte vertical;
- [x] tests de aceptación automatizados;
- [x] comando único documentado para ejecutar fixture y tests;
- [x] cero llamadas de red en CI (`.github/workflows/ci.yml`);
- [x] provenance de código externo documentada;
- [x] brief dorado persistido y fijado por test de regresión;
- [ ] **revisión del brief dorado por una persona** antes de iniciar adaptadores reales.

Este último punto sigue abierto y es un gate bloqueante incumplido: SPECT-002 y SPECT-003 se implementaron antes de resolverlo. Ver la nota de incumplimiento en [`plan.md`](plan.md).

## Siguiente SPECT propuesto

`SPECT-002 — DataForSEO Adapter`: keywords + SERP, presupuesto, caché, retry y contract tests contra fixtures sanitizadas de respuestas reales.
