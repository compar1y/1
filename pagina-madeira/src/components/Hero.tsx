import React from 'react';
import { Ruler, Eye, Hammer, Sparkles } from 'lucide-react';
import { offerConfig } from '../offerConfig';
import { trackCtaClick } from '../lib/tracking';

interface HeroProps {
  onCtaClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onCtaClick }) => {
  const handleCta = () => {
    trackCtaClick('hero_cta_button', 'QUERO CONHECER OS 100 PROJETOS', 'planos');
    onCtaClick();
  };

  return (
    <section
      id="hero-section" data-retina="Hero"
      className="w-full bg-[#F5F0E7] flex flex-col items-center text-center px-4 pt-4 pb-8 sm:pt-6 sm:pb-10 md:py-12 lg:py-14"
    >
      <div className="w-full max-w-[1100px] mx-auto flex flex-col items-center">
        {/* Eyebrow / Tag de Contexto */}
        <div className="mb-3 sm:mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C86A1B]/10 border border-[#C86A1B]/20 text-[#9E4E0D] text-[12px] sm:text-[13px] font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-[#C86A1B]" />
          <span>BIBLIOTECA COMPLETA EM PDF • ACESSO IMEDIATO</span>
        </div>

        {/* Top: Headline & Subheadline */}
        <div className="w-full flex flex-col items-center">
          <h1
            id="hero-headline"
            className="text-[30px] sm:text-[42px] md:text-[52px] lg:text-[60px] leading-[1.14] font-black text-[#171512] max-w-4xl tracking-tight"
          >
            100 projetos de madeira prontos para você{' '}
            <span className="text-[#C86A1B]">construir ou vender</span>
          </h1>

          <p
            id="hero-subheadline"
            className="mt-3 sm:mt-4 text-[16px] sm:text-[20px] md:text-[22px] leading-relaxed text-[#3F2A1E]/85 max-w-[780px] font-normal"
          >
            Tenha medidas, planos de corte, listas de materiais e instruções visuais para começar seus projetos sem precisar planejar cada peça do zero.
          </p>

          {/* 3 Benefícios Curtos & Claros */}
          <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[12.5px] sm:text-[14px] text-[#3F2A1E] font-semibold">
            <span className="inline-flex items-center gap-1.5 bg-white/80 border border-[#E8DDD0] px-3 py-1.5 rounded-full shadow-xs">
              <Ruler className="w-3.5 h-3.5 text-[#C86A1B]" />
              Projetos com medidas e materiais
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/80 border border-[#E8DDD0] px-3 py-1.5 rounded-full shadow-xs">
              <Eye className="w-3.5 h-3.5 text-[#C86A1B]" />
              Instruções visuais de montagem
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/80 border border-[#E8DDD0] px-3 py-1.5 rounded-full shadow-xs">
              <Hammer className="w-3.5 h-3.5 text-[#C86A1B]" />
              Para uso pessoal ou comercialização
            </span>
          </div>
        </div>

        {/* Middle: Main Mockup */}
        <div
          id="hero-mockup-container"
          className="my-4 sm:my-5 md:my-6 w-full flex items-center justify-center"
        >
          <img
            id="hero-main-mockup"
            src={offerConfig.assets.hero}
            onError={(e) => {
              const target = e.currentTarget;
              if (offerConfig.assets.heroFallback && target.src !== offerConfig.assets.heroFallback) {
                target.src = offerConfig.assets.heroFallback;
              }
            }}
            alt="Arsenal 100 Projetos de Madeira com 5 Coleções e Bônus"
            width={430}
            height={520}
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            referrerPolicy="no-referrer"
            className="w-full max-w-[240px] sm:max-w-[310px] md:max-w-[390px] lg:max-w-[430px] h-auto object-contain drop-shadow-[0_14px_28px_rgba(63,42,30,0.18)] select-none"
          />
        </div>

        {/* Bottom: Hero CTA */}
        <div className="w-full max-w-[380px] sm:max-w-none flex flex-col items-center justify-center pt-1">
          <button
            id="hero-cta-button"
            onClick={handleCta}
            type="button"
            style={{ backgroundColor: '#008A5B', color: '#ffffff' }}
            className="animate-pulse-cta w-full sm:w-auto inline-flex items-center justify-center px-8 sm:px-11 py-4 bg-[#008A5B] hover:bg-[#006E48] text-white text-[16px] sm:text-[18px] font-bold rounded-[14px] shadow-[0_8px_20px_rgba(0,138,91,0.32)] hover:shadow-[0_10px_24px_rgba(0,110,72,0.4)] cursor-pointer uppercase tracking-wider select-none text-center"
          >
            QUERO CONHECER OS 100 PROJETOS ↓
          </button>
          <span className="mt-2.5 text-[11.5px] sm:text-[12.5px] text-[#3F2A1E]/70 font-medium">
            Acesso digital imediato • Download em PDF • Garantia de 180 dias
          </span>
        </div>
      </div>
    </section>
  );
};

