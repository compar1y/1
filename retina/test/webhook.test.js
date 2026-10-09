import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

process.env.RETINA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'retina-test-'));
const { parseSale } = await import('../server/webhook.js');
const SID = 'rt_abcdefghij012345';

test('Hotmart: compra aprovada com sck', () => {
  const s = parseSale({ event: 'PURCHASE_APPROVED', data: { product: { name: 'Curso X' }, purchase: { transaction: 'HP123', status: 'APPROVED', price: { value: 97 }, origin: { sck: SID } } } });
  assert.equal(s.sid, SID);
  assert.equal(s.value, 97);
  assert.equal(s.status, 'approved');
  assert.equal(s.tx, 'HP123');
  assert.equal(s.product, 'Curso X');
});

test('Kiwify: valor em centavos e src em TrackingParameters', () => {
  const s = parseSale({ order_id: 'k-1', order_status: 'paid', Product: { product_name: 'Ebook' }, Commissions: { charge_amount: 2790 }, TrackingParameters: { src: SID, utm_source: 'facebook' } });
  assert.equal(s.sid, SID);
  assert.equal(s.value, 27.9);
  assert.equal(s.status, 'approved');
  assert.equal(s.tx, 'k-1');
});

test('reembolso e pendente', () => {
  assert.equal(parseSale({ event: 'PURCHASE_REFUNDED', data: { purchase: { status: 'REFUNDED', price: { value: 10 } } } }).status, 'refunded');
  assert.equal(parseSale({ status: 'waiting_payment', value: 10 }).status, 'pending');
});

test('ID da sessão dentro de uma URL', () => {
  const s = parseSale({ checkout_url: `https://pay.x.com/abc?utm_id=${SID}&foo=1`, amount: '47,00' });
  assert.equal(s.sid, SID);
  assert.equal(s.value, 47);
});
