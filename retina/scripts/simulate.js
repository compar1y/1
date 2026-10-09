#!/usr/bin/env node
// Gerador de tráfego simulado para testar o Retina sem precisar de visitas reais.
//
//   npm run simulate                      → 1.500 sessões espalhadas nos últimos 14 dias (grava direto no banco)
//   npm run simulate -- --sessions 3000 --days 30
//   npm run simulate -- --live            → visitantes "ao vivo" chegando em tempo real via HTTP (Ctrl+C para parar)
//   npm run simulate -- --live --url http://localhost:3000 --site demo
//
// O comportamento usa o layout real da página de demonstração (scripts/demo-layout.json),
// então heatmaps e replays batem com a página de verdade.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const SITE = args.site || 'demo';
const N = Number(args.sessions || 1500);
const DAYS = Number(args.days || 14);
const LIVE = !!args.live;
const URL_BASE = (args.url || 'http://localhost:3000').replace(/\/$/, '');

const LAYOUT = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'demo-layout.json'), 'utf8'));
// ignora elementos fora da tela (ex.: itens escondidos de carrossel)
for (const L of Object.values(LAYOUT)) L.elements = L.elements.filter((e) => e.x > 0 && e.x < 1 && e.y >= 0 && e.y <= 1);

// ---------- aleatoriedade ----------
const rnd = Math.random;
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
function weighted(items) { const t = items.reduce((a, i) => a + i[1], 0); let r = rnd() * t; for (const [v, w] of items) { if ((r -= w) <= 0) return v; } return items[0][0]; }
function gauss() { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const logn = (mean, sd = 0.5) => mean * Math.exp(gauss() * sd - (sd * sd) / 2);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const id36 = (n) => { const c = 'abcdefghijklmnopqrstuvwxyz0123456789'; const b = crypto.randomBytes(n); let s = ''; for (const x of b) s += c[x % 36]; return s; };

// ---------- perfis de tráfego ----------
const CREATIVES = [
  ['criativo-01-video-marceneiro', 0.55], ['criativo-02-carrossel-projetos', 0.45], ['criativo-03-ugc-renda-extra', 0.72], ['criativo-04-antes-depois', 0.35],
];
const UA = {
  insta: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 341.0.0.0 (iPhone14,5; iOS 17_5; pt_BR)',
  instaAndroid: 'Mozilla/5.0 (Linux; Android 13; SM-A145M Build/TP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0 Mobile Safari/537.36 Instagram 341.0.0.0 Android',
  fb: 'Mozilla/5.0 (Linux; Android 12; moto g22) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/470.0.0.0;]',
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Mobile Safari/537.36',
  safari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  tiktok: 'Mozilla/5.0 (Linux; Android 13; Redmi Note 12) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0 Mobile Safari/537.36 musical_ly_2023 BytedanceWebview',
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36',
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
};

function profile() {
  const src = weighted([['facebook', 62], ['instagram', 12], ['google', 8], ['tiktok', 6], ['direto', 12]]);
  let device = rnd() < (src === 'google' || src === 'direto' ? 0.55 : 0.88) ? 'mobile' : 'desktop';
  let ua, utm = {}, ref = '', quality = 0.5;
  if (src === 'facebook') {
    const [content, q] = weighted(CREATIVES.map((c) => [c, c[0].includes('ugc') ? 30 : 23]));
    quality = q;
    utm = { utm_source: 'facebook', utm_medium: 'paid', utm_campaign: weighted([['MAD-ABO-PUBLICOS', 45], ['MAD-CBO-ESCALA', 40], ['MAD-RMKT-7D', 15]]), utm_content: content, utm_term: weighted([['feed', 50], ['stories', 30], ['reels', 20]]) };
    if (utm.utm_campaign === 'MAD-RMKT-7D') quality += 0.18;
    ua = device === 'mobile' ? weighted([[UA.insta, 35], [UA.instaAndroid, 22], [UA.fb, 33], [UA.chromeAndroid, 10]]) : UA.desktop;
  } else if (src === 'instagram') { ref = 'https://l.instagram.com/'; quality = 0.6; ua = device === 'mobile' ? pick([UA.insta, UA.instaAndroid]) : UA.mac; utm = { utm_source: 'instagram', utm_medium: 'bio' }; }
  else if (src === 'google') { ref = 'https://www.google.com/'; quality = 0.65; utm = { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'MAD-PESQUISA' }; ua = device === 'mobile' ? UA.chromeAndroid : UA.desktop; }
  else if (src === 'tiktok') { quality = 0.32; utm = { utm_source: 'tiktok', utm_medium: 'paid', utm_campaign: 'MAD-TT-TESTE', utm_content: 'tt-video-01' }; ua = UA.tiktok; device = 'mobile'; }
  else { quality = 0.6; ua = device === 'mobile' ? pick([UA.safari, UA.chromeAndroid]) : pick([UA.desktop, UA.mac]); }
  return { device, ua, utm, ref, quality: clamp(quality + gauss() * 0.15, 0.05, 0.98) };
}

// ---------- comportamento por seção ----------
//            Hero  Galeria  ParaQuem  Coleções  Bônus  Entrega  Preços  Marcelo  FAQ   Rodapé
const HOLD = [0.66, 0.83,    0.86,     0.70,     0.80,  0.94,    0.58,   0.74,    0.70, 1];
const DWELL = [9,   11,      10,       34,       20,    5,       26,     11,      21,   3];
const STILL = [0.6, 0.45,    0.65,     0.35,     0.5,   0.4,     0.7,    0.6,     0.72, 0.5];

function planSession(startTs, forceLive = false) {
  const pr = profile();
  const L = LAYOUT[pr.device];
  const secs = L.sections;
  const vh = L.vh;
  const q = pr.quality;
  const sid = 'rt_' + id36(16);
  const segs = []; // {name, start, dur, still, px, att[]}
  const events = [];
  let t = 300 + rnd() * 500;
  events.push({ type: 'view', t: 300 });
  let lastIdx = 0;
  let checkout = false, buyer = false, value = 0, product = null;
  const elemsOf = (name, inter) => L.elements.filter((e) => e.section === name && e.interactive === inter);

  const click = (name, el, extra = {}) => {
    const jx = (rnd() - 0.5) * el.w * 0.7, jy = (rnd() - 0.5) * el.h * 0.6;
    events.push({ type: 'click', t: Math.round(t), section: name, x: +(el.x + jx).toFixed(3), y: +(el.y + jy).toFixed(3), label: el.label, id: el.id, tag: el.tag, href: el.href || undefined,
      dead: el.interactive ? 0 : 1, cta: el.interactive ? 1 : 0, checkout: el.href && el.href.includes('pay.') ? 1 : 0, rage: 0, ...extra });
  };
  const visit = (i, mult = 1) => {
    const s = secs[i];
    const dur = Math.max(1000, logn(DWELL[i] * 1000 * (0.55 + q * 0.9) * mult, 0.6));
    const stillR = clamp(STILL[i] + gauss() * 0.12 + (q - 0.5) * 0.2, 0.05, 0.95);
    const att = new Array(20).fill(0).map(() => 0.4 + rnd() * 0.6);
    for (const e of L.elements.filter((e) => e.section === s.name && (e.tag === 'h2' || e.tag === 'h1' || e.label.includes('R$') || e.interactive)))
      att[clamp(Math.floor(e.y * 20), 0, 19)] += 1.5 + rnd() * 2;
    // seções longas: atenção cai ao longo da seção
    if (s.height > vh * 2.5) att.forEach((v, k) => { att[k] = v * (1.4 - (k / 20) * 0.9); });
    const sum = att.reduce((a, b) => a + b, 0);
    segs.push({ name: s.name, ord: i, start: t, dur, still: dur * stillR, px: s.height / vh, att: att.map((v) => (v / sum) * dur) });
    t += dur;
  };

  for (let i = 0; i < secs.length; i++) {
    visit(i);
    lastIdx = i;
    const name = secs[i].name;
    // cliques por seção
    if (name === 'Hero' && rnd() < 0.10 + q * 0.12) { click(name, elemsOf(name, true)[0]); }
    if (name === 'Galeria de projetos') {
      if (rnd() < 0.22) { const im = pick(elemsOf(name, false).filter((e) => e.tag === 'img') || []); if (im) { click(name, im); if (rnd() < 0.3) { t += 250; click(name, im, { rage: 1 }); t += 250; click(name, im, { rage: 1 }); } } }
      if (rnd() < 0.05) click(name, elemsOf(name, true)[0]);
    }
    if (name === 'Coleções' && rnd() < 0.16) { const im = pick(elemsOf(name, false).filter((e) => e.tag === 'img')); if (im) click(name, im); }
    if (name === 'Bônus' && rnd() < 0.20) { const im = pick(elemsOf(name, false).filter((e) => e.tag === 'img')); if (im) click(name, im); }
    if (name === 'Bônus' && rnd() < 0.05 + q * 0.06) click(name, elemsOf(name, true)[0]);
    if (name === 'Planos e preços') {
      const els = elemsOf(name, true);
      const complete = els.find((e) => e.id === 'complete-plan-cta'), basic = els.find((e) => e.id === 'basic-plan-cta');
      const r = rnd();
      if (r < 0.10 + q * 0.30) { click(name, complete); checkout = true; product = 'Plano Completo'; value = 27.9; break; }
      if (r < 0.10 + q * 0.30 + 0.10) {
        click(name, basic);
        // popup 1
        t += 400; events.push({ type: 'popup', t: Math.round(t), section: 'Popup desconto R$22,90' });
        segs.push({ name: 'Popup desconto R$22,90', ord: -1, start: t, dur: 4000 + rnd() * 6000, still: 3500, px: 0, att: new Array(20).fill(0).map((_, k) => (k === 10 ? 4000 : 0)) });
        t += segs[segs.length - 1].dur;
        const pe = { x: 0.5, w: 0.6, h: 0.08, interactive: true, tag: 'a', href: 'https://pay.wiapy.com/YQ2RhCk7O0Pd' };
        if (rnd() < 0.35) { click('Popup desconto R$22,90', { ...pe, y: 0.78, label: 'SIM! QUERO O COMPLETO POR R$22,90', id: 'exit1-cta-accept' }); checkout = true; value = 22.9; product = 'Downsell 1'; break; }
        click('Popup desconto R$22,90', { ...pe, y: 0.9, href: null, tag: 'button', label: 'Não, prefiro o básico', id: 'exit1-refusal-btn' });
        t += 400; events.push({ type: 'popup', t: Math.round(t), section: 'Popup desconto R$17,90' });
        segs.push({ name: 'Popup desconto R$17,90', ord: -1, start: t, dur: 3000 + rnd() * 5000, still: 2500, px: 0, att: new Array(20).fill(0).map((_, k) => (k === 10 ? 3000 : 0)) });
        t += segs[segs.length - 1].dur;
        if (rnd() < 0.3) { click('Popup desconto R$17,90', { ...pe, y: 0.78, href: 'https://pay.wiapy.com/gPeRvaElgMwB', label: 'QUERO O COMPLETO POR R$17,90', id: 'exit2-cta-accept' }); checkout = true; value = 17.9; product = 'Downsell 2'; break; }
        if (rnd() < 0.45) { click('Popup desconto R$17,90', { ...pe, y: 0.9, href: 'https://pay.wiapy.com/eiu2dIDEi_2N', label: 'Não, quero só o básico por R$10', id: 'exit2-refusal-btn' }); checkout = true; value = 10; product = 'Plano Básico'; break; }
      }
    }
    if (name === 'FAQ') {
      for (const el of elemsOf(name, true).filter((e) => e.id && e.id.startsWith('faq-toggle'))) {
        const n = Number(el.id.split('-').pop());
        const p = [0.12, 0.1, 0.22, 0.3, 0.12, 0.08, 0.18, 0.2, 0.25, 0.38][n] || 0.1;
        if (rnd() < p * (0.6 + q)) { click(name, el); t += 2500 + rnd() * 5000; }
      }
      // volta para reler o preço
      if (rnd() < 0.22 + q * 0.15) {
        const pi = secs.findIndex((s) => s.name === 'Planos e preços');
        events.push({ type: 'reread', t: Math.round(t), section: 'Planos e preços' });
        segs.push({ name: 'Planos e preços', ord: pi, start: t, dur: 6000 + rnd() * 12000, still: 6000, px: 1, att: new Array(20).fill(0).map((_, k) => (k > 8 && k < 13 ? 2500 : 200)), reread: true });
        t += segs[segs.length - 1].dur;
        if (rnd() < 0.25 + q * 0.3) { click('Planos e preços', L.elements.find((e) => e.id === 'complete-plan-cta')); checkout = true; value = 27.9; product = 'Plano Completo'; lastIdx = pi; break; }
      }
    }
    if (i === secs.length - 1) break;
    const hold = Math.pow(HOLD[i], 1.5 - q);
    if (rnd() > hold) break;
  }
  if (rnd() < 0.12 && pr.device === 'desktop') events.push({ type: 'exit_intent', t: Math.round(t), section: secs[lastIdx].name });
  if (checkout) buyer = rnd() < 0.30 + q * 0.25;
  const end = t + 500;
  events.push({ type: 'exit', t: Math.round(end), section: segs[segs.length - 1].name });
  const load = Math.round(pr.device === 'mobile' ? logn(2300, 0.5) : logn(1300, 0.4));

  return {
    sid, vid: 'v' + id36(15), startTs, end, segs, events, pr, layout: L, checkout, buyer, value, product, load, live: forceLive,
    returning: rnd() < 0.14,
  };
}

// Constrói o payload do tracker com o estado da sessão até o instante `upTo` (ms desde o início)
function payload(plan, upTo, seq, withMeta) {
  const L = plan.layout;
  const sec = {};
  let eng = 0, cur = null;
  L.sections.forEach((s, i) => { sec[s.name] = [i, 0, 0, 0, 0, 0, 0, 0, new Array(20).fill(0)]; });
  for (const g of plan.segs) {
    if (g.start > upTo) break;
    const frac = clamp((upTo - g.start) / g.dur, 0, 1);
    const x = sec[g.name] || (sec[g.name] = [-1, 0, 0, 0, 0, 0, 0, 0, new Array(20).fill(0)]);
    if (!x[1]) { x[1] = 1; x[2] = Math.round(g.start); }
    x[3] += Math.round((g.dur * frac) / 1000) * 1000;
    x[4] += Math.round((g.still * frac) / 1000) * 1000;
    const mv = Math.round(((g.dur - g.still) * frac) / 1000);
    x[5] += mv; x[6] = +(x[6] + g.px * frac).toFixed(2);
    if (g.reread) x[7]++;
    g.att.forEach((v, k) => { x[8][k] += Math.round((v * frac) / 1000) * 1000; });
    eng += g.dur * frac;
    cur = g.name;
  }
  // seções alcançadas: tudo até a seção atual + a próxima que aparece na tela
  const maxOrd = Math.max(...plan.segs.filter((g) => g.start <= upTo && g.ord >= 0).map((g) => g.ord), 0);
  L.sections.forEach((s, i) => { if (i <= maxOrd + 1 && !sec[s.name][1] && s.top < (L.sections[maxOrd].top + L.sections[maxOrd].height)) { sec[s.name][1] = 1; sec[s.name][2] = 0; } });
  const lastPage = L.sections[maxOrd];
  const maxScroll = clamp((lastPage.top + lastPage.height * 0.8 + L.vh * 0.5) / L.docH, L.vh / L.docH, 1);

  // trilha de scroll
  const tr = [];
  for (const g of plan.segs) {
    if (g.start > upTo || g.ord < 0) continue;
    const s = L.sections[g.ord];
    const steps = Math.max(2, Math.round(g.dur / 2500));
    for (let k = 0; k <= steps; k++) {
      const tt = g.start + (g.dur * k) / steps;
      if (tt > upTo) break;
      const y = clamp(s.top + (s.height - L.vh * 0.5) * (k / steps) - L.vh * 0.3, 0, L.docH - L.vh);
      tr.push([Math.round(tt / 100), Math.round(y), L.docH]);
    }
  }
  const evs = plan.events.filter((e) => e.t <= upTo);
  const p = {
    v: 1, site: SITE, sid: plan.sid, vid: plan.vid, seq,
    st: { dur: Math.round(upTo), eng: Math.round(eng / 1000) * 1000, max: +maxScroll.toFixed(3), cur, sec, lay: { h: L.docH, w: L.vw, s: L.sections.map((s) => [s.name, Math.round(s.top), Math.round(s.height)]) }, fin: upTo >= plan.end },
    ev: evs, tr,
  };
  if (withMeta) {
    const url = 'https://projetoscommadeira.com/' + (Object.keys(plan.pr.utm).length ? '?' + new URLSearchParams(plan.pr.utm) : '');
    p.meta = { url, path: '/', title: '+100 Projetos Lucrativos com Madeira', ref: plan.pr.ref, utm: plan.pr.utm, vw: L.vw, vh: L.vh, sw: L.vw, sh: L.vh, dpr: 2, lang: 'pt-BR', tz: 'America/Sao_Paulo', touch: plan.pr.device === 'mobile', bot: false, ret: plan.returning, load: plan.load };
  }
  return p;
}

function hotmartPayload(plan) {
  return {
    event: 'PURCHASE_APPROVED', version: '2.0.0',
    data: {
      product: { id: 4242, name: '+100 Projetos Lucrativos com Madeira - ' + plan.product },
      purchase: { transaction: 'HP' + id36(10).toUpperCase(), status: 'APPROVED', price: { value: plan.value, currency_value: 'BRL' }, origin: { sck: plan.sid, src: plan.pr.utm.utm_source || '' } },
      buyer: { email: 'comprador@exemplo.com' },
    },
  };
}

// ---------- modo histórico: grava direto no banco ----------
async function backfill() {
  const realNow = Date.now;
  process.env.RETINA_DATA_DIR ||= path.resolve(import.meta.dirname, '..', 'data');
  const { bootstrap, db } = await import('../server/db.js');
  bootstrap();
  const { collect } = await import('../server/collect.js');
  const { handleWebhook } = await import('../server/webhook.js');
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(SITE);
  if (!site) { console.error(`Site "${SITE}" não existe.`); process.exit(1); }

  const now = realNow();
  // distribuição: crescimento ao longo dos dias + pico à noite
  const hourW = [2, 1, 1, 0.5, 0.5, 0.6, 1, 2, 3, 4, 4.5, 5, 6, 6, 5.5, 5, 5.5, 6, 7.5, 9, 10, 9, 6, 3.5];
  const times = [];
  while (times.length < N) {
    const d = rnd() * DAYS;
    if (rnd() > 0.45 + 0.55 * (1 - d / DAYS)) continue;
    const ts = now - d * 86400000;
    const h = Number(new Intl.DateTimeFormat('en', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hourCycle: 'h23' }).format(ts));
    if (rnd() * 10 > hourW[h]) continue;
    times.push(ts);
  }
  times.sort((a, b) => a - b);
  let sales = 0, done = 0;
  const fakeReq = (ua) => ({ headers: { 'user-agent': ua } });
  for (const ts of times) {
    const plan = planSession(ts);
    if (ts + plan.end > now) continue;
    Date.now = () => Math.round(ts + plan.end + 2000);
    collect(JSON.stringify(payload(plan, plan.end, 0, true)), fakeReq(plan.pr.ua));
    if (plan.buyer) {
      Date.now = () => Math.round(ts + plan.end + 60000 + rnd() * 600000);
      const site2 = { id: SITE };
      handleWebhook(site2, JSON.stringify(hotmartPayload(plan)), 'hotmart');
      sales++;
    }
    Date.now = realNow;
    if (++done % 250 === 0) process.stdout.write(`  ${done} sessões...\n`);
  }
  // marca tudo como finalizado
  db.prepare('UPDATE sessions SET finished = 1 WHERE site_id = ? AND last_seen < ?').run(SITE, now - 60000);
  // algumas vendas sem sessão ligada (ex.: comprou pelo WhatsApp) para mostrar a diferença no painel
  for (let i = 0; i < Math.round(sales * 0.08); i++) {
    Date.now = () => Math.round(now - rnd() * DAYS * 86400000);
    handleWebhook({ id: SITE }, JSON.stringify({ event: 'PURCHASE_APPROVED', data: { product: { name: 'Plano Completo' }, purchase: { transaction: 'HP' + id36(10).toUpperCase(), status: 'APPROVED', price: { value: 27.9 } } } }), 'hotmart');
  }
  Date.now = realNow;
  console.log(`\n  ✓ ${done} sessões simuladas (${DAYS} dias), ${sales} vendas ligadas a sessões. Abra o painel.\n`);
}

