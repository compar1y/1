import { Layout } from '../components/Layout';
import { OfferCard } from '../components/OfferCard';
import { useMe } from '../state';

export function Store() {
  const { me } = useMe();
  if (!me) return null;
  const offers = me.library.store;
  return (
    <Layout title="Mais conteúdos">
      <p className="mb-4 text-[14px] leading-relaxed text-bark/75">{me.settings.texts.storeIntro}</p>
      {offers.length ? (
        <div className="space-y-4">
          {offers.map((o) => <OfferCard key={o.id} offer={o} placement="store" variant="feature" />)}
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <div className="text-[34px]">🎉</div>
          <div className="mt-1 text-[16px] font-extrabold">Você já tem todos os conteúdos disponíveis</div>
          <p className="mt-1 text-[13.5px] text-bark/70">Quando sair algo novo, ele aparece aqui.</p>
        </div>
      )}
    </Layout>
  );
}
