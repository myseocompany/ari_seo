# ADR 0002 — Estrategia de extracción de páginas competidoras

- Estado: aceptado
- Fecha: 2026-10-24
- Reemplaza parcialmente la decisión de proveedores de [`spec.md`](../../specs/001-ari-scout/spec.md)

## Contexto

El SPECBOOT decidió Apify como proveedor de enriquecimiento para extraer contenido de las páginas competidoras seleccionadas. Más tarde, [`roadmap.md`](../../specs/001-ari-scout/roadmap.md) describió SPECT-004 como "enriquecimiento de competidores: HTTP directo → Apify", introduciendo un paso previo que el SPECBOOT no contemplaba.

Ese cambio de diseño se registró solo como una línea del roadmap, sin ADR, pese a que [`plan.md`](../../specs/001-ari-scout/plan.md) exige ADR para decisiones de diseño. Este documento lo formaliza.

## Decisión

La extracción se intenta en dos niveles, en este orden:

1. **HTTP directo.** Petición simple a la URL pública, respetando `robots.txt`, con timeout, límite de tamaño, límite de concurrencia y sin ejecución de JavaScript.
2. **Apify como escalón de respaldo.** Solo si el nivel 1 no entrega evidencia utilizable y el enriquecimiento está habilitado para esa ejecución.

Ningún nivel es obligatorio para que un brief llegue a `ready`: la indisponibilidad de ambos produce `partial` con el gap explícito, como ya establece el SPECBOOT para Apify.

## Motivos

- La mayoría de las páginas competidoras de este dominio sirven título, encabezados y texto en el HTML inicial; un navegador headless es innecesario para ellas.
- Apify tiene costo por ejecución y latencia de arranque. Usarlo como primer recurso paga por capacidad que la mayoría de los casos no necesita.
- Mantener dos niveles detrás del mismo puerto `PageExtractor` conserva la frontera del dominio: el análisis no sabe de dónde vino el contenido.
- Un escalón barato y determinista es más fácil de grabar como fixture que un actor remoto, lo que importa dado el gate de fixtures grabadas de la etapa 3bis.

## Consecuencias

- `PageExtractor` necesita exponer, además del contenido normalizado, qué nivel lo produjo y qué limitaciones tuvo, para que el `SourceLedger` conserve la procedencia.
- Aparecen códigos de error propios del nivel HTTP, separados de los de Apify: el catálogo de `spec.md` debe crecer con `EXTRACTION_BLOCKED` y `EXTRACTION_TOO_LARGE` sin reutilizar los `APIFY_*`.
- Hay que decidir y documentar el criterio de "evidencia utilizable" que dispara el escalón a Apify; si queda implícito, el costo se vuelve impredecible.
- El cumplimiento de `robots.txt` y de términos aplicables pasa a ser responsabilidad del nivel 1, que antes recaía enteramente en el proveedor externo.
- SPECT-004 debe grabar fixtures de ambos niveles antes de considerarse verificado.
