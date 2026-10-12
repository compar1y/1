import { Clock } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Link } from '../components/Link';

// Aparece quando a oferta ainda está com o link de checkout provisório no catalog.js
export function CheckoutPending() {
  return (
    <Layout title="Em breve" backTo="/mais">
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <Clock className="mx-auto h-9 w-9 text-amber" />
        <h1 className="mt-2 text-[18px] font-extrabold">Este conteúdo abre em breve</h1>
        <p className="mt-1 text-[14px] text-bark/70">Estamos finalizando a liberação. Volte daqui a pouco.</p>
        <Link to="/" className="mt-4 inline-block rounded-xl bg-amber px-5 py-3 text-[14px] font-extrabold text-white">Voltar ao início</Link>
      </div>
    </Layout>
  );
}
