# Evaluación de reutilización para ARI Scout

Evaluación realizada el 2026-10-24 sobre la rama por defecto disponible públicamente.

## Repositorios revisados

| Repositorio | Estado observado | Licencia observada | Decisión |
| --- | --- | --- | --- |
| [`kennyzir/7deer_skills`](https://github.com/kennyzir/7deer_skills) | Código, skills, contratos y tests presentes | MIT | Reutilizar patrones; no importar el dominio Roblox ni el scraping directo de Google |
| [`codextde/autoseo`](https://github.com/codextde/autoseo) | Rama `main` clonada sin commits | No verificable en el checkout | No reutilizar |
| [`IamRamgarhia/All-In-One-Free-SEO-Tool`](https://github.com/IamRamgarhia/All-In-One-Free-SEO-Tool) | Rama `main` clonada sin commits | No verificable en el checkout | No reutilizar |

Una descripción de GitHub no se considera evidencia de que exista una implementación reutilizable. Los dos repositorios vacíos deben reevaluarse si publican código y una licencia clara.

## Elementos adoptados de 7deer_skills

Fuente revisada en commit `32a68816736567804e4278d67732e6c42d109564`:

- artifacts legibles y auditables entre etapas;
- `observed_at/observed_through` separado de la fecha de generación;
- source IDs estables y ledger de evidencia;
- gaps, conflictos y desconocidos explícitos;
- condiciones de handoff por estado;
- fixtures sintéticas claramente identificadas;
- prohibición de representar un intento o inferencia como resultado real.

## Elementos rechazados o sustituidos

- **Scraping directo y recursivo de Google:** se sustituye por un puerto SERP con DataForSEO como primer adaptador real; reduce fragilidad y riesgo de bloqueo.
- **Esperas para evadir CAPTCHA:** no forman parte de ARI Scout.
- **Score basado en impresiones subjetivas de autoridad:** se sustituye por componentes declarados, cobertura de evidencia y reglas versionadas.
- **Acoplamiento a Roblox/inglés:** el dominio inicial de ARI es genérico y la fixture comienza en `es-CO`.
- **Markdown como contrato público:** ARI mantiene JSON Schema para interoperabilidad; los artifacts de auditoría pueden tener una vista Markdown derivada.

## Política de licencia

SPECT-001 adopta ideas y estructura, no copia archivos del repositorio externo. Si una implementación futura incorpora código MIT de `7deer_skills`, deberá conservar su aviso de copyright y licencia en `THIRD_PARTY_NOTICES.md`.
