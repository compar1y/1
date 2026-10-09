import { db, dbSizeBytes, DB_PATH } from './db.js';
import { stats } from './stats.js';

export const TZ = process.env.RETINA_TZ || 'America/Sao_Paulo';
const LIVE_MS = 45000;
const DAY = 86400000;

// ---------------- filtros ----------------
// Todos os endpoints aceitam: site, from, to (ms), device, source, campaign, content, medium, browser, buyer (1/0)
export function parseFilters(qs) {
  const now = Date.now();
  const to = Number(qs.get('to')) || now;
  const from = Number(qs.get('from')) || to - 7 * DAY;
  return {
    site: qs.get('site') || 'demo',
    from, to,
    device: qs.get('device') || null,
    source: qs.get('source') || null,
    campaign: qs.get('campaign') || null,
    content: qs.get('content') || null,
    medium: qs.get('medium') || null,
    browser: qs.get('browser') || null,
    buyer: qs.get('buyer') ?? null,
    bots: qs.get('bots') === '1',
  };
}

function where(f, alias = 's') {
  const w = [`${alias}.site_id = ?`, `${alias}.started_at >= ?`, `${alias}.started_at < ?`];
  const p = [f.site, f.from, f.to];
  if (!f.bots) w.push(`${alias}.is_bot = 0`);
  if (f.device === 'desktop') { w.push(`${alias}.device IN ('desktop','tablet')`); }
  else if (f.device) { w.push(`${alias}.device = ?`); p.push(f.device); }
  const eq = { source: 'utm_source', campaign: 'utm_campaign', content: 'utm_content', medium: 'utm_medium', browser: 'browser' };
  for (const [k, col] of Object.entries(eq)) {
    if (f[k] == null) continue;
    if (f[k] === '(nenhum)') w.push(`${alias}.${col} IS NULL`);
    else { w.push(`${alias}.${col} = ?`); p.push(f[k]); }
  }
  if (f.buyer === '1') w.push(`${alias}.converted = 1`);
  if (f.buyer === '0') w.push(`${alias}.converted = 0`);
  return { sql: w.join(' AND '), params: p };
}

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
const median = (arr) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const pct = (a, b) => (b ? a / b : 0);
const isFinished = (s, now) => s.finished || now - s.last_seen > LIVE_MS * 2;

function sourceOf(s) {
  return s.utm_source || s.ref_host || 'direto';
}

function sessionRows(f, cols = '*') {
  const w = where(f);
  return db.prepare(`SELECT ${cols} FROM sessions s WHERE ${w.sql}`).all(...w.params);
}

// ---------------- visão geral ----------------
function kpis(rows, convs) {
  const n = rows.length;
  const eng = rows.map((r) => r.engaged_ms / 1000);
  const revenueAttr = rows.reduce((a, r) => a + (r.revenue || 0), 0);
  const approved = convs.filter((c) => c.status === 'approved');
  return {
    sessions: n,
    visitors: new Set(rows.map((r) => r.visitor_id || r.id)).size,
    avgEngaged: avg(eng),
    medianEngaged: median(eng),
    avgScroll: avg(rows.map((r) => r.max_scroll)),
    quickExit: pct(rows.filter((r) => r.engaged_ms < 5000 && r.clicks === 0).length, n),
    ctaRate: pct(rows.filter((r) => r.cta_clicks > 0).length, n),
    checkoutRate: pct(rows.filter((r) => r.checkout_clicks > 0).length, n),
    buyers: rows.filter((r) => r.converted).length,
    convRate: pct(rows.filter((r) => r.converted).length, n),
    revenueAttributed: revenueAttr,
    sales: approved.length,
    revenue: approved.reduce((a, c) => a + c.value, 0),
    rpv: n ? approved.reduce((a, c) => a + c.value, 0) / n : 0,
    rageRate: pct(rows.filter((r) => r.rage_clicks > 0).length, n),
    avgLoad: avg(rows.filter((r) => r.load_ms > 0).map((r) => r.load_ms)),
  };
}

function bucketKey(ts, hourly) {
  const d = new Date(ts);
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(d);
  const g = (t) => parts.find((p) => p.type === t).value;
  return hourly ? `${g('year')}-${g('month')}-${g('day')} ${g('hour')}h` : `${g('year')}-${g('month')}-${g('day')}`;
}

