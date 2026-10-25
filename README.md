# ARI SEO

ARI SEO es la base de un sistema multiagente para investigar, construir y publicar páginas orientadas a posicionamiento orgánico.

Esta primera etapa define límites, responsabilidades y contratos. No contiene búsquedas, generación de contenido, construcción de páginas, publicación ni un orquestador funcional.

## Flujo previsto

```text
ARI Scout --SEOBrief--> ARI Build --PageArtifact--> ARI Launch --PublicationResult
```

ARI Core será responsable de coordinar este flujo en una etapa futura. Los agentes no se invocan entre sí directamente.

## Estructura

```text
agents/
  scout/README.md   Definición de ARI Scout
  build/README.md   Definición de ARI Build
  launch/README.md  Definición de ARI Launch
contracts/
  common.schema.json
  seo-brief.schema.json
  page-artifact.schema.json
  publication-result.schema.json
  README.md
```

## Decisiones arquitectónicas

- **Separación por etapa:** investigación, construcción y publicación tienen propietarios y límites distintos.
- **Contratos antes que implementación:** JSON Schema Draft 2020-12 ofrece contratos versionados y agnósticos del lenguaje sin agregar dependencias.
- **Trazabilidad de extremo a extremo:** cada artefacto incluye identidad, versión, fecha de creación y un `trace_id` que debe conservarse durante todo el flujo.
- **Evolución segura:** `contract_version` permite introducir nuevas versiones; los consumidores deben rechazar versiones mayores que no soporten.
- **Errores como datos:** los resultados incluyen estados y errores estructurados, evitando depender de excepciones específicas de una tecnología.
- **Sin acoplamiento entre agentes:** cada agente consume y produce contratos compartidos; la coordinación pertenecerá a ARI Core.

## Estado actual

Los archivos de `agents/` son definiciones, no agentes ejecutables. Los esquemas de `contracts/` describen las fronteras futuras del sistema y no implican transporte, persistencia ni protocolo de mensajería.

El primer ciclo SDLC fue iniciado para ARI Scout. Su SPECBOOT, plan por gates y backlog están en [`specs/001-ari-scout/`](specs/001-ari-scout/). Los gates cumplidos e incumplidos se registran en [`plan.md`](specs/001-ari-scout/plan.md#gates-incumplidos); hoy sigue abierta la revisión humana del brief dorado.

## Desarrollo con SPECBOOT

Las features nuevas siguen el ciclo definido en [`SPECBOOT.md`](SPECBOOT.md). Los comandos versionados están en `.opencode/commands/`, las plantillas en `specs/_templates/` y los artefactos pasan de `specs/active/<slug>/` a `specs/done/<slug>/` al completar sus gates.

La carpeta `specs/001-ari-scout/` conserva el primer ciclo histórico, anterior a la instalación del harness versionado.

## Ejecutar ARI Scout offline

El primer corte vertical usa fixtures sintéticas y no consume APIs:

```bash
npm ci
npm test
npm run scout
```

El corte offline se ejercita sobre el cluster `empanada machine` en `en-US`. Dos artefactos lo gobiernan:

| Artefacto | Qué es |
| --- | --- |
| `fixtures/scout/en-us-golden.json` | **Fixture dorada**: la entrada, con las señales sintéticas de sitio, keywords y SERP. |
| `fixtures/scout/en-us-golden.brief.json` | **Brief dorado**: la salida aprobada, fijada por un test de regresión. |

Si un cambio de normalización, scoring, clustering o ensamblaje altera la salida, el suite falla. Para aprobar una desviación intencional:

```bash
npm run golden:update   # regenera el brief dorado; revisa el diff antes de commitear
```

Para usar DataForSEO real, configura `.env` desde `.env.example`, revisa el presupuesto de `examples/scout-request.json` y ejecuta:

```bash
npm run scout:dataforseo
```

El modo real toma el `ScoutRequest` de un archivo, así que puedes investigar cualquier tema sin tocar código:

```bash
node --env-file=.env src/scout/dataforseo-cli.js mi-request.json
```

Las fixtures de proveedor en `fixtures/dataforseo/` son grabaciones saneadas de respuestas reales, producidas por `scripts/record-dataforseo-fixtures.mjs`. No escribir envolturas de proveedor a mano: fijan la forma de la respuesta y una forma inventada ya produjo un suite en verde contra una API imaginaria.

