import { useState } from 'react';
import { BRAND } from '../config/offer';
import { startWelcomeOffer, useStore } from '../lib/store';
import { track } from '../lib/tracking';
import { Button, RugPreview } from './ui';

export function Onboarding() {
  const { set } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const valid = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    track('Lead', { placement: 'onboarding' });
    set((s) => startWelcomeOffer({ ...s, user: { name: name.trim(), email: email.trim().toLowerCase() } }));
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <RugPreview shape="redondo" colors={['#EDE3D1', '#B8603C', '#8E9E7E']} className="mx-auto h-28 w-28" />
      <h1 className="mt-6 text-center text-2xl leading-tight font-extrabold">
        Bem-vinda ao <span className="text-terra">{BRAND.name}</span>
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        Cadastre suas sobras uma vez e o app mostra quais tapetes cabem no barbante que você já tem.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-3">
        <label className="block">
          <span className="text-xs font-semibold text-muted">Seu primeiro nome</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-line bg-paper px-4 py-3.5 outline-none focus:border-terra"
            placeholder="Maria"
            autoComplete="given-name"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-muted">E-mail usado na compra</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            inputMode="email"
            className="mt-1 w-full rounded-2xl border border-line bg-paper px-4 py-3.5 outline-none focus:border-terra"
            placeholder="maria@email.com"
            autoComplete="email"
          />
        </label>
        <Button type="submit" className="w-full text-base" disabled={!valid}>
          Entrar no meu mapa
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-muted">Seus dados ficam salvos só neste aparelho.</p>
    </div>
  );
}
