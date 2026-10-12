import { useEffect, useState } from 'react';
import { Download, LifeBuoy, LogOut, Smartphone } from 'lucide-react';
import { Layout } from '../components/Layout';
import { api } from '../lib/api';
import { navigate } from '../lib/router';
import { useMe } from '../state';

type InstallEvent = Event & { prompt: () => Promise<void> };
let deferred: InstallEvent | null = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as InstallEvent; });

export function Account() {
  const { me, setMe } = useMe();
  const [canInstall, setCanInstall] = useState(!!deferred);
  useEffect(() => {
    const on = () => setCanInstall(true);
    addEventListener('beforeinstallprompt', on);
    return () => removeEventListener('beforeinstallprompt', on);
  }, []);
  if (!me) return null;
  const standalone = matchMedia('(display-mode: standalone)').matches;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);

  return (
    <Layout title="Minha conta">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="text-[18px] font-extrabold text-ink">{me.customer.name || me.customer.email.split('@')[0]}</div>
        <div className="text-[14px] text-bark/70">{me.customer.email}</div>
      </div>

      {!standalone && (
        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[15px] font-extrabold text-ink"><Smartphone className="h-5 w-5 text-amber" /> Instale o app no celular</div>
          <p className="mt-1 text-[13.5px] leading-relaxed text-bark/75">
            {me.settings.texts.installHint}
          </p>
          {canInstall ? (
            <button onClick={async () => { await deferred?.prompt(); deferred = null; setCanInstall(false); }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-amber py-3 text-[14px] font-extrabold text-white">
              <Download className="h-4 w-4" /> Instalar agora
            </button>
          ) : (
            <p className="mt-2 rounded-xl bg-paper p-3 text-[13px] text-bark">
              {ios ? <>No Safari, toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.</> : <>No Chrome, abra o menu <b>⋮</b> e toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</>}
            </p>
          )}
        </div>
      )}

      {me.settings.supportEmail && <a href={`mailto:${me.settings.supportEmail}`} className="mt-4 flex items-center gap-2 rounded-2xl bg-white p-4 text-[14px] font-bold text-bark shadow-sm">
        <LifeBuoy className="h-5 w-5 text-amber" /> Suporte: {me.settings.supportEmail}
      </a>}
      <button
        onClick={async () => { await api('/api/auth/logout', {}); setMe(null); navigate('/entrar'); location.reload(); }}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-line py-3 text-[14px] font-bold text-bark">
        <LogOut className="h-4 w-4" /> Sair
      </button>
    </Layout>
  );
}
