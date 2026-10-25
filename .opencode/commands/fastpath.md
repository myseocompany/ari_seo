---
description: "SPECBOOT escape valve — salta el ciclo para cambios triviales y va directo a commit. Args: <descripción-breve-del-cambio>"
---

Estás usando `/fastpath`, el escape valve de SPECBOOT. Ver `SPECBOOT.md` del repo, sección **Cuándo NO aplica (fastpath)**.

## Precondición obligatoria

Fastpath solo aplica si **TODAS** estas condiciones son ciertas:

- [ ] **<50 líneas** cambiadas
- [ ] **Sin cambios de contrato o API pública** (schemas, CLI, proveedores o artefactos publicados)
- [ ] **Sin nueva dependencia** (`package.json` y `package-lock.json` intactos)
- [ ] **Sin nueva capacidad visible** para operadores o consumidores
- [ ] **Sin cambios en persistencia, caché o formatos almacenados**

## Acciones

### 1. Verificar aplicabilidad

Corre:
```bash
git diff --stat
git diff --stat -- package.json package-lock.json contracts/ src/scout/file-cache.js
```

Comprueba las 5 condiciones. Si cualquiera falla:
- **Detente inmediatamente**.
- Explica al usuario cuál condición se cruzó.
- Sugiere: correr SPECBOOT completo (`/enrich_us "$ARGUMENTS"`).

### 2. Verificación mínima

Aunque saltemos SPECBOOT, corre igualmente los verificadores del repo (declarados en `SPECBOOT.md`):

- Tests relevantes al área tocada.
- Suite completa con `npm test`.

Si algo falla, arreglar antes de commitear.

### 3. Commit

Prepara commit con mensaje corto y conventional. Formato:

```
<tipo>: <descripción en imperativo>

[cuerpo opcional de 1 línea explicando el por qué]

fastpath: <razón por la que califica — ej. "typo en label", "bump patch dep">
```

La línea `fastpath:` es obligatoria y sirve de auditoría — si alguien revisa el histórico, sabe explícitamente que este cambio saltó SPECBOOT deliberadamente.

### 4. Reportar

- Hash del commit.
- Mensaje completo.
- Confirmación de las 5 condiciones de fastpath cumplidas.
- Recordatorio: no push automático — el usuario decide cuándo publicar.

## Prohibido

- No usar fastpath para "ahorrar tiempo" cuando el cambio realmente amerita SPECBOOT. La disciplina se erosiona rápido.
- No omitir la línea `fastpath:` en el mensaje.
- No push ni PR automáticos.
- No usar fastpath para cambios que puedan generar llamadas o costos de proveedor sin verificar impacto.
