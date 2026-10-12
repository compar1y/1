import { lazy, Suspense, useEffect } from 'react';
import { Loader2, WifiOff } from 'lucide-react';
import { useLocation, match, navigate } from './lib/router';
import { useMe } from './state';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Library } from './pages/Library';
import { DeliverablePage } from './pages/DeliverablePage';
import { Store } from './pages/Store';
import { Account } from './pages/Account';
import { CheckoutPending } from './pages/CheckoutPending';

// O leitor de PDF e o painel são carregados só quando usados (deixa o app leve no celular)
const Reader = lazy(() => import('./pages/Reader'));
const Admin = lazy(() => import('./pages/Admin').then((m) => ({ default: m.Admin })));

const Spinner = () => <div className="grid min-h-dvh place-items-center"><Loader2 className="h-7 w-7 animate-spin text-amber" /></div>;

export function App() {
  const { path, search } = useLocation();
  const { status, refresh } = useMe();
  const params = new URLSearchParams(search);

  const isPublic = path === '/entrar' || path.startsWith('/admin');
  useEffect(() => {
    if (status === 'anon' && !isPublic) navigate('/entrar', { replace: true });
  }, [status, isPublic]);

  if (path.startsWith('/admin')) return <Suspense fallback={<Spinner />}><Admin /></Suspense>;
  if (path === '/entrar') {
    if (status === 'ready' && !params.get('t')) { navigate('/', { replace: true }); return null; }
    return <Login token={params.get('t')} />;
  }
  if (status === 'loading' || status === 'anon') return <Spinner />;
  if (status === 'error') {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <WifiOff className="mx-auto h-8 w-8 text-bark/50" />
          <p className="mt-2 font-bold">Sem conexão com o servidor.</p>
          <button onClick={() => refresh()} className="mt-3 rounded-xl bg-amber px-5 py-2.5 font-bold text-white">Tentar de novo</button>
        </div>
      </div>
    );
  }

  let m;
  if (path === '/') return <Home justBought={params.has('comprou')} />;
  if (path === '/conteudos') return <Library />;
  if ((m = match('/conteudo/:id', path))) return <DeliverablePage id={m.id} />;
  if ((m = match('/ler/:id/:item?', path))) return <Suspense fallback={<Spinner />}><Reader id={m.id} item={m.item} /></Suspense>;
  if (path === '/mais') return <Store />;
  if (path === '/conta') return <Account />;
  if (path === '/checkout-pendente') return <CheckoutPending />;
  return <Home justBought={false} />;
}
