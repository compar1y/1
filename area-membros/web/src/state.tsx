import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api, ApiError, type Me } from './lib/api';

type Ctx = {
  me: Me | null;
  status: 'loading' | 'ready' | 'anon' | 'error';
  refresh: () => Promise<Me | null>;
  setMe: (m: Me | null) => void;
  toast: (text: string) => void;
};

const MeContext = createContext<Ctx>(null!);
export const useMe = () => useContext(MeContext);

export function MeProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [status, setStatus] = useState<Ctx['status']>('loading');
  const [toastText, setToastText] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const owned = useRef<Set<string> | null>(null);

  const toast = useCallback((text: string) => {
    setToastText(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastText(null), 4000);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const m = await api<Me>('/api/me');
      // Avisa quando aparece um conteúdo novo (ex.: voltou do checkout e o webhook já liberou)
      const now = new Set(m.library.deliverables.filter((d) => d.owned).map((d) => d.id));
      if (owned.current) {
        const fresh = m.library.deliverables.filter((d) => d.owned && !owned.current!.has(d.id));
        if (fresh.length) toast(`🎉 Novo conteúdo liberado: ${fresh.map((d) => d.title).join(', ')}`);
      }
      owned.current = now;
      setMe(m);
      setStatus('ready');
      return m;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) { setMe(null); owned.current = null; setStatus('anon'); }
      else setStatus((s) => (s === 'ready' ? s : 'error'));
      return null;
    }
  }, [toast]);

  useEffect(() => {
    refresh();
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  return (
    <MeContext.Provider value={{ me, status, refresh, setMe, toast }}>
      {children}
      {toastText && (
        <div role="status" className="animate-toast fixed left-1/2 top-3 z-[60] w-[calc(100%-24px)] max-w-md -translate-x-1/2 rounded-2xl bg-bark px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toastText}
        </div>
      )}
    </MeContext.Provider>
  );
}
