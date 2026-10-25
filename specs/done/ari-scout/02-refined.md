---
slug: ari-scout
refined_at: 2026-10-24
---

# Refined User Story

## Actor

El equipo que mantiene ARI SEO y los agentes que continuarán el desarrollo de ARI Scout.

## Valor

Evita rehacer una implementación respaldada por contratos, fixtures y pruebas; incorpora el ciclo al formato operativo actual y hace visibles los gates aún pendientes.

## Criterios de aceptación

- **AC1 — Preservación:** dado el ciclo histórico, cuando se normaliza, entonces `specs/001-ari-scout/` permanece intacto y enlazado como fuente de verdad histórica.
- **AC2 — Trazabilidad:** dado cada gate principal, cuando se consulta el proposal o testing report, entonces puede localizarse su requisito, implementación y evidencia de prueba.
- **AC3 — Verificación reproducible:** dado el checkout sin credenciales, cuando se ejecuta `npm test`, entonces la suite completa pasa sin llamadas reales a proveedores.
- **AC4 — Honestidad de estado:** dados los gates humanos y de integración pendientes, cuando se consulta el spec normalizado, entonces no figura como `ready` ni `archived`.
- **AC5 — Continuidad:** dado un pendiente de ARI Scout, cuando se retome, entonces se crea un SPECBOOT propio si constituye una feature no trivial, sin reabrir ni reescribir el ciclo histórico.

## Requisitos no funcionales

- No duplicar los documentos históricos ni generar dos fuentes de verdad.
- No incluir secretos, credenciales ni respuestas sin sanear.
- Mantener compatibilidad con Node.js 20+ y ejecución offline.
- Toda afirmación de cobertura debe apuntar a un archivo o test existente.

## Supuestos confirmados

- La normalización es documental; no cambia contratos ni comportamiento del runtime.
- Los pendientes de SPECT-004 a SPECT-006 son trabajo futuro y no bloquean documentar lo ya implementado.
- La revisión humana del brief dorado y el smoke real de Search Console sí bloquean cerrar este ciclo como `ready`.

## Riesgos

- Confundir “tests verdes” con producto completamente validado.
- Perder pendientes al repartir evidencia entre la estructura histórica y la nueva.
- Ejecutar integraciones pagadas durante una verificación que debe ser offline.

## Fuera de alcance

- Reimplementar SPECT-001, SPECT-002 o SPECT-003.
- Aprobar automáticamente la calidad editorial del brief dorado.
- Ejecutar Search Console sin propiedad y autorización explícitas.
- Implementar SPECT-004, SPECT-005 o SPECT-006.
