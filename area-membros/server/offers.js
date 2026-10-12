// Motor de ofertas: decide o que cada cliente vê, a partir do catálogo e do que ele já comprou.
// Funções puras (sem banco), para serem testadas isoladamente.

export const PLACEMENTS = ['inline', 'end', 'home', 'store', 'locked'];
const TZ = process.env.TZ_APP || 'America/Sao_Paulo';
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

/** 'AAAA-MM-DD' no fuso de São Paulo */
export const dayKey = (ts = Date.now()) => dayFmt.format(new Date(ts));

/** Confere as referências do catálogo e devolve a lista de problemas (vazia = ok). */
export function validateCatalog(cat) {
  const errors = [];
  const { products = {}, deliverables = {}, offers = {} } = cat;
  const refExists = (ref) => {
    const [d, item] = ref.split('/');
    const del = deliverables[d];
    if (!del) return false;
    return !item || !!del.items?.some((i) => i.id === item);
  };
  for (const [id, p] of Object.entries(products)) {
    if (!Array.isArray(p.grants) || !p.grants.length) errors.push(`produto "${id}": "grants" vazio`);
    for (const g of p.grants || []) if (!deliverables[g]) errors.push(`produto "${id}": entregável "${g}" não existe`);
    if (!Array.isArray(p.match)) errors.push(`produto "${id}": "match" precisa ser uma lista`);
  }
  for (const [id, d] of Object.entries(deliverables)) {
    if (!['library', 'pdf', 'link'].includes(d.type)) errors.push(`entregável "${id}": type inválido (${d.type})`);
    if (d.type === 'library' && !d.items?.length) errors.push(`entregável "${id}": library sem items`);
    for (const it of d.items || []) if (!it.file && !d.file) errors.push(`entregável "${id}": parte "${it.id}" sem arquivo (defina file na parte ou no entregável)`);
    if (d.type === 'link' && !d.url) errors.push(`entregável "${id}": link sem url`);
    if (d.lockedOffer && !offers[d.lockedOffer]) errors.push(`entregável "${id}": lockedOffer "${d.lockedOffer}" não existe`);
    if (!Object.values(products).some((p) => p.grants?.includes(id))) errors.push(`entregável "${id}": nenhum produto libera este entregável`);
  }
  for (const [id, o] of Object.entries(offers)) {
    if (!products[o.product]) errors.push(`oferta "${id}": produto "${o.product}" não existe`);
    if (!o.checkoutUrl) errors.push(`oferta "${id}": sem checkoutUrl`);
    for (const ref of o.attachTo || []) if (!refExists(ref)) errors.push(`oferta "${id}": attachTo "${ref}" não existe`);
    for (const pl of o.placements || []) if (!PLACEMENTS.includes(pl)) errors.push(`oferta "${id}": placement "${pl}" inválido`);
    for (const k of ['startsAt', 'endsAt']) if (o[k] && !/^\d{4}-\d{2}-\d{2}$/.test(o[k])) errors.push(`oferta "${id}": ${k} fora do formato AAAA-MM-DD`);
    for (const p of [...(o.audience?.requires || []), ...(o.audience?.excludes || [])]) if (!products[p]) errors.push(`oferta "${id}": audience cita produto "${p}" inexistente`);
  }
  return errors;
}

/** Entregáveis liberados por um conjunto de produtos */
export function ownedDeliverables(cat, ownedProducts) {
  const out = new Set();
  for (const p of ownedProducts) for (const g of cat.products[p]?.grants || []) out.add(g);
  return out;
}

export const isPlaceholderUrl = (url) => !url || /TROCAR/i.test(url);

/**
 * A oferta pode ser mostrada para este cliente agora?
 * - dentro da janela de datas
 * - audience.requires: precisa ter PELO MENOS UM desses produtos
 * - audience.excludes: não pode ter NENHUM desses produtos
 * - ainda não tem o produto (nem todos os entregáveis que ele libera)
 */
export function isEligible(cat, offerId, ctx) {
  const o = cat.offers[offerId];
  if (!o || o.active === false) return false;
  const today = ctx.today || dayKey(ctx.now);
  if (o.startsAt && today < o.startsAt) return false;
  if (o.endsAt && today > o.endsAt) return false;
  const req = o.audience?.requires;
  if (req?.length && !req.some((p) => ctx.products.has(p))) return false;
  if (o.audience?.excludes?.some((p) => ctx.products.has(p))) return false;
  if (ctx.products.has(o.product)) return false;
  const grants = cat.products[o.product]?.grants || [];
  if (grants.length && grants.every((g) => ctx.deliverables.has(g))) return false;
  return true;
}

