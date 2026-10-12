import { Fragment, useCallback, useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, Copy, Info, Loader2, LogOut, RefreshCw, Search, XCircle } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { brl, dateBR, dateTimeBR, pct } from '../lib/format';

type Placement = { placement: string; impressions: number; viewers: number; opens: number; clicks: number; clickers: number; sales: number; revenue: number; ctr: number | null; takeRate: number | null };
type OfferRow = { id: string; title: string; product: string; price: number; startsAt: string | null; endsAt: string | null; placeholderCheckout: boolean; viewers: number; clickers: number; sales: number; revenue: number; ctr: number | null; takeRate: number | null; productSales: number; productRevenue: number; placements: Placement[] };
type Overview = {
  days: number;
  kpis: { customers: number; newCustomers: number; activeCustomers: number; buyers: number; ltv: number; totalRevenue: number; frontRevenue: number; backRevenue: number; backShare: number; backTakeRate: number };
  entries: { entry: string; name: string; customers: number; revenue: number; ltv: number; backBuyers: number; backTakeRate: number; backRevenue: number }[];
  offers: OfferRow[];
  series: { day: string; front: number; back: number }[];
  warnings: { level: 'error' | 'warn' | 'info'; text: string }[];
  webhookUrl: string;
  products: { id: string; name: string; price: number }[];
};
type Customer = { id: string; email: string; name: string | null; created_at: number; last_seen: number | null; ltv: number; purchases: { id: number; product_id: string; productName: string; status: string; value: number; source: string; offer_id: string | null; placement: string | null; created_at: number }[] };

const PLACEMENT_LABEL: Record<string, string> = { inline: 'Anexada ao conteúdo', end: 'Fim da leitura / download', home: 'Início ("Para você")', store: 'Vitrine', locked: 'Bônus bloqueado' };
// Cores das séries (validadas para daltonismo): front-end azul, back-end âmbar da marca
const C_FRONT = '#2F6FA8';
const C_BACK = '#C86A1B';

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="text-[12px] font-semibold text-bark/60">{label}</div>
      <div className="mt-1 text-[24px] font-black leading-none text-ink">{value}</div>
      {sub && <div className="mt-1.5 text-[12px] text-bark/60">{sub}</div>}
    </div>
  );
}

