import { Plus, Scale, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Thickness } from '../data/models';
import { uid, useStore } from '../lib/store';
import { useOffer } from './OfferSheet';
import { Button, Card } from './ui';

export const PALETTE: [string, string][] = [
  ['Cru', '#EDE3D1'],
  ['Branco', '#FAF8F4'],
  ['Terracota', '#B8603C'],
  ['Verde-sálvia', '#8E9E7E'],
  ['Mostarda', '#D3A23E'],
  ['Rosa antigo', '#C98F8B'],
  ['Azul-marinho', '#2F3E57'],
  ['Azul-céu', '#8DB3C9'],
  ['Cinza', '#9A9792'],
  ['Preto', '#2A2623'],
  ['Caramelo', '#A8713F'],
  ['Vermelho', '#B23A33'],
];

const THICK: Thickness[] = ['4/6', '6', '8'];

export function Stash() {
  const { state, set, owns } = useStore();
  const { openOffer } = useOffer();
  const [color, setColor] = useState(PALETTE[0]);
  const [grams, setGrams] = useState('');
  const [thickness, setThickness] = useState<Thickness>('6');

  const total = state.stash.reduce((a, y) => a + y.grams, 0);
  const thicknesses = new Set(state.stash.map((y) => y.thickness));
  const g = parseInt(grams, 10);

  const add = () => {
    if (!g || g <= 0) return;
    set((s) => ({ ...s, stash: [...s.stash, { id: uid(), colorName: color[0], hex: color[1], grams: g, thickness }] }));
    setGrams('');
  };

  const update = (id: string, value: number) =>
    set((s) => ({ ...s, stash: s.stash.map((y) => (y.id === id ? { ...y, grams: Math.max(0, value) } : y)) }));
  const remove = (id: string) => set((s) => ({ ...s, stash: s.stash.filter((y) => y.id !== id) }));

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-extrabold">Minhas sobras</h1>
        <p className="text-sm text-muted">Separe por cor e espessura, pese e cadastre aqui.</p>
      </header>

      <Card className="space-y-4">
        <div>
          <div className="mb-2 text-xs font-semibold text-muted">Cor</div>
          <div className="grid grid-cols-6 gap-2">
            {PALETTE.map((p) => (
              <button
                key={p[0]}
                onClick={() => setColor(p)}
                title={p[0]}
                aria-label={p[0]}
                className={`aspect-square rounded-full border-2 transition ${color[0] === p[0] ? 'scale-110 border-ink' : 'border-line'}`}
                style={{ background: p[1] }}
              />
            ))}
          </div>
          <div className="mt-2 text-sm font-semibold">{color[0]}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="text-xs font-semibold text-muted">Peso (g)</span>
            <input
              value={grams}
              onChange={(e) => setGrams(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              inputMode="numeric"
              placeholder="ex: 120"
              className="mt-1 w-full rounded-2xl border border-line bg-cream px-4 py-3 outline-none focus:border-terra"
            />
          </label>
          <div>
            <span className="text-xs font-semibold text-muted">Barbante nº</span>
            <div className="mt-1 flex gap-1 rounded-2xl bg-cream p-1">
              {THICK.map((t) => (
                <button
                  key={t}
                  onClick={() => setThickness(t)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${thickness === t ? 'bg-paper shadow' : 'text-muted'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Button onClick={add} disabled={!g} className="w-full">
          <Plus size={16} /> Adicionar sobra
        </Button>
        <p className="flex items-start gap-2 text-xs text-muted">
          <Scale size={14} className="mt-0.5 shrink-0" /> Use uma balança de cozinha. Pese cada cor separada, sem o tubete.
        </p>
      </Card>

      {state.stash.length > 0 && (
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-sm font-semibold">{state.stash.length} sobras</span>
            <span className="text-sm font-bold text-terra">{total} g no total</span>
          </div>
          <ul>
            {state.stash.map((y) => (
              <li key={y.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                <span className="h-9 w-9 shrink-0 rounded-full border border-line" style={{ background: y.hex }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{y.colorName}</div>
                  <div className="text-xs text-muted">Barbante nº {y.thickness}</div>
                </div>
                <input
                  value={y.grams}
                  onChange={(e) => update(y.id, parseInt(e.target.value.replace(/\D/g, '') || '0', 10))}
                  inputMode="numeric"
                  aria-label={`Peso de ${y.colorName}`}
                  className="w-16 rounded-xl border border-line bg-cream px-2 py-1.5 text-right text-sm"
                />
                <span className="text-xs text-muted">g</span>
                <button onClick={() => remove(y.id)} aria-label="Remover" className="p-1 text-muted hover:text-terra">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {thicknesses.size > 1 && !owns('bonus-fios') && (
        <Card className="border-gold/60 bg-[#fbf3e1]">
          <p className="text-sm font-semibold">Você tem barbantes de espessuras diferentes.</p>
          <p className="mt-1 text-xs text-muted">
            O app só combina fios da mesma espessura. A Tabela de Fios, Espessuras e Agulhas mostra quando dá para misturar e qual agulha usar.
          </p>
          <Button variant="ghost" className="mt-1 -ml-5" onClick={() => openOffer('upgrade-completo', 'stash_espessuras', 'Para misturar espessuras')}>
            Ver a tabela de fios →
          </Button>
        </Card>
      )}
    </div>
  );
}
