import { Layout, SectionTitle } from '../components/Layout';
import { DeliverableCard } from '../components/DeliverableCard';
import { useMe } from '../state';

export function Library() {
  const { me } = useMe();
  if (!me) return null;
  const owned = me.library.deliverables.filter((d) => d.owned);
  const locked = me.library.deliverables.filter((d) => d.locked);
  return (
    <Layout title="Meus conteúdos">
      <SectionTitle>Liberados para você</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {owned.map((d) => <DeliverableCard key={d.id} d={d} progress={me.progress} />)}
      </div>
      {!!locked.length && (
        <>
          <SectionTitle>Bloqueados</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {locked.map((d) => <DeliverableCard key={d.id} d={d} progress={me.progress} />)}
          </div>
        </>
      )}
    </Layout>
  );
}
