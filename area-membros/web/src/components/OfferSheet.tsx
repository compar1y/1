import { useEffect } from 'react';
import { Check, X, Lock, ShieldCheck } from 'lucide-react';
import type { Offer } from '../lib/api';
import { api, goUrl, STATIC } from '../lib/api';
import { navigate } from '../lib/router';
import { brl, endsIn } from '../lib/format';
import { trackOffer } from '../lib/track';
import { Cover } from './Cover';

// Detalhe da oferta em "bottom sheet". O botão leva para /go, que mede o clique e abre o checkout.
export function OfferSheet({ offer, placement, refId, onClose, intro }: { offer: Offer; placement: string; refId?: string; onClose: () => void; intro?: string }) {
  useEffect(() => {
    trackOffer({ type: 'open', offerId: offer.id, placement, ref: refId });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [offer.id, placement, refId, onClose]);

  const deadline = endsIn(offer.endsAt);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={offer.title}>
      <button aria-label="Fechar" className="animate-fade absolute inset-0 bg-black/55" onClick={onClose} />
      <div className="animate-sheet pb-safe relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="relative">
          <Cover image={offer.image} icon={offer.icon} title={offer.title} className="h-40 w-full text-[34px]" />
          <button onClick={onClose} aria-label="Fechar" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-bark shadow">
            <X className="h-5 w-5" />
          </button>
          {offer.badge && <span className="absolute left-3 top-3 rounded-full bg-amber px-3 py-1 text-[11px] font-extrabold tracking-wide text-white shadow">{offer.badge}</span>}
        </div>
        <div className="px-5 pb-5 pt-4">
          {intro && <p className="mb-1 text-[13px] font-bold text-leaf">{intro}</p>}
          {offer.hook && <p className="text-[14px] font-medium leading-snug text-wood">{offer.hook}</p>}
          <h2 className="mt-2 text-[22px] font-black leading-tight text-ink">{offer.title}</h2>
          {offer.subtitle && <p className="mt-1.5 text-[14px] leading-relaxed text-bark/80">{offer.subtitle}</p>}
          {!!offer.bullets.length && (
            <ul className="mt-4 space-y-2">
              {offer.bullets.map((b) => (
                <li key={b} className="flex gap-2.5 text-[14px] font-medium text-bark">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-leaf/10 text-leaf"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
                  {b}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 flex items-end justify-between gap-3 rounded-2xl bg-paper px-4 py-3">
            <div>
              {offer.priceFrom && <div className="text-[13px] text-bark/60 line-through">de {brl(offer.priceFrom)}</div>}
              <div className="text-[26px] font-black leading-none text-ink">{brl(offer.price)}</div>
            </div>
            {deadline && <div className="rounded-full bg-amber/10 px-3 py-1 text-[12px] font-bold text-amber-dark">{deadline}</div>}
          </div>
          <a
            href={goUrl(offer.id, placement, refId)}
            onClick={STATIC ? async (e) => { e.preventDefault(); await api('/go', { offerId: offer.id, placement, ref: refId }); onClose(); navigate('/?comprou=1'); } : undefined}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber px-5 py-4 text-center text-[16px] font-extrabold text-white shadow-[0_6px_0_var(--color-amber-dark)] active:translate-y-[3px] active:shadow-[0_3px_0_var(--color-amber-dark)]"
          >
            <Lock className="h-4 w-4" /> {offer.cta}
          </a>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-bark/60">
            <ShieldCheck className="h-4 w-4" /> Pagamento seguro • liberado aqui no app após a compra
          </p>
          <button onClick={onClose} className="mt-2 w-full py-2 text-[13px] font-semibold text-bark/60">Agora não</button>
        </div>
      </div>
    </div>
  );
}
