import { db } from './db.js';
import { parseUA, BOT_RE } from './ua.js';
import { stats } from './stats.js';

export const SID_RE = /^rt_[a-z0-9]{16}$/;
const VID_RE = /^v[a-z0-9]{15}$/;

const sitesCache = new Map();
export function siteById(id) {
  if (!sitesCache.has(id)) sitesCache.set(id, db.prepare('SELECT * FROM sites WHERE id = ?').get(id) || null);
  return sitesCache.get(id);
}
export function clearSiteCache() { sitesCache.clear(); }

const q = {
  getSession: db.prepare('SELECT id, site_id FROM sessions WHERE id = ?'),
  insertSession: db.prepare(`INSERT INTO sessions (id, site_id, visitor_id, started_at, last_seen) VALUES (?, ?, ?, ?, ?)`),
  updateMeta: db.prepare(`UPDATE sessions SET url=?, path=?, title=?, referrer=?, ref_host=?, utm_source=?, utm_medium=?, utm_campaign=?, utm_content=?, utm_term=?,
    device=?, os=?, browser=?, country=?, lang=?, vw=?, vh=?, load_ms=?, is_bot=?, is_returning=? WHERE id=?`),
  updateState: db.prepare(`UPDATE sessions SET last_seen=?, duration_ms=MAX(duration_ms, ?), engaged_ms=MAX(engaged_ms, ?), max_scroll=MAX(max_scroll, ?),
    doc_h=?, cur_section=COALESCE(?, cur_section), layout=COALESCE(?, layout), finished=MAX(finished, ?) WHERE id=?`),
  upsertSection: db.prepare(`INSERT INTO session_sections (session_id, site_id, section, ord, reached, first_t, dwell_ms, still_ms, moving_s, scroll_vh, rereads, attention)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(session_id, section) DO UPDATE SET ord=excluded.ord, reached=MAX(reached, excluded.reached), first_t=CASE WHEN first_t > 0 THEN first_t ELSE excluded.first_t END,
      dwell_ms=MAX(dwell_ms, excluded.dwell_ms), still_ms=MAX(still_ms, excluded.still_ms), moving_s=MAX(moving_s, excluded.moving_s),
      scroll_vh=MAX(scroll_vh, excluded.scroll_vh), rereads=MAX(rereads, excluded.rereads),
      attention=CASE WHEN excluded.dwell_ms >= dwell_ms THEN excluded.attention ELSE attention END`),
  insertEvent: db.prepare(`INSERT INTO events (session_id, site_id, ts, t, type, section, x, y, label, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
  bumpCounters: db.prepare(`UPDATE sessions SET clicks=clicks+?, rage_clicks=rage_clicks+?, dead_clicks=dead_clicks+?, cta_clicks=cta_clicks+?, checkout_clicks=checkout_clicks+?,
    exit_intent=MAX(exit_intent, ?), popups=popups+? WHERE id=?`),
  insertTrace: db.prepare('INSERT INTO traces (session_id, seq, points) VALUES (?, ?, ?)'),
  insertManualConv: db.prepare(`INSERT INTO conversions (site_id, session_id, tx_id, value, currency, status, product, source, raw, created_at) VALUES (?, ?, ?, ?, 'BRL', 'approved', ?, 'manual', ?, ?)
    ON CONFLICT DO NOTHING`),
  markConverted: db.prepare('UPDATE sessions SET converted=1, revenue=(SELECT COALESCE(SUM(value),0) FROM conversions WHERE session_id=? AND status=\'approved\') WHERE id=?'),
};

const str = (v, n = 200) => (v == null ? null : String(v).slice(0, n));
const num = (v) => (typeof v === 'number' && isFinite(v) ? v : null);

function refHost(ref) {
  try { return ref ? new URL(ref).hostname.replace(/^www\./, '') : null; } catch { return null; }
}

// Recebe um lote do tracker. Retorna status HTTP.
export function collect(body, req) {
  let p;
  try { p = JSON.parse(body); } catch { stats.collectErrors++; return 400; }
  if (!p || !SID_RE.test(p.sid) || typeof p.site !== 'string') { stats.collectErrors++; return 400; }
  const site = siteById(p.site);
  if (!site) { stats.collectErrors++; return 404; }
  const now = Date.now();
  const sid = p.sid;

  const run = () => {
    const existing = q.getSession.get(sid);
    if (existing && existing.site_id !== site.id) return 403;
    if (!existing) q.insertSession.run(sid, site.id, VID_RE.test(p.vid) ? p.vid : null, Math.round(now - (num(p.st?.dur) || 0)), now);

    if (p.meta && typeof p.meta === 'object') {
      const m = p.meta;
      const ua = String(req.headers['user-agent'] || '');
      const { device, os, browser } = parseUA(ua, num(m.vw) || 0);
      const utm = m.utm || {};
      const country = str(req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || req.headers['x-country'] || (String(m.lang || '').split('-')[1] || '').toUpperCase() || null, 4);
      q.updateMeta.run(str(m.url, 1000), str(m.path), str(m.title), str(m.ref, 500), refHost(m.ref),
        str(utm.utm_source), str(utm.utm_medium), str(utm.utm_campaign), str(utm.utm_content), str(utm.utm_term),
        device, os, browser, country, str(m.lang, 20), num(m.vw), num(m.vh), num(m.load),
        m.bot || BOT_RE.test(ua) ? 1 : 0, m.ret ? 1 : 0, sid);
    }

    const st = p.st || {};
    const lay = st.lay && Array.isArray(st.lay.s) ? JSON.stringify({ h: num(st.lay.h), w: num(st.lay.w), s: st.lay.s.slice(0, 60) }) : null;
    q.updateState.run(now, num(st.dur) || 0, Math.min(num(st.eng) || 0, (num(st.dur) || 0) + 1000), Math.min(1, num(st.max) || 0), num(st.lay?.h), str(st.cur, 80), lay, st.fin ? 1 : 0, sid);

    if (st.sec && typeof st.sec === 'object') {
      let n = 0;
      for (const [name, v] of Object.entries(st.sec)) {
        if (++n > 60 || !Array.isArray(v)) break;
        const [o, r, ft, d, still, mv, px, rr, a] = v;
        q.upsertSection.run(sid, site.id, str(name, 80), num(o) ?? -1, r ? 1 : 0, num(ft) || 0, num(d) || 0, num(still) || 0, num(mv) || 0, num(px) || 0, num(rr) || 0,
          Array.isArray(a) ? JSON.stringify(a.slice(0, 20).map((x) => num(x) || 0)) : null);
      }
    }

    const evs = Array.isArray(p.ev) ? p.ev.slice(0, 300) : [];
    const c = { click: 0, rage: 0, dead: 0, cta: 0, checkout: 0, exitIntent: 0, popup: 0 };
    for (const e of evs) {
      if (!e || typeof e.type !== 'string') continue;
      const type = e.type.slice(0, 30);
      const data = {};
      for (const k of ['id', 'tag', 'href', 'dead', 'cta', 'checkout', 'rage', 'value', 'data']) if (e[k] != null) data[k] = e[k];
      q.insertEvent.run(sid, site.id, Math.round(now - Math.max(0, (num(st.dur) || 0) - (num(e.t) || 0))), num(e.t) || 0, type, str(e.section, 80), num(e.x), num(e.y), str(e.label, 150),
        Object.keys(data).length ? JSON.stringify(data).slice(0, 1000) : null);
      if (type === 'click') {
        c.click++; if (e.rage) c.rage++; if (e.dead) c.dead++; if (e.cta) c.cta++; if (e.checkout) c.checkout++;
      } else if (type === 'exit_intent') c.exitIntent = 1;
      else if (type === 'popup') c.popup++;
      else if (type === 'conversion') {
        q.insertManualConv.run(site.id, sid, 'manual-' + sid + '-' + (num(e.t) || 0), num(e.value) || 0, str(e.data, 200), JSON.stringify(e).slice(0, 2000), now);
        q.markConverted.run(sid, sid);
      }
    }
    if (evs.length) q.bumpCounters.run(c.click, c.rage, c.dead, c.cta, c.checkout, c.exitIntent, c.popup, sid);

    if (Array.isArray(p.tr) && p.tr.length) q.insertTrace.run(sid, num(p.seq) || 0, JSON.stringify(p.tr.slice(0, 2000)));
    stats.events += evs.length;
    return 204;
  };

  try {
    db.exec('BEGIN');
    const r = run();
    db.exec(r === 204 ? 'COMMIT' : 'ROLLBACK');
    if (r === 204) stats.collected++;
    else stats.collectErrors++;
    return r;
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch {}
    stats.collectErrors++;
    console.error('[collect]', err.message);
    return 500;
  }
}
