import { Check, Heart, Ruler } from 'lucide-react';
import { useMemo, useState } from 'react';
import { MODELS, type Shape } from '../data/models';
import { fitModel, rankModels, type FitResult, type FitStatus } from '../lib/match';
import { useStore } from '../lib/store';
import { track } from '../lib/tracking';
import { useOffer } from './OfferSheet';
import { PriceCalculator } from './PriceCalculator';
import { Button, Card, Pill, RugPreview, Sheet } from './ui';

const STATUS: Record<FitStatus, { label: string; tone: 'ok' | 'warn' | 'bad' }> = {
  cabe: { label: 'Cabe nas suas sobras', tone: 'ok' },
  quase: { label: 'Quase cabe', tone: 'warn' },
  nao: { label: 'Faltam sobras', tone: 'bad' },
};

export function FitBadge({ fit }: { fit: FitResult }) {
  const s = STATUS[fit.status];
  return <Pill tone={s.tone}>{fit.status === 'cabe' ? '✓ ' : ''}{s.label}</Pill>;
}

export function ModelCard({ fit, onOpen }: { fit: FitResult; onOpen: () => void }) {
  const { state } = useStore();
  const m = fit.model;
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-3 rounded-3xl border border-line bg-paper p-3 text-left transition hover:border-terra/50">
      <div className="relative shrink-0 rounded-2xl bg-cream p-2">
        <RugPreview shape={m.shape} colors={m.slots.map((s) => s.refHex)} className="h-16 w-16" />
        {state.done.includes(m.number) && (
          <span className="absolute -top-1 -right-1 rounded-full bg-sage-dark p-1 text-white">
            <Check size={10} />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold text-muted">Modelo {m.number} · nº {m.thickness}</div>
        <div className="truncate text-sm font-bold">{m.name}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {state.stash.length > 0 && <FitBadge fit={fit} />}
          <span className="text-xs text-muted">{fit.totalNeed} g</span>
        </div>
      </div>
    </button>
  );
}

export function Models({ openModel }: { openModel: (n: number) => void }) {
  const { state } = useStore();
  const [filter, setFilter] = useState<'todos' | 'cabe' | 'fav'>(state.stash.length ? 'cabe' : 'todos');
  const [shape, setShape] = useState<Shape | 'todas'>('todas');
  const ranked = useMemo(() => rankModels(MODELS, state.stash), [state.stash]);

  const list = ranked.filter(
    (f) =>
      (filter === 'todos' || (filter === 'cabe' ? f.status !== 'nao' : state.favorites.includes(f.model.number))) &&
      (shape === 'todas' || f.model.shape === shape)
  );

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-extrabold">Modelos</h1>
        <p className="text-sm text-muted">
          {state.stash.length ? 'Ordenados do que mais cabe nas suas sobras.' : 'Cadastre suas sobras para ver o que cabe.'}
        </p>
      </header>

      <div className="flex gap-1 rounded-2xl bg-paper p-1">
        {(
          [
            ['cabe', 'Cabem / quase'],
            ['todos', 'Todos'],
            ['fav', 'Favoritos'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`flex-1 rounded-xl py-2 text-xs font-semibold ${filter === k ? 'bg-terra text-white' : 'text-muted'}`}>
            {l}
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['todas', 'redondo', 'retangular', 'oval', 'quadrado'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setShape(s)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${shape === s ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-muted'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {list.map((f) => (
          <ModelCard key={f.model.number} fit={f} onOpen={() => openModel(f.model.number)} />
        ))}
        {!list.length && <Card className="text-center text-sm text-muted">Nenhum modelo neste filtro.</Card>}
      </div>
    </div>
  );
}

export function ModelDetail({ number, onClose }: { number: number | null; onClose: () => void }) {
  const { state, set, owns } = useStore();
  const { openOffer } = useOffer();
  const [celebrate, setCelebrate] = useState(false);
  const model = MODELS.find((m) => m.number === number);
  const fit = model ? fitModel(model, state.stash) : null;
  const hasStash = state.stash.length > 0;

  const close = () => {
    setCelebrate(false);
    onClose();
  };

  if (!model || !fit) return <Sheet open={false} onClose={close}>{null}</Sheet>;

  const fav = state.favorites.includes(model.number);
  const done = state.done.includes(model.number);
  const toggle = (key: 'favorites' | 'done') =>
    set((s) => ({ ...s, [key]: s[key].includes(model.number) ? s[key].filter((n) => n !== model.number) : [...s[key], model.number] }));

  const markDone = () => {
    if (!done) {
      track('ModelDone', { model: model.number });
      setCelebrate(true);
      // Desconta das sobras o que foi usado em cada cor.
      set((s) => ({
        ...s,
        done: [...s.done, model.number],
        stash: s.stash.map((y) => {
          const used = fit.slots.filter((r) => r.yarn?.id === y.id).reduce((a, r) => a + Math.min(r.need, y.grams), 0);
          return used ? { ...y, grams: y.grams - used } : y;
        }),
      }));
    } else toggle('done');
  };

  return (
    <Sheet open onClose={close}>
      {celebrate ? (
        <div className="p-6 pt-10">
          <div className="text-center text-5xl">🎉</div>
          <h2 className="mt-3 text-center text-xl font-extrabold">Mais um tapete pronto!</h2>
          <p className="mt-1 text-center text-sm text-muted">
            Já descontamos o barbante usado das suas sobras. Você já fez {state.done.length} {state.done.length === 1 ? 'modelo' : 'modelos'}.
          </p>
          <div className="mt-6">
            <PriceCalculator grams={fit.totalNeed} src="celebracao" />
          </div>
          <Button variant="secondary" className="mt-4 w-full" onClick={close}>
            Voltar aos modelos
          </Button>
        </div>
      ) : (
        <div>
          <div className="flex justify-center rounded-t-3xl bg-cream px-6 pt-10 pb-6">
            <RugPreview shape={model.shape} colors={model.slots.map((s) => s.refHex)} className="h-40 w-40" />
          </div>
          <div className="space-y-5 p-6">
            <div>
              <div className="text-xs font-semibold text-muted">
                Modelo {model.number} · {model.level} · página {model.pdfPage} do PDF
              </div>
              <h2 className="text-xl font-extrabold">{model.name}</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Pill>{model.size}</Pill>
                <Pill>Barbante nº {model.thickness}</Pill>
                <Pill>Agulha {model.needle}</Pill>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-line">
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 bg-cream px-4 py-2 text-[11px] font-semibold text-muted">
                <span>Cor do modelo</span>
                <span className="text-right">{hasStash ? 'Sua sobra' : ''}</span>
                <span className="text-right">Pede</span>
              </div>
              {fit.slots.map((r, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 border-t border-line px-4 py-2.5 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-4 w-4 shrink-0 rounded-full border border-line" style={{ background: r.yarn?.hex ?? r.refHex }} />
                    <span className="truncate">
                      {r.role}
                      <span className="block text-[11px] text-muted">{r.yarn ? `usando ${r.yarn.colorName}` : `ref.: ${r.refName}`}</span>
                    </span>
                  </span>
                  <span className={`text-right font-semibold ${!hasStash ? '' : r.ok ? 'text-sage-dark' : 'text-terra'}`}>
                    {hasStash ? (r.yarn ? `${r.yarn.grams} g ${r.ok ? '✓' : '✗'}` : '— ✗') : ''}
                  </span>
                  <span className="text-right text-muted">{r.need} g</span>
                </div>
              ))}
              <div className="border-t border-line bg-cream px-4 py-3 text-sm">
                {hasStash ? (
                  fit.status === 'cabe' ? (
                    <b className="text-sage-dark">✅ Cabe! Sobram cerca de {fit.margin} g de margem.</b>
                  ) : (
                    <b className="text-terra">
                      {fit.status === 'quase' ? '⚠️ Quase: ' : '❌ Não cabe: '}faltam {fit.missing} g.
                    </b>
                  )
                ) : (
                  <span className="text-muted">Total aproximado: {fit.totalNeed} g. Cadastre suas sobras para comparar.</span>
                )}
              </div>
            </div>

            {hasStash && fit.status !== 'cabe' && (
              <Card className="border-gold/60 bg-[#fbf3e1]">
                <p className="text-sm font-semibold">Falta uma cor? Dá para resgatar.</p>
                <p className="mt-1 text-xs text-muted">
                  {owns('bonus-resgate')
                    ? 'Abra o Mapa de Resgate do Tapete na aba Materiais e veja alternativas de troca de cor e borda.'
                    : 'O Mapa de Resgate do Tapete mostra trocas de cor, borda e finalização para terminar a peça com o que você tem.'}
                </p>
                {!owns('bonus-resgate') && (
                  <Button variant="ghost" className="mt-1 -ml-5" onClick={() => openOffer('upgrade-completo', 'modelo_resgate', 'Para terminar sem comprar mais barbante')}>
                    Liberar o Mapa de Resgate →
                  </Button>
                )}
              </Card>
            )}

            <div>
              <div className="mb-2 text-sm font-bold">Etapas</div>
              <ol className="space-y-1.5">
                {model.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-terra text-xs font-bold text-white">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-xs text-muted">Pontos e fotos de cada etapa na página {model.pdfPage} do PDF.</p>
            </div>

            {!owns('bonus-medidas') && (
              <button
                onClick={() => openOffer('upgrade-completo', 'modelo_medidas', 'Para mudar o tamanho')}
                className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-line p-3 text-left text-sm"
              >
                <Ruler size={18} className="shrink-0 text-terra" />
                <span>
                  <b>Quer este modelo maior ou menor?</b>
                  <span className="block text-xs text-muted">Veja a Tabela de Adaptação de Medidas</span>
                </span>
              </button>
            )}

            <div className="grid grid-cols-[auto_1fr] gap-2">
              <Button variant="secondary" onClick={() => toggle('favorites')} className={fav ? 'text-terra' : ''}>
                <Heart size={16} fill={fav ? 'currentColor' : 'none'} />
              </Button>
              <Button variant={done ? 'secondary' : 'sage'} onClick={markDone}>
                <Check size={16} /> {done ? 'Feito (desmarcar)' : 'Terminei este tapete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
