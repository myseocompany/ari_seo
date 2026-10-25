---
description: "SPECBOOT paso 4a — Corre los verificadores declarados en SPECBOOT.md y valida contra los AC. Args: <slug>"
---

Estás en el paso `verify` del ciclo SPECBOOT. Ver `SPECBOOT.md` del repo.

## Precondición

`$ARGUMENTS` = slug del feature. Debes estar en el worktree del feature (rama `feature/<slug>`) con `status: applied` en `specs/active/<slug>/01-user-story.md`.

Si estás en el checkout principal o en otra rama, detente y avísale al usuario.

## Acciones

### 1. Leer verificadores del repo

Lee `SPECBOOT.md` del repo actual, sección **Verificadores del repo**. Esa sección lista los comandos exactos que debes correr, en el orden indicado. NO uses una lista hardcodeada — respeta lo que declare el repo.

### 2. Correr cada verificador

Para cada verificador de la lista:
- Ejecutar el comando exacto (usa el filtro por slug si el verificador lo soporta y el spec lo declara).
- Capturar salida completa.
- Marcar resultado: `PASS`, `FAIL`, o `N/A` (si la herramienta no aplica al repo).

Si un verificador falla, **detén el resto** y reporta el fallo (no correr los siguientes hasta arreglar).

### 3. Validar cobertura de AC

Lee `specs/active/<slug>/02-refined.md`, sección **Criterios de aceptación**. Para cada AC, verifica que exista al menos un test que lo cubra (por nombre del test o por assertion explícita en el código de prueba).

### 4. Actualizar testing report

Actualiza `specs/active/<slug>/04-testing-report.md`:
- Tabla de verificadores con resultado y notas
- Cobertura de AC: marcar cada AC con `[x]` si está cubierto, `[ ]` si falta
- Fallos encontrados: descripción, causa raíz, decisión

### 5. Reportar

En el chat:
- Tabla resumen de verificadores (PASS/FAIL).
- AC cubiertos vs. AC pendientes.
- Si hay fallos: análisis de causa raíz y sugerencia de fix.
- Instrucción: si hay fallos, arreglar y volver a correr `/verify`. Si todo pasa, correr `/code_review <slug>`.

## Prohibido

- No marcar como PASS un verificador que no se corrió realmente.
- No firmar la cobertura de un AC sin verificar que el test lo cubra.
- No editar el `03-proposal.md` para "hacer coincidir" con lo implementado si divergió — usar la sección `## Cambios respecto al plan original`.
- No saltar al siguiente paso si algún verificador falló.
