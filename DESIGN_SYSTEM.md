# ARI — Design System

## Estado y alcance

- Estado: adoptado para nuevas superficies de ARI SEO.
- Origen: sistema visual de AriCRM (`velo_wa/DESIGN_SYSTEM.md`), adaptado el 2026-10-25.
- Objetivo: mantener continuidad visual entre ARI SEO, su visor local y la futura integración en AriCRM.
- Este documento define tokens y comportamiento visual; no obliga a ARI SEO a usar el mismo runtime o framework de AriCRM.

ARI SEO todavía no tiene una aplicación web permanente. Toda nueva UI —HTML local, panel, componente embebido o interfaz en AriCRM— debe aplicar estas reglas. Cuando la superficie viva dentro de AriCRM, debe reutilizar los componentes reales del anfitrión antes de recrearlos.

## Principio de marca

- **Nombre:** Ari.
- **Primario:** morado.
- **Lienzo:** blanco y grises claros.
- **Verde:** éxito o estado saludable; no es color decorativo ni CTA.
- **Rojo:** error o acción destructiva.
- **Ámbar:** advertencia, costo o revisión pendiente.
- **Azul:** información neutral.

> Morado es el protagonista. Gris estructura la interfaz. Los demás colores necesitan una razón semántica.

## Tokens de color

### Primario — Ari Purple

```css
--ari-purple-50:  #F5F3FF;
--ari-purple-100: #EDE9FE;
--ari-purple-200: #DDD6FE;
--ari-purple-300: #C4B5FD;
--ari-purple-400: #A78BFA;
--ari-purple-500: #8B5CF6;
--ari-purple-600: #7C3AED;
--ari-purple-700: #6D28D9;
--ari-purple-800: #5B21B6;
--ari-purple-900: #4C1D95;
```

Usos:

- `600`: CTA principal, navegación activa y enlaces principales.
- `700`: hover del CTA.
- `50–100`: selección, hover sutil y fondos informativos de marca.
- `800–900`: texto de énfasis sobre fondos morados claros.

### Neutrales

```css
--ari-gray-25:  #FAFAFA;
--ari-gray-50:  #F9FAFB;
--ari-gray-100: #F3F4F6;
--ari-gray-200: #E5E7EB;
--ari-gray-300: #D1D5DB;
--ari-gray-400: #9CA3AF;
--ari-gray-500: #6B7280;
--ari-gray-600: #4B5563;
--ari-gray-700: #374151;
--ari-gray-800: #1F2937;
--ari-gray-900: #111827;
```

### Semánticos

```css
--ari-success-50:  #F0FDF4;
--ari-success-500: #22C55E;
--ari-success-700: #15803D;

--ari-danger-50:   #FEF2F2;
--ari-danger-500:  #EF4444;
--ari-danger-700:  #B91C1C;

--ari-warning-50:  #FFFBEB;
--ari-warning-500: #F59E0B;
--ari-warning-700: #B45309;

--ari-info-50:     #EFF6FF;
--ari-info-500:    #3B82F6;
--ari-info-700:    #1D4ED8;
```

En AriCRM, el verde también representa WhatsApp conectado/entregado. En ARI SEO no debe asociarse a WhatsApp salvo que la superficie esté mostrando explícitamente esa información.

## Tipografía

- Fuente: stack sans-serif del sistema o Inter cuando ya esté disponible.
- Títulos: `font-semibold`; evitar pesos ultralivianos.
- Texto: `font-normal`, color gray-700/800.
- Metadata: gray-500/600.
- Código, IDs, timestamps, métricas tabulares: monospace.
- Ancho de lectura recomendado para texto largo: 65–80 caracteres.

Escala sugerida:

| Uso | Tamaño | Peso |
|---|---:|---:|
| Título de página | 30–36 px | 600–700 |
| Título de sección | 20–24 px | 600 |
| Título de tarjeta | 16–18 px | 600 |
| Cuerpo | 14–16 px | 400 |
| Metadata/ayuda | 12–14 px | 400–500 |

## Espaciado y geometría

- Escala base: múltiplos de 4 px.
- Contenido principal: máximo 1152–1280 px.
- Tarjetas: radio 12–16 px, borde gray-200, sombra mínima.
- Controles: radio 8–12 px.
- Separación entre secciones: 24–32 px.
- Targets interactivos: mínimo 44 × 44 px cuando sea posible.
- No usar sombras fuertes para suplir jerarquía; preferir espacio, borde y tipografía.

## Componentes

### Botones

- **Primario:** fondo purple-600, hover purple-700, texto blanco.
- **Secundario:** fondo blanco, borde y texto purple-600, hover purple-50.
- **Ghost:** transparente, borde gray-200, texto gray-700, hover gray-50.
- **Danger:** fondo danger-500, hover danger-700, texto blanco.
- **Deshabilitado:** gray-100/300, sin sombra ni falsa affordance.

Todos usan padding equivalente a `px-5 py-2.5`, texto 14 px medium y foco visible. Solo debe existir un CTA primario dominante por región.

### Inputs

- Fondo gray-50 o blanco.
- Borde gray-200; hover gray-300.
- Foco purple-500 con anillo purple-500 al 20 %.
- Error danger-500 con mensaje textual; nunca comunicar error solo por color.
- Label persistente; placeholder no sustituye label.

### Tarjetas de métricas

- Fondo blanco, borde gray-200, radio 12 px y padding 20 px.
- Valor principal: gray-900, 24–30 px, semibold.
- Label: gray-500, 14 px.
- Icono: purple-50 sobre purple-600.
- Éxito, advertencia o error solo cuando la métrica expresa realmente ese estado.

### Badges y estados

