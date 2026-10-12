import { useCallback, useState } from 'react';
import { BookOpen, CheckCircle2, Circle, Download, ExternalLink, Lock } from 'lucide-react';
import { Layout } from '../components/Layout';
import { OfferCard } from '../components/OfferCard';
import { OfferSheet } from '../components/OfferSheet';
import { Cover } from '../components/Cover';
import { Link } from '../components/Link';
import { api, downloadStatic, fileUrl, STATIC, type Offer, type Progress } from '../lib/api';
import { useMe } from '../state';

/** Baixar: inicia o download e, se houver oferta de "fim", aproveita o momento ("enquanto baixa…"). */
export function DownloadButton({ refId, endOffer, className = '', label = 'Baixar' }: { refId: string; endOffer: Offer | null; className?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <a href={fileUrl(refId, true)} download aria-label={label || "Baixar"} onClick={(e) => { if (STATIC) { e.preventDefault(); downloadStatic(refId); } if (endOffer) setTimeout(() => setOpen(true), 600); }} className={className}>
        <Download className="h-4 w-4" /> {label}
      </a>
      {open && endOffer && <OfferSheet offer={endOffer} placement="end" refId={refId} onClose={close} intro="✅ Seu download começou" />}
    </>
  );
}

function DoneToggle({ refId, progress }: { refId: string; progress: Progress[] }) {
  const { refresh } = useMe();
  const done = !!progress.find((p) => p.ref === refId)?.done_at;
  return (
    <button onClick={async () => { await api('/api/progress', { ref: refId, done: !done }); refresh(); }}
      className={`flex items-center gap-1.5 text-[12.5px] font-bold ${done ? 'text-leaf' : 'text-bark/55'}`} aria-pressed={done}>
      {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />} {done ? 'Concluído' : 'Marcar como feito'}
    </button>
  );
}

const btn = 'flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13.5px] font-extrabold';

export function DeliverablePage({ id }: { id: string }) {
  const { me } = useMe();
  if (!me) return null;
  const d = me.library.deliverables.find((x) => x.id === id);
  if (!d) {
    return (
      <Layout backTo="/conteudos" title="Conteúdo">
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <Lock className="mx-auto h-8 w-8 text-bark/40" />
          <div className="mt-2 font-extrabold">Este conteúdo não está na sua conta</div>
          <Link to="/mais" className="mt-3 inline-block text-[14px] font-bold text-amber-dark underline">Ver mais conteúdos</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout backTo="/conteudos" title={d.title}>
      <div className="flex gap-4">
        <Cover image={d.image} icon={d.icon} title={d.title} className={`h-28 w-28 shrink-0 rounded-2xl text-[22px] shadow-sm ${d.locked ? 'opacity-60 grayscale-[60%]' : ''}`} />
        <div className="min-w-0">
          {d.subtitle && <div className="text-[11px] font-bold uppercase tracking-wide text-amber-dark">{d.subtitle}</div>}
          <h1 className="text-[20px] font-black leading-tight text-ink">{d.title}</h1>
          {d.description && <p className="mt-1 text-[13.5px] leading-snug text-bark/75">{d.description}</p>}
        </div>
      </div>

      {d.locked ? (
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-2 rounded-2xl bg-white p-3 text-[13.5px] font-semibold text-bark shadow-sm">
            <Lock className="h-4 w-4 text-amber" /> {me.settings.texts.lockedNotice}
          </div>
          {d.lockedOffer && <OfferCard offer={d.lockedOffer} placement="locked" refId={d.id} />}
        </div>
      ) : (
        <>
          {d.type === 'pdf' && (
            <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
              <div className="grid grid-cols-2 gap-2">
                <Link to={`/ler/${d.id}`} className={`${btn} bg-amber text-white`}><BookOpen className="h-4 w-4" /> Abrir</Link>
                <DownloadButton refId={d.id} endOffer={d.endOffer} className={`${btn} border-2 border-line text-bark`} />
              </div>
              <div className="mt-3 flex justify-center"><DoneToggle refId={d.id} progress={me.progress} /></div>
            </div>
          )}
          {d.type === 'link' && d.url && (
            <a href={d.url} target="_blank" rel="noopener" className={`${btn} mt-5 w-full bg-amber py-3.5 text-white`}>
              <ExternalLink className="h-4 w-4" /> Abrir {d.subtitle ? `(${d.subtitle})` : ''}
            </a>
          )}

          {/* A oferta anexada a este conteúdo: no máximo uma por tela */}
          {d.offer && <div className="mt-5"><OfferCard offer={d.offer} placement="inline" refId={d.id} /></div>}

          {d.type === 'library' && (
            <div className="mt-6 space-y-3">
              <h2 className="text-[17px] font-black text-ink">{d.itemsTitle || me.settings.texts.itemsTitle}</h2>
              {d.items.map((it, i) => {
                const ref = `${d.id}/${it.id}`;
                const p = me.progress.find((x) => x.ref === ref);
                return (
                  <div key={it.id} className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
                    <Link to={`/ler/${ref}`} className="flex gap-3 p-3">
                      {(it.image || it.icon) && <Cover image={it.image} icon={it.icon} title={it.title} className="h-20 w-20 shrink-0 rounded-xl text-[15px]" />}
                      <div className="min-w-0">
                        <div className="text-[10.5px] font-bold uppercase tracking-wide text-amber-dark">{d.itemLabel || me.settings.texts.itemLabel} {String(i + 1).padStart(2, '0')}</div>
                        <div className="text-[15px] font-extrabold leading-tight text-ink">{it.title}</div>
                        {it.subtitle && <div className="text-[12.5px] text-bark/65">{it.subtitle}</div>}
                        <div className="mt-1 line-clamp-1 text-[12px] text-bark/55">{it.highlights.join(' • ')}</div>
                        {p?.last_page && p.pages && !p.done_at && <div className="mt-1 text-[11.5px] font-bold text-amber-dark">Parou na página {p.last_page} de {p.pages}</div>}
                      </div>
                    </Link>
                    <div className="flex items-center justify-between gap-2 border-t border-line/70 px-3 py-2">
                      <DoneToggle refId={ref} progress={me.progress} />
                      <div className="flex gap-1.5">
                        <DownloadButton refId={ref} endOffer={it.endOffer} label="" className="grid h-9 w-9 place-items-center rounded-lg border border-line text-bark" />
                        <Link to={`/ler/${ref}`} className="flex items-center gap-1.5 rounded-lg bg-amber px-3 py-2 text-[13px] font-extrabold text-white"><BookOpen className="h-4 w-4" /> Abrir</Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
