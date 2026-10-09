import React, { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { offerConfig } from '../offerConfig';

interface ProjectLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

export const ProjectLightbox: React.FC<ProjectLightboxProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const handlePrev = useCallback(() => {
    onNavigate((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, onNavigate]);

  const handleNext = useCallback(() => {
    onNavigate((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, onNavigate]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen) return null;

  return (
    <div
      id="project-lightbox-overlay"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 select-none animate-fadeIn"
      onClick={onClose}
    >
      {/* Lightbox Container */}
      <div
        id="project-lightbox-content"
        className="relative max-w-[90vw] max-h-[92vh] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="lightbox-close-btn"
          onClick={onClose}
          type="button"
          aria-label="Fechar visualizador"
          className="absolute -top-10 right-0 sm:-top-12 sm:right-0 p-2 text-white/80 hover:text-white bg-black/40 hover:bg-black/70 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Counter */}
        <div
          id="lightbox-counter"
          className="absolute -top-10 left-0 sm:-top-12 sm:left-0 text-white/90 text-sm font-medium tracking-wide bg-black/40 px-3 py-1 rounded-full"
        >
          Página {currentIndex + 1} de {images.length}
        </div>

        {/* Image Box */}
        <div className="relative flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-2xl">
          <img
            id={`lightbox-image-${currentIndex}`}
            src={images[currentIndex]}
            onError={(e) => {
              const target = e.currentTarget;
              const fallback = offerConfig.assets.projectFallbacks?.[currentIndex];
              if (fallback && target.src !== fallback) {
                target.src = fallback;
              }
            }}
            alt={`Página interna do projeto ${currentIndex + 1}`}
            className="max-h-[82vh] max-w-[85vw] md:max-w-[620px] object-contain select-none"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Navigation Arrows */}
        <button
          id="lightbox-prev-btn"
          onClick={handlePrev}
          type="button"
          aria-label="Projeto anterior"
          className="absolute left-2 sm:-left-16 top-1/2 -translate-y-1/2 p-3 text-white bg-black/50 hover:bg-black/80 rounded-full transition-all cursor-pointer shadow-lg"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          id="lightbox-next-btn"
          onClick={handleNext}
          type="button"
          aria-label="Próximo projeto"
          className="absolute right-2 sm:-right-16 top-1/2 -translate-y-1/2 p-3 text-white bg-black/50 hover:bg-black/80 rounded-full transition-all cursor-pointer shadow-lg"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
