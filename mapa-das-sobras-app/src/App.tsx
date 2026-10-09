import { BookOpen, Grid3x3, House, Store, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Home } from './components/Home';
import { Library } from './components/Library';
import { ModelDetail, Models } from './components/Models';
import { OfferProvider, useOffer } from './components/OfferSheet';
import { Onboarding } from './components/Onboarding';
import { Shop } from './components/Shop';
import { Stash } from './components/Stash';
import { useStore } from './lib/store';

export type Tab = 'inicio' | 'sobras' | 'modelos' | 'materiais' | 'atelie';

const TABS: { id: Tab; label: string; icon: typeof House }[] = [
  { id: 'inicio', label: 'Início', icon: House },
  { id: 'sobras', label: 'Sobras', icon: Wallet },
  { id: 'modelos', label: 'Modelos', icon: Grid3x3 },
  { id: 'materiais', label: 'Materiais', icon: BookOpen },
  { id: 'atelie', label: 'Ateliê', icon: Store },
];

const readTab = (): Tab => {
  const h = window.location.hash.slice(1) as Tab;
  return TABS.some((t) => t.id === h) ? h : 'inicio';
};

function Shell() {
  const { state, set, isComplete } = useStore();
  const { openOffer } = useOffer();
  const [tab, setTab] = useState<Tab>(readTab);
  const [model, setModel] = useState<number | null>(null);

  useEffect(() => {
    const onHash = () => setTab(readTab());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Oferta de boas-vindas: aparece uma única vez, logo após o primeiro acesso.
  useEffect(() => {
    if (!state.user || isComplete || state.welcomeOfferDismissed || !state.welcomeOfferEndsAt) return;
    const t = setTimeout(() => {
      openOffer('upgrade-completo', 'boasvindas_popup', 'Oferta de boas-vindas · só no primeiro acesso');
      set((s) => ({ ...s, welcomeOfferDismissed: true }));
    }, 1200);
    return () => clearTimeout(t);
  }, [state.user, isComplete, state.welcomeOfferDismissed, state.welcomeOfferEndsAt, openOffer, set]);

  const go = (t: Tab) => {
    window.location.hash = t;
    setTab(t);
    window.scrollTo({ top: 0 });
  };

  if (!state.user) return <Onboarding />;

  return (
    <div className="mx-auto min-h-screen max-w-lg">
      <main className="px-4 pt-6 pb-28">
        {tab === 'inicio' && <Home go={go} openModel={setModel} />}
        {tab === 'sobras' && <Stash />}
        {tab === 'modelos' && <Models openModel={setModel} />}
        {tab === 'materiais' && <Library />}
        {tab === 'atelie' && <Shop />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-safe backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => go(id)}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${tab === id ? 'text-terra' : 'text-muted'}`}
            >
              <Icon size={20} strokeWidth={tab === id ? 2.4 : 1.8} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <ModelDetail number={model} onClose={() => setModel(null)} />
    </div>
  );
}

export default function App() {
  return (
    <OfferProvider>
      <Shell />
    </OfferProvider>
  );
}
