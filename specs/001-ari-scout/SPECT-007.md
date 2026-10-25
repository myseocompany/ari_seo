# SPECT-007 — Integración multi-tenant con AriCRM

## Estado

Pendiente. Gobernado por [ADR 0004](../../docs/adr/0004-plano-de-control-y-plano-de-ejecucion.md): AriCRM es el plano de control (autenticación, tenancy, cuotas, aprobación y UI) y ARI SEO el plano de ejecución en Node; el motor no se porta a PHP ni se ejecuta dentro del proceso web de AriCRM.

La integración llega en dos pasos: primero un corte vertical mínimo en AriCRM — un job que invoca el CLI de Scout vía `Process::run`, tras flag —, y después el contrato completo multi-tenant definido aquí, cuando SPECT-006 estabilice la operación y la API de ARI Core. Este SPECT fija el contrato al que converge el corte inicial; el seam CLI intermedio lo define el ADR 0004, no este documento.

## Resultado

Permitir que un tenant de AriCRM conecte su sitio, lance una investigación de ARI Scout, revise el brief y conserve consumo e historial sin compartir credenciales, caché ni artefactos con otros tenants.

```text
Usuario del tenant
  → AriCRM: autenticación, permisos, plan y UI
  → ARI Core API: proyecto + ejecución asíncrona
  → ARI Scout: DataForSEO + Search Console + sitemap
  → SEOBrief con estado review_required
  → AriCRM: selección de competidores + checklist + notas
  → aprobación versionada
  → SEOBrief approved para ARI Build
```

## Límites de responsabilidad

### AriCRM

- Autenticar usuarios y resolver el `tenant_id` desde la sesión; nunca aceptarlo ciegamente desde el navegador.
- Aplicar roles, plan, cuota y permisos de lanzamiento/aprobación.
- Gestionar la conexión OAuth de Search Console y mostrar proyectos, ejecuciones, costos y revisiones.
- Enviar solicitudes a ARI Core con credenciales de servicio, no directamente desde el frontend.
- Recibir webhooks firmados y reflejar el estado al usuario.

### ARI SEO / ARI Core

- Ejecutar Scout de forma asíncrona y aislada por tenant/proyecto.
- Validar contratos, idempotencia, presupuesto y estado del workflow.
- Resolver referencias de credenciales sin incluir secretos en requests, logs o artefactos.
- Persistir evidencia, briefs, decisiones humanas, consumo y auditoría.
- Notificar cambios de estado mediante webhooks firmados y reintentables.

## Identidad y jerarquía

```text
tenant_id
└── project_id        sitio + mercado + propiedad Search Console
    └── run_id        ejecución inmutable de Scout
        ├── request_id / trace_id
        ├── artifacts
        ├── SEOBrief versionado
        └── review_id / approval
```

- Todos los registros, objetos de caché, métricas y artefactos llevan `tenant_id` y `project_id`.
- Los identificadores son opacos y no conceden autorización por sí mismos.
- Una ejecución conserva el snapshot de configuración usado; cambios posteriores del proyecto no reescriben el histórico.
- La caché puede deduplicar adquisición pública solo si no mezcla señales propias, credenciales ni artefactos privados entre tenants.

## Contratos iniciales

### Crear ejecución

`POST /v1/scout-runs`

```json
{
  "tenant_id": "tenant_...",
  "project_id": "project_...",
  "request_id": "uuid",
  "trace_id": "uuid",
  "topic": "empanada machine",
  "locale": "en-US",
  "location": "United States",
  "seed_keywords": ["empanada machine"],
  "conversion_goal": "request a quote",
  "limits": { "provider_budget_usd": 0.25 }
}
```

- `request_id` es la llave de idempotencia dentro del tenant.
- `tenant_id` lo firma AriCRM y ARI Core verifica que el principal de servicio pueda actuar sobre él.
- Dominio, propiedad Search Console y referencia de credencial provienen del proyecto persistido; no se aceptan secretos en el payload.

Respuesta aceptada:

```json
{
  "run_id": "run_...",
  "status": "queued",
  "request_id": "uuid",
  "trace_id": "uuid"
}
```

### Consultar ejecución

`GET /v1/scout-runs/{run_id}` devuelve estado, progreso, consumo, gaps y enlaces a artefactos autorizados.

### Registrar revisión

`POST /v1/scout-runs/{run_id}/reviews`

Incluye versión/hash del brief, criterios aprobados, competidores incluidos/excluidos, notas y actor. Rechaza la aprobación si el hash ya no coincide con la versión vigente.

### Webhook hacia AriCRM

Eventos mínimos:

- `scout.run.started`
- `scout.run.review_required`
- `scout.run.approved`
- `scout.run.failed`

Cada entrega incluye `event_id`, `tenant_id`, `run_id`, timestamp y firma HMAC. AriCRM deduplica por `event_id`; ARI Core reintenta con backoff y conserva estado de entrega.

## Estados

```text
queued → running → review_required → approved
                   ├── changes_requested → running
                   └── rejected
queued/running → partial | failed | cancelled
```

- `ready` del `SEOBrief` significa evidencia automática suficiente; en la integración se expone como `review_required`, no como aprobación humana.
- Solo un usuario autorizado de AriCRM puede producir `approved`, `changes_requested` o `rejected`.
- Un brief aprobado es inmutable. Una nueva ejecución crea una versión nueva.

## Seguridad y credenciales

