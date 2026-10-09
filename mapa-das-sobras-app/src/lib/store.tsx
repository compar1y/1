import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BONUS_IDS, PRODUCTS, WELCOME_OFFER_MINUTES } from '../config/offer';
import type { Yarn } from './match';

export interface AppState {
  user: { name: string; email: string } | null;
  owned: string[];
  stash: Yarn[];
  done: number[];
  favorites: number[];
  welcomeOfferEndsAt: number | null;
  welcomeOfferDismissed: boolean;
}

const KEY = 'mds_state_v1';

const initial: AppState = {
  user: null,
  owned: ['core'],
  stash: [],
  done: [],
  favorites: [],
  welcomeOfferEndsAt: null,
  welcomeOfferDismissed: false,
};

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initial, ...JSON.parse(raw) };
  } catch {
    /* modo privado ou armazenamento bloqueado */
  }
  return initial;
}

/**
 * Libera acesso a partir da URL de obrigado do checkout:
 *   ?plano=completo           → core + 6 bônus
 *   ?plano=basico             → core
 *   ?liberar=pack-natal,clube → produtos extras
 * Também aceita ?email=&nome= para pular o cadastro.
 */
function applyUrlAccess(s: AppState): AppState {
  const p = new URLSearchParams(window.location.search);
  const owned = new Set(s.owned);
  const plano = p.get('plano');
  if (plano === 'completo') ['core', ...BONUS_IDS].forEach((id) => owned.add(id));
  if (plano === 'basico') owned.add('core');
  (p.get('liberar') || '')
    .split(',')
    .map((x) => x.trim())
    .filter((id) => PRODUCTS.some((pr) => pr.id === id))
    .forEach((id) => owned.add(id));

  let user = s.user;
  const email = p.get('email');
  if (!user && email) user = { email, name: p.get('nome') || p.get('name') || '' };

  if (plano || p.get('liberar') || email) {
    ['plano', 'liberar', 'email', 'nome', 'name'].forEach((k) => p.delete(k));
    const qs = p.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash);
  }
  return { ...s, owned: [...owned], user };
}

interface Ctx {
  state: AppState;
  set: (fn: (s: AppState) => AppState) => void;
  owns: (productId: string) => boolean;
  isComplete: boolean;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => applyUrlAccess(load()));

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const set = useCallback((fn: (s: AppState) => AppState) => setState(fn), []);

  const owns = useCallback(
    (id: string) =>
      state.owned.includes(id) ||
      state.owned.some((o) => PRODUCTS.find((p) => p.id === o)?.unlocks?.includes(id)),
    [state.owned]
  );

  const value = useMemo<Ctx>(
    () => ({ state, set, owns, isComplete: BONUS_IDS.every((b) => owns(b)) }),
    [state, set, owns]
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore fora do StoreProvider');
  return ctx;
}

export const startWelcomeOffer = (s: AppState): AppState =>
  s.welcomeOfferEndsAt ? s : { ...s, welcomeOfferEndsAt: Date.now() + WELCOME_OFFER_MINUTES * 60_000 };

export const uid = () => Math.random().toString(36).slice(2, 10);
