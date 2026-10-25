---
slug: ari-scout
reviewed_at: 2026-10-25
reviewer: Nicolás
decision: approved
approved: 8
total: 8
---

# Revisión humana del brief dorado

Artefacto revisado: `fixtures/scout/en-us-golden.brief.json` mediante `docs/golden-brief-review.html`.

## Aprobado

- [x] La keyword primaria representa la oportunidad principal.
- [x] Las keywords secundarias cubren intención comercial e informativa útil.
- [x] Los clusters tienen sentido y no mezclan necesidades incompatibles.
- [x] El tipo de página, título y objetivo de conversión son adecuados.
- [x] El outline responde lo necesario para elegir y cotizar una máquina.

Esta aprobación valida la estructura y dirección editorial del brief dorado sintético.

## No aprobado todavía

- [x] Los competidores forman un conjunto razonable después de curación humana.
  - Incluidos: Empanadas Machine, ANKO, PastaBiz, ANKO Food y VER Food Solutions.
  - Excluidos: WebstaurantStore y FoodProTec.
- [x] Los enlaces internos propuestos son pertinentes.
  - Aprobado sobre el candidato real generado con Search Console y sitemap de `maquiempanadas.com`.
- [x] Los supuestos y límites están claros.
  - Aprobados después de ampliar y mostrar explícitamente volatilidad, fuentes, reglas de selección, ventana de Search Console, límites del sitemap, ausencia de extracción de contenido y presupuesto.

## Decisión

El gate humano queda **aprobado (8/8)**. No se modifica la fixture dorada para insertar datos volátiles. El candidato real confirmó los enlaces internos, cinco competidores después de curación humana y los supuestos/límites ampliados.

## Hallazgos del candidato real

- **Competidores corregidos:** el selector excluye plataformas no comparables, deduplica por dominio y registra razones de exclusión; la selección final fue curada por el revisor.
- **Curación humana:** el visor permite incluir/excluir cada candidato sin convertir decisiones específicas de Maquiempanadas en reglas globales del algoritmo. La selección se conserva localmente; las decisiones conocidas se precargan desde un artefacto local ignorado por Git.
- **Supuestos/límites rechazados:** el brief solo muestra que las métricas pueden cambiar. Debe declarar de forma visible ventana y volatilidad de datos, fuentes utilizadas, presupuesto/costo, límites de filas/URLs, ausencia de extracción del contenido de competidores y que una URL en SERP no equivale automáticamente a competidor comercial.

## Condiciones para cerrar

1. Capturar y sanear una fixture mínima de la respuesta real de Search Console.
2. Repetir `/verify` y `/code_review`, marcar `ready` y archivar.

## Estado de accesos al revisar

- DataForSEO: ejecución real completada; costo reportado aproximado de USD 0.0256 frente al límite de USD 0.25.
- Google Search Console: propiedad `sc-domain:maquiempanadas.com`, acceso de solo lectura validado.
- Sitemap: inventario real de `maquiempanadas.com` procesado.
- Artefacto local: `artifacts/maquiempanadas-live.brief.local.json` (ignorado por Git).
