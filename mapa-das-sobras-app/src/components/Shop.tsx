import { Check } from 'lucide-react';
import { formatBRL, PRODUCTS } from '../config/offer';
import { useStore } from '../lib/store';
import { useOffer } from './OfferSheet';
import { PriceCalculator } from './PriceCalculator';
import { Card, Pill } from './ui';

export function Shop() {
  const { owns, isComplete } = useStore();
  const { openOffer } = useOffer();
  const items = PRODUCTS.filter((p) => p.kind === 'upsell' && !(p.id === 'upgrade-completo' && isComplete)).sort(
    (a, b) => Number(owns(a.id)) - Number(owns(b.id))
  );

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-extrabold">Ateliê</h1>
        <p className="text-sm text-muted">Mais modelos e ferramentas para aproveitar cada grama.</p>
      </header>

      <div className="space-y-3">
        {items.map((p) => {
          const has = owns(p.id);
          return (
            <button key={p.id} onClick={() => openOffer(p.id, `loja_${p.id}`)} className="w-full text-left">
              <Card className={`relative ${p.highlight && !has ? 'border-terra' : ''}`}>
                {p.highlight && !has && (
                  <span className="absolute -top-2.5 right-4">
                    <Pill tone="gold">{p.highlight}</Pill>
                  </span>
                )}
                <div className="flex gap-3">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cream text-3xl">{p.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold leading-tight">{p.name}</div>
                    <div className="mt-0.5 text-xs text-muted">{p.tagline}</div>
                    <div className="mt-2 flex items-center gap-2">
                      {has ? (
                        <Pill tone="ok">
                          <Check size={12} /> Você já tem
                        </Pill>
                      ) : (
                        <>
                          {p.compareAt && <span className="text-xs text-muted line-through">{formatBRL(p.compareAt)}</span>}
                          <span className="font-extrabold text-terra">
                            {formatBRL(p.price)}
                            {p.recurring && <span className="text-xs font-medium text-muted">/mês</span>}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      <PriceCalculator src="loja" />
    </div>
  );
}
