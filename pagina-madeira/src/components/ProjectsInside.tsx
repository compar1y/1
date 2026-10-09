import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { offerConfig } from '../offerConfig';
import { ProjectLightbox } from './ProjectLightbox';

interface ProjectsInsideProps {
  onCtaClick?: () => void;
}

export const ProjectsInside: React.FC<ProjectsInsideProps> = ({ onCtaClick }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section
      id="projetos-por-dentro" data-retina="Galeria de projetos"
      className="w-full bg-[#EDE3D4] py-10 md:py-16 px-4 overflow-hidden"
    >
      <div className="w-full max-w-[1160px] mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-12">
          <h2
            id="projects-inside-title"
            className="text-[26px] sm:text-[32px] md:text-[38px] font-black text-[#171512] tracking-tight leading-tight"
          >
            Projetos Que Você Vai Aprender a Fazer
          </h2>
          <p
            id="projects-inside-subtitle"
            className="mt-3 text-[15px] sm:text-[16px] text-[#3F2A1E]/85 font-medium leading-relaxed"
          >
            Tenha em mãos o resultado final, medidas exatas, materiais e o passo a passo completo para executar cada peça com segurança — modelos com excelente acabamento e alta procura, perfeitos para uso pessoal ou fáceis de vender sob encomenda.
          </p>
        </div>

        {/* Carousel Wrapper with Desktop Controls */}
        <div className="relative group">
          {/* Scroll Buttons for Desktop */}
          <button
            id="carousel-btn-prev"
            onClick={() => handleScroll('left')}
            type="button"
            aria-label="Rolar para a esquerda"
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full bg-white text-[#3F2A1E] shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:bg-[#F5F0E7] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[#6F4528]/15"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            id="carousel-btn-next"
            onClick={() => handleScroll('right')}
            type="button"
            aria-label="Rolar para a direita"
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full bg-white text-[#3F2A1E] shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:bg-[#F5F0E7] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[#6F4528]/15"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Horizontal Scroll Track */}
          <div
            ref={scrollContainerRef}
            id="projects-carousel-track"
            className="flex gap-4 md:gap-6 overflow-x-auto pb-6 pt-2 px-2 no-scrollbar snap-x snap-mandatory cursor-grab active:cursor-grabbing"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {offerConfig.assets.projects.map((imageUrl, index) => (
              <div
                key={`project-page-${index}`}
                id={`project-card-${index}`}
                onClick={() => setLightboxIndex(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setLightboxIndex(index);
                  }
                }}
                className="flex-shrink-0 w-[240px] sm:w-[260px] md:w-[280px] bg-white rounded-[12px] p-2.5 sm:p-3 shadow-[0_6px_18px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_28px_rgba(63,42,30,0.16)] transition-all duration-300 snap-center hover:-translate-y-1 group/card cursor-pointer border border-[#6F4528]/10 relative overflow-hidden"
              >
                {/* A4 Container Aspect Ratio ~ 1:1.414 */}
                <div className="w-full aspect-[1/1.414] relative bg-[#FAF7F2] rounded-[8px] overflow-hidden flex items-center justify-center">
                  <img
                    id={`project-img-${index}`}
                    src={imageUrl}
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback = offerConfig.assets.projectFallbacks?.[index];
                      if (fallback && target.src !== fallback) {
                        target.src = fallback;
                      }
                    }}
                    alt={`Projeto com medidas e passo a passo visual #${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain select-none transition-transform duration-300 group-hover/card:scale-[1.02]"
                  />
                  {/* Hover indicator to zoom */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/95 text-[#3F2A1E] font-semibold text-xs py-1.5 px-3 rounded-full flex items-center gap-1.5 shadow-md">
                      <ZoomIn className="w-3.5 h-3.5 text-[#C86A1B]" />
                      Clique para ampliar
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hint indicator for mobile users */}
        <div className="text-center mt-3 text-xs text-[#6F4528]/70 font-medium md:hidden flex items-center justify-center gap-1.5">
          <span>← Deslize para ver mais projetos →</span>
        </div>

        {/* CTA Button: Foco em IC */}
        <div className="mt-8 md:mt-10 flex justify-center">
          <button
            id="projects-inside-cta-button"
            onClick={onCtaClick}
            type="button"
            style={{ backgroundColor: '#008A5B', color: '#ffffff' }}
            className="animate-pulse-cta inline-flex items-center justify-center px-7 sm:px-9 py-3.5 sm:py-4 bg-[#008A5B] hover:bg-[#006E48] text-white text-[15px] sm:text-[17px] font-bold rounded-[14px] shadow-[0_8px_20px_rgba(0,138,91,0.32)] hover:shadow-[0_10px_24px_rgba(0,110,72,0.4)] cursor-pointer uppercase tracking-wider text-center select-none"
          >
            DESBLOQUEAR A COLEÇÃO DE PROJETOS ↓
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      <ProjectLightbox
        images={offerConfig.assets.projects}
        currentIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(newIdx) => setLightboxIndex(newIdx)}
      />
    </section>
  );
};
