import { Check, Lock, ShieldCheck } from 'lucide-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { BONUS_IDS, formatBRL, productById, type Product } from '../config/offer';
import { useStore } from '../lib/store';
import { buildCheckoutUrl, track } from '../lib/tracking';
import { Button, Sheet } from './ui';

interface OfferCtx {
  /** Abre a oferta de um produto. `src` identifica onde a oferta apareceu (vai para utm_content). */
  openOffer: (productId: string, src: string, reason?: string) => void;
}

const Ctx = createContext<OfferCtx>({ openOffer: () => {} });
export const useOffer = () => useContext(Ctx);

export function OfferProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<{ product: Product; src: string; reason?: string } | null>(null);

  const openOffer = useCallback((productId: string, src: string, reason?: string) => {
    const product = productById(productId);
    if (!product) return;
    track('ViewContent', { content_ids: [product.id], content_name: product.name, value: product.price / 100, currency: 'BRL', placement: src });
    setCurrent({ product, src, reason });
  }, []);

  return (
    <Ctx.Provider value={{ openOffer }}>
      {children}
      <Sheet open={!!current} onClose={() => setCurrent(null)}>
        {current && <OfferBody {...current} />}
      </Sheet>
    </Ctx.Provider>
  );
}

function OfferBody({ product, src, reason }: { product: Product; src: string; reason?: string }) {
  const { state, owns } = useStore();
  const already = owns(product.id);
  const url = product.checkoutUrl
    ? buildCheckoutUrl(product.checkoutUrl, { email: state.user?.email, name: state.user?.name, src })
    : '';
  const included = product.unlocks?.map((id) => productById(id)).filter(Boolean) as Product[] | undefined;
  const isUpgrade = product.unlocks?.some((id) => (BONUS_IDS as readonly string[]).includes(id));
  const off = product.compareAt ? Math.round((1 - product.price / product.compareAt) * 100) : 0;

  const go = () => {
    track('InitiateCheckout', { content_ids: [product.id], value: product.price / 100, currency: 'BRL', placement: src });
    window.open(url, '_blank', 'noopener');
  };

  return (
    <div>
      <div className="rounded-t-3xl bg-gradient-to-br from-terra to-terra-dark px-6 pt-8 pb-6 text-white">
        {reason && <p className="mb-2 text-xs font-semibold tracking-wide text-white/80 uppercase">{reason}</p>}
        <div className="text-4xl">{product.emoji}</div>
        <h2 className="mt-2 text-xl leading-tight font-bold">{product.name}</h2>
        <p className="mt-1 text-sm text-white/85">{product.tagline}</p>
      </div>

      <div className="space-y-5 p-6">
        <p className="text-sm leading-relaxed text-muted">{product.description}</p>

        {included && (
          <ul className="space-y-2">
            {included.map((p) => (
              <li key={p.id} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 rounded-full bg-[#e4ecdc] p-0.5 text-sage-dark">
                  <Check size={14} />
                </span>
                <span>
                  <b className="font-semibold">{p.name}</b>
                  {owns(p.id) && <span className="ml-1 text-xs text-muted">(você já tem)</span>}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-end justify-between rounded-2xl bg-cream p-4">
          <div>
            {product.compareAt && <div className="text-xs text-muted line-through">{formatBRL(product.compareAt)}</div>}
            <div className="text-2xl font-extrabold text-ink">
              {formatBRL(product.price)}
              {product.recurring && <span className="text-sm font-medium text-muted">/mês</span>}
            </div>
            <div className="text-xs text-muted">{product.recurring ? 'Cancele quando quiser' : 'Pagamento único'}</div>
          </div>
          {off > 0 && <span className="rounded-xl bg-sage-dark px-3 py-1.5 text-sm font-bold text-white">-{off}%</span>}
        </div>

        {already ? (
          <Button variant="secondary" className="w-full" disabled>
            <Check size={16} /> Você já tem este material
          </Button>
        ) : url ? (
          <Button className="w-full text-base" onClick={go}>
            {isUpgrade ? 'Liberar agora' : product.recurring ? 'Assinar agora' : 'Quero este material'}
          </Button>
        ) : (
          <Button className="w-full" disabled>
            <Lock size={16} /> Disponível em breve
          </Button>
        )}

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
          <ShieldCheck size={14} /> Garantia de {product.guaranteeDays ?? 7} dias · Compra 100% segura
        </p>
      </div>
    </div>
  );
}
