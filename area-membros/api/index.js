// Função da Vercel: roda o mesmo servidor da área de membros, em MODO DEMONSTRAÇÃO.
// A Vercel não guarda arquivos entre execuções, então o banco fica em /tmp e é recriado
// com dados de exemplo sempre que a função "acorda". Serve para visualizar, não para clientes reais.
process.env.DEMO ??= '1';
process.env.DATA_DIR ??= '/tmp/area-membros';
process.env.NO_LISTEN = '1';

let handler;

export default async function vercelHandler(req, res) {
  // As rewrites do vercel.json mandam o caminho original em ?__p=
  const url = new URL(req.url, 'http://x');
  const original = url.searchParams.get('__p');
  if (original) {
    url.searchParams.delete('__p');
    const qs = url.searchParams.toString();
    req.url = original + (qs ? '?' + qs : '');
  }
  if (!process.env.PUBLIC_URL) process.env.PUBLIC_URL = `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
  handler ??= (await import('../server/index.js')).handler;
  return handler(req, res);
}
