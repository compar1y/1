// Capa de um conteúdo ou oferta: usa a imagem quando existe; senão, um bloco com o ícone.
export function Cover({ image, icon, title, className = '' }: { image: string | null; icon: string | null; title: string; className?: string }) {
  if (image) return <img src={image} alt="" loading="lazy" decoding="async" className={`object-cover ${className}`} />;
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-wood via-wood to-amber ${className}`} aria-label={title}>
      <span className="text-[2.6em] drop-shadow-sm" aria-hidden>{icon || '📘'}</span>
    </div>
  );
}
