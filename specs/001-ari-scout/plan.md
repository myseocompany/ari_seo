# Plan SDLC — ARI Scout

## Vocabulario de estado

`roadmap.md` y los SPECT usan estas etiquetas y ninguna otra:

| Estado | Significado |
| --- | --- |
| `Pendiente` | No iniciado. |
| `En curso` | Implementación iniciada, gate del incremento sin cumplir. |
| `Implementado` | Código y tests en verde, pero con al menos un punto de su Definition of Done abierto. |
| `Completado` | Definition of Done íntegramente cumplida, incluidos los gates humanos. |

Un incremento no pasa a `Completado` mientras tenga una casilla sin marcar.

## Etapas y gates

### 1. SPECBOOT — `Completado`

Gate: alcance, actores, proveedores, requisitos, estados y criterios de aceptación documentados. Cumplido en [`spec.md`](spec.md).

### 2. Diseño — `Completado`

Entregables:

- JSON Schema de `ScoutRequest` → `contracts/scout-request.schema.json`;
- modelo interno normalizado para keywords, SERP y documentos extraídos;
- interfaces `KeywordProvider`, `SerpProvider` y `PageExtractor`;
- política de presupuesto, caché, reintentos y degradación;
- ADR de runtime y empaquetado → [`0001-scout-runtime.md`](../../docs/adr/0001-scout-runtime.md).

Gate: los modelos internos no filtran tipos crudos de DataForSEO/Apify al dominio. Cumplido.

### 3. Implementación vertical — `Implementado`

El primer incremento ejecutable está definido en [`SPECT-001.md`](SPECT-001.md).

Orden recomendado:

1. validación y máquina de estados;
2. adaptador DataForSEO con fixtures;
3. normalización y selección de competidores;
4. análisis/clustering y ensamblaje del `SEOBrief`;
5. adaptador Apify opcional;
6. presupuesto, caché y observabilidad;
7. interfaz ejecutable para desarrollo.

Gate: caso feliz completo con fixtures y sin red. **Cumplido.**

Gate humano: revisión del brief dorado. **Cumplido el 2026-10-25 (8/8)** con contraste posterior contra un candidato real; evidencia en [`../done/ari-scout/05-human-review.md`](../done/ari-scout/05-human-review.md).

### 3bis. Integración con proveedores de pago — `Implementado`

Etapa añadida el 2026-10-24: SPECT-002 y SPECT-003 ya habían ejecutado trabajo que ninguna etapa del plan describía ni acotaba.

Cubre [`SPECT-002.md`](SPECT-002.md) (DataForSEO) y [`SPECT-003.md`](SPECT-003.md) (Search Console e inventario del sitio).

Entregables por proveedor:

- adaptador con autenticación inyectada, timeout, retry acotado y clasificación retryable/no retryable;
- normalización al modelo interno antes de cualquier análisis;
- presupuesto estimado antes de llamar y costo reportado registrado;
- caché por endpoint y payload normalizado, nunca por credenciales;
- fixtures grabadas y saneadas de respuestas reales;
- smoke test documentado contra la API real.

Gates:

1. **Fixtures grabadas.** Ningún adaptador se considera verificado con envolturas escritas a mano. La forma de la respuesta debe provenir de una grabación saneada bajo `fixtures/<proveedor>/`.
2. **Secretos ausentes del artefacto.** Credenciales y tokens no aparecen en salidas, errores, logs ni fixtures.
3. **Techo de presupuesto respetado** antes de la primera llamada de red.
4. **Smoke test documentado** con fecha, costo y hallazgos.

El gate 1 existe por una causa concreta: las fixtures escritas a mano de SPECT-002 codificaron una forma que la API no devuelve, y 19 pruebas pasaron en verde contra una API imaginaria. SPECT-003 todavía incumple este gate.

### 4. Verificación — `En curso`

- tests unitarios para validación, puntuación, clustering y estados;
- contract tests contra JSON Schema;
- tests de adaptadores con fixtures sanitizadas;
- integración opt-in con credenciales reales y presupuesto mínimo;
- pruebas de fallos, rate limits, timeouts y redacción de secretos.

Gate: criterios de aceptación de `spec.md` automatizados y trazables. La evidencia es la matriz de [Trazabilidad de requisitos](spec.md#trazabilidad-de-requisitos). El smoke real de Search Console fue completado el 2026-10-25; el criterio 3 continúa dependiendo de la futura extracción de competidores (SPECT-004).

### 5. Release piloto — `Pendiente`

- ejecutar un conjunto pequeño de temas del mercado objetivo;
- revisar calidad del brief, costo y latencia;
- calibrar umbrales sin cambiar silenciosamente resultados históricos;
- documentar operación y rollback de configuración.

Gate: briefs aprobados por revisión humana y costos dentro del presupuesto acordado.

## Gates incumplidos

Registro explícito para que un incumplimiento no se pierda entre documentos.

| Gate | Etapa | Estado | Consecuencia observada |
| --- | --- | --- | --- |
| Revisión humana del brief dorado | 3 | Cumplido el 2026-10-25 | Aprobación 8/8 tras contrastar con evidencia real y curar competidores. |
| Fixtures grabadas y saneadas | 3bis | Cumplido | DataForSEO y Search Console tienen grabaciones saneadas; el sitemap real fue ejercitado sin versionar su inventario completo por volumen. |
| Criterios de `spec.md` trazables | 4 | Cumplido desde 2026-10-24 | Antes no existía forma de demostrar qué RF estaba cubierto; ningún SPECT referenciaba un RF. |

## Riesgos principales

| Riesgo | Mitigación |
| --- | --- |
| Costos variables por llamadas | Estimación previa, techo duro, caché y fixtures |
| Cambios en APIs externas | Adaptadores y contract tests por proveedor sobre grabaciones |
| SERP volátil | Timestamp, locale/location y parámetros en evidencia interna |
| Extracción bloqueada/incompleta | Apify opcional y estado `partial` explícito |
| Síntesis no reproducible | Entradas normalizadas, configuración versionada y tests con fixtures |
| Fuga de secretos/datos crudos | Redacción central y allowlist de campos observables |
| Gates omitidos bajo presión de avance | CI que falla, Definition of Done obligatoria por SPECT y el registro de gates incumplidos de este documento |
