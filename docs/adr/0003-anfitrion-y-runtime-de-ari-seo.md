# ADR 0003 — Anfitrión y runtime de ARI SEO

- Estado: **rechazado**
- Fecha: 2026-10-25
- Reemplazado por: [ADR 0004 — Plano de control y plano de ejecución](0004-plano-de-control-y-plano-de-ejecucion.md) (2026-10-25, tras panel de auditoría multi-modelo: 5/5 «replantear»)
- Revisa: [ADR 0001](0001-scout-runtime.md), que fijó Node.js 20 como runtime
- Decide sobre: SPECT-004 a SPECT-007 de [`roadmap.md`](../../specs/001-ari-scout/roadmap.md)

> Este documento se escribió para que otros LLM lo revisen y lo contradigan. Es
> autocontenido: incluye la evidencia medida, para que el revisor no necesite
> acceso a los repositorios. Cada afirmación está marcada como **medido**,
> **estimado** o **no verificado**.

> **Resultado de la revisión (2026-10-25):** un panel de cinco modelos
> independientes (GLM-5.1, DeepSeek-V4.1-Flash, Big Pickle, Claude Opus 5 y
> Codex GPT-5.6) auditó este documento y el repositorio con el objetivo nuevo
> (agencia de landing pages); los cinco llegaron al veredicto «replantear». El
> diagnóstico de producto sobrevive y fue absorbido por el ADR 0004; la decisión
> de portar el motor a PHP, congelar `ari_seo` y archivar los contratos fue
> rechazada. Este documento se conserva íntegro como registro del razonamiento
> y de sus dos auditorías internas.

## Contexto

ARI SEO es la primera etapa de un sistema multiagente para investigar, construir
y publicar páginas orientadas a posicionamiento orgánico
(`ARI Scout → ARI Build → ARI Launch`). Hoy solo existe ARI Scout: un motor en
Node.js que convierte señales de DataForSEO, Google Search Console y el sitemap
del sitio en un `SEOBrief` validado contra JSON Schema.

Dos hechos nuevos obligan a revisar el ADR 0001.

### 1. Apareció un usuario, y no es un desarrollador

El ciclo SDLC completo se ejecutó sin declarar ningún usuario. Los criterios de
aceptación de [`02-refined.md`](../../specs/done/ari-scout/02-refined.md)
—preservación, trazabilidad, verificación reproducible, honestidad de estado,
continuidad— son todos sobre contratos, pruebas y documentación. Ninguno
describe a una persona haciendo un trabajo.

La operadora real será **una asistente con formación en trabajo social, sin
fondo técnico ni de SEO**. Eso convierte varias propiedades actuales en
bloqueadores absolutos, no en asperezas:

- La salida del motor es JSON por stdout: **1196 líneas** en la corrida offline
  (*medido*).
- `live-cli.js` exige `node --env-file=.env` y editar a mano un
  `ScoutRequest` en JSON (*medido*).
- Las credenciales de DataForSEO y el token OAuth de Search Console viven en
  `.env` (*medido*).
- No hay dónde guardar un brief, ni lista de briefs, ni estado, ni historial
  (*medido*).
- DataForSEO cuesta por corrida —**USD 0.0256** contra un techo de USD 0.25 en
  la corrida real (*medido*)— y nada expone ese costo en ninguna interfaz.

### 2. El roadmap pendiente es, casi todo, infraestructura que ya existe en otro repo

| SPECT | Incremento | Estado (*medido*) |
| --- | --- | --- |
| 001 | Pipeline offline, evidencia, scoring, contratos | Completado |
| 002 | DataForSEO keywords + SERP, presupuesto, caché, retry | Implementado; faltan logs y métricas con redacción de secretos |
| 003 | Search Console e inventario/canibalización | Completado |
| 004 | Enriquecimiento de competidores: HTTP directo → Apify | Pendiente, todo |
| 005 | Síntesis LLM controlada, prompts versionados y evals | Pendiente, todo |
| 006 | Operación, observabilidad, piloto, conexión con ARI Core | Parcial |
| 007 | **Integración multi-tenant con AriCRM** | Pendiente |

SPECT-005 y SPECT-007 son los que mandan: el primero necesita cliente LLM,
versionado de prompts, trazas y evals; el segundo declara que el destino final
siempre fue AriCRM.

## Inventario de los candidatos (*medido*)

Tres anfitriones posibles, todos del mismo dueño y en la misma máquina.

### `ari_seo` — el repo actual

- Node.js 20, ESM, `node --test`, Ajv Draft 2020-12.
- Motor: **1102 líneas** en 16 archivos. `domain.js` 296 (scoring, clustering,
  intención, outline), `dataforseo-provider.js` 116, `dataforseo-client.js` 109,
  `search-console-client.js` 101, `sitemap-provider.js` 92. Lógica sustantiva
  ≈ **714 líneas**; el resto es plumbing, del cual los tres CLIs (118 líneas) y
  la validación Ajv (28) desaparecerían en un port.
- Pruebas: **473 líneas** en 3 archivos.
- Contratos: **307 líneas** de JSON Schema.
- Fixtures: **212 KB** de grabaciones saneadas de respuestas reales de
  DataForSEO, Search Console y sitemap.
