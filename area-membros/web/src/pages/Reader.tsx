import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, Download, Loader2, ZoomIn, ZoomOut, CheckCircle2 } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { Link } from '../components/Link';
import { OfferCard } from '../components/OfferCard';
import { OfferSheet } from '../components/OfferSheet';
import { api, fileUrl } from '../lib/api';
import { useMe } from '../state';

// Build "legacy" do pdf.js: funciona também em celulares mais antigos (Android/iOS desatualizados).
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const DPR = Math.min(window.devicePixelRatio || 1, 2);

/** Uma página: só desenha quando está perto da tela e libera a memória quando sai (PDFs grandes no celular). */
function PageView({ doc, n, width, ratio }: { doc: PDFDocumentProxy; n: number; width: number; ratio: number }) {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(false);
  const [ownRatio, setOwnRatio] = useState<number | null>(null);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '150% 0px' });
    if (holder.current) io.observe(holder.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    if (!near) { c.width = 0; c.height = 0; return; }
    let task: { cancel: () => void; promise: Promise<void> } | null = null;
    let cancelled = false;
    doc.getPage(n).then((page) => {
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      setOwnRatio(base.height / base.width);
      const viewport = page.getViewport({ scale: (width / base.width) * DPR });
      c.width = Math.floor(viewport.width);
      c.height = Math.floor(viewport.height);
      task = page.render({ canvasContext: c.getContext('2d')!, viewport });
      task.promise.catch(() => {});
    });
    return () => { cancelled = true; task?.cancel(); };
  }, [near, doc, n, width]);

  return (
    <div ref={holder} data-page={n} className="relative mx-auto mb-2 bg-white shadow-sm" style={{ width, height: width * (ownRatio || ratio) }}>
      <canvas ref={canvas} className="block h-full w-full" />
      {!near && <div className="absolute inset-0 grid place-items-center text-[13px] font-semibold text-bark/30">Página {n}</div>}
    </div>
  );
}