function RevenueChart({ series }: { series: Overview['series'] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...series.map((s) => s.front + s.back));
  const H = 160;
  const h = hover != null ? series[hover] : null;
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[15px] font-extrabold text-ink">Receita por dia</h3>
        <div className="flex gap-4 text-[12px] font-semibold text-bark/75">
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: C_FRONT }} /> Front-end (página de vendas)</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: C_BACK }} /> Back-end (dentro do app)</span>
        </div>
      </div>
      <div className="relative mt-3" onMouseLeave={() => setHover(null)}>
        <div className="flex items-end gap-[2px] border-b border-line" style={{ height: H }}>
          {series.map((s, i) => {
            const fh = (s.front / max) * (H - 8);
            const bh = (s.back / max) * (H - 8);
            return (
              <div key={s.day} className="flex h-full flex-1 cursor-default flex-col justify-end" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}
                style={{ opacity: hover == null || hover === i ? 1 : 0.55 }} aria-label={`${s.day}: front ${brl(s.front)}, back ${brl(s.back)}`}>
                {bh > 0 && <div style={{ height: bh, background: C_BACK, borderRadius: '4px 4px 0 0' }} />}
                {bh > 0 && fh > 0 && <div style={{ height: 2 }} />}
                {fh > 0 && <div style={{ height: fh, background: C_FRONT, borderRadius: bh > 0 ? 0 : '4px 4px 0 0' }} />}
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-bark/50">
          <span>{series[0]?.day.split('-').reverse().slice(0, 2).join('/')}</span>
          <span>{series.at(-1)?.day.split('-').reverse().slice(0, 2).join('/')}</span>
        </div>
        {h && (
          <div className="pointer-events-none absolute top-0 z-10 rounded-xl border border-line bg-white px-3 py-2 text-[12px] shadow-lg"
            style={{ left: `clamp(0px, calc(${((hover! + 0.5) / series.length) * 100}% - 80px), calc(100% - 170px))`, width: 170 }}>
            <div className="font-bold text-ink">{h.day.split('-').reverse().join('/')}</div>
            <div className="mt-1 flex justify-between gap-2 text-bark"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm" style={{ background: C_FRONT }} />Front-end</span><b>{brl(h.front)}</b></div>
            <div className="flex justify-between gap-2 text-bark"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm" style={{ background: C_BACK }} />Back-end</span><b>{brl(h.back)}</b></div>
          </div>
        )}
      </div>
    </div>
  );
}

function OffersTable({ offers }: { offers: OfferRow[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="w-full min-w-[760px] text-[13px]">
        <thead className="bg-paper text-left text-[11.5px] uppercase tracking-wide text-bark/60">
          <tr>
            <th className="px-3 py-2.5">Oferta</th>
            <th className="px-3 py-2.5 text-right" title="Clientes únicos que viram a oferta">Viram</th>
            <th className="px-3 py-2.5 text-right" title="Clientes únicos que clicaram para o checkout">Clicaram</th>
            <th className="px-3 py-2.5 text-right">CTR</th>
            <th className="px-3 py-2.5 text-right" title="Compras atribuídas a um clique na oferta">Vendas</th>
            <th className="px-3 py-2.5 text-right" title="Vendas ÷ clientes que viram">Take rate</th>
            <th className="px-3 py-2.5 text-right">Receita</th>
            <th className="px-3 py-2.5 text-right" title="Todas as vendas do produto no período, por qualquer caminho">Vendas do produto</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((o) => (
            <Fragment key={o.id}>
              <tr className="cursor-pointer border-t border-line hover:bg-paper/60" onClick={() => setOpen(open === o.id ? null : o.id)}>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-ink">
                    {open === o.id ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                    {o.title}
                  </div>
                  <div className="ml-5.5 text-[11.5px] text-bark/55">
                    {brl(o.price)}{o.endsAt ? ` • até ${o.endsAt.split('-').reverse().join('/')}` : ''}
                    {o.placeholderCheckout && <span className="ml-1.5 font-bold text-amber-dark">• checkout provisório</span>}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{o.viewers}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{o.clickers}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{pct(o.ctr)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{o.sales}</td>
                <td className="px-3 py-2.5 text-right font-bold tabular-nums">{pct(o.takeRate)}</td>
                <td className="px-3 py-2.5 text-right font-bold tabular-nums">{brl(o.revenue)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-bark/70">{o.productSales} • {brl(o.productRevenue)}</td>
              </tr>
              {open === o.id && (o.placements.length ? o.placements.map((p) => (
                <tr key={p.placement} className="bg-paper/50 text-bark/80">
                  <td className="py-2 pl-9 pr-3">{PLACEMENT_LABEL[p.placement] || p.placement}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{p.viewers}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{p.clickers}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{pct(p.ctr)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{p.sales}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{pct(p.takeRate)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{brl(p.revenue)}</td>
                  <td />
                </tr>
              )) : (
                <tr className="bg-paper/50"><td colSpan={8} className="py-2 pl-9 text-bark/60">Ainda sem dados no período.</td></tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Customers({ products }: { products: Overview['products'] }) {
  const [q, setQ] = useState('');
  const [list, setList] = useState<Customer[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [grant, setGrant] = useState({ email: '', product: products[0]?.id || '', name: '' });

  const load = useCallback(async (query = q) => {
    const r = await api<{ customers: Customer[] }>(`/api/admin/customers?q=${encodeURIComponent(query)}`);
    setList(r.customers);
  }, [q]);
  useEffect(() => { load(''); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function doGrant(e: FormEvent) {
    e.preventDefault();
    try { await api('/api/admin/grant', grant); setMsg(`Acesso a "${products.find((p) => p.id === grant.product)?.name}" liberado para ${grant.email}.`); load(); }
    catch (err: any) { setMsg(err.message); }
  }
  async function link(email: string) {
    try {
      const r = await api<{ link: string }>('/api/admin/login-link', { email });
      await navigator.clipboard?.writeText(r.link).catch(() => {});
      setMsg(`Link de acesso de ${email} (vale 24h, copiado): ${r.link}`);
    } catch (err: any) { setMsg(err.message); }
  }
  async function revoke(id: number) {
    if (!confirm('Revogar esta compra? O cliente perde o acesso ao conteúdo.')) return;
    await api('/api/admin/revoke', { purchaseId: id });
    load();
  }

  return (
    <div className="space-y-3">
      <form onSubmit={doGrant} className="flex flex-wrap items-end gap-2 rounded-2xl border border-line bg-white p-3">
        <div className="text-[13px] font-bold text-ink basis-full">Liberar acesso manualmente</div>
        <input required type="email" placeholder="e-mail" value={grant.email} onChange={(e) => setGrant({ ...grant, email: e.target.value })} className="min-w-[200px] flex-1 rounded-lg border border-line px-3 py-2 text-[13px]" />
        <input placeholder="nome (opcional)" value={grant.name} onChange={(e) => setGrant({ ...grant, name: e.target.value })} className="min-w-[140px] flex-1 rounded-lg border border-line px-3 py-2 text-[13px]" />
        <select value={grant.product} onChange={(e) => setGrant({ ...grant, product: e.target.value })} className="rounded-lg border border-line px-3 py-2 text-[13px]">
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button className="rounded-lg bg-bark px-4 py-2 text-[13px] font-bold text-white">Liberar</button>
      </form>
      {msg && <div className="break-all rounded-xl bg-leaf/10 px-3 py-2 text-[13px] font-semibold text-bark">{msg}</div>}
      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-line bg-white px-3">
          <Search className="h-4 w-4 text-bark/50" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por e-mail ou nome" className="w-full py-2 text-[13px] outline-none" />
        </div>
        <button className="rounded-lg border border-line bg-white px-4 text-[13px] font-bold">Buscar</button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[680px] text-[13px]">
          <thead className="bg-paper text-left text-[11.5px] uppercase tracking-wide text-bark/60">
            <tr><th className="px-3 py-2.5">Cliente</th><th className="px-3 py-2.5">Compras</th><th className="px-3 py-2.5 text-right">LTV</th><th className="px-3 py-2.5" /></tr>
          </thead>
          <tbody>
            {list?.map((c) => (
              <tr key={c.id} className="border-t border-line align-top">
                <td className="px-3 py-2.5">
                  <div className="font-bold text-ink">{c.email}</div>
                  <div className="text-[11.5px] text-bark/55">{c.name || 'sem nome'} • desde {dateBR(c.created_at)}{c.last_seen ? ` • visto ${dateTimeBR(c.last_seen)}` : ''}</div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {c.purchases.map((p) => (
                      <span key={p.id} title={`${p.source}${p.offer_id ? ` • oferta ${p.offer_id} (${p.placement})` : ''} • ${dateTimeBR(p.created_at)}`}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${p.status === 'approved' ? 'bg-leaf/10 text-leaf' : 'bg-red-50 text-red-700 line-through'}`}>
                        {p.productName}
                        {p.status === 'approved' && <button onClick={() => revoke(p.id)} aria-label="Revogar" className="opacity-50 hover:opacity-100"><XCircle className="h-3.5 w-3.5" /></button>}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right font-bold tabular-nums">{brl(c.ltv)}</td>
                <td className="px-3 py-2.5 text-right"><button onClick={() => link(c.email)} className="whitespace-nowrap rounded-lg border border-line px-2.5 py-1 text-[12px] font-bold">Gerar link de acesso</button></td>
              </tr>
            ))}
            {list && !list.length && <tr><td colSpan={4} className="px-3 py-4 text-center text-bark/60">Nenhum cliente encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WebhookLog() {
  const [log, setLog] = useState<{ id: number; ts: number; ok: number; summary: string; body: string }[] | null>(null);
  useEffect(() => { api('/api/admin/webhooks').then((r) => setLog(r.log)); }, []);
  if (!log) return null;
  if (!log.length) return <p className="text-[13px] text-bark/60">Nenhum webhook recebido ainda.</p>;
  return (
    <div className="space-y-1.5">
      {log.map((l) => {
        const s = JSON.parse(l.summary);
        return (
          <details key={l.id} className="rounded-xl border border-line bg-white px-3 py-2 text-[12.5px]">
            <summary className="cursor-pointer">
              <b className={l.ok ? 'text-leaf' : 'text-red-700'}>{l.ok ? 'OK' : 'ERRO'}</b> • {dateTimeBR(l.ts)} • {s.customer || s.email || 'sem e-mail'} • {s.status} • {(s.products || []).join(', ') || '—'}
              {s.error && <span className="text-red-700"> • {s.error}</span>}
            </summary>
            <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-paper p-2 text-[11px]">{l.body}</pre>
          </details>
        );
      })}
    </div>
  );
}

export function Admin() {
  const [data, setData] = useState<Overview | null>(null);
  const [state, setState] = useState<'loading' | 'login' | 'ready'>('loading');
  const [days, setDays] = useState(30);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'ofertas' | 'clientes' | 'webhooks'>('ofertas');

  const load = useCallback(async (d = days) => {
    try { setData(await api<Overview>(`/api/admin/overview?days=${d}`)); setState('ready'); }
    catch (e) { if (e instanceof ApiError && e.status === 401) setState('login'); }
  }, [days]);
  useEffect(() => { load(days); }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  async function login(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try { await api('/api/admin/login', { password }); load(); } catch (err: any) { setError(err.message); }
  }

  if (state === 'loading') return <div className="grid min-h-dvh place-items-center"><Loader2 className="h-6 w-6 animate-spin text-amber" /></div>;
  if (state === 'login') {
    return (
      <form onSubmit={login} className="mx-auto mt-24 max-w-sm px-5">
        <h1 className="text-[22px] font-black">Painel da área de membros</h1>
        <p className="mt-1 text-[13.5px] text-bark/70">A senha aparece no terminal quando o servidor sobe (ou use ADMIN_PASSWORD).</p>
        <input type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" className="mt-4 w-full rounded-xl border-2 border-line bg-white px-4 py-3 outline-none focus:border-amber" />
        {error && <p className="mt-2 text-[13px] font-semibold text-red-700">{error}</p>}
        <button className="mt-3 w-full rounded-xl bg-bark py-3 font-bold text-white">Entrar</button>
      </form>
    );
  }
  if (!data) return null;
  const k = data.kpis;
  const icon = { error: <XCircle className="h-4 w-4 shrink-0 text-red-700" />, warn: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-dark" />, info: <Info className="h-4 w-4 shrink-0 text-bark/50" /> };

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="flex-1 text-[22px] font-black text-ink">Painel • LTV e ofertas</h1>
        <div className="flex rounded-xl border border-line bg-white p-1 text-[13px] font-bold">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)} className={`rounded-lg px-3 py-1.5 ${days === d ? 'bg-bark text-white' : 'text-bark/70'}`}>{d} dias</button>
          ))}
        </div>
        <button onClick={() => load()} aria-label="Atualizar" className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-white"><RefreshCw className="h-4 w-4" /></button>
        <button onClick={async () => { await api('/api/admin/logout', {}); setState('login'); }} aria-label="Sair" className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-white"><LogOut className="h-4 w-4" /></button>
      </div>

      {!!data.warnings.length && (
        <details className="mt-4 rounded-2xl border border-amber/30 bg-white p-3" open={data.warnings.some((w) => w.level === 'error')}>
          <summary className="cursor-pointer text-[13.5px] font-bold text-amber-dark">{data.warnings.length} pendências de configuração</summary>
          <ul className="mt-2 space-y-1.5">
            {data.warnings.map((w, i) => <li key={i} className="flex gap-2 text-[12.5px] text-bark">{icon[w.level]} {w.text}</li>)}
          </ul>
        </details>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="LTV médio (desde o início)" value={brl(k.ltv)} sub={`${k.buyers} compradores • ${brl(k.totalRevenue)} no total`} />
        <Tile label={`Receita de back-end (${data.days}d)`} value={brl(k.backRevenue)} sub={`${pct(k.backShare)} da receita do período`} />
        <Tile label={`Receita de front-end (${data.days}d)`} value={brl(k.frontRevenue)} />
        <Tile label="Compraram algo no app" value={pct(k.backTakeRate)} sub={`dos compradores • ${k.activeCustomers} ativos no app em ${data.days}d`} />
      </div>

      <div className="mt-4"><RevenueChart series={data.series} /></div>

      <h2 className="mb-2 mt-6 text-[16px] font-extrabold">LTV por porta de entrada</h2>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[560px] text-[13px]">
          <thead className="bg-paper text-left text-[11.5px] uppercase tracking-wide text-bark/60">
            <tr><th className="px-3 py-2.5">Entrou por</th><th className="px-3 py-2.5 text-right">Clientes</th><th className="px-3 py-2.5 text-right">LTV médio</th><th className="px-3 py-2.5 text-right">Compraram no back-end</th><th className="px-3 py-2.5 text-right">Receita de back-end</th></tr>
          </thead>
          <tbody>
            {data.entries.map((e) => (
              <tr key={e.entry} className="border-t border-line">
                <td className="px-3 py-2.5 font-bold">{e.name}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{e.customers}</td>
                <td className="px-3 py-2.5 text-right font-bold tabular-nums">{brl(e.ltv)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{pct(e.backTakeRate)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{brl(e.backRevenue)}</td>
              </tr>
            ))}
            {!data.entries.length && <tr><td colSpan={5} className="px-3 py-4 text-center text-bark/60">Ainda sem vendas.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex gap-1 border-b border-line text-[14px] font-bold">
        {(['ofertas', 'clientes', 'webhooks'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`-mb-px border-b-2 px-3 py-2 capitalize ${tab === t ? 'border-amber text-ink' : 'border-transparent text-bark/55'}`}>{t}</button>
        ))}
      </div>
      <div className="mt-3">
        {tab === 'ofertas' && (
          <>
            <p className="mb-2 text-[12.5px] text-bark/65">Toque numa oferta para ver o desempenho por posição. "Viram" e "clicaram" contam clientes únicos.</p>
            <OffersTable offers={data.offers} />
          </>
        )}
        {tab === 'clientes' && <Customers products={data.products} />}
        {tab === 'webhooks' && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-line bg-white p-3">
              <div className="text-[13px] font-bold">URL do webhook (cole na Wiapy: compra aprovada, reembolso e chargeback)</div>
              <div className="mt-1.5 flex items-center gap-2">
                <code className="flex-1 break-all rounded-lg bg-paper px-2 py-1.5 text-[12px]">{data.webhookUrl}</code>
                <button onClick={() => navigator.clipboard?.writeText(data.webhookUrl)} aria-label="Copiar" className="grid h-8 w-8 place-items-center rounded-lg border border-line"><Copy className="h-4 w-4" /></button>
              </div>
            </div>
            <WebhookLog />
          </div>
        )}
      </div>
    </div>
  );
}
