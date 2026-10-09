import { ChevronRight, Clock } from 'lucide-react';
import { useMemo } from 'react';
import { formatBRL, productById } from '../config/offer';
import { MODELS } from '../data/models';
import { rankModels } from '../lib/match';
import { useStore } from '../lib/store';
import { ModelCard } from './Models';
import { useOffer } from './OfferSheet';
import { Button, Card, useCountdown } from './ui';
import type { Tab } from '../App';

const TOTAL_MODELS = 100;

export function Home({ go, openModel }: { go: (t: Tab) => void; openModel: (n: number) => void }) {
  const { state, isComplete, owns } = useStore();
  const { openOffer } = useOffer();
  const ranked = useMemo(() => rankModels(MODELS, state.stash), [state.stash]);
  const fits = ranked.filter((f) => f.status === 'cabe');
  const grams = state.stash.reduce((a, y) => a + y.grams, 0);
  const { left, label } = useCountdown(state.welcomeOfferEndsAt);
  const upgrade = productById('upgrade-completo')!;
  const month = new Date().getMonth();

  // Próxima oferta mais relevante para o momento da cliente.
  const next = !isComplete
    ? null
    : state.done.length > 0 && !owns('guia-venda')
      ? { id: 'guia-venda', text: 'Já fez seu primeiro tapete? Que tal começar a vender?' }
      : month >= 8 && month <= 11 && !owns('pack-natal')
        ? { id: 'pack-natal', text: 'O Natal está chegando: modelos para vender e presentear.' }
        : !owns('pack-casa')
          ? { id: 'pack-casa', text: 'Monte jogos de banheiro e cozinha com as mesmas sobras.' }
          : !owns('clube')
            ? { id: 'clube', text: 'Modelos novos todo mês no Clube das Sobras.' }
            : null;

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm text-muted">Olá, {state.user?.name || 'crocheteira'} 👋</p>
        <h1 className="text-2xl leading-tight font-extrabold">O que suas sobras viram hoje?</h1>
      </header>

      <div className="grid grid-cols-3 gap-2">
        {[
          [`${grams} g`, 'de sobras'],
          [fits.length, 'modelos cabem'],
          [`${state.done.length}/${TOTAL_MODELS}`, 'feitos'],
        ].map(([v, l]) => (
          <Card key={l} className="p-3 text-center">
            <div className="text-lg font-extrabold text-terra">{v}</div>
            <div className="text-[11px] text-muted">{l}</div>
          </Card>
        ))}
      </div>

      {!isComplete && (
        <button
          onClick={() => openOffer('upgrade-completo', left > 0 ? 'home_boasvindas' : 'home_upgrade', left > 0 ? 'Oferta de boas-vindas' : undefined)}
          className="w-full overflow-hidden rounded-3xl bg-gradient-to-br from-terra to-terra-dark p-5 text-left text-white"
        >
          {left > 0 && (
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
              <Clock size={12} /> Oferta de boas-vindas acaba em {label}
            </div>
          )}
          <div className="text-lg leading-tight font-extrabold">🎁 Libere os 6 bônus do Plano Completo</div>
          <p className="mt-1 text-sm text-white/85">Cores, emendas, resgate, medidas e acabamentos. Pague só a diferença.</p>
          <div className="mt-3 flex items-center justify-between">
            <span>
              <span className="mr-2 text-sm text-white/70 line-through">{formatBRL(upgrade.compareAt!)}</span>
              <b className="text-xl">{formatBRL(upgrade.price)}</b>
            </span>
            <span className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-terra">Ver oferta</span>
          </div>
        </button>
      )}

      {state.stash.length === 0 ? (
        <Card className="space-y-3 text-center">
          <div className="text-4xl">🧶</div>
          <div className="font-bold">Comece pelas suas sobras</div>
          <p className="text-sm text-muted">Separe, pese e cadastre. Em um minuto você vê quais tapetes cabem nelas.</p>
          <Button className="w-full" onClick={() => go('sobras')}>
            Cadastrar minhas sobras
          </Button>
        </Card>
      ) : (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-bold">{fits.length ? 'Cabem nas suas sobras' : 'Os que chegam mais perto'}</h2>
            <button onClick={() => go('modelos')} className="flex items-center text-xs font-semibold text-terra">
              Ver todos <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {(fits.length ? fits : ranked).slice(0, 3).map((f) => (
              <ModelCard key={f.model.number} fit={f} onOpen={() => openModel(f.model.number)} />
            ))}
          </div>
        </section>
      )}

      {next && (
        <button onClick={() => openOffer(next.id, 'home_proxima')} className="w-full text-left">
          <Card className="flex items-center gap-3">
            <span className="text-3xl">{productById(next.id)!.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">{productById(next.id)!.name}</span>
              <span className="block text-xs text-muted">{next.text}</span>
            </span>
            <ChevronRight size={18} className="text-muted" />
          </Card>
        </button>
      )}
    </div>
  );
}
