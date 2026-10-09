/* Retina — painel */
(() => {
  'use strict';

  // ================= utilidades =================
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const nf = new Intl.NumberFormat('pt-BR');
  const fmt = {
    n: (v) => nf.format(Math.round(v || 0)),
    d1: (v) => (v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 }),
    pct: (v, d = 1) => ((v || 0) * 100).toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: 0 }) + '%',
    money: (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    dur(sec) {
      sec = Math.round(sec || 0);
      if (sec < 60) return sec + 's';
      const m = Math.floor(sec / 60), s = sec % 60;
      if (m < 60) return `${m}m ${String(s).padStart(2, '0')}s`;
      return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
    },
    clock(ms) { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; },
    date: (ts) => new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    ago(ts) {
      if (!ts) return 'nunca';
      const s = Math.round((Date.now() - ts) / 1000);
      if (s < 60) return `há ${s}s`;
      if (s < 3600) return `há ${Math.round(s / 60)} min`;
      if (s < 86400) return `há ${Math.round(s / 3600)} h`;
      return `há ${Math.round(s / 86400)} dias`;
    },
    bytes(b) { const u = ['B', 'KB', 'MB', 'GB']; let i = 0; while (b >= 1024 && i < 3) { b /= 1024; i++; } return b.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' ' + u[i]; },
  };
  const DEVICE = { mobile: 'Celular', desktop: 'Desktop', tablet: 'Tablet' };
  const EVT = {
    view: ['Abriu a página', '◎'], click: ['Clique', '⌖'], exit: ['Fechou a página', '✕'], hide: ['Saiu da aba / app', '⇥'], show: ['Voltou para a aba', '⇤'],
    popup: ['Popup apareceu', '▣'], reread: ['Voltou para reler', '↺'], copy: ['Copiou texto', '⧉'], exit_intent: ['Intenção de saída (mouse foi ao topo)', '↑'],
    field: ['Clicou em campo de formulário', '✎'], video_play: ['Deu play no vídeo', '▶'], video_end: ['Terminou o vídeo', '■'], js_error: ['Erro de JavaScript', '!'],
    custom: ['Evento personalizado', '★'], conversion: ['Conversão', '$'],
  };

  // ================= estado / filtros =================
  const st = {
    site: store.get('retina_site') || 'demo',
    period: store.get('retina_period') || '14',
    device: '', source: '', campaign: '', content: '',
    sites: [],
  };
  function range() {
    const now = new Date();
    const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
    if (st.period === 'today') return { from: startOfDay(now), to: Date.now() + 60000 };
    if (st.period === 'yesterday') { const t = startOfDay(now); return { from: t - 86400000, to: t }; }
    if (st.period === 'all') return { from: 1, to: Date.now() + 60000 };
    return { from: Date.now() - Number(st.period) * 86400000, to: Date.now() + 60000 };
  }
  function qs(extra = {}) {
    const r = range();
    const p = new URLSearchParams({ site: st.site, from: r.from, to: r.to });
    for (const k of ['device', 'source', 'campaign', 'content']) if (st[k]) p.set(k, st[k]);
    for (const [k, v] of Object.entries(extra)) { if (v === null || v === undefined || v === '') p.delete(k); else p.set(k, v); }
    return p.toString();
  }
  async function api(path, extra, opts = {}) {
    const url = '/api/' + path + (path.includes('?') ? '&' : '?') + qs(extra);
    const r = await fetch(url, { credentials: 'same-origin', ...opts });
    if (r.status === 401) { showLogin(); throw new Error('unauthorized'); }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }
  async function apiRaw(path, opts = {}) {
    const r = await fetch('/api/' + path, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...opts });
    if (r.status === 401) { showLogin(); throw new Error('unauthorized'); }
    return r.json();
  }
  const currentSite = () => st.sites.find((s) => s.id === st.site) || st.sites[0] || { id: st.site, name: st.site };

  // ================= tooltip =================
  const tip = $('#tip');
  function showTip(html, x, y) {
    tip.innerHTML = html; tip.hidden = false;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let left = x + 14, top = y - h - 10;
    if (left + w > innerWidth - 8) left = x - w - 14;
    if (top < 8) top = y + 16;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }
  const hideTip = () => { tip.hidden = true; };

  // ================= gráficos =================
  const SVGNS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs = {}, parent) {
    const e = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  }
  function niceMax(v) {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
    return 10 * p;
  }

  // Linha/área com crosshair. pts: [{x, y, label?}]; opts: {yFmt, xFmt, yMax, height, tip(pt), markers}
  function lineChart(el, pts, opts = {}) {
    el.classList.add('chart');
    el.innerHTML = '';
    if (!pts.length) { el.innerHTML = '<div class="empty">Sem dados no período</div>'; return; }
    const W = Math.max(280, el.clientWidth || 600), H = opts.height || 220;
    const m = { l: 44, r: 12, t: 10, b: opts.xLabels ? 34 : 24 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const xs = pts.map((p) => p.x);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const yMax = opts.yMax ?? niceMax(Math.max(...pts.map((p) => p.y)));
    const X = (v) => m.l + (x1 === x0 ? iw / 2 : ((v - x0) / (x1 - x0)) * iw);
    const Y = (v) => m.t + ih - (v / yMax) * ih;
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, height: H, role: 'img', 'aria-label': opts.label || 'gráfico' }, el);
    for (let i = 0; i <= 4; i++) {
      const v = (yMax / 4) * i, y = Y(v);
      svgEl('line', { x1: m.l, x2: W - m.r, y1: y, y2: y, class: i ? 'gridline' : 'baseline' }, svg);
      svgEl('text', { x: m.l - 8, y: y + 4, 'text-anchor': 'end', class: 'tick' }, svg).textContent = (opts.yFmt || fmt.d1)(v);
    }
    const nT = Math.min(pts.length, Math.max(2, Math.floor(iw / 70)));
    for (let i = 0; i < nT; i++) {
      const p = pts[Math.round((i / (nT - 1 || 1)) * (pts.length - 1))];
      svgEl('text', { x: X(p.x), y: H - (opts.xLabels ? 16 : 6), 'text-anchor': i === 0 ? 'start' : i === nT - 1 ? 'end' : 'middle', class: 'tick' }, svg).textContent = (opts.xFmt || String)(p.x, p);
    }
    const d = pts.map((p, i) => (i ? 'L' : 'M') + X(p.x).toFixed(1) + ',' + Y(p.y).toFixed(1)).join('');
    if (opts.area !== false) svgEl('path', { d: d + `L${X(pts[pts.length - 1].x)},${Y(0)}L${X(pts[0].x)},${Y(0)}Z`, class: 'area' }, svg);
    svgEl('path', { d, class: 'line' }, svg);
    if (opts.markers) pts.forEach((p) => svgEl('circle', { cx: X(p.x), cy: Y(p.y), r: 4, class: 'dot' }, svg));
    const xh = svgEl('line', { y1: m.t, y2: m.t + ih, class: 'xhair', visibility: 'hidden' }, svg);
    const dot = svgEl('circle', { r: 5, class: 'dot', visibility: 'hidden' }, svg);
    const hit = svgEl('rect', { x: m.l, y: m.t, width: iw, height: ih, class: 'hit' }, svg);
    const move = (ev) => {
      const r = svg.getBoundingClientRect();
      const mx = ((ev.clientX - r.left) / r.width) * W;
      let best = pts[0], bd = Infinity;
      for (const p of pts) { const dd = Math.abs(X(p.x) - mx); if (dd < bd) { bd = dd; best = p; } }
      xh.setAttribute('x1', X(best.x)); xh.setAttribute('x2', X(best.x)); xh.setAttribute('visibility', 'visible');
      dot.setAttribute('cx', X(best.x)); dot.setAttribute('cy', Y(best.y)); dot.setAttribute('visibility', 'visible');
      showTip(opts.tip ? opts.tip(best) : `<b>${esc((opts.xFmt || String)(best.x, best))}</b><br>${esc((opts.yFmt || fmt.n)(best.y))}`, ev.clientX, ev.clientY);
    };
    hit.addEventListener('pointermove', move);
    hit.addEventListener('pointerleave', () => { xh.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); hideTip(); });
    if (opts.onClick) { hit.style.cursor = 'pointer'; hit.addEventListener('click', (ev) => { const r = svg.getBoundingClientRect(); const mx = ((ev.clientX - r.left) / r.width) * W; let best = pts[0], bd = Infinity; for (const p of pts) { const dd = Math.abs(X(p.x) - mx); if (dd < bd) { bd = dd; best = p; } } opts.onClick(best); }); }
  }

  // Colunas (série temporal). items: [{label, v, tip}]
  function colChart(el, items, opts = {}) {
    el.classList.add('chart');
    el.innerHTML = '';
    if (!items.length) { el.innerHTML = '<div class="empty">Sem dados no período</div>'; return; }
    const W = Math.max(280, el.clientWidth || 600), H = opts.height || 200;
    const m = { l: 40, r: 8, t: 10, b: 24 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const yMax = niceMax(Math.max(...items.map((i) => i.v), 1));
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, height: H, role: 'img', 'aria-label': opts.label || 'gráfico de colunas' }, el);
    for (let i = 0; i <= 4; i++) {
      const v = (yMax / 4) * i, y = m.t + ih - (v / yMax) * ih;
      svgEl('line', { x1: m.l, x2: W - m.r, y1: y, y2: y, class: i ? 'gridline' : 'baseline' }, svg);
      svgEl('text', { x: m.l - 8, y: y + 4, 'text-anchor': 'end', class: 'tick' }, svg).textContent = fmt.d1(v);
    }
    const bw = iw / items.length;
    const gap = Math.min(4, bw * 0.25);
    const every = Math.ceil(items.length / Math.max(2, Math.floor(iw / 64)));
    items.forEach((it, i) => {
      const h = (it.v / yMax) * ih, x = m.l + i * bw + gap / 2, w = Math.max(1, bw - gap);
      const r = Math.min(4, w / 2, h);
      const y = m.t + ih - h;
      if (h > 0) svgEl('path', { d: `M${x},${m.t + ih}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${m.t + ih}Z`, class: 'col' }, svg);
      if (i % every === 0) svgEl('text', { x: x + w / 2, y: H - 6, 'text-anchor': 'middle', class: 'tick' }, svg).textContent = it.label;
      const hit = svgEl('rect', { x: m.l + i * bw, y: m.t, width: bw, height: ih, class: 'hit' }, svg);
      hit.addEventListener('pointermove', (ev) => showTip(it.tip || `<b>${esc(it.label)}</b><br>${fmt.n(it.v)}`, ev.clientX, ev.clientY));
      hit.addEventListener('pointerleave', hideTip);
    });
  }

  // Barras horizontais em HTML. rows: [{label, v, display, tip, title}]
  function bars(rows, opts = {}) {
    if (!rows.length) return '<div class="empty">Sem dados</div>';
    const max = opts.max ?? Math.max(...rows.map((r) => r.v), 1e-9);
    return `<div class="bars">${rows.map((r) => `<div class="bar-row" ${r.tip ? `data-tip="${esc(r.tip)}"` : ''}>
      <span class="lbl" title="${esc(r.title || r.label)}">${esc(r.label)}</span>
      <span class="track"><span class="fill" style="width:${Math.max(0, Math.min(100, (r.v / max) * 100))}%"></span></span>
      <span class="val">${esc(r.display ?? fmt.n(r.v))}</span></div>`).join('')}</div>`;
  }
  // tooltips por atributo data-tip
  document.addEventListener('pointermove', (e) => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (t) showTip(t.getAttribute('data-tip'), e.clientX, e.clientY);
    else if (!e.target.closest || !e.target.closest('.chart .hit')) hideTip();
  });

  function delta(cur, prev, invert = false) {
    if (!prev) return '<span class="kpi-delta">—</span>';
    const d = (cur - prev) / Math.abs(prev);
    if (!isFinite(d) || Math.abs(d) < 0.005) return '<span class="kpi-delta">= período anterior</span>';
    const good = invert ? d < 0 : d > 0;
    return `<span class="kpi-delta"><span class="${good ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'} ${fmt.pct(Math.abs(d), 0)}</span> vs período anterior</span>`;
  }
  const kpi = (label, value, deltaHtml = '', tipText = '') => `<div class="kpi" ${tipText ? `data-tip="${esc(tipText)}"` : ''}><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div>${deltaHtml}</div>`;
  const pace = (p) => `<span class="pace-${p.split(' ')[0]}">${esc(p)}</span>`;
  const sessLink = (id, text) => `<a href="#/session/${id}">${text || 'ver'}</a>`;
  const emptyState = (title, text) => `<div class="card empty"><b>${title}</b>${text}</div>`;

  // ================= páginas =================
  const page = $('#page');
  let cleanup = [];
  const onCleanup = (fn) => cleanup.push(fn);
  function every(ms, fn) { const id = setInterval(fn, ms); onCleanup(() => clearInterval(id)); }

  const pages = {};

  // ---------- Visão geral ----------
  pages.overview = async () => {
    const d = await api('overview');
    const k = d.kpis, p = d.prev;
    if (!k.sessions) {
      page.innerHTML = head('Visão geral', 'Resumo de como os leads se comportam na página.') + noData();
      return;
    }
    page.innerHTML = `${head('Visão geral', 'Resumo de como os leads se comportam na página. Passe o mouse nos números para ver a explicação.')}
      <div class="kpis">
        ${kpi('Visitas', fmt.n(k.sessions), delta(k.sessions, p.sessions), 'Cada vez que alguém abre a página conta como uma visita (sessão).')}
        ${kpi('Tempo médio de atenção', fmt.dur(k.avgEngaged), delta(k.avgEngaged, p.avgEngaged), 'Só conta o tempo em que a pessoa estava com a aba aberta e interagindo (rolando, mexendo, tocando) nos últimos 30s. Mediana: ' + fmt.dur(k.medianEngaged))}
        ${kpi('Rolagem média', fmt.pct(k.avgScroll, 0), delta(k.avgScroll, p.avgScroll), 'Até quanto da página, em média, as pessoas chegam.')}
        ${kpi('Clicaram em algum botão', fmt.pct(k.ctaRate), delta(k.ctaRate, p.ctaRate))}
        ${kpi('Foram ao checkout', fmt.pct(k.checkoutRate), delta(k.checkoutRate, p.checkoutRate), 'Clicaram em um link para a página de pagamento.')}
        ${kpi('Conversão', fmt.pct(k.convRate, 2), delta(k.convRate, p.convRate), 'Visitas que viraram venda aprovada (via webhook da plataforma).')}
        ${kpi('Faturamento', fmt.money(k.revenue), delta(k.revenue, p.revenue), `${k.sales} vendas no período. ${fmt.money(k.revenueAttributed)} ligadas a uma sessão rastreada.`)}
        ${kpi('Receita por visita', fmt.money(k.rpv), delta(k.rpv, p.rpv), 'Faturamento ÷ visitas. A métrica-mãe para comparar versões da página e criativos.')}
        ${kpi('Saída imediata', fmt.pct(k.quickExit), delta(k.quickExit, p.quickExit, true), 'Ficaram menos de 5s e não clicaram em nada.')}
        ${kpi('Carregamento médio', (k.avgLoad / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 's', delta(k.avgLoad, p.avgLoad, true), 'Tempo até a página terminar de carregar no aparelho do lead.')}
      </div>
      ${d.insights.length ? `<div class="card"><div class="card-head"><h2>O que a página está te dizendo</h2><span class="card-sub">gerado automaticamente a partir dos dados</span></div>
        <div class="insights">${d.insights.map((i) => `<div class="insight ${i.kind}"><b class="ic">${{ drop: '↓', exit: '✕', attention: '◉', skim: '»', reread: '↺', dead: '⌖', device: '▯', speed: '⏱' }[i.kind] || '•'}</b><span>${esc(i.text)}</span></div>`).join('')}</div></div>` : ''}
      <div class="grid g-2-1 mt">
        <div class="card"><div class="card-head"><h2>Visitas ${d.hourly ? 'por hora' : 'por dia'}</h2><span class="card-sub">passe o mouse para ver checkout e vendas</span></div><div id="c-series"></div></div>
        <div class="card"><div class="card-head"><h2>Funil da página</h2></div><div class="funnel">${d.funnel.map((f) => `<div class="funnel-row"><span>${f.label}</span><span class="track"><span class="fill" style="width:${(f.n / (d.funnel[0].n || 1)) * 100}%"></span></span><span class="val">${fmt.n(f.n)}<small>${fmt.pct(f.n / (d.funnel[0].n || 1))}</small></span></div>`).join('')}</div></div>
      </div>
      <div class="grid g3 mt">
        <div class="card"><h2>Origens</h2>${bars(d.sources.map((s) => ({ label: s.key, v: s.n, display: fmt.pct(s.n / k.sessions, 0) })))}</div>
        <div class="card"><h2>Dispositivos</h2>${bars(d.devices.map((s) => ({ label: DEVICE[s.key] || s.key, v: s.n, display: fmt.pct(s.n / k.sessions, 0) })))}</div>
        <div class="card"><h2>Navegadores</h2>${bars(d.browsers.map((s) => ({ label: s.key, v: s.n, display: fmt.pct(s.n / k.sessions, 0) })))}</div>
      </div>`;
    colChart($('#c-series'), d.series.map((s) => ({
      label: d.hourly ? s.key.slice(11) : s.key.slice(8, 10) + '/' + s.key.slice(5, 7), v: s.sessions,
      tip: `<b>${esc(d.hourly ? s.key.slice(8, 10) + '/' + s.key.slice(5, 7) + ' ' + s.key.slice(11) : s.key.slice(8, 10) + '/' + s.key.slice(5, 7))}</b><br>${fmt.n(s.sessions)} visitas<br>${fmt.n(s.checkout)} foram ao checkout<br>${fmt.n(s.sales)} vendas`,
    })), { label: 'Visitas por período' });
    every(30000, () => { if (location.hash.startsWith('#/overview')) refreshQuiet(); });
  };

  // ---------- Retenção ----------
  pages.retention = async () => {
    const d = await api('retention');
    if (!d.total) { page.innerHTML = head('Retenção da página', '') + noData(); return; }
    const S = d.sections;
    page.innerHTML = `${head('Retenção da página', 'O "gráfico da VTurb" da sua página: quantos leads chegam em cada bloco, onde param de ler e onde fecham a página.')}
      <div class="card"><div class="card-head"><h2>Retenção por seção</h2><span class="card-sub">% das ${fmt.n(d.total)} visitas que chegaram em cada bloco</span></div>
        <div id="c-ret"></div>
        <div class="legend" style="margin-top:6px">${S.map((s, i) => `<span style="--c:transparent"><b>${i + 1}</b> ${esc(s.section)}</span>`).join('')}</div>
      </div>
      <div class="card mt"><div class="card-head"><h2>Seção por seção</h2><span class="card-sub">clique em uma linha para ver as sessões que saíram ali</span></div>
        <div class="table-wrap"><table>
          <thead><tr><th>#</th><th>Seção</th><th class="n">Chegaram</th><th class="n">Perda vs anterior</th><th class="n">Fecharam aqui</th><th class="n">Tempo médio</th><th>Ritmo</th><th class="n">Releram</th><th class="n">Cliques</th><th class="n">% da atenção</th></tr></thead>
          <tbody>${S.map((s, i) => `<tr class="click" data-sec="${esc(s.section)}">
            <td class="muted">${i + 1}</td><td><b>${esc(s.section)}</b></td>
            <td class="n cell-bar" style="--w:${s.reachRate * 100}%"><span>${fmt.pct(s.reachRate)}</span></td>
            <td class="n">${i ? (s.dropFromPrev > 0.1 ? `<span class="pill pill-crit">−${fmt.pct(s.dropFromPrev)}</span>` : '−' + fmt.pct(s.dropFromPrev)) : '<span class="muted">—</span>'}</td>
            <td class="n" data-tip="${esc(`${fmt.n(s.exits)} pessoas fecharam a página com essa seção na tela (${fmt.pct(s.exitShare)} de todas as saídas)`)}">${fmt.pct(s.exitRate)}</td>
            <td class="n">${fmt.dur(s.avgDwell)}</td>
            <td data-tip="${esc(`Parados lendo ${fmt.pct(s.stillRatio, 0)} do tempo · rolando a ${s.speed.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} telas/s`)}">${pace(s.pace)}</td>
            <td class="n">${fmt.pct(s.rereadRate)}</td>
            <td class="n">${fmt.n(s.clicks)}</td>
            <td class="n cell-bar" style="--w:${s.totalAttentionShare * 100}%"><span>${fmt.pct(s.totalAttentionShare)}</span></td></tr>`).join('')}</tbody>
        </table></div>
        ${d.popups.length ? `<h3 class="mt">Popups</h3><div class="table-wrap"><table><thead><tr><th>Popup</th><th class="n">Viram</th><th class="n">Tempo médio</th><th class="n">Cliques</th></tr></thead><tbody>${d.popups.map((s) => `<tr><td>${esc(s.section)}</td><td class="n">${fmt.n(s.reached)} (${fmt.pct(s.reachRate)})</td><td class="n">${fmt.dur(s.avgDwell)}</td><td class="n">${fmt.n(s.clicks)}</td></tr>`).join('')}</tbody></table></div>` : ''}
        <p class="muted mt" style="font-size:12.5px">Ritmo: <span class="pace-lendo">lendo</span> = parado a maior parte do tempo · <span class="pace-escaneando">escaneando</span> = rolando devagar · <span class="pace-passando">passando batido</span> = rolando rápido sem parar.</p>
      </div>
      <div class="grid g2 mt">
        <div class="card"><div class="card-head"><h2>Retenção por tempo</h2><span class="card-sub">% das visitas que continuam engajadas após X segundos</span></div><div id="c-time"></div></div>
        <div class="card"><div class="card-head"><h2>Profundidade de rolagem</h2><span class="card-sub">% das visitas que chegaram a X% da página</span></div><div id="c-scroll"></div></div>
      </div>`;
    lineChart($('#c-ret'), S.map((s, i) => ({ x: i + 1, y: s.reachRate, s })), {
      yMax: 1, yFmt: (v) => fmt.pct(v, 0), xFmt: (x) => '#' + x, markers: true, height: 260, label: 'Retenção por seção',
      tip: (p) => `<b>${p.x}. ${esc(p.s.section)}</b><br>${fmt.pct(p.s.reachRate)} chegaram aqui<br>${fmt.pct(p.s.exitRate)} fecharam a página aqui<br>tempo médio: ${fmt.dur(p.s.avgDwell)}`,
    });
    lineChart($('#c-time'), d.timeCurve, { yMax: 1, yFmt: (v) => fmt.pct(v, 0), xFmt: (x) => fmt.dur(x), label: 'Retenção por tempo', tip: (p) => `<b>${fmt.dur(p.x)}</b><br>${fmt.pct(p.y)} ainda na página` });
    lineChart($('#c-scroll'), d.scrollCurve, { yMax: 1, yFmt: (v) => fmt.pct(v, 0), xFmt: (x) => x + '%', label: 'Profundidade de rolagem', tip: (p) => `<b>${p.x}% da página</b><br>${fmt.pct(p.y)} chegaram até aqui` });
    $$('tr[data-sec]').forEach((tr) => tr.addEventListener('click', () => { location.hash = '#/sessions?section=' + encodeURIComponent(tr.dataset.sec); }));
  };

  // ---------- Heatmaps ----------
  const hm = { device: store.get('retina_hm_device') || 'mobile', mode: 'clicks', only: '' };
  const FRAMES = { mobile: { w: 390, h: 844 }, desktop: { w: 1366, h: 768 } };
  pages.heatmap = async () => {
    const site = currentSite();
    const d = await api('heatmap', { device: hm.device });
    const MODES = {
      clicks: ['Cliques', 'Onde as pessoas tocam e clicam. Inclui cliques em coisas que não são botões (cliques mortos).'],
      attention: ['Atenção', 'Onde a tela fica parada. Quanto mais forte a cor, mais tempo o centro da tela ficou naquele trecho.'],
      scroll: ['Rolagem', 'Quantos chegam em cada parte. Quanto mais escuro, menos gente viu aquele trecho.'],
      exits: ['Saídas', 'Em qual seção as pessoas estavam quando fecharam a página.'],
    };
    page.innerHTML = `${head('Heatmaps', 'Mapas sobre a sua página real. Role a página dentro do quadro: o mapa acompanha.')}
      <div class="card" style="margin-bottom:16px;display:flex;gap:12px;flex-wrap:wrap;align-items:center">
        <div class="seg" id="hm-dev">${Object.entries({ mobile: 'Celular', desktop: 'Desktop' }).map(([k, v]) => `<button type="button" data-v="${k}" class="${hm.device === k ? 'on' : ''}">${v}</button>`).join('')}</div>
        <div class="seg" id="hm-mode">${Object.entries(MODES).map(([k, v]) => `<button type="button" data-v="${k}" class="${hm.mode === k ? 'on' : ''}">${v[0]}</button>`).join('')}</div>
        <div class="seg" id="hm-only" ${hm.mode === 'clicks' ? '' : 'hidden'}>${Object.entries({ '': 'Todos', dead: 'Cliques mortos', rage: 'Rage clicks' }).map(([k, v]) => `<button type="button" data-v="${k}" class="${hm.only === k ? 'on' : ''}">${v}</button>`).join('')}</div>
        <span class="muted" style="margin-left:auto">${fmt.n(d.total)} visitas · ${fmt.n(d.clicks.length)} cliques</span>
      </div>
      <div class="hm-wrap">
        <div class="hm-stage" id="hm-stage"><div class="loading">Carregando a página…</div></div>
        <div class="hm-side">
          <div class="card"><h2>${MODES[hm.mode][0]}</h2><p class="ink2" style="font-size:13px">${MODES[hm.mode][1]}</p>
            ${hm.mode === 'scroll' ? '<div class="hm-legend" style="background:linear-gradient(90deg,rgba(0,0,0,0),rgba(0,0,0,.65))"></div><div style="display:flex;justify-content:space-between" class="muted"><span>todos viram</span><span>ninguém viu</span></div>'
              : '<div class="hm-legend" style="background:linear-gradient(90deg,rgba(245,179,143,.25),#eb6834 50%,#9b1c1c)"></div><div style="display:flex;justify-content:space-between" class="muted"><span>pouco</span><span>muito</span></div>'}
          </div>
          <div class="card"><h2>Seções</h2>${bars(d.sections.map((s) => {
            const v = hm.mode === 'clicks' ? s.clicks : hm.mode === 'attention' ? s.share : hm.mode === 'exits' ? s.exitRate : s.reachRate;
            const disp = hm.mode === 'clicks' ? fmt.n(v) : fmt.pct(v, 0);
            return { label: s.section, v, display: disp };
          }), { max: hm.mode === 'clicks' ? undefined : hm.mode === 'scroll' ? 1 : undefined })}</div>
          <p class="muted" style="font-size:12px">A página é carregada de <b>${esc(site.url || '(sem URL)')}</b>. Altere em <a href="#/setup">Instalação</a>. Se ela não carregar, mostramos um esboço das seções.</p>
        </div>
      </div>`;
    $$('#hm-dev button').forEach((b) => b.addEventListener('click', () => { hm.device = b.dataset.v; store.set('retina_hm_device', hm.device); render(); }));
    $$('#hm-mode button').forEach((b) => b.addEventListener('click', () => { hm.mode = b.dataset.v; render(); }));
    $$('#hm-only button').forEach((b) => b.addEventListener('click', () => { hm.only = b.dataset.v; render(); }));
    mountPageFrame($('#hm-stage'), site.url, FRAMES[hm.device], d.layout, (overlay, layout) => drawHeat(overlay, layout, d));
  };

  // Monta o iframe da página real (modo heatmap do tracker) com camada de desenho sincronizada ao scroll.
  // Fallback: esboço com as seções do layout gravado nas sessões.
  function mountPageFrame(stage, url, frame, fallbackLayout, draw) {
    stage.innerHTML = '';
    const scale = Math.min(1, (stage.clientWidth - 24) / frame.w);
    const viewH = Math.min(frame.h, Math.round((innerHeight - 160) / scale));
    stage.style.height = Math.round(viewH * scale + 24) + 'px';
    const box = document.createElement('div');
    box.className = 'hm-frame-box';
    box.style.cssText = `width:${frame.w}px;height:${viewH}px;transform:scale(${scale});margin-top:12px;`;
    stage.appendChild(box);
    const overlay = document.createElement('div');
    overlay.className = 'hm-overlay';
    overlay.style.cssText = `width:${frame.w}px;height:${viewH}px;`;
    const canvas = document.createElement('canvas');
    overlay.appendChild(canvas);
    let layout = null, done = false;

    const useFallback = () => {
      if (done) return;
      done = true;
      box.innerHTML = '';
      const L = fallbackLayout;
      if (!L || !L.s || !L.s.length) { stage.innerHTML = '<div class="empty"><b>Não foi possível carregar a página</b>Confira a URL do site em Instalação e se o script do Retina está nela.</div>'; return; }
      const k = frame.w / (L.w || frame.w);
      const lay = { h: L.h * k, w: frame.w, s: L.s.map(([n, t, h]) => [n, t * k, h * k]) };
      const scroller = document.createElement('div');
      scroller.style.cssText = `width:${frame.w}px;height:${viewH}px;overflow-y:auto;position:relative;background:var(--surface)`;
      const wire = document.createElement('div');
      wire.className = 'wire';
      wire.style.height = lay.h + 'px';
      wire.innerHTML = lay.s.map(([n, t, h]) => `<div class="wire-sec" style="top:${t}px;height:${h}px">${esc(n)}</div>`).join('');
      overlay.style.height = lay.h + 'px';
      wire.appendChild(overlay);
      scroller.appendChild(wire);
      box.appendChild(scroller);
      const note = document.createElement('div');
      note.className = 'replay-banner'; note.textContent = 'Esboço das seções (a página não carregou no quadro)';
      stage.appendChild(note);
      canvas.width = frame.w; canvas.height = Math.min(lay.h, 30000);
      draw(canvas, lay);
    };

    if (!url) { useFallback(); return {}; }
    const iframe = document.createElement('iframe');
    iframe.src = url + (url.includes('?') ? '&' : '?') + 'retina_heatmap=1';
    iframe.width = frame.w; iframe.height = viewH;
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.setAttribute('title', 'Página analisada');
    box.appendChild(iframe);
    box.appendChild(overlay);
    const onMsg = (e) => {
      if (e.source !== iframe.contentWindow || !e.data || !e.data.retina) return;
      if (e.data.retina === 'layout') {
        const L = e.data.layout;
        const changed = !layout || layout.h !== L.h || JSON.stringify(layout.s) !== JSON.stringify(L.s);
        if (!L.s.length) return;
        done = true;
        layout = L;
        if (changed) { canvas.width = frame.w; canvas.height = Math.min(L.h, 30000); draw(canvas, L); }
        canvas.style.transform = `translateY(${-e.data.scrollY}px)`;
      }
      if (e.data.retina === 'scroll') canvas.style.transform = `translateY(${-e.data.scrollY}px)`;
    };
    addEventListener('message', onMsg);
    onCleanup(() => removeEventListener('message', onMsg));
    const to = setTimeout(useFallback, 6000);
    onCleanup(() => clearTimeout(to));
    return { iframe, get layout() { return layout; } };
  }

  // mapeia (seção, y relativo) para y em pixels num layout
  function secY(layout, name, rel) {
    const s = layout.s.find((x) => x[0] === name);
    return s ? s[1] + rel * s[2] : null;
  }
  // rampa sequencial (laranja → vermelho escuro)
  function heatColor(a) {
    const stops = [[245, 179, 143], [235, 104, 52], [155, 28, 28]];
    const t = Math.min(1, a) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(t)), f = t - i;
    return stops[i].map((c, k) => Math.round(c + (stops[i + 1][k] - c) * f));
  }
  function label(ctx, text, x, y) {
    ctx.font = '600 13px system-ui, sans-serif';
    const w = ctx.measureText(text).width + 14;
    ctx.fillStyle = 'rgba(11,11,11,.82)';
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, 22, 11) : ctx.rect(x, y, w, 22); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(text, x + 7, y + 15);
  }
  function drawHeat(canvas, layout, d) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const secs = new Map(d.sections.map((s) => [s.section, s]));
    if (hm.mode === 'clicks') {
      const pts = d.clicks.filter((c) => (hm.only === 'dead' ? c[4] : hm.only === 'rage' ? c[3] : true));
      const off = document.createElement('canvas'); off.width = W; off.height = H;
      const o = off.getContext('2d');
      const R = W < 500 ? 16 : 22;
      for (const [sec, x, y] of pts) {
        const py = secY(layout, sec, y);
        if (py == null || x < 0 || x > 1) continue;
        const px = x * W;
        const g = o.createRadialGradient(px, py, 0, px, py, R);
        g.addColorStop(0, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        o.fillStyle = g; o.fillRect(px - R, py - R, R * 2, R * 2);
      }
      const img = o.getImageData(0, 0, W, H);
      const a = img.data;
      let max = 0; for (let i = 3; i < a.length; i += 4) if (a[i] > max) max = a[i];
      for (let i = 0; i < a.length; i += 4) {
        const v = a[i + 3] / (max || 1);
        if (!v) continue;
        const [r, g, b] = heatColor(v);
        a[i] = r; a[i + 1] = g; a[i + 2] = b; a[i + 3] = Math.round(Math.min(0.9, 0.25 + v * 0.75) * 255);
      }
      ctx.putImageData(img, 0, 0);
      for (const [n, t] of layout.s) { const s = secs.get(n); if (s && s.clicks) label(ctx, `${fmt.n(s.clicks)} cliques`, W - 130, t + 8); }
    } else if (hm.mode === 'attention') {
      let max = 0;
      for (const s of d.sections) for (const v of s.attention) max = Math.max(max, v);
      for (const [n, t, h] of layout.s) {
        const s = secs.get(n); if (!s) continue;
        const bh = h / s.attention.length;
        s.attention.forEach((v, i) => {
          const k = v / (max || 1);
          const [r, g, b] = heatColor(k);
          ctx.fillStyle = `rgba(${r},${g},${b},${0.08 + k * 0.55})`;
          ctx.fillRect(0, t + i * bh, W, bh + 1);
        });
        label(ctx, `${n}: ${fmt.dur(s.avgDwell)} · ${fmt.pct(s.share, 0)} da atenção`, 8, t + 8);
      }
    } else if (hm.mode === 'scroll') {
      for (const [n, t, h] of layout.s) {
        const s = secs.get(n); if (!s) continue;
        ctx.fillStyle = `rgba(0,0,0,${(1 - s.reachRate) * 0.65})`;
        ctx.fillRect(0, t, W, h);
        ctx.fillStyle = 'rgba(235,104,52,.9)'; ctx.fillRect(0, t, W, 2);
        label(ctx, `${fmt.pct(s.reachRate, 0)} chegaram aqui — ${n}`, 8, t + 8);
      }
    } else if (hm.mode === 'exits') {
      const max = Math.max(...d.sections.map((s) => s.exitRate), 0.01);
      for (const [n, t, h] of layout.s) {
        const s = secs.get(n); if (!s) continue;
        const k = s.exitRate / max;
        const [r, g, b] = heatColor(k);
        ctx.fillStyle = `rgba(${r},${g},${b},${0.1 + k * 0.5})`;
        ctx.fillRect(0, t, W, h);
        label(ctx, `${fmt.pct(s.exitRate, 0)} dos que chegaram fecharam aqui — ${n}`, 8, t + 8);
      }
    }
  }

  // ---------- Cliques ----------
  pages.clicks = async () => {
    const d = await api('clicks');
    if (!d.total) { page.innerHTML = head('Cliques e eventos', '') + noData(); return; }
    const evName = (t) => (EVT[t] || [t])[0];
    page.innerHTML = `${head('Cliques e eventos', 'Em que as pessoas clicam, o que tentam clicar e não funciona, o que copiam e quais erros aparecem.')}
      <div class="card"><div class="card-head"><h2>Elementos clicados</h2><span class="card-sub">${fmt.n(d.total)} visitas no período</span></div>
        <div class="table-wrap"><table><thead><tr><th>Elemento</th><th>Seção</th><th class="n">Cliques</th><th class="n">% das visitas</th><th class="n">Compradores</th><th class="n">Quando (média)</th><th>Alertas</th></tr></thead>
        <tbody>${d.elements.map((e) => `<tr>
          <td><span class="trunc" title="${esc(e.label)}">${esc(e.label || '(sem texto)')}</span><br><span class="muted" style="font-size:11.5px">${esc(e.tag || '')}${e.el_id ? '#' + esc(e.el_id) : ''}</span></td>
          <td>${esc(e.section || '—')}</td><td class="n">${fmt.n(e.n)}</td>
          <td class="n cell-bar" style="--w:${Math.min(100, (e.sessions / d.total) * 100)}%"><span>${fmt.pct(e.sessions / d.total)}</span></td>
          <td class="n">${fmt.n(e.buyers || 0)}</td><td class="n">${fmt.dur(e.avg_t / 1000)}</td>
          <td>${e.checkout ? '<span class="pill pill-buy">checkout</span> ' : ''}${e.dead ? `<span class="pill pill-warn" data-tip="Clicaram em algo que não é botão nem link">${fmt.n(e.dead)} mortos</span> ` : ''}${e.rage ? `<span class="pill pill-crit" data-tip="Vários cliques seguidos no mesmo lugar: sinal de frustração">${fmt.n(e.rage)} rage</span>` : ''}</td></tr>`).join('')}</tbody></table></div>
      </div>
      <div class="grid g3 mt">
        <div class="card"><h2>Outros eventos</h2>${bars(d.other.map((o) => ({ label: evName(o.type), v: o.sessions, display: fmt.n(o.sessions), tip: `${fmt.n(o.n)} eventos em ${fmt.n(o.sessions)} visitas` })))}</div>
        <div class="card"><h2>Textos copiados</h2>${d.copies.length ? `<div class="bars">${d.copies.map((c) => `<div class="bar-row"><span class="lbl" title="${esc(c.label)}">"${esc(c.label)}"</span><span class="muted">${esc(c.section || '')}</span><span class="val">${c.n}</span></div>`).join('')}</div>` : '<div class="empty">Ninguém copiou texto ainda</div>'}</div>
        <div class="card"><h2>Erros de JavaScript</h2>${d.errors.length ? `<div class="bars">${d.errors.map((c) => `<div class="bar-row"><span class="lbl" title="${esc(c.label)}">${esc(c.label)}</span><span></span><span class="val">${c.n}</span></div>`).join('')}</div>` : '<div class="empty">Nenhum erro registrado 🎉</div>'}</div>
      </div>`;
  };

  // ---------- Compradores x não compradores ----------
  const cmp = { by: 'converted' };
  pages.compare = async () => {
    const d = await api('compare', { by: cmp.by });
    const Y = cmp.by === 'converted' ? 'Compraram' : 'Foram ao checkout', N = cmp.by === 'converted' ? 'Não compraram' : 'Não foram ao checkout';
    const gy = d.groups.yes, gn = d.groups.no;
    page.innerHTML = `${head('Quem compra × quem não compra', 'O que os compradores fazem diferente na página. É aqui que você descobre quais blocos vendem.')}
      <div class="card" style="margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <div class="seg" id="cmp-by"><button type="button" data-v="converted" class="${cmp.by === 'converted' ? 'on' : ''}">Compradores (webhook)</button><button type="button" data-v="checkout" class="${cmp.by === 'checkout' ? 'on' : ''}">Foram ao checkout</button></div>
        <span class="muted">Sem vendas suficientes ainda? Compare quem foi ao checkout.</span>
      </div>
      ${gy.n < 3 ? emptyState('Poucos dados no grupo "' + Y + '"', `Só ${gy.n} visitas nesse grupo. Configure o webhook de vendas em <a href="#/setup">Instalação</a> ou compare por checkout.`) : `
      <div class="kpis">
        ${kpi(Y, fmt.n(gy.n))}${kpi(N, fmt.n(gn.n))}
        ${kpi('Tempo de atenção', `${fmt.dur(gy.avgEngaged)} <span class="muted" style="font-size:15px">vs ${fmt.dur(gn.avgEngaged)}</span>`)}
        ${kpi('Rolagem média', `${fmt.pct(gy.avgScroll, 0)} <span class="muted" style="font-size:15px">vs ${fmt.pct(gn.avgScroll, 0)}</span>`)}
        ${kpi('Cliques por visita', `${fmt.d1(gy.avgClicks)} <span class="muted" style="font-size:15px">vs ${fmt.d1(gn.avgClicks)}</span>`)}
      </div>
      ${d.insights.length ? `<div class="card"><h2>Blocos que mais pesam na decisão</h2><div class="insights">${d.insights.map((i) => `<div class="insight attention"><b class="ic">◉</b><span>Em <b>${esc(i.section)}</b> quem ${cmp.by === 'converted' ? 'comprou' : 'foi ao checkout'} passou <b>${fmt.d1(i.ratio)}×</b> mais tempo (${fmt.dur(i.yes)} vs ${fmt.dur(i.no)}).</span></div>`).join('')}</div></div>` : ''}
      <div class="grid g2 mt">
        <div class="card"><div class="card-head"><h2>Tempo médio em cada seção</h2><div class="legend"><span style="--c:var(--s1)">${Y}</span><span style="--c:var(--s2)">${N}</span></div></div>${twoBars(d.sections, (s) => [s.yes.avgDwell, s.no.avgDwell], fmt.dur)}</div>
        <div class="card"><div class="card-head"><h2>% que chegou em cada seção</h2><div class="legend"><span style="--c:var(--s1)">${Y}</span><span style="--c:var(--s2)">${N}</span></div></div>${twoBars(d.sections, (s) => [s.yes.reachRate, s.no.reachRate], (v) => fmt.pct(v, 0), 1)}</div>
      </div>`}`;
    $$('#cmp-by button').forEach((b) => b.addEventListener('click', () => { cmp.by = b.dataset.v; render(); }));
  };
  function twoBars(sections, get, f, maxFixed) {
    const max = maxFixed || Math.max(...sections.flatMap(get), 1e-9);
    return `<div class="bars">${sections.map((s) => {
      const [a, b] = get(s);
      return `<div class="bar-row two" data-tip="${esc(`<b>${esc(s.section)}</b><br>${f(a)} vs ${f(b)}`)}"><span class="lbl">${esc(s.section)}</span>
        <span class="track"><span class="fill" style="width:${(a / max) * 100}%"></span><span class="fill b" style="width:${(b / max) * 100}%"></span></span>
        <span class="val" style="font-size:12px">${f(a)}<br><span class="muted">${f(b)}</span></span></div>`;
    }).join('')}</div>`;
  }

  // ---------- Origens ----------
  const src = { dim: 'content', sort: 'sessions' };
  pages.sources = async () => {
    const d = await api('sources', { dim: src.dim });
    const DIMS = { source: 'Origem', medium: 'Mídia', campaign: 'Campanha', content: 'Criativo (utm_content)', term: 'Posicionamento (utm_term)', ref: 'Site de origem', browser: 'Navegador', os: 'Sistema', device: 'Dispositivo', country: 'País' };
    const rows = [...d.rows].sort((a, b) => b[src.sort] - a[src.sort]);
    const best = rows.filter((r) => r.sessions >= 20).sort((a, b) => b.rpv - a.rpv)[0];
    page.innerHTML = `${head('Origens e criativos', 'Qual tráfego chega mais qualificado. Um criativo pode trazer muito clique e pouca leitura: aqui você vê isso.')}
      <div class="card" style="margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <label class="muted" for="dim">Agrupar por</label>
        <select id="dim">${Object.entries(DIMS).map(([k, v]) => `<option value="${k}" ${src.dim === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
        ${best ? `<span class="pill pill-buy" style="margin-left:auto">Melhor receita por visita: ${esc(best.key)} (${fmt.money(best.rpv)})</span>` : ''}
      </div>
      <div class="card"><div class="table-wrap"><table><thead><tr>
        <th>${DIMS[src.dim]}</th>${[['sessions', 'Visitas'], ['avgEngaged', 'Atenção média'], ['avgScroll', 'Rolagem'], ['ctaRate', 'Clicou botão'], ['checkoutRate', 'Checkout'], ['convRate', 'Conversão'], ['revenue', 'Faturamento'], ['rpv', 'Receita/visita']]
          .map(([k, v]) => `<th class="n"><a href="#" data-sort="${k}">${v}${src.sort === k ? ' ↓' : ''}</a></th>`).join('')}
      </tr></thead><tbody>${rows.map((r) => `<tr>
        <td><b class="trunc">${esc(r.key)}</b></td><td class="n">${fmt.n(r.sessions)}</td><td class="n">${fmt.dur(r.avgEngaged)}</td><td class="n">${fmt.pct(r.avgScroll, 0)}</td>
        <td class="n">${fmt.pct(r.ctaRate)}</td><td class="n">${fmt.pct(r.checkoutRate)}</td><td class="n">${fmt.pct(r.convRate, 2)}</td><td class="n">${fmt.money(r.revenue)}</td><td class="n"><b>${fmt.money(r.rpv)}</b></td></tr>`).join('')}</tbody></table></div></div>`;
    $('#dim').addEventListener('change', (e) => { src.dim = e.target.value; render(); });
    $$('[data-sort]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); src.sort = a.dataset.sort; render(); }));
  };

  // ---------- Sessões ----------
  const ses = { sort: 'recent', only: '', offset: 0 };
  pages.sessions = async (params) => {
    const section = params.get('section') || '';
    const d = await api('sessions', { sort: ses.sort, only: ses.only, offset: ses.offset, limit: 50, section });
    page.innerHTML = `${head('Sessões e replay', 'Cada visita, uma por uma. Clique para assistir o replay: rolagem, cliques, popups e onde a pessoa saiu.')}
      ${section ? `<div class="banner">Mostrando quem fechou a página em <b>${esc(section)}</b>. <a href="#/sessions">Limpar</a></div>` : ''}
      <div class="card" style="margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <div class="seg" id="s-only">${Object.entries({ '': 'Todas', engaged: 'Engajadas (30s+)', checkout: 'Foram ao checkout', buyers: 'Compradores', rage: 'Com rage click' }).map(([k, v]) => `<button type="button" data-v="${k}" class="${ses.only === k ? 'on' : ''}">${v}</button>`).join('')}</div>
        <select id="s-sort" aria-label="Ordenar">${Object.entries({ recent: 'Mais recentes', engaged: 'Mais tempo', scroll: 'Mais rolagem', clicks: 'Mais cliques', buyers: 'Compradores primeiro' }).map(([k, v]) => `<option value="${k}" ${ses.sort === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
        <span class="muted" style="margin-left:auto">${fmt.n(d.total)} sessões</span>
        <a class="btn btn-sm" href="/api/export.csv?${qs()}" download>Exportar CSV</a>
      </div>
      <div class="card">${d.rows.length ? `<div class="table-wrap"><table><thead><tr><th>Quando</th><th>Origem / criativo</th><th>Aparelho</th><th class="n">Atenção</th><th class="n">Rolagem</th><th>Saiu em</th><th class="n">Cliques</th><th></th></tr></thead><tbody>
        ${d.rows.map((r) => `<tr class="click" data-id="${r.id}">
          <td>${fmt.date(r.started_at)}${r.live ? ' <span class="pill pill-live">ao vivo</span>' : ''}</td>
          <td><span class="trunc" style="max-width:220px">${esc(r.utm_source || r.ref_host || 'direto')}${r.utm_content ? ' · ' + esc(r.utm_content) : ''}</span></td>
          <td>${DEVICE[r.device] || '—'}<br><span class="muted" style="font-size:11.5px">${esc(r.browser || '')}</span></td>
          <td class="n">${fmt.dur(r.engaged_ms / 1000)}</td><td class="n">${fmt.pct(r.max_scroll, 0)}</td>
          <td>${esc(r.cur_section || '—')}</td>
          <td class="n">${r.clicks}${r.rage_clicks ? ' <span class="pill pill-crit">rage</span>' : ''}</td>
          <td>${r.converted ? `<span class="pill pill-buy">comprou ${fmt.money(r.revenue)}</span>` : r.checkout_clicks ? '<span class="pill">checkout</span>' : ''}</td></tr>`).join('')}
      </tbody></table></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
        <button class="btn btn-sm" id="prev" ${ses.offset ? '' : 'disabled'}>← Anteriores</button>
        <button class="btn btn-sm" id="next" ${ses.offset + 50 < d.total ? '' : 'disabled'}>Próximas →</button></div>` : '<div class="empty"><b>Nenhuma sessão</b>Ajuste os filtros ou o período.</div>'}</div>`;
    $$('#s-only button').forEach((b) => b.addEventListener('click', () => { ses.only = b.dataset.v; ses.offset = 0; render(); }));
    $('#s-sort').addEventListener('change', (e) => { ses.sort = e.target.value; ses.offset = 0; render(); });
    $$('tr[data-id]').forEach((tr) => tr.addEventListener('click', () => { location.hash = '#/session/' + tr.dataset.id; }));
    $('#prev')?.addEventListener('click', () => { ses.offset = Math.max(0, ses.offset - 50); render(); });
    $('#next')?.addEventListener('click', () => { ses.offset += 50; render(); });
  };

  // ---------- Sessão + replay ----------
  pages.session = async (params, id) => {
    const r = await fetch('/api/session/' + id, { credentials: 'same-origin' });
    if (r.status === 401) return showLogin();
    if (!r.ok) { page.innerHTML = emptyState('Sessão não encontrada', ''); return; }
    const d = await r.json();
    const s = d.session;
    const site = st.sites.find((x) => x.id === s.site_id) || currentSite();
    const dur = Math.max(s.duration_ms, ...d.events.map((e) => e.t), ...(d.trace.length ? [d.trace[d.trace.length - 1][0] * 100] : [0]));
    const journey = [];
    for (const sec of [...d.sections].filter((x) => x.reached && x.ord >= 0).sort((a, b) => a.ord - b.ord)) journey.push(sec.section);
    const evs = d.events.filter((e) => e.type !== 'view');
    page.innerHTML = `<div class="page-head"><div><a href="#/sessions" class="muted">← Sessões</a><h1>Sessão de ${fmt.date(s.started_at)} ${s.live ? '<span class="pill pill-live">ao vivo</span>' : ''} ${s.converted ? `<span class="pill pill-buy">comprou ${fmt.money(s.revenue)}</span>` : ''}</h1>
        <p>${DEVICE[s.device] || ''} · ${esc(s.os || '')} · ${esc(s.browser || '')} · ${esc(s.utm_source || s.ref_host || 'direto')}${s.utm_campaign ? ' / ' + esc(s.utm_campaign) : ''}${s.utm_content ? ' / ' + esc(s.utm_content) : ''}${s.is_returning ? ' · <b>visitante recorrente</b>' : ''}</p></div></div>
      <div class="kpis">
        ${kpi('Tempo na página', fmt.dur(s.duration_ms / 1000))}${kpi('Tempo de atenção', fmt.dur(s.engaged_ms / 1000))}${kpi('Rolagem máxima', fmt.pct(s.max_scroll, 0))}
        ${kpi('Cliques', fmt.n(s.clicks) + (s.rage_clicks ? ` <span class="pill pill-crit">${s.rage_clicks} rage</span>` : ''))}${kpi('Saiu em', `<span style="font-size:17px">${esc(s.cur_section || '—')}</span>`)}
        ${kpi('Carregamento', s.load_ms ? (s.load_ms / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 's' : '—')}
      </div>
      <div class="card" style="margin-bottom:16px"><h3>Caminho na página</h3><div class="journey">${journey.map((j, i) => `<span class="${j === s.cur_section && !s.converted ? 'exit' : ''}">${i + 1}. ${esc(j)}</span>`).join('')}</div></div>
      <div class="replay">
        <div>
          <div class="replay-stage" id="rp-stage"></div>
          <div class="replay-controls">
            <button class="btn btn-primary" id="rp-play" type="button">▶ Assistir</button>
            <input type="range" id="rp-seek" min="0" max="${dur}" value="0" step="100" aria-label="Posição do replay">
            <span class="num" id="rp-time">0:00 / ${fmt.clock(dur)}</span>
            <select id="rp-speed" aria-label="Velocidade"><option value="1">1×</option><option value="2">2×</option><option value="4" selected>4×</option><option value="8">8×</option><option value="16">16×</option></select>
            <label class="muted"><input type="checkbox" id="rp-skip" checked> pular parado</label>
          </div>
          <div class="card mt"><div class="card-head"><h2>Posição na página ao longo do tempo</h2><span class="card-sub">clique no gráfico para pular o replay</span></div><div id="rp-chart"></div></div>
        </div>
        <div class="card"><h2>Linha do tempo</h2><div class="timeline" id="rp-tl">${evs.map((e, i) => `<div class="tl-item" data-i="${i}" data-t="${e.t}"><span class="tl-t">${fmt.clock(e.t)}</span><span><span class="tl-type">${(EVT[e.type] || [e.type])[0]}</span>${e.label ? `<br><span class="ink2">${esc(e.label)}</span>` : ''}${e.section ? `<br><span class="muted">${esc(e.section)}</span>` : ''}${e.data && e.data.rage ? ' <span class="pill pill-crit">rage</span>' : ''}${e.data && e.data.dead ? ' <span class="pill pill-warn">morto</span>' : ''}${e.data && e.data.checkout ? ' <span class="pill pill-buy">checkout</span>' : ''}</span></div>`).join('')}
          ${d.conversions.map((c) => `<div class="tl-item"><span class="tl-t">venda</span><span><span class="tl-type">${c.status === 'approved' ? 'Compra aprovada' : 'Venda ' + esc(c.status)}</span><br>${fmt.money(c.value)} · ${esc(c.product || '')} <span class="muted">(${esc(c.source)})</span></span></div>`).join('')}
          </div>
          ${d.others.length ? `<h3 class="mt">Outras visitas dessa pessoa</h3>${d.others.map((o) => `<div>${sessLink(o.id, fmt.date(o.started_at))} · ${fmt.dur(o.engaged_ms / 1000)}${o.converted ? ' <span class="pill pill-buy">comprou</span>' : ''}</div>`).join('')}` : ''}
        </div>
      </div>
      <div class="card mt"><h2>Seções nesta visita</h2><div class="table-wrap"><table><thead><tr><th>Seção</th><th class="n">Chegou em</th><th class="n">Tempo</th><th class="n">Parado lendo</th><th class="n">Releu</th></tr></thead><tbody>
        ${[...d.sections].sort((a, b) => (a.ord < 0) - (b.ord < 0) || a.ord - b.ord).map((x) => `<tr><td>${esc(x.section)}</td><td class="n">${x.reached ? fmt.clock(x.first_t) : '<span class="muted">não chegou</span>'}</td><td class="n">${fmt.dur(x.dwell_ms / 1000)}</td><td class="n">${x.dwell_ms ? fmt.pct(x.still_ms / x.dwell_ms, 0) : '—'}</td><td class="n">${x.rereads || ''}</td></tr>`).join('')}
      </tbody></table></div></div>`;
    setupReplay(d, site, dur, evs);
  };

  function setupReplay(d, site, dur, evs) {
    const s = d.session;
    const frame = { w: s.vw || (s.device === 'mobile' ? 390 : 1366), h: s.vh || (s.device === 'mobile' ? 760 : 768) };
    const stage = $('#rp-stage');
    const scale = Math.min(1, (stage.clientWidth - 40) / frame.w, (stage.clientHeight - 30) / frame.h);
    const dev = document.createElement('div');
    dev.className = 'replay-device';
    dev.style.cssText = `width:${frame.w}px;height:${frame.h}px;transform:scale(${scale});`;
    stage.appendChild(dev);
    const banner = document.createElement('div'); banner.className = 'replay-banner'; banner.hidden = true; stage.appendChild(banner);
    const fx = document.createElement('div'); fx.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:2'; dev.appendChild(fx);
    let iframe = null, frameLayout = null;
    if (site.url) {
      iframe = document.createElement('iframe');
      iframe.src = site.url + (site.url.includes('?') ? '&' : '?') + 'retina_heatmap=1';
      iframe.width = frame.w; iframe.height = frame.h;
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      iframe.title = 'Replay da sessão';
      dev.insertBefore(iframe, fx);
      const onMsg = (e) => { if (iframe && e.source === iframe.contentWindow && e.data && e.data.retina === 'layout' && e.data.layout.s.length) frameLayout = e.data.layout; };
      addEventListener('message', onMsg); onCleanup(() => removeEventListener('message', onMsg));
    }
    // fallback/esboço quando não há iframe
    const L = s.layout;
    let wire = null;
    if (!site.url && L) {
      wire = document.createElement('div'); wire.className = 'wire'; wire.style.cssText = `height:${L.h}px;position:absolute;left:0;right:0;top:0;transition:none`;
      wire.innerHTML = L.s.map(([n, t, h]) => `<div class="wire-sec" style="top:${t}px;height:${h}px">${esc(n)}</div>`).join('');
      dev.insertBefore(wire, fx);
    }
    // converte y da sessão → y na página carregada (por seção, para aguentar diferenças de layout)
    const mapY = (y, ref) => {
      if (!L || !frameLayout) return y;
      const probe = y + (ref ?? 0);
      const sec = L.s.find(([, t, h]) => probe >= t && probe < t + h) || L.s[L.s.length - 1];
      const tgt = frameLayout.s.find((x) => x[0] === sec[0]);
      if (!tgt) return (y / (L.h || 1)) * frameLayout.h;
      return tgt[1] + ((probe - sec[1]) / sec[2]) * tgt[2] - (ref ?? 0);
    };
    const tr = d.trace.map(([ds, y]) => [ds * 100, y]);
    const yAt = (t) => {
      if (!tr.length) return 0;
      if (t <= tr[0][0]) return tr[0][1];
      for (let i = 1; i < tr.length; i++) if (tr[i][0] >= t) { const [t0, y0] = tr[i - 1], [t1, y1] = tr[i]; return y0 + ((y1 - y0) * (t - t0)) / Math.max(1, t1 - t0); }
      return tr[tr.length - 1][1];
    };
    const keyTimes = [...tr.map((x) => x[0]), ...evs.map((e) => e.t)].sort((a, b) => a - b);

    let t = 0, playing = false, last = 0, lastPost = 0, evIdx = 0, popup = null;
    const seek = $('#rp-seek'), timeEl = $('#rp-time'), play = $('#rp-play');
    const items = $$('#rp-tl .tl-item[data-t]');
    function setBanner(text) { banner.textContent = text; banner.hidden = !text; }
    function apply(force) {
      const y = mapY(yAt(t), frame.h / 2);
      if (iframe && (force || performance.now() - lastPost > 50)) { iframe.contentWindow?.postMessage({ retina: 'scrollTo', y }, '*'); lastPost = performance.now(); }
      if (wire) wire.style.transform = `translateY(${-yAt(t)}px)`;
      seek.value = t; timeEl.textContent = `${fmt.clock(t)} / ${fmt.clock(dur)}`;
      items.forEach((it) => { const et = Number(it.dataset.t); it.classList.toggle('past', et < t - 1500); it.classList.toggle('now', et <= t && et > t - 1500); });
    }
    function fireEvents(from, to) {
      for (const e of evs) {
        if (e.t <= from || e.t > to) continue;
        if (e.type === 'click' && e.x != null) {
          const isPopup = e.section && e.section.startsWith('Popup');
          let cy;
          if (isPopup || popup) cy = frame.h * (0.25 + (e.y || 0.5) * 0.5);
          else {
            const sy = L ? (L.s.find((x) => x[0] === e.section) || [0, 0, 0]) : null;
            const pageY = sy ? sy[1] + e.y * sy[2] : 0;
            cy = mapY(pageY, 0) - mapY(yAt(e.t), frame.h / 2);
          }
          const dot = document.createElement('div');
          dot.className = 'replay-click' + (e.data && e.data.rage ? ' rage' : '');
          dot.style.left = e.x * frame.w + 'px'; dot.style.top = Math.max(10, Math.min(frame.h - 10, cy)) + 'px';
          fx.appendChild(dot); setTimeout(() => dot.remove(), 1000);
          if (popup) { popup = null; setBanner(''); }
        }
        if (e.type === 'popup') { popup = e.section; setBanner('Popup na tela: ' + e.section); }
        if (e.type === 'hide') setBanner('Saiu da aba / trocou de app');
        if (e.type === 'show') setBanner(popup ? 'Popup na tela: ' + popup : '');
        if (e.type === 'exit') setBanner('Fechou a página aqui');
        if (e.type === 'reread') setBanner('Voltou para reler: ' + e.section);
      }
    }
    function frameLoop(now) {
      if (!playing) return;
      const dt = Math.min(200, now - last); last = now;
      const prev = t;
      t += dt * Number($('#rp-speed').value);
      if ($('#rp-skip').checked) { const nxt = keyTimes.find((k) => k > prev); if (nxt && nxt - prev > 3000 && t < nxt - 800) t = nxt - 800; }
      if (t >= dur) { t = dur; playing = false; play.textContent = '↺ Assistir de novo'; }
      fireEvents(prev, t); apply();
      if (playing) requestAnimationFrame(frameLoop);
    }
    play.addEventListener('click', () => {
      if (playing) { playing = false; play.textContent = '▶ Continuar'; return; }
      if (t >= dur) { t = 0; evIdx = 0; popup = null; setBanner(''); }
      playing = true; play.textContent = '❚❚ Pausar'; last = performance.now(); requestAnimationFrame(frameLoop);
    });
    const jump = (v) => { t = v; popup = null; setBanner(''); apply(true); };
    seek.addEventListener('input', () => jump(Number(seek.value)));
    items.forEach((it) => it.addEventListener('click', () => jump(Math.max(0, Number(it.dataset.t) - 1500))));
    onCleanup(() => { playing = false; });
    setTimeout(() => apply(true), 1200);
    void evIdx;
    // gráfico de posição
    const docH = (L && L.h) || s.doc_h || 1;
    lineChart($('#rp-chart'), tr.map(([tt, y]) => ({ x: tt / 1000, y: Math.min(1, (y + frame.h) / docH) })), {
      yMax: 1, yFmt: (v) => fmt.pct(v, 0), xFmt: (x) => fmt.clock(x * 1000), height: 160, label: 'Posição na página',
      tip: (p) => `<b>${fmt.clock(p.x * 1000)}</b><br>vendo até ${fmt.pct(p.y, 0)} da página`, onClick: (p) => jump(p.x * 1000),
    });
  }

  // ---------- Ao vivo ----------
  pages.live = async () => {
    const draw = async () => {
      const d = await api('live');
      const live = d.sessions;
      const old = $('#live-root');
      const html = `<div id="live-root">${head('Ao vivo', 'Quem está na página agora e em qual bloco. Atualiza a cada 3 segundos.')}
        <div class="live-grid">
          <div>
            <div class="grid g2">
              <div class="card"><div class="kpi-label">Pessoas na página agora</div><div class="live-big">${live.length}</div><div class="muted">ativas nos últimos 45s</div></div>
              <div class="card"><div class="kpi-label">Novas visitas · últimos 30 min</div><div id="lv-min"></div></div>
            </div>
            <div class="card mt"><h2>Onde elas estão agora</h2>${bars(d.bySection.map((b) => ({ label: b.key === '—' ? 'Carregando a página' : b.key, v: b.n, display: fmt.n(b.n) })))}</div>
            <div class="card mt"><h2>Visitantes ativos</h2>${live.length ? `<div class="table-wrap"><table><thead><tr><th>Chegou</th><th>Origem</th><th>Aparelho</th><th>Vendo agora</th><th class="n">Atenção</th><th class="n">Rolagem</th></tr></thead><tbody>
              ${live.map((r) => `<tr class="click" data-id="${r.id}"><td>${fmt.ago(r.started_at)}</td><td>${esc(r.utm_source || r.ref_host || 'direto')}${r.utm_campaign ? ' · ' + esc(r.utm_campaign) : ''}</td><td>${DEVICE[r.device] || ''} · ${esc(r.browser || '')}</td><td><b>${esc(r.cur_section || '—')}</b></td><td class="n">${fmt.dur(r.engaged_ms / 1000)}</td><td class="n">${fmt.pct(r.max_scroll, 0)}</td></tr>`).join('')}
            </tbody></table></div>` : '<div class="empty"><b>Ninguém na página neste momento</b>Para testar, rode <code>npm run simulate -- --live</code> ou abra sua página.</div>'}</div>
          </div>
          <div class="card"><h2>Acontecendo agora</h2><div class="feed">${d.recentEvents.map((e) => `<div><span class="muted">${fmt.ago(e.ts)}</span> · <b>${(EVT[e.type] || [e.type])[0]}</b>${e.label ? ': ' + esc(e.label) : ''}${e.section ? ` <span class="muted">em ${esc(e.section)}</span>` : ''} ${sessLink(e.session_id, '→')}</div>`).join('') || '<div class="empty">Sem eventos nos últimos 10 min</div>'}</div></div>
        </div></div>`;
      if (old) old.outerHTML = html; else page.innerHTML = html;
      const mins = [];
      const nowM = Math.floor(d.now / 60000);
      const map = new Map(d.perMinute.map((x) => [x.m, x.n]));
      for (let m = nowM - 29; m <= nowM; m++) mins.push({ label: m === nowM ? 'agora' : `-${nowM - m}m`, v: map.get(m) || 0, tip: `${map.get(m) || 0} visitas` });
      colChart($('#lv-min'), mins, { height: 110, label: 'Visitas por minuto' });
      $$('#live-root tr[data-id]').forEach((tr) => tr.addEventListener('click', () => { location.hash = '#/session/' + tr.dataset.id; }));
    };
    await draw();
    every(3000, () => draw().catch(() => {}));
  };

  // ---------- Vendas ----------
  pages.sales = async () => {
    const rows = await api('conversions');
    const appr = rows.filter((r) => r.status === 'approved');
    const linked = appr.filter((r) => r.session_id);
    page.innerHTML = `${head('Vendas', 'Vendas recebidas pelo webhook da plataforma (Hotmart, Kiwify, Wiapy...) e a visita que gerou cada uma.')}
      <div class="kpis">
        ${kpi('Vendas aprovadas', fmt.n(appr.length))}${kpi('Faturamento', fmt.money(appr.reduce((a, r) => a + r.value, 0)))}
        ${kpi('Ticket médio', fmt.money(appr.length ? appr.reduce((a, r) => a + r.value, 0) / appr.length : 0))}
        ${kpi('Ligadas a uma visita', fmt.pct(appr.length ? linked.length / appr.length : 0, 0), '', 'Vendas em que o ID da sessão voltou no webhook. As demais vieram de links sem o rastreio (ex.: WhatsApp, e-mail).')}
        ${kpi('Reembolsos / cancelamentos', fmt.n(rows.filter((r) => r.status === 'refunded').length))}
      </div>
      <div class="card">${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Quando</th><th>Produto</th><th class="n">Valor</th><th>Status</th><th>Origem do lead</th><th class="n">Atenção</th><th class="n">Rolagem</th><th>Visita</th></tr></thead><tbody>
        ${rows.map((r) => `<tr><td>${fmt.date(r.created_at)}</td><td><span class="trunc">${esc(r.product || '—')}</span></td><td class="n">${fmt.money(r.value)}</td>
          <td>${r.status === 'approved' ? '<span class="pill pill-buy">aprovada</span>' : r.status === 'refunded' ? '<span class="pill pill-crit">reembolso</span>' : `<span class="pill">${esc(r.status)}</span>`}</td>
          <td>${r.session_id ? esc(r.utm_source || 'direto') + (r.utm_campaign ? ' · ' + esc(r.utm_campaign) : '') : '<span class="muted">sem visita ligada</span>'}</td>
          <td class="n">${r.session_id ? fmt.dur(r.engaged_ms / 1000) : '—'}</td><td class="n">${r.session_id ? fmt.pct(r.max_scroll, 0) : '—'}</td>
          <td>${r.session_id ? sessLink(r.session_id, 'replay →') : ''}</td></tr>`).join('')}
      </tbody></table></div>` : `<div class="empty"><b>Nenhuma venda recebida no período</b>Configure o webhook da sua plataforma em <a href="#/setup">Instalação</a>.</div>`}</div>`;
  };

  // ---------- Instalação ----------
  pages.setup = async () => {
    const sites = await apiRaw('sites');
    st.sites = sites; fillSites();
    const origin = location.origin;
    page.innerHTML = `${head('Instalação e sites', 'Tudo que você precisa colar na página e na plataforma de vendas.')}
      ${sites.map((s) => `<div class="card" style="margin-bottom:16px" data-site="${esc(s.id)}">
        <div class="card-head"><h2>${esc(s.name)} <span class="muted" style="font-weight:400">· chave <code>${esc(s.id)}</code></span></h2>
          <span><button class="btn btn-sm" data-act="edit">Editar</button> <button class="btn btn-sm btn-danger" data-act="wipe">Apagar dados</button> <button class="btn btn-sm btn-danger" data-act="del">Excluir site</button></span></div>
        <div class="steps">
          <div><b>Cole no &lt;head&gt; da página de vendas</b> (Elementor, WordPress, HTML, Lovable, qualquer uma):
            <div class="copy-row mt"><pre>&lt;script async src="${origin}/r.js" data-site="${esc(s.id)}"&gt;&lt;/script&gt;</pre><button class="btn btn-sm" data-copy>Copiar</button></div></div>
          <div><b>Nomeie os blocos da página</b> (opcional, mas é o que deixa a retenção legível). Adicione o atributo em cada seção:
            <div class="copy-row mt"><pre>&lt;section data-retina="Depoimentos"&gt; ... &lt;/section&gt;</pre><button class="btn btn-sm" data-copy>Copiar</button></div>
            <p class="muted mt" style="font-size:12.5px">No Elementor: Avançado → Atributos → <code>data-retina|Depoimentos</code>. Sem isso, o Retina usa as &lt;section&gt; que têm id. Popups: adicione também <code>data-retina-kind="popup"</code>.</p></div>
          <div><b>Webhook de vendas</b>: cole esta URL na sua plataforma (Hotmart, Kiwify, Wiapy, Eduzz, Braip, Ticto, Perfect Pay, Cakto...), evento de compra aprovada e reembolso:
            <div class="copy-row mt"><pre>${origin}/webhook/${esc(s.id)}/${esc(s.webhook_token)}</pre><button class="btn btn-sm" data-copy>Copiar</button></div>
            <p class="muted mt" style="font-size:12.5px">O Retina adiciona o ID da visita no link do checkout (<code>sck</code>, <code>src</code>, <code>utm_id</code> e <code>rsid</code>), e a plataforma devolve no webhook. É assim que cada venda é ligada ao comportamento de quem comprou. <button class="btn btn-sm btn-ghost" data-act="rotate">Gerar novo token</button></p></div>
          <div><b>Alternativa sem webhook</b>: na página de obrigado, se ela recebe os parâmetros da URL:
            <div class="copy-row mt"><pre>&lt;img src="${origin}/cv?site=${esc(s.id)}&amp;sid=ID_DA_SESSAO&amp;value=97" width="1" height="1"&gt;</pre><button class="btn btn-sm" data-copy>Copiar</button></div></div>
          <div><b>Status</b>: ${s.last_hit ? `<span class="status-dot ${Date.now() - s.last_hit < 86400000 ? 'ok' : 'warn'}"></span>último dado recebido ${fmt.ago(s.last_hit)}` : '<span class="status-dot bad"></span>ainda não recebemos nenhuma visita. Abra a página depois de colar o script.'}
            · URL da página para heatmaps: <b>${esc(s.url || '(não definida)')}</b></div>
        </div></div>`).join('')}
      <div class="card"><h2>Adicionar outro site / página</h2>
        <form id="new-site" style="display:flex;gap:8px;flex-wrap:wrap"><input type="text" name="name" placeholder="Nome (ex.: Página Curso X)" required><input type="url" name="url" placeholder="https://suapagina.com" style="min-width:260px"><button class="btn btn-primary" type="submit">Criar</button></form>
        <p class="muted mt" style="font-size:12.5px">Dica para teste A/B: crie um site para cada versão da página e compare a retenção.</p>
      </div>`;
    $$('[data-copy]').forEach((b) => b.addEventListener('click', () => {
      const t = b.previousElementSibling.textContent;
      navigator.clipboard?.writeText(t).then(() => { b.textContent = 'Copiado!'; setTimeout(() => (b.textContent = 'Copiar'), 1500); });
    }));
    $$('[data-site]').forEach((card) => {
      const id = card.dataset.site;
      card.querySelector('[data-act=edit]').addEventListener('click', async () => {
        const s = sites.find((x) => x.id === id);
        const name = prompt('Nome do site:', s.name); if (name === null) return;
        const url = prompt('URL da página (usada nos heatmaps e replays):', s.url || ''); if (url === null) return;
        await apiRaw('sites/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify({ name, url }) }); render();
      });
      card.querySelector('[data-act=rotate]').addEventListener('click', async () => { if (!confirm('Gerar novo token? A URL antiga do webhook deixa de funcionar.')) return; await apiRaw('sites/' + encodeURIComponent(id) + '/rotate', { method: 'POST' }); render(); });
      card.querySelector('[data-act=wipe]').addEventListener('click', async () => { if (prompt('Isso apaga TODAS as sessões e vendas deste site. Digite APAGAR para confirmar.') !== 'APAGAR') return; await apiRaw('sites/' + encodeURIComponent(id) + '/data', { method: 'DELETE' }); render(); });
      card.querySelector('[data-act=del]').addEventListener('click', async () => { if (prompt('Excluir o site e todos os dados. Digite EXCLUIR para confirmar.') !== 'EXCLUIR') return; await apiRaw('sites/' + encodeURIComponent(id), { method: 'DELETE' }); st.site = ''; await loadSites(); render(); });
    });
    $('#new-site').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const s = await apiRaw('sites', { method: 'POST', body: JSON.stringify({ name: f.get('name'), url: f.get('url') }) });
      if (s.id) { st.site = s.id; store.set('retina_site', s.id); await loadSites(); render(); }
    });
  };

  // ---------- Servidor ----------
  pages.server = async () => {
    const draw = async () => {
      const d = await apiRaw('system');
      const up = d.uptime / 1000;
      const html = `<div id="srv-root">${head('Servidor', 'Saúde do Retina: coleta, banco de dados e webhooks. Atualiza a cada 5 segundos.')}
        <div class="kpis">
          ${kpi('Status', '<span class="status-dot ok"></span>Online')}
          ${kpi('No ar há', fmt.dur(up))}
          ${kpi('Lotes recebidos', fmt.n(d.stats.collected), `<span class="kpi-delta">${fmt.n(d.stats.collectErrors)} rejeitados</span>`, 'Pacotes de dados enviados pelos navegadores desde que o servidor ligou.')}
          ${kpi('Eventos recebidos', fmt.n(d.stats.events))}
          ${kpi('Webhooks', fmt.n(d.stats.webhooks), `<span class="kpi-delta">${fmt.n(d.stats.webhookErrors)} com erro</span>`)}
          ${kpi('Memória', fmt.bytes(d.memory.rss))}
          ${kpi('Banco de dados', fmt.bytes(d.db.size))}
        </div>
        <div class="grid g2">
          <div class="card"><div class="card-head"><h2>Requisições por minuto</h2><span class="card-sub">última hora</span></div><div id="srv-req"></div></div>
          <div class="card"><h2>Banco de dados</h2><dl class="kv">
            <dt>Sessões</dt><dd>${fmt.n(d.db.sessions)}</dd><dt>Eventos</dt><dd>${fmt.n(d.db.events)}</dd><dt>Seções registradas</dt><dd>${fmt.n(d.db.sections)}</dd>
            <dt>Trilhas de replay</dt><dd>${fmt.n(d.db.traces)}</dd><dt>Vendas</dt><dd>${fmt.n(d.db.conversions)}</dd><dt>Arquivo</dt><dd><code>${esc(d.db.path)}</code></dd>
            <dt>Node.js</dt><dd>${esc(d.node)} · ${esc(d.platform)} · pid ${d.pid}</dd><dt>Fuso horário</dt><dd>${esc(d.tz)}</dd></dl></div>
        </div>
        <div class="card mt"><h2>Sites</h2><div class="table-wrap"><table><thead><tr><th>Site</th><th>Coleta</th><th class="n">Visitas 24h</th><th>Última venda</th></tr></thead><tbody>
          ${d.sites.map((s) => `<tr><td><b>${esc(s.name)}</b> <span class="muted">${esc(s.id)}</span></td><td><span class="status-dot ${!s.last_hit ? 'bad' : Date.now() - s.last_hit < 3600000 ? 'ok' : 'warn'}"></span>${s.last_hit ? 'último dado ' + fmt.ago(s.last_hit) : 'sem dados'}</td><td class="n">${fmt.n(s.sessions_24h)}</td><td>${s.last_sale ? fmt.ago(s.last_sale) : '—'}</td></tr>`).join('')}
        </tbody></table></div></div>
        <div class="card mt"><h2>Último webhook</h2>${d.stats.lastWebhook ? `<pre>${esc(JSON.stringify(d.stats.lastWebhook, null, 2))}</pre>` : '<p class="muted">Nenhum webhook recebido desde que o servidor ligou.</p>'}</div>
        <div class="card mt"><h2>Endpoints</h2><dl class="kv">
          <dt>Tracker</dt><dd><code>GET ${location.origin}/r.js</code></dd><dt>Coleta</dt><dd><code>POST ${location.origin}/c</code></dd>
          <dt>Webhook</dt><dd><code>POST ${location.origin}/webhook/:site/:token</code></dd><dt>Pixel de conversão</dt><dd><code>GET ${location.origin}/cv?site=&amp;sid=&amp;value=</code></dd>
          <dt>Health check</dt><dd><code>GET ${location.origin}/health</code></dd></dl></div></div>`;
      const old = $('#srv-root');
      if (old) old.outerHTML = html; else page.innerHTML = html;
      const nowM = Math.floor(Date.now() / 60000), map = new Map(d.stats.perMinute.map((x) => [x.m, x]));
      const items = [];
      for (let m = nowM - 59; m <= nowM; m++) { const x = map.get(m); items.push({ label: m === nowM ? 'agora' : `-${nowM - m}m`, v: x ? x.req : 0, tip: `${x ? x.req : 0} requisições · ${x ? x.col : 0} lotes de dados` }); }
      colChart($('#srv-req'), items, { height: 170, label: 'Requisições por minuto' });
    };
    await draw();
    every(5000, () => draw().catch(() => {}));
  };

  // ================= casca =================
  const head = (title, text) => `<div class="page-head"><div><h1>${title}</h1>${text ? `<p>${text}</p>` : ''}</div></div>`;
  const noData = () => emptyState('Ainda não há visitas neste período', `Instale o script na sua página (veja <a href="#/setup">Instalação</a>), ajuste o período no topo, ou gere dados de teste com <code>npm run simulate</code>.`);

  let renderToken = 0;
  async function render(quiet) {
    cleanup.forEach((fn) => { try { fn(); } catch {} });
    cleanup = [];
    hideTip();
    const [path, query] = (location.hash.slice(2) || 'overview').split('?');
    const [name, arg] = path.split('/');
    const fn = pages[name] || pages.overview;
    $$('#nav a').forEach((a) => a.classList.toggle('on', a.dataset.page === (name === 'session' ? 'sessions' : name)));
    $('#sidebar').classList.remove('open');
    const noFilters = ['setup', 'server', 'live'].includes(name);
    $$('#filters > :not(#f-site)').forEach((el) => { el.style.display = noFilters ? 'none' : ''; });
    if (!noFilters) $('#f-clear').style.display = '';
    const my = ++renderToken;
    if (!quiet) page.innerHTML = '<div class="loading">Carregando…</div>';
    try { await fn(new URLSearchParams(query || ''), arg); } catch (e) { if (my === renderToken && e.message !== 'unauthorized') page.innerHTML = emptyState('Erro ao carregar', esc(e.message)); }
    if (!quiet) page.focus({ preventScroll: true });
  }
  const refreshQuiet = () => render(true);

  async function loadSites() {
    st.sites = await apiRaw('sites');
    if (!st.sites.find((s) => s.id === st.site)) st.site = st.sites[0]?.id || '';
    fillSites();
  }
  function fillSites() {
    $('#f-site').innerHTML = st.sites.map((s) => `<option value="${esc(s.id)}" ${s.id === st.site ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
  }
  async function loadFilterOptions() {
    try {
      const f = await api('filters', { source: null, campaign: null, content: null });
      const fill = (id, list, label, cur) => { $(id).innerHTML = `<option value="">${label}</option>` + list.map((v) => `<option ${v === cur ? 'selected' : ''}>${esc(v)}</option>`).join(''); };
      fill('#f-source', f.source, 'Todas as origens', st.source);
      fill('#f-campaign', f.campaign, 'Todas as campanhas', st.campaign);
      fill('#f-content', f.content, 'Todos os criativos', st.content);
    } catch {}
  }
  function bindFilters() {
    $('#f-period').value = st.period;
    const upd = () => { $('#f-clear').hidden = !(st.device || st.source || st.campaign || st.content); };
    $('#f-site').addEventListener('change', (e) => { st.site = e.target.value; store.set('retina_site', st.site); st.source = st.campaign = st.content = ''; loadFilterOptions(); render(); });
    $('#f-period').addEventListener('change', (e) => { st.period = e.target.value; store.set('retina_period', st.period); loadFilterOptions(); render(); });
    for (const k of ['device', 'source', 'campaign', 'content']) $('#f-' + k).addEventListener('change', (e) => { st[k] = e.target.value; ses.offset = 0; upd(); render(); });
    $('#f-clear').addEventListener('click', () => { st.device = st.source = st.campaign = st.content = ''; for (const k of ['device', 'source', 'campaign', 'content']) $('#f-' + k).value = ''; upd(); render(); });
  }

  async function liveBadge() {
    try {
      const r = await fetch('/api/live?site=' + encodeURIComponent(st.site), { credentials: 'same-origin' });
      if (!r.ok) return;
      const d = await r.json();
      const b = $('#nav-live'); b.hidden = !d.sessions.length; b.textContent = d.sessions.length;
    } catch {}
  }

  function showLogin() { $('#app').hidden = true; $('#login').hidden = false; $('#pw').focus(); }
  async function start() {
    $('#login').hidden = true; $('#app').hidden = false;
    await loadSites();
    loadFilterOptions();
    render();
    liveBadge(); setInterval(liveBadge, 10000);
  }
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('#pw').value }) });
    const d = await r.json().catch(() => ({}));
    if (d.ok) start(); else $('#login-err').textContent = d.error || 'Erro';
  });
  $('#logout-btn').addEventListener('click', async () => { await fetch('/api/logout'); location.reload(); });
  $('#theme-btn').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next); store.set('retina_theme', next); render(true);
  });
  $('#menu-btn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
  addEventListener('hashchange', () => render());
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (!/^#\/(session|live|server)/.test(location.hash)) render(true); }, 300); });

  bindFilters();
  fetch('/api/me', { credentials: 'same-origin' }).then((r) => (r.ok ? start() : showLogin())).catch(showLogin);
})();
