import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Loader2, Mail, MailCheck } from 'lucide-react';
import { api } from '../lib/api';
import { navigate } from '../lib/router';
import { useMe } from '../state';

export function Login({ token }: { token: string | null }) {
  const { refresh, brand } = useMe();
  const [email, setEmail] = useState(() => { try { return localStorage.getItem('am_email') || ''; } catch { return ''; } });
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'verifying'>(token ? 'verifying' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const verified = useRef(false);

  useEffect(() => {
    if (!token || verified.current) return;
    verified.current = true;
    api('/api/auth/verify', { token })
      .then(async () => { await refresh(); navigate('/', { replace: true }); })
      .catch((e) => { setError(e.message); setState('idle'); history.replaceState(null, '', '/entrar'); });
  }, [token, refresh]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setState('sending');
    try {
      const r = await api<{ devLink?: string }>('/api/auth/request', { email });
      try { localStorage.setItem('am_email', email.trim()); } catch { /* modo privado */ }
      setDevLink(r.devLink || null);
      setState('sent');
    } catch (err: any) {
      setError(err.message);
      setState('idle');
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[440px] flex-col px-5 pb-10 pt-8">
      <div className="flex items-center gap-2.5">
        <img src={brand?.icon || '/icon.svg'} alt="" className="h-9 w-9 rounded-xl" />
        <span className="text-[14px] font-extrabold text-bark">{brand?.appName}</span>
      </div>
      {brand?.loginImage && <img src={brand.loginImage} alt="" className="mx-auto mt-6 h-[200px] w-auto object-contain drop-shadow-xl" />}
      <h1 className="mt-6 text-[28px] font-black leading-[1.1] text-ink">Sua área de membros</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-bark/80">
        {brand?.texts.loginSubtitle}
      </p>

      {state === 'verifying' && (
        <div className="mt-8 flex items-center gap-3 rounded-2xl bg-white p-4 text-[15px] font-semibold text-bark shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-amber" /> Entrando…
        </div>
      )}

      {state === 'sent' ? (
        <div className="mt-8 rounded-2xl border border-leaf/30 bg-white p-5 shadow-sm">
          <MailCheck className="h-8 w-8 text-leaf" />
          <h2 className="mt-2 text-[18px] font-extrabold text-ink">Confira seu e-mail</h2>
          <p className="mt-1 text-[14px] leading-relaxed text-bark/80">
            Se <b>{email.trim()}</b> tiver uma compra, o link de acesso chega em instantes. Olhe também nas abas <b>Spam</b> e <b>Promoções</b>.
          </p>
          {devLink && (
            <a href={devLink} className="mt-4 block rounded-xl bg-bark px-4 py-3 text-center text-[14px] font-bold text-white">
              Modo de teste: entrar agora
            </a>
          )}
          <button onClick={() => setState('idle')} className="mt-4 text-[13px] font-semibold text-amber-dark underline">Usar outro e-mail</button>
        </div>
      ) : state !== 'verifying' && (
        <form onSubmit={submit} className="mt-8">
          <label htmlFor="email" className="text-[13px] font-bold text-bark">E-mail da compra</label>
          <div className="mt-1.5 flex items-center gap-2 rounded-2xl border-2 border-line bg-white px-4 focus-within:border-amber">
            <Mail className="h-5 w-5 text-bark/50" />
            <input id="email" type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com" className="w-full bg-transparent py-3.5 text-[16px] outline-none" />
          </div>
          {error && <p className="mt-2 text-[13.5px] font-semibold text-red-700" role="alert">{error}</p>}
          <button disabled={state === 'sending'} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber py-4 text-[16px] font-extrabold text-white shadow-[0_6px_0_var(--color-amber-dark)] active:translate-y-[3px] active:shadow-[0_3px_0_var(--color-amber-dark)] disabled:opacity-70">
            {state === 'sending' && <Loader2 className="h-5 w-5 animate-spin" />} Receber link de acesso
          </button>
        </form>
      )}
      {brand?.supportEmail && <p className="mt-auto pt-10 text-center text-[12px] text-bark/55">Problemas para entrar? Fale com o suporte: {brand.supportEmail}</p>}
    </div>
  );
}
