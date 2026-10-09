import { useState } from 'react';
import { formatBRL } from '../config/offer';
import { useStore } from '../lib/store';
import { useOffer } from './OfferSheet';
import { Button, Card } from './ui';

const num = (v: string) => parseFloat(v.replace(',', '.')) || 0;

/** Ferramenta gratuita que abre a conversa para o guia "Venda Seus Tapetes". */
export function PriceCalculator({ grams = 400, src }: { grams?: number; src: string }) {
  const { owns } = useStore();
  const { openOffer } = useOffer();
  const [g, setG] = useState(String(grams));
  const [kg, setKg] = useState('30');
  const [hours, setHours] = useState('5');
  const [rate, setRate] = useState('12');

  const material = (num(g) / 1000) * num(kg);
  const labor = num(hours) * num(rate);
  const price = Math.ceil((material + labor) * 1.1);

  const field = (label: string, value: string, setter: (v: string) => void, suffix: string) => (
    <label className="block">
      <span className="text-[11px] font-semibold text-muted">{label}</span>
      <div className="mt-1 flex items-center rounded-xl border border-line bg-cream px-3">
        <input value={value} onChange={(e) => setter(e.target.value)} inputMode="decimal" className="w-full bg-transparent py-2 text-sm outline-none" />
        <span className="text-xs text-muted">{suffix}</span>
      </div>
    </label>
  );

  return (
    <Card className="space-y-3">
      <div>
        <div className="text-sm font-bold">💰 Quanto cobrar por este tapete?</div>
        <p className="text-xs text-muted">Calcule um preço que paga o barbante e o seu tempo.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {field('Barbante usado', g, setG, 'g')}
        {field('Preço do kg', kg, setKg, 'R$')}
        {field('Horas de trabalho', hours, setHours, 'h')}
        {field('Sua hora', rate, setRate, 'R$')}
      </div>
      <div className="rounded-2xl bg-sage-dark p-4 text-white">
        <div className="text-xs text-white/80">Preço mínimo sugerido</div>
        <div className="text-2xl font-extrabold">{formatBRL(price * 100)}</div>
        <div className="text-[11px] text-white/80">
          Material {formatBRL(Math.round(material * 100))} + trabalho {formatBRL(Math.round(labor * 100))} + 10% de extras
        </div>
      </div>
      {!owns('guia-venda') && (
        <Button variant="ghost" className="-ml-5" onClick={() => openOffer('guia-venda', `calculadora_${src}`, 'Do tapete pronto à primeira venda')}>
          Aprenda a fotografar e vender seus tapetes →
        </Button>
      )}
    </Card>
  );
}