export default function Reader({ id, item }: { id: string; item?: string }) {
  const { me, refresh } = useMe();
  const ref = item ? `${id}/${item}` : id;
  const d = me?.library.deliverables.find((x) => x.id === id && x.owned);
  const it = item ? d?.items.find((i) => i.id === item) : null;
  const title = it?.title || d?.title || '';
  const endOffer = (item ? it?.endOffer : d?.endOffer) || null;
  const saved = me?.progress.find((p) => p.ref === ref);

  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [ratio, setRatio] = useState(1.414);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [vw, setVw] = useState(() => Math.min(window.innerWidth, 900));
  const [endSheet, setEndSheet] = useState(false);
  const [done, setDone] = useState(!!saved?.done_at);
  const endShown = useRef(false);
  const resumed = useRef(false);
  const closeEnd = useCallback(() => setEndSheet(false), []);

  useEffect(() => {
    if (!d || (item && !it)) return;
    let destroyed = false;
    const task = pdfjs.getDocument({ url: fileUrl(ref), disableAutoFetch: true, disableStream: true, withCredentials: true });
    task.promise.then(async (pdf) => {
      if (destroyed) return;
      const first = await pdf.getPage(1);
      const v = first.getViewport({ scale: 1 });
      setRatio(v.height / v.width);
      setDoc(pdf);
      api('/api/progress', { ref, page: saved?.last_page || it?.page || 1, pages: pdf.numPages }).catch(() => {});
    }).catch(() => !destroyed && setError('Não foi possível abrir o arquivo. Verifique sua internet ou use o botão de baixar.'));
    return () => { destroyed = true; task.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, !!d]);

  useEffect(() => {
    const onResize = () => setVw(Math.min(window.innerWidth, 900));
    addEventListener('resize', onResize);
    return () => removeEventListener('resize', onResize);
  }, []);

  // Página atual = a que cruza o meio da tela
  useEffect(() => {
    if (!doc) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const mid = innerHeight / 2;
        const els = document.querySelectorAll<HTMLElement>('[data-page]');
        for (const el of els) { if (el.getBoundingClientRect().bottom > mid) { setPage(Number(el.dataset.page)); break; } }
        const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 40;
        if (atBottom) setPage(doc.numPages);
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => { removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [doc]);

  // Retoma de onde parou
  useEffect(() => {
    if (!doc || resumed.current) return;
    resumed.current = true;
    // Sem progresso salvo, uma parte que aponta para uma página do e-book abre nela
    const target = Math.min(saved?.last_page && !saved.done_at ? saved.last_page : it?.page || 1, doc.numPages);
    if (target > 1) requestAnimationFrame(() => document.querySelector(`[data-page="${target}"]`)?.scrollIntoView());
  }, [doc, saved, it]);

  // Salva a página (com atraso, para não chamar a API a cada rolagem) e mostra a oferta ao terminar
  useEffect(() => {
    if (!doc) return;
    const t = setTimeout(() => api('/api/progress', { ref, page, pages: doc.numPages }).catch(() => {}), 1500);
    if (page === doc.numPages && endOffer && !endShown.current) {
      endShown.current = true;
      setTimeout(() => setEndSheet(true), 1200);
    }
    return () => clearTimeout(t);
  }, [page, doc, ref, endOffer]);

  async function markDone() {
    setDone(true);
    await api('/api/progress', { ref, done: true, page: doc?.numPages, pages: doc?.numPages }).catch(() => {});
    refresh();
  }

  if (!me) return null;
  if (!d || (item && !it)) {
    return (
      <div className="p-6 text-center">
        <p className="font-bold">Este conteúdo não está disponível na sua conta.</p>
        <Link to="/" className="mt-3 inline-block font-bold text-amber-dark underline">Voltar ao início</Link>
      </div>
    );
  }

  const width = Math.round((vw - 16) * zoom);
  return (
    <div className="min-h-dvh bg-line">
      <header className="sticky top-0 z-30 flex items-center gap-2 bg-bark px-2 py-2 text-white shadow">
        <Link to={`/conteudo/${id}`} aria-label="Voltar" className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10"><ChevronLeft className="h-6 w-6" /></Link>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-bold">{title}</div>
          {doc && <div className="text-[11.5px] text-white/70">Página {page} de {doc.numPages}</div>}
        </div>
        <button onClick={() => setZoom((z) => (z >= 2 ? 1 : z + 0.5))} aria-label={zoom >= 2 ? 'Diminuir zoom' : 'Aumentar zoom'} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10">
          {zoom >= 2 ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
        </button>
        <a href={fileUrl(ref, true)} download aria-label="Baixar PDF" className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10"><Download className="h-5 w-5" /></a>
      </header>

      {error && <div className="m-4 rounded-2xl bg-white p-4 text-[14px] font-semibold text-red-700">{error}</div>}
      {!doc && !error && <div className="flex items-center justify-center gap-2 p-10 text-[14px] font-semibold text-bark"><Loader2 className="h-5 w-5 animate-spin text-amber" /> Abrindo…</div>}

      {doc && (
        <div className="overflow-x-auto px-2 pt-2">
          {Array.from({ length: doc.numPages }, (_, i) => <PageView key={i} doc={doc} n={i + 1} width={width} ratio={ratio} />)}
        </div>
      )}

      {doc && (
        <div className="mx-auto max-w-[560px] px-4 pb-16 pt-4">
          <button onClick={markDone} disabled={done}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-extrabold ${done ? 'bg-leaf/10 text-leaf' : 'bg-white text-bark shadow-sm'}`}>
            <CheckCircle2 className="h-5 w-5" /> {done ? 'Concluído!' : 'Marcar como concluído'}
          </button>
          {endOffer && <div className="mt-4"><OfferCard offer={endOffer} placement="end" refId={ref} /></div>}
        </div>
      )}

      {endSheet && endOffer && <OfferSheet offer={endOffer} placement="end" refId={ref} onClose={closeEnd} intro={`🎉 Você chegou ao fim de "${title}"`} />}
    </div>
  );
}