| Estado | Tratamiento |
|---|---|
| En cola / neutral | gray-100 + gray-700 |
| En ejecución | info-50 + info-700 |
| Requiere revisión | warning-50 + warning-700 |
| Aprobado / saludable | success-50 + success-700 |
| Parcial | warning-50 + warning-700 |
| Fallido / rechazado | danger-50 + danger-700 |

El texto del estado siempre acompaña al color.

### Tablas

- Encabezado gray-100, texto gray-600, 12–13 px medium.
- Filas blancas con separadores gray-200.
- Hover gray-50 cuando la fila sea interactiva.
- Números y costos alineados a la derecha.
- En móvil, priorizar columnas esenciales o convertir cada fila en tarjeta; no reducir texto hasta volverlo ilegible.

### Checklist de revisión

- Cada criterio muestra selección, texto y estado inequívoco.
- El progreso debe expresarse como `n de total`, no solo mediante barra.
- Una casilla marcada no equivale por sí sola a aprobación persistida.
- La acción “Aprobar” muestra actor, fecha y versión/hash del artefacto.
- Si el artefacto cambió, invalidar la aprobación previa y explicarlo.

### Selección de competidores

- Mostrar dominio y URL; el dominio tiene mayor jerarquía visual.
- Permitir incluir/excluir individualmente.
- Mostrar el motivo de exclusión automática o humana.
- Diferenciar propuesta automática de selección aprobada.
- Conservar el conjunto original para auditoría; la curación no destruye evidencia.

### Costos y límites

- Mostrar presupuesto máximo antes de ejecutar.
- Distinguir reservado, reportado y ahorrado por caché.
- Usar warning para cercanía al límite y danger para bloqueo.
- Nunca ocultar el costo detrás de tooltips o logs técnicos.

### Progreso de una investigación

Orden recomendado:

```text
En cola → Obteniendo datos → Analizando → Requiere revisión → Aprobado
```

- Mostrar fase actual y última actualización.
- El progreso indeterminado no debe inventar porcentajes.
- Los fallos indican qué fuente falló y si el brief sigue siendo utilizable.

## Gráficas

- Serie principal: `#7C3AED`.
- Series secundarias: `#C4B5FD`, `#8B5CF6`, `#5B21B6`.
- Verde únicamente para éxito o señal saludable.
- Evitar paletas arcoíris sin significado.
- Incluir labels, leyenda y alternativa tabular accesible.

## Accesibilidad

- Contraste WCAG AA como mínimo.
- Foco de teclado visible en todo control.
- HTML semántico antes que roles ARIA personalizados.
- No depender exclusivamente de color, icono o posición.
- Labels accesibles para inputs y checkboxes.
- Mensajes de error asociados al campo correspondiente.
- Respetar `prefers-reduced-motion`.
- El orden visual y el orden del DOM deben coincidir.

## Contenido y tono

- Español claro, directo y no técnico para la operadora.
- Explicar siglas y términos SEO en contexto.
- Presentar decisiones antes que evidencia cruda.
- Mostrar progresivamente detalles técnicos, IDs y registros.
- No usar “ready” como sinónimo de aprobación humana: presentar “Listo para revisión”.
- Los límites y supuestos deben ser visibles, no enterrados en metadata.

## Aplicación por superficie

### Visor local de brief

- Es herramienta de desarrollo y revisión, no producto final.
- Debe mostrar resumen, recomendaciones, competidores, enlaces, límites y evidencia agrupada.
- Puede persistir preferencias localmente, pero debe advertir que eso no constituye aprobación auditable.

### Futuro módulo en AriCRM

- Reutilizar layout, navegación, formularios y feedback existentes en AriCRM.
- Aplicar estos tokens solo donde no exista ya un componente canónico equivalente.
- La página debe pertenecer al tenant activo y seguir las reglas de autorización de AriCRM.
- Estados en tiempo real deben tener fallback recuperable; no depender solo de una conexión websocket.

### Artefactos compartidos o imprimibles

- Fondo blanco, alto contraste y sin navegación innecesaria.
- Conservar identidad del tenant, fecha, versión y estado de aprobación.
- Ocultar controles interactivos al imprimir.

## Lo que no debe hacerse

- Magenta, coral, teal o ámbar como color principal de marca.
- Verde decorativo o como CTA principal.
- Datos sensibles en HTML generado, URLs, logs o capturas.
- Tablas de miles de filas como vista inicial.
- Aprobar automáticamente un brief porque su estado técnico sea `ready`.
- Mezclar estado de ejecución, calidad del brief y aprobación humana en una sola etiqueta.
- Crear componentes paralelos cuando la superficie vive dentro de AriCRM y ya existe uno equivalente.

## Integración técnica

### CSS nativo

Definir los tokens en `:root` y consumirlos mediante `var(--ari-...)`.

### Tailwind

Mapear `ari` a la rampa purple y los colores semánticos a nombres explícitos. La configuración exacta depende de la versión de Tailwind del anfitrión; no copiar una configuración legacy sin verificarla.

### React/Inertia en AriCRM

- Usar componentes existentes antes de crear variantes.
- Mantener estados y contratos fuera de componentes de presentación.
- No hardcodear colores hexadecimales cuando exista token.

## Checklist de una nueva superficie

- [ ] Declara persona y tarea principal.
- [ ] Tiene un CTA dominante y foco visible.
- [ ] Usa tokens, no colores arbitrarios.
- [ ] Expone costos, límites y estado cuando apliquen.
- [ ] Funciona con teclado y contraste AA.
- [ ] Es responsive y tiene alternativa para tablas densas.
- [ ] Diferencia resultado automático de aprobación humana.
- [ ] Reutiliza componentes del anfitrión cuando existe integración.
- [ ] Tiene estados vacío, carga, parcial, error y éxito.
- [ ] Evita exponer secretos o evidencia sensible.
