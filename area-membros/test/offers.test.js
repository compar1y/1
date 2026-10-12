import { test } from 'node:test';
import assert from 'node:assert/strict';
import cat from '../catalog.js';
import { validateCatalog, buildLibrary, isEligible, ownedDeliverables, rank, pickAttached } from '../server/offers.js';

const NOV = Date.parse('2026-11-10T15:00:00-03:00');
const ctxFor = (products, now = NOV) => {
  const p = new Set(products);
  return { customerId: 'c1', products: p, deliverables: ownedDeliverables(cat, p), now };
};

test('o catálogo de exemplo é válido', () => {
  assert.deepEqual(validateCatalog(cat), []);
});

test('validação aponta referências quebradas', () => {
  const bad = structuredClone(cat);
  bad.offers['natal-15'].attachTo.push('nao-existe');
  bad.offers['natal-15'].product = 'fantasma';
  const errs = validateCatalog(bad);
  assert.ok(errs.some((e) => e.includes('nao-existe')));
  assert.ok(errs.some((e) => e.includes('fantasma')));
});

test('quem tem o Básico vê os bônus com cadeado e o upgrade', () => {
  const lib = buildLibrary(cat, { customerId: 'c1', products: ['basico'], now: NOV });
  const locked = lib.deliverables.filter((d) => d.locked);
  assert.equal(locked.length, 6);
  assert.ok(locked.every((d) => d.lockedOffer?.id === 'upgrade-completo'));
  assert.equal(lib.deliverables.find((d) => d.id === 'projetos-100').offer.id, 'upgrade-completo');
});

test('quem tem o Completo não vê upgrade nem cadeado', () => {
  const lib = buildLibrary(cat, { customerId: 'c1', products: ['completo'], now: NOV });
  assert.equal(lib.deliverables.filter((d) => d.locked).length, 0);
  assert.ok(!lib.store.some((o) => o.id === 'upgrade-completo'));
  assert.equal(lib.deliverables.find((d) => d.id === 'precificacao').offer.id, 'planilha-precificacao');
});

test('nunca mostra oferta de produto que a pessoa já tem', () => {
  assert.equal(isEligible(cat, 'natal-15', ctxFor(['completo', 'natal-15'])), false);
  const lib = buildLibrary(cat, { customerId: 'c1', products: ['completo', 'natal-15'], now: NOV });
  assert.ok(!lib.store.some((o) => o.id === 'natal-15'));
  // o entregável comprado aparece, com a oferta seguinte da escada
  const natal = lib.deliverables.find((d) => d.id === 'natal-15');
  assert.equal(natal.owned, true);
  assert.equal(natal.offer.id, 'pack-divulgacao');
});

test('janela de datas: oferta de Natal só vale de 01/10 a 24/12', () => {
  assert.equal(isEligible(cat, 'natal-15', ctxFor(['completo'])), true);
  assert.equal(isEligible(cat, 'natal-15', ctxFor(['completo'], Date.parse('2026-12-26T12:00:00-03:00'))), false);
  assert.equal(isEligible(cat, 'natal-15', ctxFor(['completo'], Date.parse('2026-09-20T12:00:00-03:00'))), false);
});

test('parte sem oferta própria herda a do entregável; com oferta própria, usa a sua', () => {
  const ctx = ctxFor(['completo']);
  assert.equal(pickAttached(cat, 'projetos-100/jardim', 'inline', ctx), 'jardim-primavera');
  assert.equal(pickAttached(cat, 'projetos-100/cozinha', 'inline', ctx), 'natal-15');
});

test('empate de prioridade gira por cliente/dia, sem mudar a ordem das prioridades', () => {
  const ids = ['pack-divulgacao', 'planilha-precificacao', 'natal-15'];
  const seen = new Set();
  for (let i = 0; i < 20; i++) {
    const r = rank(cat, ids, 'seed' + i);
    assert.equal(r[0], 'natal-15'); // prioridade 90 sempre primeiro
    seen.add(r[1]);
  }
  assert.equal(seen.size, 2);
  assert.deepEqual(rank(cat, ids, 'x'), rank(cat, ids, 'x'));
});

test('placements restringem onde a oferta aparece', () => {
  const c = structuredClone(cat);
  c.offers['natal-15'].placements = ['store'];
  const lib = buildLibrary(c, { customerId: 'c1', products: ['completo'], now: NOV });
  assert.ok(!lib.home.some((o) => o.id === 'natal-15'));
  assert.ok(lib.store.some((o) => o.id === 'natal-15'));
  assert.notEqual(lib.deliverables.find((d) => d.id === 'projetos-100').offer?.id, 'natal-15');
});
