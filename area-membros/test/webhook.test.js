import { test } from 'node:test';
import assert from 'node:assert/strict';
import cat from '../catalog.js';
import { parseSale, parsePayload } from '../server/webhook.js';

test('reconhece compra aprovada com código do checkout, e-mail, valor e clique', () => {
  const s = parseSale({
    event: 'order.approved',
    producer: { email: 'eu@produtor.com' },
    data: { id: 'TX9', status: 'paid', total: 27.9, customer: { name: 'Ana Souza', email: 'Ana@Email.com' }, checkout: { url: 'https://pay.wiapy.com/VIB5O5IAEWDa' }, utm: { src: 'am_abcdefghijkl' } },
  }, cat);
  assert.equal(s.email, 'ana@email.com');
  assert.equal(s.name, 'Ana Souza');
  assert.equal(s.status, 'approved');
  assert.equal(s.tx, 'TX9');
  assert.equal(s.value, 27.9);
  assert.equal(s.clickId, 'am_abcdefghijkl');
  assert.deepEqual(s.products, ['completo']);
});

test('reembolso e chargeback viram refunded; pix gerado vira pending', () => {
  assert.equal(parseSale({ status: 'refunded', email: 'a@b.com', code: 'eiu2dIDEi_2N' }, cat).status, 'refunded');
  assert.equal(parseSale({ event: 'chargeback', email: 'a@b.com', code: 'eiu2dIDEi_2N' }, cat).status, 'refunded');
  assert.equal(parseSale({ status: 'pix_generated', email: 'a@b.com', code: 'eiu2dIDEi_2N' }, cat).status, 'pending');
});

test('pedido com order bump libera os dois produtos', () => {
  const s = parseSale({ status: 'approved', customer: { email: 'x@y.com' }, items: [{ offer: 'eiu2dIDEi_2N' }, { offer: 'TROCAR_CODIGO_NATAL' }] }, cat);
  assert.deepEqual(s.products.sort(), ['basico', 'natal-15']);
});

test('aceita formulário (x-www-form-urlencoded)', () => {
  const s = parseSale(parsePayload('status=approved&customer_email=z%40z.com&product_code=eiu2dIDEi_2N'), cat);
  assert.equal(s.email, 'z@z.com');
  assert.deepEqual(s.products, ['basico']);
});