function groupCount(rows, keyFn, limit = 8) {
  const m = new Map();
  for (const r of rows) { const k = keyFn(r) ?? '—'; m.set(k, (m.get(k) || 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([k, v]) => ({ key: k, n: v }));
}

export function overview(f) {
  const rows = sessionRows(f);
  const convs = db.prepare('SELECT * FROM conversions WHERE site_id = ? AND created_at >= ? AND created_at < ?').all(f.site, f.from, f.to);
  const span = f.to - f.from;
  const prevF = { ...f, from: f.from - span, to: f.from };
  const prevRows = sessionRows(prevF);
  const prevConvs = db.prepare('SELECT * FROM conversions WHERE site_id = ? AND created_at >= ? AND created_at < ?').all(f.site, prevF.from, prevF.to);

  const hourly = span <= 2 * DAY;
  const series = new Map();
  // preenche buckets vazios
  const step = hourly ? 3600000 : DAY;
  for (let t = f.from; t < f.to; t += step) series.set(bucketKey(t, hourly), { key: bucketKey(t, hourly), sessions: 0, checkout: 0, sales: 0 });
  for (const r of rows) { const k = bucketKey(r.started_at, hourly); const b = series.get(k) || { key: k, sessions: 0, checkout: 0, sales: 0 }; b.sessions++; if (r.checkout_clicks) b.checkout++; series.set(k, b); }
  for (const c of convs) { if (c.status !== 'approved') continue; const k = bucketKey(c.created_at, hourly); const b = series.get(k); if (b) b.sales++; }

  const n = rows.length;
  const funnel = [
    { label: 'Visitas', n },
    { label: 'Ficaram 10s+', n: rows.filter((r) => r.engaged_ms >= 10000).length },
    { label: 'Rolaram 50%+', n: rows.filter((r) => r.max_scroll >= 0.5).length },
    { label: 'Clicaram em botão', n: rows.filter((r) => r.cta_clicks > 0).length },
    { label: 'Foram ao checkout', n: rows.filter((r) => r.checkout_clicks > 0).length },
    { label: 'Compraram', n: rows.filter((r) => r.converted).length },
  ];

  return {
    kpis: kpis(rows, convs),
    prev: kpis(prevRows, prevConvs),
    hourly,
    series: [...series.values()].sort((a, b) => (a.key < b.key ? -1 : 1)),
    devices: groupCount(rows, (r) => r.device),
    browsers: groupCount(rows, (r) => r.browser),
    sources: groupCount(rows, sourceOf),
    funnel,
    live: db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE site_id = ? AND last_seen > ? AND finished = 0 AND is_bot = 0').get(f.site, Date.now() - LIVE_MS).n,
    insights: insights(f, rows),
  };
}

// ---------------- retenção por seção (o "gráfico da VTurb" da página) ----------------
export function sectionStats(f, rowsIn) {
  const rows = rowsIn || sessionRows(f, 'id, cur_section, finished, last_seen, converted, max_scroll, engaged_ms');
  const ids = new Set(rows.map((r) => r.id));
  const w = where(f);
  const secRows = db.prepare(`SELECT ss.* FROM session_sections ss JOIN sessions s ON s.id = ss.session_id WHERE ${w.sql}`).all(...w.params);
  const clickRows = db.prepare(`SELECT e.section, COUNT(*) AS n, SUM(json_extract(e.data,'$.cta')) AS cta FROM events e JOIN sessions s ON s.id = e.session_id WHERE ${w.sql} AND e.type='click' GROUP BY e.section`).all(...w.params);
  const clicksBy = new Map(clickRows.map((c) => [c.section, c]));
  const now = Date.now();
  const total = ids.size;

  const exitsBy = new Map();
  let finishedN = 0;
  for (const r of rows) {
    if (!isFinished(r, now) || r.converted) continue;
    finishedN++;
    exitsBy.set(r.cur_section, (exitsBy.get(r.cur_section) || 0) + 1);
  }

  const m = new Map();
  for (const r of secRows) {
    if (!ids.has(r.session_id)) continue;
    let s = m.get(r.section);
    if (!s) { s = { section: r.section, ords: [], reached: 0, dwell: [], still: 0, dwellSum: 0, moving: 0, scrollVh: 0, rereads: 0, att: new Array(20).fill(0), popup: true }; m.set(r.section, s); }
    if (r.ord >= 0) { s.ords.push(r.ord); s.popup = false; }
    if (r.reached) s.reached++;
    if (r.dwell_ms > 0) s.dwell.push(r.dwell_ms / 1000);
    s.dwellSum += r.dwell_ms; s.still += r.still_ms; s.moving += r.moving_s; s.scrollVh += r.scroll_vh;
    if (r.rereads > 0) s.rereads++;
    if (r.attention) { try { JSON.parse(r.attention).forEach((v, i) => { s.att[i] += v; }); } catch {} }
  }

  const list = [...m.values()].map((s) => {
    const stillRatio = s.dwellSum ? s.still / s.dwellSum : 0;
    const speed = s.moving ? s.scrollVh / s.moving : 0; // telas por segundo enquanto rola
    let pace = 'escaneando';
    if (stillRatio >= 0.55 && speed < 0.9) pace = 'lendo';
    else if (stillRatio < 0.3 || speed > 1.4) pace = 'passando batido';
    const c = clicksBy.get(s.section);
    return {
      section: s.section,
      popup: s.popup,
      ord: median(s.ords),
      reached: s.reached,
      reachRate: pct(s.reached, total),
      exits: exitsBy.get(s.section) || 0,
      avgDwell: avg(s.dwell),
      medianDwell: median(s.dwell),
      totalAttentionShare: 0,
      stillRatio,
      speed,
      pace,
      rereadRate: pct(s.rereads, s.reached),
      clicks: c ? c.n : 0,
      ctaClicks: c ? c.cta || 0 : 0,
      attention: s.att.map((v) => (s.reached ? v / s.reached / 1000 : 0)),
    };
  });
  const totalAtt = list.reduce((a, s) => a + s.avgDwell * s.reached, 0);
  for (const s of list) {
    s.totalAttentionShare = totalAtt ? (s.avgDwell * s.reached) / totalAtt : 0;
    s.exitRate = pct(s.exits, s.reached);
    s.exitShare = pct(s.exits, finishedN);
  }
  const page = list.filter((s) => !s.popup).sort((a, b) => a.ord - b.ord);
  page.forEach((s, i) => { s.dropFromPrev = i ? Math.max(0, page[i - 1].reachRate - s.reachRate) : 1 - s.reachRate; });
  return { total, finished: finishedN, sections: page, popups: list.filter((s) => s.popup) };
}

export function retention(f) {
  const rows = sessionRows(f, 'id, cur_section, finished, last_seen, converted, max_scroll, engaged_ms');
  const n = rows.length;
  const scrollCurve = [];
  for (let p = 0; p <= 100; p += 5) scrollCurve.push({ x: p, y: pct(rows.filter((r) => r.max_scroll * 100 >= p - 0.001).length, n) });
  const secs = rows.map((r) => r.engaged_ms / 1000).sort((a, b) => a - b);
  const p95 = secs.length ? secs[Math.floor(secs.length * 0.95)] : 0;
  const maxT = Math.max(120, Math.min(1800, Math.ceil(p95 / 30) * 30));
  const stepT = maxT <= 300 ? 5 : maxT <= 900 ? 15 : 30;
  const timeCurve = [];
  for (let t = 0; t <= maxT; t += stepT) timeCurve.push({ x: t, y: pct(secs.filter((s) => s >= t).length, n) });
  return { ...sectionStats(f, rows), scrollCurve, timeCurve };
}

// ---------------- heatmaps ----------------
export function heatmap(f) {
  const w = where(f);
  const clicks = db.prepare(`SELECT e.section, e.x, e.y, json_extract(e.data,'$.rage') AS rage, json_extract(e.data,'$.dead') AS dead, e.label
    FROM events e JOIN sessions s ON s.id = e.session_id WHERE ${w.sql} AND e.type = 'click' AND e.x IS NOT NULL ORDER BY e.id DESC LIMIT 30000`).all(...w.params);
  const st = sectionStats(f);
  // layout de referência mais comum para esse filtro (fallback quando a página não carrega no iframe)
  const lay = db.prepare(`SELECT layout FROM sessions s WHERE ${w.sql} AND layout IS NOT NULL ORDER BY last_seen DESC LIMIT 1`).get(...w.params);
  return {
    total: st.total,
    clicks: clicks.map((c) => [c.section, c.x, c.y, c.rage ? 1 : 0, c.dead ? 1 : 0]),
    sections: st.sections.map((s) => ({ section: s.section, reachRate: s.reachRate, avgDwell: s.avgDwell, attention: s.attention, exitRate: s.exitRate, share: s.totalAttentionShare, clicks: s.clicks })),
    layout: lay ? JSON.parse(lay.layout) : null,
  };
}

// ---------------- cliques ----------------
export function clicks(f) {
  const w = where(f);
  const base = `FROM events e JOIN sessions s ON s.id = e.session_id WHERE ${w.sql} AND e.type = 'click'`;
  const elements = db.prepare(`SELECT e.label, e.section, json_extract(e.data,'$.tag') AS tag, json_extract(e.data,'$.id') AS el_id,
      COUNT(*) AS n, COUNT(DISTINCT e.session_id) AS sessions,
      SUM(json_extract(e.data,'$.rage')) AS rage, SUM(json_extract(e.data,'$.dead')) AS dead,
      SUM(json_extract(e.data,'$.checkout')) AS checkout, SUM(s.converted) AS buyers, AVG(e.t) AS avg_t
    ${base} GROUP BY e.label, e.section, el_id ORDER BY n DESC LIMIT 150`).all(...w.params);
  const total = db.prepare(`SELECT COUNT(*) AS n FROM sessions s WHERE ${w.sql}`).get(...w.params).n;
  const other = db.prepare(`SELECT e.type, COUNT(*) AS n, COUNT(DISTINCT e.session_id) AS sessions FROM events e JOIN sessions s ON s.id = e.session_id
    WHERE ${w.sql} AND e.type NOT IN ('click','view','hide','show') GROUP BY e.type ORDER BY n DESC`).all(...w.params);
  const copies = db.prepare(`SELECT e.label, e.section, COUNT(*) AS n FROM events e JOIN sessions s ON s.id = e.session_id
    WHERE ${w.sql} AND e.type = 'copy' AND e.label IS NOT NULL GROUP BY e.label ORDER BY n DESC LIMIT 30`).all(...w.params);
  const errors = db.prepare(`SELECT e.label, COUNT(*) AS n FROM events e JOIN sessions s ON s.id = e.session_id
    WHERE ${w.sql} AND e.type = 'js_error' GROUP BY e.label ORDER BY n DESC LIMIT 20`).all(...w.params);
  return { total, elements, other, copies, errors };
}

// ---------------- compradores x não compradores ----------------
export function compare(f, by = 'converted') {
  const col = by === 'checkout' ? 'checkout_clicks > 0' : 'converted = 1';
  const rows = sessionRows(f, `id, engaged_ms, max_scroll, clicks, cta_clicks, rage_clicks, finished, last_seen, cur_section, converted, (${col}) AS grp`);
  const groups = { yes: rows.filter((r) => r.grp), no: rows.filter((r) => !r.grp) };
  const out = { by, groups: {} };
  const secMaps = {};
  const w = where(f);
  const secAll = db.prepare(`SELECT ss.session_id, ss.section, ss.ord, ss.reached, ss.dwell_ms, ss.rereads FROM session_sections ss JOIN sessions s ON s.id = ss.session_id WHERE ${w.sql}`).all(...w.params);
  for (const [k, g] of Object.entries(groups)) {
    const ids = new Set(g.map((r) => r.id));
    out.groups[k] = {
      n: g.length,
      avgEngaged: avg(g.map((r) => r.engaged_ms / 1000)),
      avgScroll: avg(g.map((r) => r.max_scroll)),
      avgClicks: avg(g.map((r) => r.clicks)),
    };
    const m = new Map();
    for (const r of secAll) {
      if (!ids.has(r.session_id)) continue;
      let s = m.get(r.section);
      if (!s) { s = { section: r.section, ords: [], reached: 0, dwell: [], rereads: 0 }; m.set(r.section, s); }
      if (r.ord >= 0) s.ords.push(r.ord);
      if (r.reached) s.reached++;
      if (r.dwell_ms > 0) s.dwell.push(r.dwell_ms / 1000);
      if (r.rereads) s.rereads++;
    }
    secMaps[k] = m;
  }
  const names = new Set([...secMaps.yes.keys(), ...secMaps.no.keys()]);
  const sections = [...names].map((name) => {
    const y = secMaps.yes.get(name), n = secMaps.no.get(name);
    const ords = [...(y?.ords || []), ...(n?.ords || [])];
    return {
      section: name,
      ord: ords.length ? median(ords) : 999,
      yes: { reachRate: pct(y?.reached || 0, out.groups.yes.n), avgDwell: avg(y?.dwell || []), rereadRate: pct(y?.rereads || 0, y?.reached || 0) },
      no: { reachRate: pct(n?.reached || 0, out.groups.no.n), avgDwell: avg(n?.dwell || []), rereadRate: pct(n?.rereads || 0, n?.reached || 0) },
    };
  }).sort((a, b) => a.ord - b.ord);
  out.sections = sections;
  // insights: onde compradores passam muito mais tempo
  out.insights = sections
    .filter((s) => s.yes.avgDwell > 0 && s.no.avgDwell > 0 && out.groups.yes.n >= 3)
    .map((s) => ({ section: s.section, ratio: s.yes.avgDwell / s.no.avgDwell, yes: s.yes.avgDwell, no: s.no.avgDwell }))
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 3);
  return out;
}

// ---------------- origens / UTMs ----------------
const DIMS = { source: 'utm_source', medium: 'utm_medium', campaign: 'utm_campaign', content: 'utm_content', term: 'utm_term', ref: 'ref_host', device: 'device', browser: 'browser', os: 'os', country: 'country' };
export function sources(f, dim = 'source') {
  const col = DIMS[dim] || 'utm_source';
  const rows = sessionRows(f, `${col} AS k, engaged_ms, max_scroll, cta_clicks, checkout_clicks, converted, revenue`);
  const m = new Map();
  for (const r of rows) {
    const k = r.k ?? '(nenhum)';
    let g = m.get(k);
    if (!g) { g = { key: k, n: 0, eng: 0, scroll: 0, cta: 0, checkout: 0, buyers: 0, revenue: 0 }; m.set(k, g); }
    g.n++; g.eng += r.engaged_ms / 1000; g.scroll += r.max_scroll; if (r.cta_clicks) g.cta++; if (r.checkout_clicks) g.checkout++; if (r.converted) g.buyers++; g.revenue += r.revenue || 0;
  }
  return {
    dim,
    rows: [...m.values()].sort((a, b) => b.n - a.n).map((g) => ({
      key: g.key, sessions: g.n, avgEngaged: g.eng / g.n, avgScroll: g.scroll / g.n, ctaRate: g.cta / g.n, checkoutRate: g.checkout / g.n,
      buyers: g.buyers, convRate: g.buyers / g.n, revenue: g.revenue, rpv: g.revenue / g.n,
    })),
  };
}

// ---------------- sessões ----------------
export function sessions(f, qs) {
  const w = where(f);
  const sorts = { recent: 'started_at DESC', engaged: 'engaged_ms DESC', scroll: 'max_scroll DESC', clicks: 'clicks DESC', buyers: 'converted DESC, started_at DESC' };
  const sort = sorts[qs.get('sort')] || sorts.recent;
  const limit = Math.min(200, Number(qs.get('limit')) || 50);
  const offset = Number(qs.get('offset')) || 0;
  let extra = '';
  const p = [...w.params];
  if (qs.get('only') === 'checkout') extra = ' AND checkout_clicks > 0';
  if (qs.get('only') === 'rage') extra = ' AND rage_clicks > 0';
  if (qs.get('only') === 'buyers') extra = ' AND converted = 1';
  if (qs.get('only') === 'engaged') extra = ' AND engaged_ms >= 30000';
  if (qs.get('section')) { extra += ' AND cur_section = ? AND finished = 1'; p.push(qs.get('section')); }
  const total = db.prepare(`SELECT COUNT(*) AS n FROM sessions s WHERE ${w.sql}${extra}`).get(...p).n;
  const rows = db.prepare(`SELECT id, visitor_id, started_at, last_seen, device, os, browser, utm_source, utm_campaign, utm_content, ref_host, country,
      duration_ms, engaged_ms, max_scroll, cur_section, clicks, rage_clicks, checkout_clicks, converted, revenue, finished, is_returning
    FROM sessions s WHERE ${w.sql}${extra} ORDER BY ${sort} LIMIT ? OFFSET ?`).all(...p, limit, offset);
  const now = Date.now();
  return { total, rows: rows.map((r) => ({ ...r, live: !r.finished && now - r.last_seen < LIVE_MS })) };
}

export function session(id) {
  const s = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  if (!s) return null;
  const sections = db.prepare('SELECT * FROM session_sections WHERE session_id = ? ORDER BY ord').all(id);
  const events = db.prepare('SELECT ts, t, type, section, x, y, label, data FROM events WHERE session_id = ? ORDER BY t, id').all(id);
  const trace = db.prepare('SELECT points FROM traces WHERE session_id = ? ORDER BY seq').all(id).flatMap((r) => JSON.parse(r.points));
  const conversions = db.prepare('SELECT tx_id, value, status, product, source, created_at FROM conversions WHERE session_id = ?').all(id);
  const others = s.visitor_id ? db.prepare('SELECT id, started_at, engaged_ms, converted FROM sessions WHERE visitor_id = ? AND id != ? ORDER BY started_at DESC LIMIT 10').all(s.visitor_id, id) : [];
  return {
    session: { ...s, layout: s.layout ? JSON.parse(s.layout) : null, live: !s.finished && Date.now() - s.last_seen < LIVE_MS },
    sections: sections.map((r) => ({ ...r, attention: r.attention ? JSON.parse(r.attention) : null })),
    events: events.map((e) => ({ ...e, data: e.data ? JSON.parse(e.data) : null })),
    trace, conversions, others,
  };
}

// ---------------- ao vivo ----------------
export function live(site) {
  const rows = db.prepare(`SELECT id, started_at, last_seen, device, browser, utm_source, utm_campaign, ref_host, engaged_ms, max_scroll, cur_section, clicks, checkout_clicks
    FROM sessions WHERE site_id = ? AND last_seen > ? AND finished = 0 AND is_bot = 0 ORDER BY started_at DESC LIMIT 200`).all(site, Date.now() - LIVE_MS);
  const bySection = groupCount(rows, (r) => r.cur_section, 50);
  const recentEvents = db.prepare(`SELECT e.session_id, e.ts, e.type, e.section, e.label FROM events e WHERE e.site_id = ? AND e.ts > ? AND e.type IN ('click','exit','popup','conversion','exit_intent','reread','copy')
    ORDER BY e.id DESC LIMIT 40`).all(site, Date.now() - 10 * 60000);
  const last30 = db.prepare(`SELECT (started_at / 60000) AS m, COUNT(*) AS n FROM sessions WHERE site_id = ? AND started_at > ? AND is_bot = 0 GROUP BY m`).all(site, Date.now() - 30 * 60000);
  return { now: Date.now(), sessions: rows, bySection, recentEvents, perMinute: last30 };
}

// ---------------- conversões ----------------
export function conversions(f) {
  return db.prepare(`SELECT c.*, s.utm_source, s.utm_campaign, s.engaged_ms, s.max_scroll, s.device FROM conversions c LEFT JOIN sessions s ON s.id = c.session_id
    WHERE c.site_id = ? AND c.created_at >= ? AND c.created_at < ? ORDER BY c.created_at DESC LIMIT 300`).all(f.site, f.from, f.to)
    .map((c) => ({ ...c, raw: undefined }));
}

// ---------------- insights automáticos ----------------
function insights(f, rows) {
  const out = [];
  if (rows.length < 5) return out;
  const st = sectionStats(f);
  const secs = st.sections;
  if (secs.length >= 2) {
    const worst = [...secs].slice(1).sort((a, b) => b.dropFromPrev - a.dropFromPrev)[0];
    if (worst && worst.dropFromPrev > 0.05) out.push({ kind: 'drop', text: `Maior perda de leads: ${(worst.dropFromPrev * 100).toFixed(0)}% das visitas não chegam em "${worst.section}". O bloco anterior está segurando pouco.`, section: worst.section });
    const exitTop = [...secs].sort((a, b) => b.exits - a.exits)[0];
    if (exitTop && exitTop.exits) out.push({ kind: 'exit', text: `"${exitTop.section}" é onde mais gente fecha a página (${(exitTop.exitShare * 100).toFixed(0)}% das saídas).`, section: exitTop.section });
    const att = [...secs].sort((a, b) => b.totalAttentionShare - a.totalAttentionShare)[0];
    if (att) out.push({ kind: 'attention', text: `"${att.section}" concentra ${(att.totalAttentionShare * 100).toFixed(0)}% de todo o tempo de atenção da página.`, section: att.section });
    const skimmed = secs.filter((s) => s.pace === 'passando batido' && s.reachRate > 0.2);
    if (skimmed.length) out.push({ kind: 'skim', text: `Leads passam batido por: ${skimmed.map((s) => '"' + s.section + '"').join(', ')}. Vale encurtar ou deixar mais visual.` });
    const reread = [...secs].sort((a, b) => b.rereadRate - a.rereadRate)[0];
    if (reread && reread.rereadRate > 0.08) out.push({ kind: 'reread', text: `${(reread.rereadRate * 100).toFixed(0)}% dos que viram "${reread.section}" voltaram para reler. Sinal de interesse (ou dúvida).`, section: reread.section });
  }
  const w = where(f);
  const dead = db.prepare(`SELECT e.label, e.section, COUNT(*) AS n FROM events e JOIN sessions s ON s.id = e.session_id WHERE ${w.sql} AND e.type='click' AND json_extract(e.data,'$.dead') = 1
    GROUP BY e.label, e.section ORDER BY n DESC LIMIT 1`).get(...w.params);
  if (dead && dead.n >= 3) out.push({ kind: 'dead', text: `${dead.n} cliques em algo que não é botão: "${(dead.label || 'elemento sem texto').slice(0, 50)}" em "${dead.section}". As pessoas acham que é clicável.` });
  const mobile = rows.filter((r) => r.device === 'mobile'), desk = rows.filter((r) => r.device !== 'mobile');
  if (mobile.length >= 5 && desk.length >= 5) {
    const cm = pct(mobile.filter((r) => r.checkout_clicks).length, mobile.length), cd = pct(desk.filter((r) => r.checkout_clicks).length, desk.length);
    if (cd > cm * 1.5 && cd - cm > 0.02) out.push({ kind: 'device', text: `No celular, ${(cm * 100).toFixed(1).replace('.', ',')}% vão ao checkout contra ${(cd * 100).toFixed(1).replace('.', ',')}% no desktop. Revise a versão mobile.` });
  }
  const slow = rows.filter((r) => r.load_ms > 4000);
  if (slow.length / rows.length > 0.15) out.push({ kind: 'speed', text: `${((slow.length / rows.length) * 100).toFixed(0)}% das visitas carregaram a página em mais de 4s. Isso derruba a conversão.` });
  return out;
}

// ---------------- servidor / sistema ----------------
export function system() {
  const count = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
  const sites = db.prepare(`SELECT st.id, st.name, st.url, st.webhook_token, st.created_at,
      (SELECT MAX(last_seen) FROM sessions WHERE site_id = st.id) AS last_hit,
      (SELECT COUNT(*) FROM sessions WHERE site_id = st.id AND started_at > ?) AS sessions_24h,
      (SELECT MAX(created_at) FROM conversions WHERE site_id = st.id) AS last_sale
    FROM sites st ORDER BY st.created_at`).all(Date.now() - DAY);
  const mem = process.memoryUsage();
  return {
    version: '1.0.0',
    node: process.version,
    platform: process.platform,
    pid: process.pid,
    uptime: Date.now() - stats.startedAt,
    memory: { rss: mem.rss, heap: mem.heapUsed },
    db: { path: DB_PATH, size: dbSizeBytes(), sessions: count('sessions'), events: count('events'), sections: count('session_sections'), traces: count('traces'), conversions: count('conversions') },
    stats: { ...stats, perMinute: stats.perMinute.slice(-60) },
    sites,
    tz: TZ,
  };
}
