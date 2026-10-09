/*!
 * Retina — tracker de comportamento para páginas de vendas
 * Uso: <script async src="https://SEU-SERVIDOR/r.js" data-site="CHAVE_DO_SITE"></script>
 *
 * Seções: marque blocos da página com data-retina="Nome da seção".
 * Sem marcação, usa <section id>, <header id> e <footer id> automaticamente.
 * Popups/modais: data-retina="Popup X" data-retina-kind="popup".
 */
(function () {
  'use strict';
  if (window.Retina && window.Retina.__loaded) return;

  var script = document.currentScript || document.querySelector('script[data-site][src*="r.js"]');
  if (!script) return;
  var SITE = script.getAttribute('data-site');
  var ENDPOINT = new URL(script.src).origin;
  var params = new URLSearchParams(location.search);

  // Domínios de checkout conhecidos (+ os passados em data-checkout="a.com,b.com")
  var CHECKOUT_HOSTS = ['pay.hotmart.com', 'pay.kiwify.com.br', 'kiwify.app', 'pay.wiapy.com', 'checkout.perfectpay.com.br',
    'pay.braip.com', 'ev.braip.com', 'pay.eduzz.com', 'sun.eduzz.com', 'checkout.ticto.app', 'payment.ticto.app',
    'pay.monetizze.com.br', 'app.monetizze.com.br', 'checkout.greenn.com.br', 'pay.cakto.com.br', 'go.disruptybr.com',
    'checkout.yampi.com.br', 'seguro.lastlink.com']
    .concat((script.getAttribute('data-checkout') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean));

  var SECTION_SEL = '[data-retina]';
  var AUTO_SEL = 'section[id], header[id], footer[id]';
  var BUCKETS = 20;            // resolução do mapa de atenção dentro de cada seção
  var IDLE_MS = 30000;         // sem interação por 30s = não está mais "engajado"
  var FLUSH_MS = 5000;

  // ---------- utilidades ----------
  function now() { return Date.now(); }
  function rid(n) { var s = ''; var c = 'abcdefghijklmnopqrstuvwxyz0123456789'; var a = new Uint8Array(n); (window.crypto || window.msCrypto).getRandomValues(a); for (var i = 0; i < n; i++) s += c[a[i] % 36]; return s; }
  function store(kind, k, v) { try { var s = window[kind]; if (v === undefined) return s.getItem(k); s.setItem(k, v); } catch (e) { return null; } }
  function docH() { var b = document.body, e = document.documentElement; return Math.max(b ? b.scrollHeight : 0, e.scrollHeight, 1); }
  function docW() { return document.documentElement.clientWidth || innerWidth; }
  function txt(el) {
    if (!el) return '';
    var t = el.getAttribute && (el.getAttribute('data-retina-label') || el.getAttribute('aria-label') || el.getAttribute('alt') || el.getAttribute('title'));
    if (!t) t = (el.innerText || el.textContent || el.value || '');
    return String(t).replace(/\s+/g, ' ').trim().slice(0, 80);
  }
  function isCheckout(href) {
    try { var h = new URL(href, location.href).hostname; return CHECKOUT_HOSTS.some(function (d) { return h === d || h.slice(-d.length - 1) === '.' + d; }); } catch (e) { return false; }
  }

  // ---------- seções ----------
  var sections = [];   // [{name, kind, el, top, height}]
  function sectionName(el) {
    return el.getAttribute('data-retina') || el.id || (el.querySelector('h1,h2,h3') ? txt(el.querySelector('h1,h2,h3')).slice(0, 40) : el.tagName.toLowerCase());
  }
  function scanSections() {
    var els = document.querySelectorAll(SECTION_SEL);
    if (!els.length) els = document.querySelectorAll(AUTO_SEL);
    var sy = scrollY, list = [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var r = el.getBoundingClientRect();
      if (r.height < 2 && r.width < 2) continue;
      var kind = el.getAttribute('data-retina-kind') || (getComputedStyle(el).position === 'fixed' ? 'popup' : 'section');
      list.push({ name: sectionName(el), kind: kind, el: el, top: r.top + (kind === 'popup' ? 0 : sy), height: Math.max(r.height, 1) });
    }
    // seções aninhadas: fica só a mais externa
    sections = list.filter(function (s) { return !list.some(function (o) { return o !== s && o.kind === 'section' && s.kind === 'section' && o.el.contains(s.el); }); });
    return sections;
  }
  function pageSections() { return sections.filter(function (s) { return s.kind !== 'popup'; }); }
  function openPopup() { for (var i = 0; i < sections.length; i++) if (sections[i].kind === 'popup' && document.contains(sections[i].el)) return sections[i]; return null; }
  function sectionAtY(y) {
    var ps = pageSections(), best = null;
    for (var i = 0; i < ps.length; i++) { if (y >= ps[i].top && y < ps[i].top + ps[i].height) return ps[i]; if (ps[i].top <= y) best = ps[i]; }
    return best || ps[0] || null;
  }
  function layout() {
    var h = docH();
    return { h: h, w: docW(), s: pageSections().map(function (s) { return [s.name, Math.round(s.top), Math.round(s.height)]; }) };
  }

  // ---------- MODO HEATMAP / REPLAY (dentro do iframe do dashboard) ----------
  if (params.has('retina_heatmap')) {
    var post = function () {
      scanSections();
      parent.postMessage({ retina: 'layout', layout: layout(), scrollY: scrollY, vh: innerHeight, vw: innerWidth }, '*');
    };
    addEventListener('scroll', function () { parent.postMessage({ retina: 'scroll', scrollY: scrollY }, '*'); }, { passive: true });
    addEventListener('message', function (e) {
      var d = e.data || {};
      if (d.retina === 'scrollTo') window.scrollTo({ top: d.y, behavior: d.smooth ? 'smooth' : 'auto' });
      if (d.retina === 'layout?') post();
    });
    addEventListener('load', post); setInterval(post, 1000); setTimeout(post, 300);
    // impede navegação dentro do iframe do dashboard
    document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[href]'); if (a) e.preventDefault(); }, true);
    window.Retina = { __loaded: true, heatmap: true, track: function () {}, conversion: function () {}, decorate: function (u) { return u; } };
    return;
  }
  if (!SITE) { console.warn('[Retina] data-site ausente'); return; }
  // ?retina_off desliga o rastreio neste navegador (para o dono da página); ?retina_on religa
  if (params.has('retina_off')) store('localStorage', 'retina_off', '1');
  if (params.has('retina_on')) store('localStorage', 'retina_off', '0');
  if (store('localStorage', 'retina_off') === '1') return;

  // ---------- identidade ----------
  var vid = store('localStorage', 'rt_vid');
  var returning = !!vid;
  if (!vid) { vid = 'v' + rid(15); store('localStorage', 'rt_vid', vid); }
  var SID = 'rt_' + rid(16);
  var T0 = now();

  // ---------- estado ----------
  var events = [];
  var trace = [];
  var lastActivity = T0;
  var engaged = 0;
  var maxScroll = 0;
  var curSection = null;
  var maxOrd = -1;
  var sec = {};        // name -> {o, r, ft, d, st, mv, px, rr, a:[]}
  var dirty = true;
  var sentMeta = false;
  var seq = 0;
  var lastTraceY = -1;
  var clickHist = [];
  var exitIntentSent = false;

  function S(name) {
    if (!sec[name]) { var a = []; for (var i = 0; i < BUCKETS; i++) a.push(0); sec[name] = { o: -1, r: 0, ft: 0, d: 0, st: 0, mv: 0, px: 0, rr: 0, a: a }; }
    return sec[name];
  }
  function track(type, data) {
    var e = { type: type, t: now() - T0 };
    if (data) for (var k in data) if (data[k] !== undefined && data[k] !== null && data[k] !== '') e[k] = data[k];
    events.push(e); dirty = true;
    if (events.length > 300) events.splice(0, events.length - 300);
  }
  function activity() { lastActivity = now(); }

  function isBot() {
    var ua = navigator.userAgent || '';
    if (params.has('retina_test')) return false;
    return !!navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|facebookexternalhit|preview|monitor/i.test(ua);
  }

  function meta() {
    var utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck', 'fbclid', 'gclid', 'ttclid'].forEach(function (k) { var v = params.get(k); if (v) utm[k] = v.slice(0, 200); });
    var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    return {
      url: location.href.slice(0, 1000), path: location.pathname, title: document.title.slice(0, 200), ref: document.referrer.slice(0, 500), utm: utm,
      vw: innerWidth, vh: innerHeight, sw: screen.width, sh: screen.height, dpr: devicePixelRatio || 1,
      lang: navigator.language, tz: (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone, touch: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,
      bot: isBot(), ret: returning, load: nav && nav.loadEventEnd ? Math.round(nav.loadEventEnd) : (nav ? Math.round(nav.domContentLoadedEventEnd) : null)
    };
  }

  function payload(final) {
    var secOut = {};
    for (var k in sec) { var x = sec[k]; secOut[k] = [x.o, x.r, x.ft, x.d, x.st, x.mv, Math.round(x.px * 100) / 100, x.rr, x.a]; }
    var p = {
      v: 1, site: SITE, sid: SID, vid: vid, seq: seq++,
      st: { dur: now() - T0, eng: engaged, max: Math.round(maxScroll * 1000) / 1000, cur: curSection, sec: secOut, lay: layout(), fin: !!final },
      ev: events.splice(0), tr: trace.splice(0)
    };
    if (!sentMeta) { p.meta = meta(); sentMeta = true; }
    return JSON.stringify(p);
  }
  function flush(final) {
    if (!dirty && !final) return;
    dirty = false;
    var body = payload(final);
    var url = ENDPOINT + '/c';
    try {
      if (final && navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }))) return;
      fetch(url, { method: 'POST', body: body, keepalive: body.length < 60000, mode: 'cors', credentials: 'omit', headers: { 'Content-Type': 'text/plain' } }).catch(function () {});
    } catch (e) {}
  }

  // ---------- loop de 1s: atenção, tempo engajado, velocidade, trilha de scroll ----------
  var lastY = scrollY;
  function tick() {
    var t = now();
    if (t - T0 > 4 * 3600 * 1000) return;           // limite de 4h por sessão
    var visible = document.visibilityState === 'visible';
    var active = visible && (t - lastActivity < IDLE_MS);
    var y = scrollY, vh = innerHeight || 1, h = docH();
    var delta = Math.abs(y - lastY); lastY = y;
    var pct = Math.min(1, (y + vh) / h);
    if (pct > maxScroll) { maxScroll = pct; dirty = true; }

    // seções alcançadas = topo da seção entrou nos 80% superiores da tela
    var ps = pageSections();
    for (var i = 0; i < ps.length; i++) {
      var s = S(ps[i].name);
      if (s.o < 0 || s.o !== i) s.o = i;
      if (!s.r && ps[i].top < y + vh * 0.8) { s.r = 1; s.ft = t - T0; dirty = true; }
    }

    var popup = openPopup();
    var center = popup || sectionAtY(y + vh / 2);
    if (center) {
      var name = center.name;
      if (name !== curSection) {
        var cs = S(name);
        var ord = popup ? -1 : ps.indexOf(center);
        if (!popup && ord >= 0) { if (ord < maxOrd && cs.d > 2000) { cs.rr++; track('reread', { section: name }); } if (ord > maxOrd) maxOrd = ord; }
        if (popup) { if (!cs.r) { cs.r = 1; cs.ft = t - T0; } track('popup', { section: name }); }
        curSection = name; dirty = true;
      }
      if (active) {
        var c = S(name);
        c.d += 1000;
        if (delta < 8) c.st += 1000; else { c.mv += 1; c.px += delta / vh; }
        var rel = popup ? 0.5 : (y + vh / 2 - center.top) / center.height;
        var b = Math.max(0, Math.min(BUCKETS - 1, Math.floor(rel * BUCKETS)));
        c.a[b] += 1000;
        engaged = Math.min(engaged + 1000, t - T0 + 1000);
        dirty = true;
      }
    }
    // trilha de scroll (para replay): só quando muda
    if (Math.abs(y - lastTraceY) > 4) { trace.push([Math.round((t - T0) / 100), Math.round(y), Math.round(h)]); lastTraceY = y; dirty = true; }
  }

  // ---------- eventos do usuário ----------
  var INTERACTIVE = 'a,button,input,select,textarea,label,summary,details,[role=button],[role=tab],[role=link],[onclick],[data-retina-click]';
  function onClick(e) {
    activity();
    var t = e.target; if (!t || !t.closest) return;
    var inter = t.closest(INTERACTIVE);
    if (!inter) { try { if (getComputedStyle(t).cursor === 'pointer') inter = t; } catch (x) {} }
    var el = inter || t;
    var pageY = e.pageY != null ? e.pageY : e.clientY + scrollY;
    var popup = openPopup();
    var s = popup && popup.el.contains(t) ? popup : sectionAtY(pageY);
    var x = e.clientX / (innerWidth || 1);
    var ry = s ? (s.kind === 'popup' ? (e.clientY - s.el.getBoundingClientRect().top) / s.height : (pageY - s.top) / s.height) : pageY / docH();
    var href = inter && inter.closest('a') ? inter.closest('a').href : null;
    var checkout = href ? isCheckout(href) : false;

    // rage click: 3+ cliques em ~1s no mesmo ponto
    var tt = now();
    clickHist = clickHist.filter(function (c) { return tt - c[0] < 1000; });
    clickHist.push([tt, e.clientX, e.clientY]);
    var near = clickHist.filter(function (c) { return Math.abs(c[1] - e.clientX) < 40 && Math.abs(c[2] - e.clientY) < 40; }).length;

    // rótulo: texto do botão/link; em cliques "mortos" descreve o elemento (imagem, título...) sem pegar o texto do bloco inteiro
    var label;
    if (inter) label = txt(el);
    else if (t.tagName === 'IMG') label = 'Imagem: ' + (t.getAttribute('alt') || (t.currentSrc || t.src || '').split('/').pop().split('?')[0]).slice(0, 70);
    else if (t.children.length <= 2 && txt(t).length <= 80) label = txt(t) || ('<' + t.tagName.toLowerCase() + '>');
    else label = (t.id ? '#' + t.id : '<' + t.tagName.toLowerCase() + '>') + ' (área)';
    track('click', {
      section: s ? s.name : null, x: Math.round(x * 1000) / 1000, y: Math.round(ry * 1000) / 1000,
      label: label, id: el.id || undefined, tag: el.tagName.toLowerCase(), href: href ? href.slice(0, 300) : undefined,
      dead: inter ? 0 : 1, cta: inter && /^(a|button)$/i.test(inter.tagName) || (inter && inter.getAttribute('role') === 'button') ? 1 : 0,
      checkout: checkout ? 1 : 0, rage: near >= 3 ? 1 : 0
    });
    if (checkout) { decorateLink(inter.closest('a')); flush(); }
  }

  // anexa o ID da sessão ao link de checkout → o webhook da plataforma devolve e liga venda ↔ comportamento
  function decorate(url) {
    try {
      var u = new URL(url, location.href);
      u.searchParams.set('rsid', SID);
      if (!u.searchParams.get('sck')) u.searchParams.set('sck', SID);
      if (!u.searchParams.get('src')) u.searchParams.set('src', SID);
      if (!u.searchParams.get('utm_id')) u.searchParams.set('utm_id', SID);
      return u.toString();
    } catch (e) { return url; }
  }
  function decorateLink(a) { if (a && a.href && isCheckout(a.href) && a.href.indexOf(SID) < 0) a.href = decorate(a.href); }
  function decorateAll() { var as = document.querySelectorAll('a[href]'); for (var i = 0; i < as.length; i++) decorateLink(as[i]); }

  document.addEventListener('click', onClick, true);
  // links de checkout decorados também no pointerdown (antes de abrir em nova aba)
  document.addEventListener('pointerdown', function (e) { var a = e.target.closest && e.target.closest('a[href]'); if (a) decorateLink(a); }, true);
  ['mousemove', 'keydown', 'touchstart', 'wheel', 'pointerdown'].forEach(function (ev) { addEventListener(ev, activity, { passive: true, capture: true }); });
  addEventListener('scroll', activity, { passive: true });

  document.addEventListener('copy', function () { var s = String(getSelection() || '').replace(/\s+/g, ' ').trim(); track('copy', { label: s.slice(0, 120), section: curSection }); });
  document.addEventListener('focusin', function (e) { var t = e.target; if (t && /^(input|textarea|select)$/i.test(t.tagName)) track('field', { label: (t.name || t.id || t.type || '').slice(0, 60), section: curSection }); });
  document.addEventListener('play', function (e) { track('video_play', { label: (e.target.currentSrc || '').split('/').pop().slice(0, 80), section: curSection }); }, true);
  document.addEventListener('ended', function (e) { track('video_end', { label: (e.target.currentSrc || '').split('/').pop().slice(0, 80), section: curSection }); }, true);
  document.addEventListener('mouseout', function (e) {
    if (!e.relatedTarget && e.clientY <= 0 && !exitIntentSent) { exitIntentSent = true; track('exit_intent', { section: curSection }); }
  });
  addEventListener('error', function (e) { track('js_error', { label: String(e.message || 'erro').slice(0, 150) }); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { track('hide', { section: curSection }); flush(true); }
    else { activity(); track('show', { section: curSection }); }
  });
  addEventListener('pagehide', function () { tick(); track('exit', { section: curSection, y: Math.round(maxScroll * 1000) / 1000 }); flush(true); });
  addEventListener('resize', function () { scanSections(); }, { passive: true });

  // ---------- API pública ----------
  window.Retina = {
    __loaded: true, sid: SID, vid: vid,
    track: function (name, data) { track('custom', { label: String(name).slice(0, 80), data: data ? JSON.stringify(data).slice(0, 500) : undefined, section: curSection }); },
    conversion: function (value, data) { track('conversion', { label: 'manual', value: Number(value) || 0, data: data ? JSON.stringify(data).slice(0, 500) : undefined }); flush(); },
    decorate: decorate,
    flush: function () { flush(); }
  };

  // ---------- start ----------
  function start() {
    scanSections(); decorateAll(); tick();
    track('view', {});
    flush();
    setInterval(tick, 1000);
    setInterval(function () { scanSections(); decorateAll(); }, 2000);
    // popups e seções que aparecem depois (React, lazy-load) são detectados na hora
    var pend = 0;
    if (window.MutationObserver) new MutationObserver(function () {
      if (pend) return; pend = setTimeout(function () { pend = 0; scanSections(); decorateAll(); }, 150);
    }).observe(document.body, { childList: true, subtree: true });
    setInterval(flush, FLUSH_MS);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
