# Plan SDLC — ARI Scout

## Etapas y gates

### 1. SPECBOOT — completado

Gate: alcance, actores, proveedores, requisitos, estados y criterios de aceptación documentados.

### 2. Diseño

Entregables:

- JSON Schema de `ScoutRequest`.
- Modelo interno normalizado para keywords, SERP y documentos extraídos.
- interfaces `KeywordProvider`, `SerpProvider` y `PageExtractor`;
- política de presupuesto, caché, reintentos y degradación;
- ADR de runtime y empaquetado.

Gate: los modelos internos no filtran tipos crudos de DataForSEO/Apify al dominio.

### 3. Implementación vertical

El primer incremento ejecutable está definido en [`SPECT-001.md`](SPECT-001.md).

Orden recomendado:

1. validación y máquina de estados;
2. adaptador DataForSEO con fixtures;
3. normalización y selección de competidores;
4. análisis/clustering y ensamblaje del `SEOBrief`;
5. adaptador Apify opcional;
6. presupuesto, caché y observabilidad;
7. interfaz ejecutable para desarrollo.

Gate: caso feliz completo con fixtures y sin red.

### 4. Verificación

- tests unitarios para validación, puntuación, clustering y estados;
- contract tests contra JSON Schema;
- tests de adaptadores con fixtures sanitizadas;
- integración opt-in con credenciales reales y presupuesto mínimo;
- pruebas de fallos, rate limits, timeouts y redacción de secretos.

Gate: criterios de aceptación de `spec.md` automatizados.

### 5. Release piloto

- ejecutar un conjunto pequeño de temas `es-CO`;
- revisar calidad del brief, costo y latencia;
- calibrar umbrales sin cambiar silenciosamente resultados históricos;
- documentar operación y rollback de configuración.

Gate: briefs aprobados por revisión humana y costos dentro del presupuesto acordado.

## Riesgos principales

| Riesgo | Mitigación |
| --- | --- |
| Costos variables por llamadas | Estimación previa, techo duro, caché y fixtures |
| Cambios en APIs externas | Adaptadores y contract tests por proveedor |
| SERP volátil | Timestamp, locale/location y parámetros en evidencia interna |
| Extracción bloqueada/incompleta | Apify opcional y estado `partial` explícito |
| Síntesis no reproducible | Entradas normalizadas, configuración versionada y tests con fixtures |
| Fuga de secretos/datos crudos | Redacción central y allowlist de campos observables |

