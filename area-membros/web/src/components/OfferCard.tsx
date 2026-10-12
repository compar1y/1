import { useCallback, useState } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import type { Offer } from '../lib/api';
import { brl, endsIn } from '../lib/format';
import { useImpression } from '../lib/track';
import { Cover } from './Cover';
import { OfferSheet } from './OfferSheet';

type Props = { offer: Offer; placement: string; refId?: string; variant?: 'attached' | 'row' | 'feature' };

// "attached": a oferta presa ao conteúdo que a pessoa já tem ("Você já tem X… agora Y").
// "row": item compacto de lista (home). "feature": card grande (vitrine).
export function OfferCard({ offer, placement, refId, variant = 'attached' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useImpression<HTMLButtonElement>(offer.id, placement, refId);
  const close = useCallback(() => setOpen(false), []);
  const deadline = endsIn(offer.endsAt);
  const price = (
    <span className="whitespace-nowrap">
      {offer.priceFrom && <span className="mr-1.5 text-[12px] font-medium text-bark/50 line-through">{brl(offer.priceFrom)}</span>}
      <span className="font-black text-ink">{brl(offer.price)}</span>
    </span>
  );

  let body;
  if (variant === 'attached') {
    body = (
      <div className="relative overflow-hidden rounded-2xl border-2 border-amber/40 bg-gradient-to-br from-amber/5 to-white p-4 text-left shadow-sm">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber/10 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-amber-dark">
          <Sparkles className="h-3.5 w-3.5" /> {offer.badge || 'Próximo passo'}
        </div>
        {offer.hook && <p className="text-[13.5px] font-medium leading-snug text-wood">{offer.hook}</p>}
        <div className="mt-3 flex items-center gap-3">
          <Cover image={offer.image} icon={offer.icon} title={offer.title} className="h-16 w-16 shrink-0 rounded-xl text-[15px]" />
          <div className="min-w-0 flex-1">
            <div className="text-[15.5px] font-extrabold leading-tight text-ink">{offer.title}</div>
            <div className="mt-1 text-[14px]">{price}</div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-amber px-4 py-3 text-[14.5px] font-extrabold text-white">
          {offer.cta} <ChevronRight className="h-5 w-5" />
        </div>
        {deadline && <div className="mt-2 text-center text-[12px] font-bold text-amber-dark">{deadline}</div>}
      </div>
    );
  } else if (variant === 'row') {
    body = (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 text-left shadow-sm">
        <Cover image={offer.image} icon={offer.icon} title={offer.title} className="h-[72px] w-[72px] shrink-0 rounded-xl text-[15px]" />
        <div className="min-w-0 flex-1">
          {offer.badge && <div className="text-[10.5px] font-extrabold uppercase tracking-wide text-amber-dark">{offer.badge}</div>}
          <div className="text-[15px] font-extrabold leading-tight text-ink">{offer.title}</div>
          <div className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-bark/70">{offer.subtitle}</div>
          <div className="mt-1 text-[13.5px]">{price}</div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-amber" />
      </div>
    );
  } else {
    body = (
      <div className="overflow-hidden rounded-3xl border border-line bg-white text-left shadow-sm">
        <div className="relative">
          <Cover image={offer.image} icon={offer.icon} title={offer.title} className="aspect-[16/8] w-full text-[30px]" />
          {offer.badge && <span className="absolute left-3 top-3 rounded-full bg-amber px-3 py-1 text-[11px] font-extrabold tracking-wide text-white shadow">{offer.badge}</span>}
        </div>
        <div className="p-4">
          <div className="text-[18px] font-black leading-tight text-ink">{offer.title}</div>
          {offer.subtitle && <p className="mt-1 text-[13.5px] leading-snug text-bark/75">{offer.subtitle}</p>}
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="text-[16px]">{price}</div>
            <span className="rounded-xl bg-amber px-4 py-2.5 text-[13.5px] font-extrabold text-white">Ver detalhes</span>
          </div>
          {deadline && <div className="mt-2 text-[12px] font-bold text-amber-dark">{deadline}</div>}
        </div>
      </div>
    );
  }

  return (
    <>
      <button ref={ref} type="button" onClick={() => setOpen(true)} className="block w-full transition active:scale-[.99]">
        {body}
      </button>
      {open && <OfferSheet offer={offer} placement={placement} refId={refId} onClose={close} />}
    </>
  );
}
