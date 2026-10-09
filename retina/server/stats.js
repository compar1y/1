// Métricas do próprio servidor (aparecem na aba "Servidor" do painel)
export const stats = {
  startedAt: Date.now(),
  requests: 0,
  collected: 0,
  collectErrors: 0,
  events: 0,
  webhooks: 0,
  webhookErrors: 0,
  lastWebhook: null,
  perMinute: [], // [{m, req, col}] últimos 60 minutos
};

export function hit(kind) {
  const m = Math.floor(Date.now() / 60000);
  let last = stats.perMinute[stats.perMinute.length - 1];
  if (!last || last.m !== m) {
    last = { m, req: 0, col: 0 };
    stats.perMinute.push(last);
    if (stats.perMinute.length > 60) stats.perMinute.shift();
  }
  last[kind]++;
}