- OAuth de Search Console usa scope `webmasters.readonly`.
- Access y refresh tokens se cifran en reposo y se acceden mediante una referencia de credencial por tenant/proyecto.
- No incluir tokens en jobs, URLs, logs, webhooks, briefs ni respuestas de error.
- Autenticación AriCRM → ARI Core mediante credencial de servicio rotatable; autorización siempre ligada al tenant.
- Webhooks firmados con timestamp, tolerancia de replay y secreto rotatable.
- Los artefactos privados requieren autorización y URLs de descarga temporales cuando se almacenen fuera de la API.

## Cuotas, costos y planes

- AriCRM define la cuota comercial del plan; ARI Core impone el techo técnico por ejecución y período.
- Reservar presupuesto antes de adquirir datos y reconciliarlo con el costo reportado.
- Registrar por tenant: ejecuciones, costo reservado, costo reportado, caché utilizada y proveedor.
- Una cuota agotada falla antes de red con un error estable; no se permite sobregiro silencioso.
- Reintentos e idempotencia no deben facturar dos veces la misma adquisición cacheada.

## Experiencia mínima en AriCRM

1. Lista de proyectos SEO del tenant.
2. Alta de proyecto: dominio, mercado, idioma y propiedad de Search Console.
3. Conexión OAuth y prueba de acceso.
4. Formulario para topic, semillas, objetivo y presupuesto.
5. Estado y progreso de la ejecución.
6. Visor del brief con selección de competidores, checklist y notas.
7. Acciones aprobar, pedir cambios o rechazar.
8. Historial de versiones, consumo y auditoría.

## Criterios de aceptación

1. Un usuario solo puede listar, lanzar y revisar ejecuciones de su tenant activo.
2. Dos tenants con el mismo dominio o topic no comparten señales privadas, credenciales ni artefactos.
3. Repetir `request_id` en el mismo tenant devuelve la misma ejecución; usarlo en otro tenant no colisiona.
4. Una ejecución excediendo cuota o presupuesto falla antes de llamar proveedores.
5. AriCRM puede seguir una ejecución desde `queued` hasta `review_required` sin mantener una conexión HTTP abierta.
6. Un webhook duplicado no duplica estados ni notificaciones en AriCRM.
7. Una firma inválida, expirada o reproducida se rechaza y audita.
8. La aprobación persiste actor, fecha, hash del brief, checklist, competidores y notas.
9. No se puede aprobar una versión obsoleta del brief.
10. Tokens y secretos no aparecen en DB de artefactos, logs, errores, webhooks ni respuestas públicas.
11. El consumo mostrado en AriCRM coincide con el ledger de ARI Core.
12. Existe un test de aislamiento que intenta leer y mutar una ejecución desde otro tenant.
13. El flujo completo funciona con proveedores simulados en CI y con un smoke opt-in sobre un tenant piloto.

## Plan de pruebas

- Contract tests AriCRM ↔ ARI Core para requests, estados, errores y webhooks.
- Tests de autorización e aislamiento cruzado entre dos tenants.
- Tests de idempotencia concurrente y deduplicación de webhooks.
- Tests de cuota/presupuesto antes de red y reconciliación de costo.
- Tests de rotación/revocación de credenciales y redacción de secretos.
- Tests de aprobación optimista mediante hash/version.
- E2E offline: crear proyecto → ejecutar Scout → revisar → aprobar.
- Smoke opt-in con Maquiempanadas como tenant piloto.

## Migración y rollout

1. Mantener el CLI actual como herramienta de desarrollo y recuperación.
2. Introducir persistencia y API de ARI Core detrás de un flag interno.
3. Integrar un único tenant piloto: Maquiempanadas.
4. Comparar resultados, costos y auditoría con el flujo local actual.
5. Habilitar por allowlist a otros tenants.
6. Añadir plan comercial solo después de medir costo, latencia y carga operativa.

Rollback: desactivar el módulo en AriCRM y conservar proyectos, ejecuciones y briefs en modo solo lectura; el motor local continúa disponible.

## Dependencias

- **[ADR 0004](../../docs/adr/0004-plano-de-control-y-plano-de-ejecucion.md):** plano de control (AriCRM) y plano de ejecución (ARI SEO); el seam inicial es CLI, no API.
- **SPECT-004:** evidencia enriquecida de competidores.
- **SPECT-005:** síntesis LLM controlada; puede permanecer deshabilitada inicialmente.
- **SPECT-006:** API operativa, workers, persistencia, observabilidad y piloto de ARI Core.
- Contratos de identidad, planes y permisos de AriCRM en `/Volumes/ExternoMS/projects/velo_wa`.

## Fuera de alcance

- Reescribir ARI SEO en PHP o ejecutar el motor dentro del proceso web de AriCRM (decidido en [ADR 0004](../../docs/adr/0004-plano-de-control-y-plano-de-ejecucion.md)).
- Crear un segundo sistema completo de usuarios, facturación y planes en ARI SEO.
- Publicación automática sin revisión humana.
- Compartir tokens de Search Console entre tenants.
- Exponer una API pública para terceros en el primer rollout.

## Definition of Done

- [ ] contratos versionados para proyecto, ejecución, revisión y webhook;
- [ ] persistencia aislada por tenant y migraciones reversibles;
- [ ] API y worker asíncrono con idempotencia;
- [ ] vault/referencias de credenciales y OAuth de solo lectura;
- [ ] cuotas, presupuesto y ledger de consumo por tenant;
- [ ] webhooks firmados, reintentables y deduplicados;
- [ ] UI mínima de proyecto, ejecución y revisión en AriCRM;
- [ ] suite de aislamiento y contratos en verde;
- [ ] smoke completo con Maquiempanadas;
- [ ] runbook, métricas, rollback y documentación operativa.