const allows = (o, placement) => !o.placements || o.placements.includes(placement);

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Ordena por prioridade; empates no topo giram por cliente + dia (estável no mesmo dia, muda no outro). */
export function rank(cat, ids, seed) {
  const sorted = [...ids].sort((a, b) => (cat.offers[b].priority || 0) - (cat.offers[a].priority || 0) || a.localeCompare(b));
  const out = [];
  let i = 0;
  while (i < sorted.length) {
    const pr = cat.offers[sorted[i]].priority || 0;
    const group = [];
    while (i < sorted.length && (cat.offers[sorted[i]].priority || 0) === pr) group.push(sorted[i++]);
    const shift = group.length > 1 ? hash(seed + '|' + pr) % group.length : 0;
    out.push(...group.slice(shift), ...group.slice(0, shift));
  }
  return out;
}

/** Melhor oferta anexada a um entregável (ou parte dele) para uma posição. Parte sem oferta própria herda a do entregável. */
export function pickAttached(cat, ref, placement, ctx) {
  const find = (r) => rank(cat, Object.keys(cat.offers).filter((id) => {
    const o = cat.offers[id];
    return o.attachTo?.includes(r) && allows(o, placement) && isEligible(cat, id, ctx);
  }), `${ctx.customerId}|${ctx.today || dayKey(ctx.now)}|${r}`)[0] || null;
  const own = find(ref);
  if (own || !ref.includes('/')) return own;
  return find(ref.split('/')[0]);
}

export function listFor(cat, placement, ctx, limit = Infinity) {
  const ids = Object.keys(cat.offers).filter((id) => allows(cat.offers[id], placement) && isEligible(cat, id, ctx));
  return rank(cat, ids, `${ctx.customerId}|${ctx.today || dayKey(ctx.now)}|${placement}`).slice(0, limit);
}

/** O que o app recebe sobre uma oferta (sem o link do checkout: o clique passa por /go para ser medido). */
export function offerView(cat, id, firstName) {
  const o = cat.offers[id];
  if (!o) return null;
  const nome = firstName || '';
  const fill = (s) => s?.replace(/\{nome\}/g, nome).replace(/^,\s*/, '');
  return {
    id, product: o.product, title: o.title, hook: fill(o.hook) || null, subtitle: o.subtitle || null,
    bullets: o.bullets || [], image: o.image || null, icon: o.icon || null, badge: o.badge || null,
    price: o.price, priceFrom: o.priceFrom || null, cta: o.cta || 'Quero acessar',
    endsAt: o.endsAt || null,
  };
}

/**
 * Monta tudo o que o app precisa para um cliente: biblioteca (com cadeados e ofertas anexadas),
 * "Para você" da home e a vitrine.
 */
export function buildLibrary(cat, { customerId, firstName, products, now = Date.now() }) {
  const ctx = { customerId, products: new Set(products), now, today: dayKey(now) };
  ctx.deliverables = ownedDeliverables(cat, ctx.products);
  const view = (id) => offerView(cat, id, firstName);
  const attached = (ref, pl) => view(pickAttached(cat, ref, pl, ctx));

  const deliverables = [];
  for (const [id, d] of Object.entries(cat.deliverables)) {
    const owned = ctx.deliverables.has(id);
    let lockedOffer = null;
    if (!owned) {
      if (!d.lockedOffer || !allows(cat.offers[d.lockedOffer], 'locked') || !isEligible(cat, d.lockedOffer, ctx)) continue;
      lockedOffer = view(d.lockedOffer);
    }
    deliverables.push({
      id, type: d.type, title: d.title, subtitle: d.subtitle || null, description: d.description || null,
      image: d.image || null, icon: d.icon || null, order: d.order ?? 999,
      itemLabel: d.itemLabel || null, itemsTitle: d.itemsTitle || null,
      owned, locked: !owned, lockedOffer,
      url: owned && d.type === 'link' ? d.url : null,
      hasFile: d.type === 'pdf' && !!d.file,
      offer: owned ? attached(id, 'inline') : null,
      endOffer: owned ? attached(id, 'end') : null,
      items: (d.items || []).map((it) => ({
        id: it.id, title: it.title, subtitle: it.subtitle || null, image: it.image || null, icon: it.icon || null,
        highlights: it.highlights || [], hasFile: !!(it.file || d.file), page: it.file ? null : it.page || null,
        offer: owned ? attached(`${id}/${it.id}`, 'inline') : null,
        endOffer: owned ? attached(`${id}/${it.id}`, 'end') : null,
      })),
    });
  }
  deliverables.sort((a, b) => Number(b.owned) - Number(a.owned) || a.order - b.order);

  return {
    deliverables,
    home: listFor(cat, 'home', ctx, cat.settings?.homeOffers ?? 3).map(view),
    store: listFor(cat, 'store', ctx).map(view),
  };
}

/** Acha o arquivo de um entregável ou parte, se o cliente tiver acesso */
export function fileFor(cat, deliverableId, itemId, ownedDels) {
  const d = cat.deliverables[deliverableId];
  if (!d || !ownedDels.has(deliverableId)) return null;
  if (itemId) {
    const it = d.items?.find((i) => i.id === itemId);
    const file = it && (it.file || d.file);
    return file ? { file, title: it.title, parent: d.title } : null;
  }
  return d.file ? { file: d.file, title: d.title } : null;
}