// ---------- modo ao vivo: visitantes chegando em tempo real pelo endpoint HTTP ----------
async function live() {
  console.log(`  Simulando visitantes ao vivo em ${URL_BASE} (site "${SITE}"). Ctrl+C para parar.`);
  const active = new Set();
  const send = (plan, final) => {
    const elapsed = Math.min(Date.now() - plan.startTs, plan.end);
    const pl = payload(plan, elapsed, plan.seq++, plan.seq === 1);
    // como o tracker real: cada lote leva só os eventos e pontos de scroll novos
    const ev = pl.ev.slice(plan.evSent || 0), tr = pl.tr.slice(plan.trSent || 0);
    plan.evSent = pl.ev.length; plan.trSent = pl.tr.length;
    pl.ev = ev; pl.tr = tr;
    const body = JSON.stringify(pl);
    return fetch(URL_BASE + '/c', { method: 'POST', body, headers: { 'Content-Type': 'text/plain', 'User-Agent': plan.pr.ua } }).catch((e) => console.error('  erro:', e.message)).then(() => final);
  };
  setInterval(async () => {
    // mantém de 4 a 14 pessoas na página
    const target = 4 + Math.round(5 + 5 * Math.sin(Date.now() / 120000));
    if (active.size < target && rnd() < 0.6) { const p = planSession(Date.now(), true); p.seq = 0; active.add(p); }
    for (const p of [...active]) {
      const elapsed = Date.now() - p.startTs;
      if (elapsed >= p.end) {
        active.delete(p);
        await send(p, true);
        if (p.buyer) {
          setTimeout(() => fetch(`${URL_BASE}/cv?site=${SITE}&sid=${p.sid}&value=${p.value}&tx=LIVE${id36(8)}`).catch(() => {}), 5000);
        }
      } else if (!p.lastSend || Date.now() - p.lastSend > 5000) { p.lastSend = Date.now(); send(p, false); }
    }
    process.stdout.write(`\r  ${active.size} visitantes na página agora   `);
  }, 1000);
}

if (LIVE) live(); else backfill();
