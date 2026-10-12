export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const pct = (n: number | null | undefined, digits = 1) => (n == null ? '—' : (n * 100).toLocaleString('pt-BR', { maximumFractionDigits: digits }) + '%');
export const dateBR = (ts: number) => new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
export const dateTimeBR = (ts: number) => new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** "Termina em 3 dias" para ofertas com data de fim */
export function endsIn(endsAt: string | null) {
  if (!endsAt) return null;
  const end = new Date(endsAt + 'T23:59:59-03:00').getTime();
  const days = Math.ceil((end - Date.now()) / 86400e3);
  if (days < 0 || days > 21) return null;
  return days <= 1 ? 'Termina hoje' : `Termina em ${days} dias`;
}
