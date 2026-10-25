## SPECBOOT — ciclo SDLC agéntico

Toda feature **no trivial** sigue el ciclo SPECBOOT antes de llegar a `main`. Lee `SPECBOOT.md` para el flujo, comandos (`/enrich_us`, `/propose`, `/apply`, `/verify`, `/code_review`, `/archive`, `/commit`) y criterios de fastpath. Los artefactos viven en `specs/active/` (en vuelo) y `specs/done/` (terminados), y se versionan con el código.

## Reglas del repositorio

- Runtime soportado: Node.js 20 o superior.
- Instala dependencias reproduciblemente con `npm ci`.
- El verificador obligatorio es `npm test`.
- Si cambia el pipeline que genera el brief dorado, ejecuta `npm run golden:update` y revisa explícitamente el diff de `fixtures/scout/en-us-golden.brief.json`.
- Los tests y la CI deben correr sin credenciales ni llamadas reales a proveedores. Las integraciones reales son opt-in, con presupuesto explícito y secretos únicamente en variables de entorno.
- Si cambia un contrato JSON, actualiza su schema, consumidores, fixtures y pruebas en la misma entrega.
- No edites manualmente `package-lock.json`; deja que npm lo mantenga al modificar dependencias.
- No hagas push, abras PR ni despliegues sin autorización explícita.
- Toda superficie visual nueva sigue `DESIGN_SYSTEM.md`; si se implementa dentro de AriCRM, reutiliza primero sus componentes canónicos.
