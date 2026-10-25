# SPECBOOT — Ciclo SDLC agéntico

Este repositorio adopta SPECBOOT (cortesía LIDR, adaptado) como ciclo de desarrollo asistido por LLM. Toda feature **no trivial** debe pasar por este ciclo antes de llegar a `main`.

## Flujo

```text
USER STORY
  → /enrich_us   → REFINED USER STORY   (specs/active/<slug>/02-refined.md)
  → /propose     → PROPOSAL ARTIFACTS   (specs/active/<slug>/03-proposal.md)
  → /apply       → crea worktree + rama + tests + docs + código base + testing report
     ↺ /verify + /code_review → implementar correcciones (hasta pasar)
  → FEATURE READY
  → /archive + /commit → FEATURE FOR PR → PUBLISHED
```

Cada comando valida el estado previo y avanza el `status` del feature en el frontmatter de `01-user-story.md`:

`raw → refined → proposed → applied → ready → archived`

## Cuándo NO aplica (fastpath)

`/fastpath` permite saltarse SPECBOOT solo si **TODAS** estas condiciones son ciertas:

- Menos de 50 líneas cambiadas.
- Sin cambios de contrato o API pública (schemas, formatos de CLI, interfaces de proveedores o artefactos publicados).
- Sin dependencias nuevas (`package.json` y `package-lock.json` intactos).
- Sin nueva capacidad visible para operadores o consumidores.
- Sin cambios en persistencia, caché o formato de datos almacenados.

Si cualquiera se cruza, aplica SPECBOOT completo.

## Verificadores del repo

`/verify` ejecuta, en este orden, y solo reporta `PASS` cuando corresponda:

1. **Tests dirigidos**: `node --test <archivo(s)>`, cuando el proposal identifica un subconjunto fiable.
2. **Suite completa**: `npm test` (obligatoria).
3. **Brief dorado sincronizado**: si el cambio puede alterar su salida, ejecutar `npm run golden:update` y comprobar `git diff --exit-code -- fixtures/scout/en-us-golden.brief.json`. Un cambio intencional requiere revisión explícita y se versiona con la feature.
4. **Integración real**: solo cuando el spec la exige, es opt-in, cuenta con credenciales disponibles y presupuesto aprobado. Nunca es requisito implícito para una corrida offline.

Actualmente el repositorio no define scripts de lint ni typecheck; no se deben declarar como `PASS`. Si se incorporan, deben añadirse aquí y a CI.

## Convenciones

- **Un worktree por feature**. `/apply` crea `git worktree add /private/tmp/<repo>-<slug> -b feature/<slug> origin/main`.
- **Ramas**: `feature/<slug>` o `fix/<slug>`, con slug en kebab-case igual a la carpeta bajo `specs/active/`.
- **Artefactos versionados**: `specs/active/` y `specs/done/` se commitean con el código.
- **PR referencia SPEC**: el cuerpo enlaza `specs/done/<slug>/03-proposal.md`.
- **Divergencias**: durante `/apply`, anexar `## Cambios respecto al plan original` en el proposal; no borrar el plan original.
- **Testing report obligatorio**: documenta comandos, resultados, cobertura de AC y límites de la verificación.
- **Red y costos**: tests y CI no usan credenciales ni red real. Toda llamada pagada requiere autorización y techo de gasto explícitos.
- **Contratos**: todo cambio bajo `contracts/` incluye compatibilidad/versionado, consumidores, fixtures y tests correspondientes.

## Estructura

```text
specs/
├── _templates/
│   ├── 01-user-story.md
│   ├── 02-refined.md
│   ├── 03-proposal.md
│   └── 04-testing-report.md
├── active/<slug>/
│   ├── 01-user-story.md
│   ├── 02-refined.md
│   ├── 03-proposal.md
│   └── 04-testing-report.md
└── done/<slug>/
```

La carpeta histórica `specs/001-ari-scout/` precede este harness. Se conserva como registro; las features nuevas usan `active/` y `done/`.

## Comandos versionados

Los comandos viven en `.opencode/commands/`: `enrich_us`, `propose`, `apply`, `verify`, `code_review`, `archive`, `commit` y `fastpath`.

`/commit` prepara el commit y el cuerpo de PR, pero no hace push, abre PR ni fusiona automáticamente.
