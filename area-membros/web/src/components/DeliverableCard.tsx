import { useCallback, useState } from 'react';
import { CheckCircle2, ExternalLink, Lock } from 'lucide-react';
import type { Deliverable, Progress } from '../lib/api';
import { Cover } from './Cover';
import { Link } from './Link';
import { OfferSheet } from './OfferSheet';
import { useImpression } from '../lib/track';

export function progressLabel(d: Deliverable, progress: Progress[]) {
  const mine = progress.filter((p) => p.ref === d.id || p.ref.startsWith(d.id + '/'));
  if (d.type === 'library') {
    const done = mine.filter((p) => p.done_at && p.ref.includes('/')).length;
    const opened = mine.filter((p) => p.ref.includes('/')).length;
    if (done) return { text: `${done} de ${d.items.length} concluídas`, done: done === d.items.length };
    if (opened) return { text: `${opened} de ${d.items.length} abertas`, done: false };
    return { text: `${d.items.length} coleções`, done: false };
  }
  const p = mine.find((x) => x.ref === d.id);
  if (p?.done_at) return { text: 'Concluído', done: true };
  if (p?.last_page && p.pages) return { text: `Página ${p.last_page} de ${p.pages}`, done: false };
  if (p) return { text: 'Aberto', done: false };
  return { text: d.type === 'link' ? 'Link externo' : 'Novo', done: false };
}

/** Card de conteúdo. Bloqueado: mostra o cadeado e abre a oferta que destrava. */
export function DeliverableCard({ d, progress }: { d: Deliverable; progress: Progress[] }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useImpression<HTMLButtonElement>(d.locked ? d.lockedOffer?.id : undefined, 'locked', d.id);

  const inner = (
    <>
      <div className="relative">
        <Cover image={d.image} icon={d.icon} title={d.title} className={`aspect-square w-full text-[22px] ${d.locked ? 'opacity-55 grayscale-[60%]' : ''}`} />
        {d.locked && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-bark/85 text-white shadow-lg"><Lock className="h-5 w-5" /></span>
          </div>
        )}
        {d.type === 'link' && !d.locked && <ExternalLink className="absolute right-2 top-2 h-5 w-5 rounded-md bg-white/90 p-0.5 text-bark" />}
      </div>
      <div className="p-2.5">
        {d.subtitle && <div className="truncate text-[10.5px] font-bold uppercase tracking-wide text-amber-dark">{d.subtitle}</div>}
        <div className="line-clamp-2 min-h-[2.5em] text-[13.5px] font-bold leading-tight text-ink">{d.title}</div>
        {d.locked ? (
          <div className="mt-1.5 text-[11.5px] font-bold text-amber">Toque para destravar</div>
        ) : (
          (() => { const p = progressLabel(d, progress); return (
            <div className={`mt-1.5 flex items-center gap-1 text-[11.5px] font-semibold ${p.done ? 'text-leaf' : 'text-bark/60'}`}>
              {p.done && <CheckCircle2 className="h-3.5 w-3.5" />} {p.text}
            </div>
          ); })()
        )}
      </div>
    </>
  );

  const cls = 'block overflow-hidden rounded-2xl border border-line bg-white text-left shadow-sm transition active:scale-[.98]';
  if (d.locked && d.lockedOffer) {
    return (
      <>
        <button ref={ref} type="button" className={cls + ' w-full'} onClick={() => setOpen(true)}>{inner}</button>
        {open && <OfferSheet offer={d.lockedOffer} placement="locked" refId={d.id} onClose={close} intro={`🔒 "${d.title}" faz parte do Pacote Completo`} />}
      </>
    );
  }
  return <Link to={`/conteudo/${d.id}`} className={cls}>{inner}</Link>;
}