- Sin UI, sin persistencia, sin autenticación, sin colas, sin despliegue.
- Única superficie visual: un generador de HTML de 120 líneas que produce una
  página de revisión. En la corrida real pesa **679 KB**, descarta por completo
  el bloque `artifacts` del resultado —donde viven el scoring explicable, las 27
  exclusiones de competidores con su razón, el inventario de 372 URLs y el
  costo— y renderiza en su lugar **2482 filas** de evidencia de Search Console
  con solo `source` y `observed_at`, sobre **20 timestamps distintos**.

### `aristudio` — operación de agencia

- Laravel 12, PHP 8.2, `laravel/mcp` con `Mcp::local` + `Mcp::web` + rutas OAuth.
- Dominio con encaje directo: `Project`, `ProjectBrief` (con `public_token` de
  48 caracteres para compartir sin login), `ProjectBriefAnswer`, `Task`,
  `TaskStatus`, `TaskType`, `Module`.
- Front: Blade + Alpine.js 3 + Tailwind.
- `app/` contiene solo `Console`, `Http`, `Mcp`, `Models`, `Providers`, `View`:
  **no existen `Services`, `Actions` ni `Jobs`**.
- ~9 archivos de prueba. Sin Docker, sin SPECBOOT, sin sistema de diseño.
- Sin cliente LLM, sin versionado de prompts, sin trazas.

### `velo_wa` — AriCRM, el producto bandera

