import type { ReactNode } from 'react';
import { BookOpen, Home, Sparkles, UserRound } from 'lucide-react';
import { Link } from './Link';
import { useLocation } from '../lib/router';
import { useMe } from '../state';

const tabs = [
  { to: '/', label: 'Início', icon: Home, match: (p: string) => p === '/' },
  { to: '/conteudos', label: 'Conteúdos', icon: BookOpen, match: (p: string) => p.startsWith('/conteudo') },
  { to: '/mais', label: 'Mais conteúdos', icon: Sparkles, match: (p: string) => p.startsWith('/mais') },
  { to: '/conta', label: 'Conta', icon: UserRound, match: (p: string) => p.startsWith('/conta') },
];

export function Layout({ children, title, backTo }: { children: ReactNode; title?: string; backTo?: string }) {
  const { path } = useLocation();
  const { me } = useMe();
  const storeCount = me?.library.store.length || 0;
  return (
    <div className="mx-auto min-h-dvh max-w-[560px] bg-cream pb-24">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          {backTo ? (
            <Link to={backTo} className="-ml-1 grid h-9 w-9 place-items-center rounded-full text-bark hover:bg-white" aria-label="Voltar">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </Link>
          ) : (
            <img src={me?.settings.icon || '/icon.svg'} alt="" className="h-8 w-8 rounded-lg" />
          )}
          <div className="min-w-0 flex-1 truncate text-[15px] font-extrabold text-ink">{title || me?.settings.appName || 'Área de membros'}</div>
        </div>
      </header>
      <main className="px-4 pt-4">{children}</main>
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur" aria-label="Navegação principal">
        <div className="mx-auto grid max-w-[560px] grid-cols-4">
          {tabs.map((t) => {
            const active = t.match(path);
            return (
              <Link key={t.to} to={t.to} aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${active ? 'text-amber' : 'text-bark/60'}`}>
                <t.icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.5 : 2} />
                {t.label}
                {t.to === '/mais' && storeCount > 0 && !active && (
                  <span className="absolute right-[calc(50%-22px)] top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-amber px-1 text-[10px] font-bold text-white">{storeCount}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-3 mt-7 flex items-end justify-between gap-3 first:mt-0">
      <h2 className="text-[18px] font-black text-ink">{children}</h2>
      {hint}
    </div>
  );
}
