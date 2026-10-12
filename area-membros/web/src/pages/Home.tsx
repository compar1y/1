import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpenCheck, Loader2 } from 'lucide-react';
import { Layout, SectionTitle } from '../components/Layout';
import { DeliverableCard } from '../components/DeliverableCard';
import { OfferCard } from '../components/OfferCard';
import { Link } from '../components/Link';
import { useMe } from '../state';
import { replaceUrl } from '../lib/router';
import type { Me } from '../lib/api';

/** Último conteúdo aberto e não concluído, para "Continue de onde parou". */
function continueReading(me: Me) {
  const byId = new Map(me.library.deliverables.filter((d) => d.owned).map((d) => [d.id, d]));
  for (const p of [...me.progress].sort((a, b) => b.updated_at - a.updated_at)) {
    if (p.done_at) continue;
    const [did, iid] = p.ref.split('/');
    const d = byId.get(did);
    if (!d || d.type === 'link') continue;
    const item = iid ? d.items.find((i) => i.id === iid) : null;
    if (iid && !item) continue;
    return { ref: p.ref, title: item?.title || d.title, parent: item ? d.title : null, image: item?.image || d.image, icon: item?.icon || d.icon, page: p.last_page, pages: p.pages };
  }
  return null;
}

export function Home({ justBought }: { justBought: boolean }) {
  const { me, refresh } = useMe();
  const [waiting, setWaiting] = useState(justBought);

  // Voltou do checkout (?comprou=1): consulta até a compra aparecer como aprovada (o webhook pode demorar alguns segundos)
  const [unlocked, setUnlocked] = useState<string[] | null>(null);
  useEffect(() => {
    if (!justBought) return;
    let n = 0;
    let t: number | undefined;
    const check = async () => {
      const m = await refresh();
      const recent = m?.recent || [];
      if (recent.length || ++n >= 30) {
        setWaiting(false);
        if (recent.length) setUnlocked([...new Set(recent.flatMap((r) => r.titles))]);
        replaceUrl('/');
        return;
      }
      t = window.setTimeout(check, 4000);
    };
    check();
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justBought]);

  const cont = useMemo(() => (me ? continueReading(me) : null), [me]);
  if (!me) return null;
  const owned = me.library.deliverables.filter((d) => d.owned);
  const locked = me.library.deliverables.filter((d) => d.locked);

  return (
    <Layout>
      <h1 className="text-[24px] font-black leading-tight text-ink">Olá{me.customer.firstName ? `, ${me.customer.firstName}` : ''}! 👋</h1>
      <p className="mt-1 text-[14px] text-bark/70">{me.settings.texts.homeSubtitle}</p>

      {waiting && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-leaf/30 bg-white p-4 text-[14px] font-semibold text-bark shadow-sm">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-leaf" />
          Compra recebida! Estamos liberando seu novo conteúdo, isso leva alguns segundos.
        </div>
      )}

      {unlocked && !waiting && (
        <div className="mt-4 rounded-2xl border border-leaf/30 bg-white p-4 shadow-sm">
          <div className="text-[15px] font-extrabold text-leaf">🎉 Compra confirmada, já está liberado!</div>
          {!!unlocked.length && <p className="mt-1 text-[13.5px] text-bark/80">{unlocked.join(' • ')}</p>}
        </div>
      )}

      {cont && (
        <Link to={`/ler/${cont.ref}`} className="mt-5 flex items-center gap-3 rounded-2xl bg-bark p-3 pr-4 text-white shadow-md">
          {cont.image ? <img src={cont.image} alt="" className="h-14 w-14 rounded-xl object-cover" /> : <span className="grid h-14 w-14 place-items-center rounded-xl bg-white/10 text-[26px]">{cont.icon || <BookOpenCheck />}</span>}
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wide text-white/75">Continue de onde parou</div>
            <div className="truncate text-[15px] font-extrabold">{cont.title}</div>
            {cont.page && cont.pages ? <div className="text-[12px] text-white/70">Página {cont.page} de {cont.pages}</div> : cont.parent && <div className="truncate text-[12px] text-white/70">{cont.parent}</div>}
          </div>
          <ArrowRight className="h-5 w-5 shrink-0" />
        </Link>
      )}

      <SectionTitle hint={<Link to="/conteudos" className="text-[13px] font-bold text-amber-dark">Ver tudo</Link>}>Seus conteúdos</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {owned.map((d) => <DeliverableCard key={d.id} d={d} progress={me.progress} />)}
      </div>

      {!!locked.length && (
        <>
          <SectionTitle>{me.settings.texts.lockedSection}</SectionTitle>
          <p className="-mt-2 mb-3 text-[13px] text-bark/70">{me.settings.texts.lockedHint}</p>
          <div className="grid grid-cols-3 gap-2.5">
            {locked.map((d) => <DeliverableCard key={d.id} d={d} progress={me.progress} />)}
          </div>
        </>
      )}

      {!!me.library.home.length && (
        <>
          <SectionTitle hint={<Link to="/mais" className="text-[13px] font-bold text-amber-dark">Ver todos</Link>}>Para você</SectionTitle>
          <div className="space-y-3">
            {me.library.home.map((o) => <OfferCard key={o.id} offer={o} placement="home" variant="row" />)}
          </div>
        </>
      )}
    </Layout>
  );
}
