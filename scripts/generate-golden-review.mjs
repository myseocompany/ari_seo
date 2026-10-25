import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.resolve(root, process.argv[2] ?? "fixtures/scout/en-us-golden.brief.json");
const outputPath = path.resolve(root, process.argv[3] ?? "docs/golden-brief-review.html");
const parsed = JSON.parse(await readFile(sourcePath, "utf8"));
const brief = parsed.brief ?? parsed;
const decisionsPath = process.argv[4] ? path.resolve(root, process.argv[4]) : null;
const decisions = decisionsPath ? JSON.parse(await readFile(decisionsPath, "utf8")) : { excluded_competitors: [] };
const embedded = JSON.stringify(brief).replaceAll("<", "\\u003c");
const embeddedDecisions = JSON.stringify(decisions).replaceAll("<", "\\u003c");

const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Revisión humana · ARI Scout Golden Brief</title>
  <style>
    :root { --ink:#17211b; --muted:#647269; --paper:#f3f0e7; --card:#fffdf7; --line:#d9d4c6; --green:#1d6946; --lime:#d9f17f; --amber:#f3b84b; --red:#b54739; }
    * { box-sizing:border-box; }
    body { margin:0; color:var(--ink); background:var(--paper); font:16px/1.55 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    header { background:var(--ink); color:#fff; padding:52px max(24px,calc((100vw - 1180px)/2)); border-bottom:8px solid var(--lime); }
    header p { max-width:760px; color:#d9e1db; margin:10px 0 0; }
    h1 { font:700 clamp(34px,6vw,68px)/.98 Georgia,serif; margin:0; letter-spacing:-.035em; }
    h2 { font:700 28px/1.1 Georgia,serif; margin:0 0 18px; }
    h3 { margin:0 0 8px; font-size:17px; }
    main { max-width:1180px; margin:auto; padding:30px 24px 70px; }
    .notice { display:flex; gap:12px; padding:16px 18px; background:#fff0cc; border:1px solid #deb55d; border-radius:12px; margin-bottom:24px; }
    .overview { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px; }
    .metric,.card { background:var(--card); border:1px solid var(--line); border-radius:16px; box-shadow:0 7px 24px #17211b0b; }
    .metric { padding:18px; }
    .metric strong { display:block; font-size:25px; margin-top:3px; }
    .metric span { color:var(--muted); font-size:13px; text-transform:uppercase; letter-spacing:.08em; }
    .grid { display:grid; grid-template-columns:1.25fr .75fr; gap:22px; align-items:start; }
    .stack { display:grid; gap:22px; }
    .card { padding:24px; }
    .pill { display:inline-flex; padding:5px 10px; border-radius:999px; background:#e4eadf; color:var(--green); font-size:13px; font-weight:700; margin:3px 4px 3px 0; }
    .primary { display:inline-block; font-size:24px; font-weight:800; padding:12px 16px; background:var(--lime); border-radius:10px; }
    ol.outline { padding:0; list-style:none; counter-reset:item; }
    ol.outline li { counter-increment:item; padding:11px 0; border-bottom:1px solid var(--line); }
    ol.outline li::before { content:counter(item,decimal-leading-zero); color:var(--green); font-weight:800; margin-right:14px; }
    a { color:var(--green); overflow-wrap:anywhere; }
    table { width:100%; border-collapse:collapse; font-size:14px; }
    th,td { padding:10px; border-bottom:1px solid var(--line); text-align:left; vertical-align:top; }
    th { color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.06em; }
    details { border-top:1px solid var(--line); padding:12px 0; }
    details:first-of-type { border-top:0; }
    summary { cursor:pointer; font-weight:750; }
    .check { display:grid; grid-template-columns:22px 1fr; gap:10px; padding:12px 0; border-bottom:1px solid var(--line); }
    tr.excluded a { color:var(--muted); text-decoration:line-through; }
    input[type=checkbox] { width:19px; height:19px; accent-color:var(--green); margin-top:3px; }
    textarea { width:100%; min-height:110px; resize:vertical; padding:12px; border:1px solid var(--line); border-radius:10px; font:inherit; background:#fff; }
    .progress { height:10px; background:#e4e1d7; border-radius:99px; overflow:hidden; margin:16px 0 8px; }
    .progress i { display:block; height:100%; width:0; background:var(--green); transition:.2s; }
    .actions { display:flex; gap:10px; flex-wrap:wrap; margin-top:18px; }
    button { border:0; border-radius:9px; padding:11px 15px; font-weight:750; cursor:pointer; background:var(--ink); color:#fff; }
    button.secondary { background:#e7e4da; color:var(--ink); }
    .approved { color:var(--green); font-weight:800; }
    .pending { color:var(--red); font-weight:800; }
    footer { color:var(--muted); font-size:13px; margin-top:22px; }
    @media (max-width:820px) { .overview { grid-template-columns:1fr 1fr; } .grid { grid-template-columns:1fr; } }
    @media print { header { padding:24px; } body { background:#fff; } main { padding:20px 0; } .card,.metric { box-shadow:none; break-inside:avoid; } .actions { display:none; } }
  </style>
</head>
<body>
  <header><h1>Golden Brief Review</h1><p>Una vista humana del artefacto aprobado que fija el comportamiento esperado de ARI Scout.</p></header>
  <main>
    <div class="notice"><strong>Contexto:</strong><span id="context-note"></span></div>
    <section class="overview" id="overview"></section>
    <div class="grid">
      <div class="stack">
        <section class="card"><h2>Dirección SEO</h2><div id="direction"></div></section>
        <section class="card"><h2>Arquitectura de página</h2><div id="page"></div></section>
        <section class="card"><h2>Supuestos y límites</h2><div id="assumptions"></div></section>
        <section class="card"><h2>Competidores observados</h2><p>Selecciona únicamente empresas comparables. La decisión se guarda en este navegador.</p><p id="competitor-summary"></p><div id="competitors"></div></section>
        <section class="card"><h2>Evidencia</h2><p id="evidence-summary"></p><div id="evidence"></div></section>
      </div>
      <aside class="stack">
        <section class="card"><h2>Checklist de aprobación</h2><p>Marca cada punto después de revisarlo. El avance se guarda en este navegador.</p><div class="progress"><i id="bar"></i></div><p id="progress-label" class="pending"></p><div id="checklist"></div><label for="notes"><h3>Notas del revisor</h3></label><textarea id="notes" placeholder="Observaciones, cambios pedidos o motivo de aprobación…"></textarea><div class="actions"><button id="print">Imprimir / guardar PDF</button><button class="secondary" id="reset">Limpiar revisión</button></div></section>
        <section class="card"><h2>Trazabilidad</h2><table id="metadata"></table><footer>Vista generada desde un artefacto JSON de ARI Scout.</footer></section>
      </aside>
    </div>
  </main>
  <script id="brief-data" type="application/json">${embedded}</script>
  <script id="review-decisions" type="application/json">${embeddedDecisions}</script>
  <script>
    const brief = JSON.parse(document.getElementById('brief-data').textContent);
    const decisions = JSON.parse(document.getElementById('review-decisions').textContent);
    const esc = value => String(value ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const metric = (label,value) => '<div class="metric"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></div>';
    const isSynthetic=brief.evidence.every(e=>e.source.startsWith('fixture:'));
    document.getElementById('context-note').textContent=isSynthetic?'La evidencia de este corte es sintética. Los primeros cinco criterios validan estructura y dirección editorial; los últimos tres requieren el candidato real.':'Este candidato contiene evidencia real. Revisa especialmente competidores, enlaces internos y límites antes de aprobarlo.';
    overview.innerHTML = metric('Estado',brief.status)+metric('Mercado',brief.locale)+metric('Intención',brief.search_intent)+metric('Evidencias',brief.evidence.length);
    direction.innerHTML = '<h3>Keyword primaria</h3><p class="primary">'+esc(brief.keywords.primary)+'</p><h3>Keywords secundarias</h3><p>'+brief.keywords.secondary.map(x=>'<span class="pill">'+esc(x)+'</span>').join('')+'</p><h3>Clusters</h3>'+brief.keywords.clusters.map(c=>'<details><summary>'+esc(c.name)+' · '+c.terms.length+' términos</summary><ul>'+c.terms.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></details>').join('');
    const p=brief.recommended_page;
    page.innerHTML='<table><tr><th>Tipo</th><td>'+esc(p.page_type)+'</td></tr><tr><th>Título</th><td>'+esc(p.working_title)+'</td></tr><tr><th>Slug</th><td><code>'+esc(p.slug)+'</code></td></tr><tr><th>Conversión</th><td>'+esc(p.conversion_goal)+'</td></tr></table><h3 style="margin-top:20px">Outline recomendado</h3><ol class="outline">'+p.outline.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol><h3>Enlaces internos</h3>'+p.internal_link_targets.map(x=>'<p><a href="'+esc(x)+'">'+esc(x)+'</a></p>').join('');
    const excludedDefaults=new Set(decisions.excluded_competitors||[]);
    competitors.innerHTML='<table><thead><tr><th>Incluir</th><th>URL</th></tr></thead><tbody>'+brief.competitor_urls.map((x,i)=>'<tr data-competitor-row="'+i+'"><td><input type="checkbox" data-competitor="'+i+'" '+(!excludedDefaults.has(x)?'checked':'')+'></td><td><a href="'+esc(x)+'">'+esc(x)+'</a></td></tr>').join('')+'</tbody></table>';
    assumptions.innerHTML=brief.assumptions.length?'<ul>'+brief.assumptions.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p class="pending">El brief no declara supuestos ni límites. No aprobar este criterio.</p>';
    const groups=brief.evidence.reduce((a,e)=>{const k=e.source.split(':')[1]||'other';(a[k]??=[]).push(e);return a;},{});
    document.getElementById('evidence-summary').textContent=brief.evidence.length+' registros en '+Object.keys(groups).length+' tipos de fuente.';
    evidence.innerHTML=Object.entries(groups).map(([k,items])=>'<details><summary>'+esc(k)+' · '+items.length+'</summary><table><thead><tr><th>Fuente</th><th>Observado</th></tr></thead><tbody>'+items.map(e=>'<tr><td>'+esc(e.source)+(e.url?'<br><a href="'+esc(e.url)+'">'+esc(e.url)+'</a>':'')+'</td><td>'+esc(e.observed_at)+'</td></tr>').join('')+'</tbody></table></details>').join('');
    metadata.innerHTML='<tr><th>Productor</th><td>'+esc(brief.metadata.producer)+'</td></tr><tr><th>Contrato</th><td>'+esc(brief.metadata.contract_version)+'</td></tr><tr><th>Creado</th><td>'+esc(brief.metadata.created_at)+'</td></tr><tr><th>Trace ID</th><td><code>'+esc(brief.metadata.trace_id)+'</code></td></tr><tr><th>Supuestos</th><td>'+brief.assumptions.map(esc).join('<br>')+'</td></tr><tr><th>Errores</th><td>'+brief.errors.length+'</td></tr>';
    const items=['La keyword primaria representa la oportunidad principal.','Las keywords secundarias cubren intención comercial e informativa útil.','Los clusters tienen sentido y no mezclan necesidades incompatibles.','El tipo de página, título y objetivo de conversión son adecuados.','El outline responde lo necesario para elegir y cotizar una máquina.','Los competidores son un conjunto razonable para comparar.','Los enlaces internos propuestos son pertinentes.','Los supuestos y límites sintéticos están claros.'];
    const key='ari-golden-review-v2-'+brief.topic+'-'+(isSynthetic?'synthetic':'live'); const saved=JSON.parse(localStorage.getItem(key)||'{}');
    checklist.innerHTML=items.map((x,i)=>'<label class="check"><input type="checkbox" data-review="'+i+'" '+(saved.checks?.[i]?'checked':'')+'><span>'+esc(x)+'</span></label>').join('');
    notes.value=saved.notes||'';
    const competitorInputs=[...document.querySelectorAll('[data-competitor]')];
    if(saved.competitors) competitorInputs.forEach((x,i)=>x.checked=saved.competitors[i]??x.checked);
    function update(){const checks=[...document.querySelectorAll('[data-review]')].map(x=>x.checked);const n=checks.filter(Boolean).length;bar.style.width=(n/items.length*100)+'%';document.getElementById('progress-label').textContent=n===items.length?'Aprobación completa':n+' de '+items.length+' puntos revisados';document.getElementById('progress-label').className=n===items.length?'approved':'pending';const selected=competitorInputs.filter(x=>x.checked).length;document.getElementById('competitor-summary').innerHTML='<strong>'+selected+' incluidos</strong> · '+(competitorInputs.length-selected)+' excluidos';competitorInputs.forEach((x,i)=>document.querySelector('[data-competitor-row="'+i+'"]').classList.toggle('excluded',!x.checked));localStorage.setItem(key,JSON.stringify({checks,competitors:competitorInputs.map(x=>x.checked),notes:notes.value}));}
    document.querySelectorAll('[data-review],[data-competitor]').forEach(x=>x.addEventListener('change',update)); notes.addEventListener('input',update); print.addEventListener('click',()=>window.print()); reset.addEventListener('click',()=>{localStorage.removeItem(key);location.reload()}); update();
  </script>
</body>
</html>`;

await writeFile(outputPath, html);
console.log(`Vista de revisión escrita en ${path.relative(root, outputPath)}`);