- PHP 8.4, Laravel 12, `laravel/mcp ^0.5`, Docker con `docker-compose.prod.yml`,
  `ops/`, Playwright, PHPUnit sobre Postgres, PRs numerados (#77–#82).
- **305 archivos de prueba.**
- Capas completas: `Actions`, `Contracts`, `Data`, `DomainEvents`, `Enums`,
  `Events`, `Jobs`, `Listeners`, `Observers`, `Policies`, `Services`, `Support`.
- Front: **Inertia 2 + React 18 + TypeScript**, 115 componentes `.tsx`, Vite,
  Tailwind, `@headlessui/react`, `lucide-react`, **`recharts`** (gráficas),
  `zustand`, `react-hot-toast`, **`laravel-echo` + `pusher-js`** (tiempo real).
  Solo 8 vistas Blade.
- Infraestructura de IA ya construida: `AnthropicClient.php`, `OpenAiClient.php`,
  `AiAgentService.php`, `AiAgentSafetyService.php`, `AiAgent/ToolRegistry.php`,
  `ImageUnderstanding/VisionLlmClient.php` + `ImageProviderResolver.php`,
  `Knowledge/KnowledgeEmbeddingService.php`, y
  **`DailyMenus/LlmMenuNormalizer.php`**, que es el precedente exacto del patrón
  que pide SPECT-005: un LLM que normaliza datos en un objeto de dominio.
- Modelos de conocimiento y trazabilidad: `KnowledgeBase`,
  `KnowledgeBaseVersion`, `KnowledgeChunk`, `KnowledgeSource`,
  `AiResponseKnowledgeTrace`, `AiAgentIncident`, `AiAgentSafetyCounter`.
- OAuth de Google ya resuelto: `GoogleCalendarClient`, `GoogleSheetsClient`,
  ambos con factory.
- Multi-tenancy: `Tenant`, `TenantUserMembership`. Feature flags en
  `config/features.php`. Y ya existe un modelo `Task`.
- **El mismo SPECBOOT** que este repo, en su versión madura, con **33 features
  en `specs/active/`**.
- `DESIGN_SYSTEM.md`: 193 líneas con el sistema Ari completo —morado `#7C3AED`
  como primario, verde reservado a estados de WhatsApp, neutrales, reglas
  estrictas de tokens.
- **No tiene** harness formal de evals (solo dos documentos markdown de
  evaluación). **No tiene** dominio de sitios, páginas ni contenido: busqué
  `Site`, `Page`, `Project`, `Content`, `Seo` entre sus modelos y no existe
  ninguno.
- `apify/` existe pero con un solo proyecto previo.

## Decisión propuesta

1. **Congelar `ari_seo`** como repositorio de referencia. No se borra: sus
   fixtures y `domain.js` son la especificación del port, y sus ADR y specs son
   el registro del razonamiento.
2. **Portar el motor a PHP dentro de `velo_wa` (AriCRM)**, con alcance por
   tenant y detrás de un flag en `config/features.php`, apagado por defecto.
3. **Dominio nuevo mínimo**: `seo_sites` y `seo_briefs`. `Task` y `Tenant` ya
   existen y se reutilizan: el brief aprobado se materializa en tareas, que es
   la unidad de trabajo que la operadora ya entiende.
4. **UI en Inertia + React + TypeScript**, con los tokens de `DESIGN_SYSTEM.md`.
   La investigación corre en un `Job` en cola y reporta progreso por el canal de
   Echo/Pusher que ya existe, no por polling.
5. **Archivar los JSON Schema** de `contracts/`. Dentro de una sola aplicación
   el contrato es el modelo Eloquent más una prueba de snapshot. Decisión
   reversible: los esquemas vuelven a pagar el día que ARI Build o ARI Launch
   sean servicios separados.
6. **Preservar las fixtures tal cual** (212 KB) para alimentar `Http::fake()`, y
   portar el test del brief dorado como prueba de snapshot en PHPUnit. Es la
   única red de seguridad del port.
7. **Secuenciar y parar**: ejecutar las fases A y B, y no tocar SPECT-004, 005 ni
   006 hasta que la operadora haya usado la fase B durante dos semanas.

## Motivos

- **Un solo stack.** El dueño mantiene cinco aplicaciones Laravel. Un seam
  Node↔Laravel —shell-out, servicio HTTP o Node en el contenedor— agrega
  operación permanente para ahorrar el port de 714 líneas. La queja que originó
  este ADR fue explícitamente de exceso de complejidad.
- **SPECT-005 decide el anfitrión.** Síntesis LLM con prompts versionados y
  trazas es ~80% andamiaje en `velo_wa` y 0% en `aristudio`. Construirlo dos
  veces no tiene defensa.
- **SPECT-007 ya nombraba el destino.** Portar a `aristudio` sería un desvío
  hacia una migración futura que el propio roadmap anticipa.
- **El costo real del port es bajo y medible**: 714 líneas de lógica y 473 de
  pruebas, con las fixtures intactas. No se descarta trabajo probado; se
  descarta plumbing que la UI vuelve innecesario.
- **La UI no es opcional ni cosmética.** Con una operadora no técnica, el
  producto *es* la UI. Hoy no existe en ningún repositorio, así que no hay nada
  que preservar por ese lado.
- **El riesgo de tocar el repo que atiende clientes que pagan se acota** con
  alcance por tenant y flag apagado, mecanismos que ya existen allí.

## Alternativas descartadas

**Solo construirle un frontend a `ari_seo`.** Sería un sexto login, un sexto
despliegue y un sexto sistema visual para una sola operadora, y dejaría SPECT-005
sin andamiaje.

**Portar a `aristudio`.** Es la mejor por encaje de dominio (`Project` →
`ProjectBrief` → `Task` es literalmente el flujo cliente → brief → contenido) y
fue la recomendación inicial de esta discusión. Se descarta porque le faltan
`Services`, `Actions`, `Jobs`, cliente LLM, versionado de prompts, trazas,
Docker y madurez de pruebas: todo lo que el roadmap pendiente consume.

**Mantener Node y exponer un servicio HTTP.** Es la opción correcta si el motor
fuera a ser consumido por varios productos o por equipos distintos. Hoy tiene un
consumidor y un operador.

**Dejarlo como está y operarlo por CLI con acompañamiento.** Descartada por la
persona: el objetivo explícito es que la asistente trabaje sin supervisión
técnica.

## Estimación (*estimado*, sesión ≈ 4 h)

| Fase | Qué | Estimado |
| --- | --- | --- |
| **A** | Port del motor: scoring, clustering, DataForSEO, Search Console, sitemap, presupuesto; migraciones; PHPUnit con fixtures y snapshot del brief dorado | 1.5–2 sesiones · 6–8 h |
| **B** | UI de la operadora: alta de investigación, progreso del job, brief legible, curado de competidores, aprobación → genera `Task` | 2–3 sesiones · 8–12 h |
| | **Hito: la operadora puede trabajar — 14–20 h** | |
| C | SPECT-002: logs y métricas con redacción de secretos | 0.5 sesión · 2 h |
| D | SPECT-004: enriquecimiento de competidores, HTTP → Apify | 1.5–2.5 sesiones · 6–10 h |
| E | SPECT-005: síntesis LLM, prompts versionados, evals | 3–5 sesiones · 12–20 h |
| F | SPECT-006: operación, observabilidad, piloto | 1–2 sesiones · 4–8 h |
| — | SPECT-007: multi-tenant AriCRM | ~se disuelve |

Total del roadmap: **38–60 h ≈ 9–15 sesiones**.

No hay medición histórica con la que calibrar esto. La sesión previa de ~4 h
produjo cierres documentales, el harness SPECBOOT y el visor sobre un motor que
**llegó ya hecho** en el commit de importación (`d539559`, 56 archivos, 8547
inserciones), así que no sirve como referencia de velocidad de construcción.

## Consecuencias

- El ADR 0001 queda superado en cuanto al runtime, y vigente en su principio de
  fondo: los adaptadores exponen objetos de dominio y el dominio no depende de
  clientes externos. Ese principio debe sobrevivir al port.
- `ari_seo` deja de recibir features. Queda como referencia congelada, y este ADR
  necesita una contraparte en `velo_wa/docs/`.
- `velo_wa` suma un dominio ajeno a su núcleo conversacional. Hay que decidir si
  SEO vive como módulo con frontera explícita o se mezcla con el resto.
- La operadora introduce gasto variable en un producto que hoy no lo tiene:
  tope por corrida **y** techo mensual visible en pantalla pasan a ser requisito
  funcional, no detalle de implementación.
- El brief deja de ser un archivo y pasa a ser un registro con historial,
  autoría y estado de aprobación. El gate humano se vuelve auditable, que hoy no
  lo es: la revisión existente se guardó en `localStorage` y se transcribió a
  mano a [`05-human-review.md`](../../specs/done/ari-scout/05-human-review.md).
- SPECBOOT debe incorporar un gate de superficie de usuario, con persona
  declarada. Su ausencia es la causa raíz de que un ciclo con todos los gates
  verdes produjera algo que la operadora no puede usar.

## Riesgos y qué invalidaría esta decisión

- **`DESIGN_SYSTEM.md` está desalineado con su propio código.** Declara "Laravel
  11, Blade/Livewire", y el repo es Laravel 12 con Inertia + React y **sin
  Livewire**. Además `app.tsx` fija el color de progreso en `#f5257e` (magenta),
  justo el color que ese documento se propuso eliminar. El sistema de diseño
  está escrito, no aplicado: heredarlo puede ser menos ahorro del que supongo.
  (*medido*; el grado de aplicación real en las 115 pantallas: **no verificado**.)
- **Feature #34.** `velo_wa` tiene 33 specs activas. El cuello de botella puede
  ser la atención del único desarrollador, no el stack. Si es así, ninguna
  decisión de anfitrión arregla el problema y la respuesta correcta es cerrar
  features antes de abrir esta.
- **La fase E no se termina, se calibra.** La calidad de un brief es subjetiva.
  Sin harness de evals —que no existe en ningún repo— el estimado de 12–20 h es
  el más frágil de la tabla.
- **El port puede perder matices no escritos.** `domain.js` creció corrigiendo
  supuestos monolingües: el corte de prueba pasó de `es-CO`/`software CRM para
  pymes` a `en-US`/`empanada machine` y eso destapó vocabulario de clustering,
  stopwords, patrones de intención y outline fijados a un idioma. El snapshot
  del brief dorado es la única defensa contra reintroducir eso en PHP.
- **Si la operadora resulta ser también el revisor editorial del contenido**, el
  alcance de la fase B crece: ya no es curar un brief, es un flujo de redacción.
- **Lo que invalidaría la decisión:** que SEO vaya a venderse como módulo de
  agencia a clientes con proyectos y entregables —no a tenants de AriCRM—, caso
  en que `aristudio` recupera la ventaja por dominio; o que ARI Build y ARI
  Launch vayan a ser servicios independientes, caso en que los JSON Schema deben
  conservarse y el motor gana valor como servicio autónomo.

## Trazabilidad del razonamiento

Este ADR es la tercera versión de una recomendación que cambió dos veces en la
misma sesión. Se deja el registro porque el revisor debería atacar justo donde
el razonamiento falló:

1. **Primera recomendación: `aristudio`.** Emitida después de inspeccionar solo
   ese repositorio. Los otros cuatro Laravel se descartaron por su nombre, sin
   abrirlos.
2. **Corrección al revisar `velo_wa`:** apareció el sistema de diseño, el mismo
   SPECBOOT y la plataforma de agentes IA. Se mantuvo `aristudio` por encaje de
   dominio y menor radio de impacto.
3. **Segunda corrección al leer el roadmap:** SPECT-005 necesita infraestructura
   LLM que solo existe en `velo_wa`, y SPECT-007 ya declaraba AriCRM como
   destino. De ahí la propuesta actual.

También se malinterpretó la palabra "asistente": se leyó como asistente de IA
cuando significaba una persona contratada. Esa confusión produjo la conclusión
—equivocada— de que no hacía falta UI nueva.

## Auditoría independiente — 2026-10-25

**Resultado: no aceptar esta propuesta en su forma actual.** El diagnóstico de
producto es correcto —la operadora necesita UI, persistencia, historial y una
aprobación auditable—, pero la evidencia reunida todavía no demuestra que el
motor deba portarse a PHP ni que `ari_seo` deba congelarse. Los hallazgos
siguientes deben resolverse antes de cambiar el estado del ADR a `aceptado`.

### A-01 — SPECT-007 se usa como evidencia circular y además contradice el port

Este ADR afirma que SPECT-007 demuestra que «el destino final siempre fue
AriCRM». Sin embargo, SPECT-007 fue creado después de la discusión que produjo
esta propuesta; por tanto, no puede probar una intención histórica anterior.

Más importante: el SPECT vigente define a AriCRM como plano de control y a ARI
SEO/ARI Core como servicio independiente. También declara fuera de alcance
reescribir el motor en PHP o ejecutarlo dentro del proceso web de AriCRM. El ADR
y el SPECT toman decisiones incompatibles. Debe elegirse una y actualizar
explícitamente la otra; no se pueden usar mutuamente como soporte.

### A-02 — Archivar JSON Schema elimina una frontera que sigue siendo necesaria

Los modelos Eloquent y un snapshot PHPUnit verifican una implementación local,
pero no sustituyen contratos interoperables. El roadmap conserva
`ARI Scout → ARI Build → ARI Launch`, con `trace_id`, versionado y rechazo de
versiones incompatibles. Incluso si Scout se porta a PHP, JSON Schema sigue
siendo la frontera verificable entre etapas y la defensa contra acoplar los
agentes al modelo interno de AriCRM.

La decisión de runtime puede cambiar sin archivar `contracts/`. Si se hace el
port, PHP debe demostrar conformidad con los mismos schemas y fixtures antes de
retirar Node.

### A-03 — La comparación de alternativas contiene una falsa dicotomía

Mantener el motor Node no implica un sexto login, otra UI ni una experiencia
separada para la operadora. AriCRM puede proporcionar autenticación, tenancy,
planes, UI y aprobación mientras invoca un worker Node interno. La comparación
relevante es:

```text
AriCRM UI + motor PHP embebido
vs.
AriCRM UI + motor Node interno
```

No es «AriCRM» frente a «otro SaaS completo». Antes de portar debe medirse el
costo real del seam interno —job, proceso o servicio— y compararlo con el costo
de mantener dos implementaciones durante la migración.

### A-04 — La estimación del port no se sostiene con conteo de líneas

Las 714 líneas estimadas esconden semántica que debe reproducirse exactamente:
orden determinista, precisión numérica, tratamiento de `null`, retries,
timeouts, claves de caché, presupuesto reservado/reportado, paginación de
Search Console, sitemap recursivo, límites y sanitización de errores. La
dificultad no es traducir sintaxis; es lograr equivalencia observable.

Antes de aceptar el port se requiere un spike acotado en PHP que ejecute las
fixtures existentes y produzca un `SEOBrief` conforme al schema y equivalente
al golden brief. Sin ese spike, las 6–8 horas de la fase A son una estimación de
baja confianza y no deben usarse para decidir arquitectura.

### A-05 — `Task` puede ser una salida, no el modelo de ejecución

El `Task` actual de AriCRM representa trabajo humano y contiene responsable,
contacto, conversación, negocio, vencimiento y completitud. No modela
idempotencia, progreso de una corrida, presupuesto, consumo, artefactos,
versiones del brief, hash aprobado, errores ni reintentos.

Es válido crear tareas a partir de un brief aprobado, pero la ejecución requiere
entidades propias, como mínimo `seo_sites`, `seo_runs`, `seo_briefs` y
`seo_reviews`. Reutilizar `Task` como sustituto de esas entidades mezclaría
workflow técnico con trabajo humano y debilitaría la auditoría.

### A-06 — Correcciones a la evidencia marcada como medida

- Los 212 KB de fixtures sí están medidos, pero no contienen una grabación de
  sitemap: existen grabaciones de DataForSEO, una fixture sintética de Scout y
  una respuesta mínima saneada de Search Console. El sitemap real fue ejercitado
  en el smoke, no versionado como fixture completa.
- Que los repositorios estén en la misma máquina de desarrollo no demuestra que
  compartan despliegue, ciclo de release, capacidad o dominio de fallos.
- Tener clientes OAuth de Calendar y Sheets reduce exploración, pero no resuelve
  automáticamente Search Console: faltan scope, propiedad `sc-domain`, refresh,
  revocación, cifrado y aislamiento por tenant.
- Que AriCRM tenga infraestructura LLM no prueba que el 80 % de SPECT-005 sea
  reutilizable. Debe medirse el acoplamiento de esos servicios al dominio
  conversacional antes de convertir ese porcentaje en argumento decisorio.

### A-07 — Faltan migración gradual, paridad y rollback del runtime

«Congelar `ari_seo`» no define cómo comparar ambas implementaciones, cuánto
tiempo convivirían ni qué señal autoriza retirar Node. El plan necesita:

1. ejecución en sombra sobre las mismas fixtures y solicitudes;
2. comparación estructural de artefactos y brief;
3. criterios de tolerancia para diferencias numéricas y de orden;
4. observación de costos, latencia y errores;
5. rollback que permita volver al motor Node sin migrar datos manualmente;
6. fecha y criterio explícito para declarar el port canónico.

### A-08 — El piloto propuesto valida usabilidad, no necesariamente valor SEO

Las fases A+B entregarían una interfaz sobre un motor cuyo outline sigue siendo
una plantilla fija y que todavía no extrae contenido competidor. Dos semanas de
uso pueden demostrar que la operadora entiende el flujo, pero no que el brief
sea suficientemente bueno para producir contenido competitivo.

El piloto debe separar métricas de **usabilidad** —tiempo, errores, autonomía,
tasa de aprobación— de métricas de **calidad SEO** —cambios pedidos, utilidad
del outline, cobertura, calidad de competidores y aceptación editorial—. Esta
separación determina si SPECT-004/005 deben adelantarse.

### Recomendación auditada

Adoptar una secuencia reversible antes de decidir el port:

1. Mantener `ari_seo` y sus contratos como motor canónico.
2. Construir en AriCRM la UI, persistencia, permisos, cuotas y revisión humana.
3. Invocar Scout mediante un worker Node interno, invisible para la operadora y
   sin autenticación ni frontend propios.
4. Pilotar con Maquiempanadas y medir costo operativo del seam, usabilidad y
   calidad de los briefs.
5. Ejecutar un spike de paridad PHP contra schemas, fixtures y golden brief.
6. Comparar evidencia del piloto y del spike; solo entonces decidir entre
   conservar Node o completar el port.
7. Si se porta, mantener los contratos JSON y una ventana de ejecución paralela
   hasta demostrar paridad y rollback.

Conclusión de la auditoría: **AriCRM sí debe ser el anfitrión de la experiencia,
pero todavía no está demostrado que PHP deba ser el runtime del motor.**

## Segunda auditoría — verificación empírica (2026-10-25, ZCode)

> Método: re-medición de cada cifra marcada *medido* contra el árbol actual de
> `ari_seo` e inspección independiente de `velo_wa` y `aristudio` (conteos,
> archivos, git). Esta pasada no re-argumenta lo que la primera auditoría ya
> sostiene: lo confirma o lo corrige con evidencia, añade lo que falta, y
> difiere explícitamente donde difiere.

### Lo *medido* sobre `ari_seo`: confirmado, con dos desvíos

| Afirmación | Resultado |
| --- | --- |
| Motor: 1102 líneas en 16 archivos; `domain.js` 296, `dataforseo-provider.js` 116, `dataforseo-client.js` 109, `search-console-client.js` 101, `sitemap-provider.js` 92 | Exacto |
| CLIs 118 líneas (75+31+12); validación Ajv 28 | Exacto |
| Pruebas: 473 líneas en 3 archivos; contratos: 307 líneas; fixtures: 212 KB | Exacto |
| Generador HTML de 120 líneas; decisiones en `localStorage` | Exacto (`scripts/generate-golden-review.mjs:108-114`) |
| HTML real de 679 KB | Exacto (679 187 bytes) |
| 2482 filas de Search Console sobre 20 timestamps; 27 exclusiones; inventario de 372 URLs | Exacto (ledger: 2482 `google-search-console` + 35 DataForSEO + 372 sitemap = 2889 entradas) |
| El visor descarta el bloque `artifacts` completo | Confirmado: `generate-golden-review.mjs:9` toma `parsed.brief ?? parsed` y nunca lee `artifacts` |
| Commit de importación `d539559`: 56 archivos, 8547 inserciones | Exacto |
| `live-cli.js` exige `node --env-file=.env` | Exacto (`src/scout/live-cli.js:14`) |
| Outline idéntico para cualquier tema | Exacto: plantilla fija por locale (`src/scout/domain.js:187-191`, el código se autodeclara "Plantillas v0") |
| Salida offline de **1196 líneas** | Desvío menor: hoy son **1192**. Irrelevante para la decisión; la cifra quedó congelada en un estado previo |
| Costo **USD 0.0256** contra techo de USD 0.25 (*medido*) | **Etiqueta incorrecta**: el brief real reporta `usage.reported_usd: 0`; el 0.0256 es transcripción de `05-human-review.md`, que lo declara "aproximado". Refuerza la tesis del ADR —ninguna interfaz expone el costo— pero el dato no es una medición del sistema |

La afirmación de que las fixtures son grabaciones de "DataForSEO, Search
Console **y sitemap**" es incorrecta, como nota la primera auditoría (A-06):
`fixtures/` contiene `dataforseo/` (192 KB), `scout/` (16 KB) y
`search-console/` (4 KB); no existe grabación de sitemap. Detalle adicional no
reportado: las fixtures SERP de DataForSEO conservan el corte viejo en español
(`crm-para-pymes`, `crm-gratis-para-pymes`…) mientras el corte dorado ya es
`en-US`/empanadas — las grabaciones reales del corte actual nunca se
versionaron. Eso debilita la decisión #6 ("preservar las fixtures tal cual…
es la única red de seguridad del port") para la parte live del pipeline.

### Confirmaciones empíricas de la primera auditoría

- **A-01, confirmada y precisada.** `SPECT-007.md` es un archivo sin trackear
  que no aparece en `git log` alguno: fue creado en esta misma sesión, después
  del ADR. Su texto efectivamente declara "ARI SEO seguirá siendo un servicio
  independiente" con AriCRM como cliente vía ARI Core y webhooks firmados.
  La contradicción es real y la circularidad también: SPECT-007 no puede
  probar una intención previa a sí mismo.
- **A-06 (fixtures), confirmada** por inspección directa (arriba).
- **A-04, agravada por re-medición.** Las "714 líneas de lógica" son la suma
  exacta de los cinco archivos nombrados en el inventario, y dejan afuera
  lógica que también porta: `budget.js` (30), `normalize.js` (31),
  `dataforseo-config.js` (32), `errors.js` (18) y `run.js` (48) — ~159 líneas
  de comportamiento real, entre ellas todo el presupuesto y sus topes. El
  puerto real ronda las **875 líneas** de lógica, ~20% más que la cifra que el
  ADR usa como "costo real del port". No cambia la conclusión, pero la
  estimación de la fase A parte de un número optimista.
- **A-08, con un dato más.** El checklist de aprobación del visor ni siquiera
  es genérico entre temas: el ítem 5 dice "elegir y cotizar una *máquina*"
  (`generate-golden-review.mjs:107`), hardcodeado al corte empanadas. La
  superficie de revisión actual está fijada al caso de prueba, no solo al
  idioma.

### Correcciones al inventario de `velo_wa` y `aristudio`

Verificado hoy y exacto en `velo_wa`: 305 archivos de prueba, todas las capas
(`Actions` 28, `Services` 232, `Jobs` 48…), 115 `.tsx` y 8 vistas Blade, los 9
archivos de infraestructura IA, los 7 modelos de conocimiento, clientes Google
con factory, multi-tenancy con `config/features.php`, `DESIGN_SYSTEM.md` de
193 líneas declarando "Laravel 11, Blade/Livewire" sobre un repo Laravel
12 + Inertia sin Livewire, `app.tsx:23` fijando `#f5257e`, ausencia total de
modelos `Site`/`Page`/`Project`/`Content`/`Seo`, y `apify/` con un solo
proyecto. Correcciones:

1. **Son 35 features activas, no 33** (`specs/active/`: 35 directorios). El
   riesgo "Feature #34" no solo sigue vivo: empeoró desde que se escribió el
   ADR.
2. **Sí existe más andamiaje de evals del que ambos documentos admiten.** El
   ADR dice "no existe harness de evals en ningún repo"; hay un harness de
   regresión conversacional scripteado (`scripts/test_agent_playground_round.php`,
   28 casos ancla, probado en producción el 2026-10-19,
   `docs/AI_AGENT_SANDBOX_REGRESSION_SPEC.md`). Es semiautomático, no un suite
   PHPUnit, pero la fase E puede construir sobre ese precedente en vez de
   empezar de cero: el estimado "más frágil" es algo menos frágil.
3. **PHPUnit no corre sobre Postgres por defecto**: `phpunit.xml` usa SQLite
   `:memory:`; Postgres vive en runners específicos (concurrencia, índices
   parciales). El port heredaría SQLite como default.
4. **`velo_wa` está en su pico de actividad**: 221 commits en octubre (récord
   mensual del repo), último commit el 2026-10-22, árbol sucio con una feature
   en vuelo sin trackear y desarrollo agéntico paralelo visible. El port no
   aterrizaría en un repo tranquilo sino en el más caliente de los cinco.
5. PRs #77–#82: cinco de seis rastreables en `git log`; el #81 no aparece.
6. En `aristudio`: **28 archivos de prueba, no ~9** (subestimado 3x); tiene
   `laravel/sail` instalado como dependencia dev ("sin Docker" es matizable);
   y **`Task` no tiene relación alguna con `ProjectBrief`** — el esquema real
   es `Project → (Brief | Task)` en paralelo, sin FK ni referencia cruzada
   (grep de "brief" en `Task.php`: cero resultados). El "encaje literal
   cliente → brief → contenido" que la sección de alternativas usa para
   ponderar `aristudio` es impreciso: el eslabón brief→tarea habría que
   construirlo allí también. El `public_token` de 48 caracteres sí existe y es
   real. Con la corrección, la ventaja de dominio de `aristudio` se reduce a
   `Project`/`ProjectBrief` — y la decisión de este ADR sale reforzada por la
   vía que menos esperaba: su alternativa descartada era más débil de lo
   argumentado.

### Dónde esta auditoría discrepa con la primera

1. **La contrapropuesta de A-03 (worker Node interno en AriCRM) reintroduce
   exactamente el seam permanente que el ADR descarta** — ahora dentro del
   despliegue que atiende clientes de pago, y en el repo medido como el más
   activo. "Medir el costo del seam antes de portar" y "medir el costo del
   port antes de aceptarlo" son exigencias simétricas de datos que nadie ha
   medido; la diferencia es que el port se paga una vez y el seam se opera
   para siempre. El spike de paridad de A-04 rompe esa simetría por una
   fracción del costo de cualquiera de las dos alternativas completas, y esta
   auditoría lo respalda — sin necesidad de revertir la decisión de fondo.
2. **El motivo principal del ADR sale verificado archivo por archivo.** Los
   nueve componentes de infraestructura IA que inclinan SPECT-005 hacia
   `velo_wa` existen, tienen tests, y `LlmMenuNormalizer` es efectivamente el
   precedente del patrón pedido. La primera auditoría (A-06, última bala)
   pide medir el acoplamiento antes de creer el "~80% reutilizable"; es justo,
   pero el punto débil de esa infraestructura es su acoplamiento al dominio
   conversacional, no su existencia — y el patrón normalizador es el menos
   acoplado de todos.
3. Con A-05 no hay desacuerdo de fondo, solo de alcance: `Task` de `velo_wa`
   existe (verificado) y materializar el brief aprobado en tareas es una
   salida razonable; que la *ejecución* necesite entidades propias
   (`seo_runs`, `seo_reviews`) es correcto y esta pasada no lo contradice.
   Los campos concretos de `Task` que A-05 enumera no fueron re-verificados.

### Respuestas a las preguntas del revisor

1. `velo_wa`, por más margen del que el ADR argumentó: el encaje de dominio de
   `aristudio` resultó menor que lo afirmado (sin cadena Brief→Task) y la
   infraestructura IA de `velo_wa` está verificada íntegra.
2. No archivar: **degradar los schemas a oráculo de prueba**. El snapshot
   PHPUnit dice "el PHP produce lo mismo que el Node"; validar además la
   salida del PHP contra los schemas existentes dentro de la suite dice "la
   forma del contrato sigue siendo la declarada". Costo de runtime: cero.
   Si ARI Build/Launch despegan como servicios, ya están.
3. Con la corrección a ~875 líneas: sí. El argumento decisivo no es el conteo
   sino la operación permanente del seam frente a un consumidor y un operador
   únicos. El spike de A-04 es el seguro barato antes de comprometer la fase A
   completa.
4. "A+B y parar" es correcta como apuesta de aprendizaje, pero con el outline
   en plantilla v0 y el checklist del visor hardcodeado al tema, el brief que
   la operadora curará es más delgado de lo que suena. Si la fase B se siente
   inútil, el sospechoso es el outline genérico, no la UI; la corrección
   barata es derivar el outline de la intención del cluster (datos que ya
   existen en `domain.js`), no adelantar SPECT-005. Las métricas de A-08
   (usabilidad vs. calidad SEO separadas) son la forma correcta de decidirlo
   con datos.
5. Sí, pero como **condición de calendario, no de arquitectura**: con 35
   features activas y récord de actividad, la fase A no debería empezar
   mientras `velo_wa` tenga features en vuelo compitiendo por el mismo
   desarrollador.
6. Además de lo ya nombrado (OAuth SC por tenant, gasto por operadora):
   (a) diseño de persistencia del brief — el artefacto real pesa ~2 MB con
   2889 entradas de evidencia; columnas JSON vs. normalización es una
   decisión con costo propio; (b) las credenciales globales de DataForSEO del
   `.env` al pasar a multi-tenant: existe techo por corrida, no techo mensual;
   (c) portar el flujo `golden:update` a PHP, no solo el snapshot; (d)
   autorización del canal Echo/Pusher por tenant; (e) re-grabar las fixtures
   SERP del corte actual (hoy siguen en el corte viejo en español, ver arriba).

### Veredicto de esta auditoría

La decisión central —portar el motor a `velo_wa` con alcance por tenant y flag
apagado, UI Inertia/React, `ari_seo` congelado como referencia— **sobrevive la
verificación empírica y sale reforzada en su motivo principal**. Debe aceptarse
con cinco condiciones, en orden:

1. Reescribir SPECT-007 y `roadmap.md` en la misma entrega que apruebe este
   ADR (coincide con A-01): hoy se contradicen dentro del mismo árbol.
2. Degradar los JSON Schema a oráculo de prueba en la fase A, no archivarlos
   (precisa A-02 en forma reversible).
3. Ejecutar el spike de paridad PHP de A-04 **antes** de la fase A completa,
   corriendo las fixtures existentes y validando contra los schemas. Es el
   seguro barato que blinda la estimación más cuestionada.
4. Corregir el inventario para el registro histórico: 35 features activas,
   28 tests en `aristudio`, ~875 líneas de port, costo "aproximado" y no
   "medido", sin fixture de sitemap, fixtures SERP en el corte viejo.
5. Condicionar el inicio de la fase A al cierre de las features en vuelo en
   `velo_wa`: el cuello de botella medido es la atención, no el stack.

Diferencia explícita con la primera auditoría: ella concluye "no aceptar; la
experiencia en AriCRM sí, el runtime PHP no todavía". Los mismos datos
verificados llevan a esta pasada a lo contrario sobre el runtime — el port se
paga una vez, el seam se opera para siempre, y la única infraestructura que
inclina la balanza está verificada — aceptando de ella el spike (condición 3),
la reescritura de SPECT-007 (condición 1) y la separación de métricas del
piloto (A-08). La divergencia es de juicio sobre un dato que ninguno de los
dos tiene: el costo real del seam interno. Si el spike de paridad resultara
desastroso, esa sería la señal para el worker Node interno de A-03 — no al
revés.

## Preguntas para el revisor

1. ¿Pesa más el encaje de dominio de `aristudio` (`Project`/`ProjectBrief`/`Task`
   ya modelados, `public_token` para compartir con el cliente) que la
   infraestructura de IA de `velo_wa`? El port del motor es idéntico en ambos; lo
   que cambia es qué hay que construir después.
2. ¿Es defendible archivar los JSON Schema, o es la frontera que impedirá que
   ARI Build y ARI Launch nazcan acoplados al CRM?
3. ¿714 líneas de lógica y 473 de pruebas justifican un port, o hay un argumento
   mejor para un servicio Node pequeño con un cliente HTTP en Laravel?
4. ¿La secuencia "A+B y parar" es correcta, o dejar el outline genérico
   —`Need and context / How to choose / Recommended solution / FAQ`, hoy
   idéntico para cualquier tema— vuelve inútil la fase B y obliga a adelantar
   SPECT-005?
5. Con 33 features activas en `velo_wa`, ¿la decisión correcta es no abrir esta
   todavía?
6. ¿Qué falta en el estimado? Específicamente: OAuth de Search Console para una
   operadora no técnica, y el control de gasto de DataForSEO con un operador que
   puede disparar corridas a voluntad.
