import { Download, Lock } from 'lucide-react';
import { BRAND, PRODUCTS, type Product } from '../config/offer';
import { useStore } from '../lib/store';
import { track } from '../lib/tracking';
import { useOffer } from './OfferSheet';
import { Card, Pill } from './ui';

export function Library() {
  const { owns } = useStore();
  const { openOffer } = useOffer();
  // Produto principal, bônus (bloqueados ou não) e coleções extras já compradas.
  const items = PRODUCTS.filter((p) => p.kind !== 'upsell' || (!p.unlocks && owns(p.id)));

  const open = (p: Product) => {
    if (!owns(p.id)) return openOffer(p.kind === 'bonus' ? 'upgrade-completo' : p.id, `biblioteca_${p.id}`, `Para liberar: ${p.name}`);
    if (!p.pdfUrl) return alert('O link deste material ainda não foi configurado. Fale com o suporte: ' + BRAND.supportEmail);
    track('OpenMaterial', { id: p.id });
    window.open(p.pdfUrl, '_blank', 'noopener');
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-extrabold">Meus materiais</h1>
        <p className="text-sm text-muted">Baixe uma vez e consulte até sem internet.</p>
      </header>

      <div className="space-y-2">
        {items.map((p) => {
          const has = owns(p.id);
          return (
            <button key={p.id} onClick={() => open(p)} className="w-full text-left">
              <Card className={`flex items-center gap-3 ${has ? '' : 'opacity-80'}`}>
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${has ? 'bg-cream' : 'bg-cream grayscale'}`}>{p.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{p.name}</span>
                  <span className="block text-xs text-muted">{p.format}</span>
                  {!has && (
                    <span className="mt-1 inline-block">
                      <Pill tone="warn">Plano Completo</Pill>
                    </span>
                  )}
                </span>
                {has ? <Download size={18} className="text-sage-dark" /> : <Lock size={18} className="text-terra" />}
              </Card>
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted">
        Comprou e algo não liberou? Abra o link de acesso do e-mail da compra neste aparelho ou escreva para {BRAND.supportEmail}.
      </p>
    </div>
  );
}
