import React from 'react';
import { CheckCircle } from 'lucide-react';
import { offerConfig, BonusItem } from '../offerConfig';
import { trackCtaClick } from '../lib/tracking';

interface BonusCardProps {
  bonus: BonusItem;
}

export const BonusCard: React.FC<BonusCardProps> = ({ bonus }) => {
  return (
    <div
      id={`bonus-card-${bonus.id}`}
      className="bg-white rounded-[14px] border border-[#5A462D]/15 shadow-[0_4px_16px_rgba(63,42,30,0.05)] flex flex-col justify-between hover:shadow-[0_8px_24px_rgba(63,42,30,0.1)] transition-all duration-300"
    >
      {/* Top Image Container */}
      <div className="w-full h-[175px] sm:h-[185px] bg-[#FAF7F2] p-3 sm:p-4 flex items-center justify-center border-b border-[#5A462D]/10 rounded-t-[14px] overflow-hidden">
        <img
          id={`bonus-img-${bonus.id}`}
          src={bonus.image}
          onError={(e) => {
            const target = e.currentTarget;
            if (bonus.imageFallback && target.src !== bonus.imageFallback) {
              target.src = bonus.imageFallback;
            }
          }}
          alt={bonus.name}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="max-h-full max-w-full object-contain select-none"
        />
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Bonus Number Tag */}
          <span
            id={`bonus-tag-${bonus.id}`}
            className="text-[12px] font-bold text-[#C86A1B] uppercase tracking-wider block mb-1"
          >
            {bonus.number}
          </span>

          {/* Title */}
          <h3
            id={`bonus-title-${bonus.id}`}
            className="text-[16px] sm:text-[17px] font-bold text-[#171512] leading-snug mb-2"
          >
            {bonus.name}
          </h3>

          {/* Description */}
          <p
            id={`bonus-desc-${bonus.id}`}
            className="text-[13px] text-[#3F2A1E]/80 leading-relaxed"
          >
            {bonus.description}
          </p>
        </div>

        {/* Card Footer */}
        <div className="mt-4 pt-3.5 border-t border-[#5A462D]/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#5A462D]/85">
            <CheckCircle className="w-3.5 h-3.5 text-[#008A5B]" />
            <span>Incluso no Plano</span>
          </div>

          <div>
            <span
              id={`bonus-badge-${bonus.id}`}
              className="inline-flex items-center justify-center text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-[6px] bg-[#E8F5E9] text-[#008A5B] border border-[#008A5B]/20 select-none"
            >
              SEM CUSTO EXTRA
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface BonusesSectionProps {
  onCtaClick?: () => void;
}

export const BonusesSection: React.FC<BonusesSectionProps> = ({ onCtaClick }) => {
  const firstRowBonuses = offerConfig.bonuses.slice(0, 4);
  const secondRowBonuses = offerConfig.bonuses.slice(4, 6);

  const handleCta = () => {
    trackCtaClick('bonuses_section_cta', 'QUERO O PLANO COMPLETO COM OS 6 BÔNUS', 'planos');
    if (onCtaClick) {
      onCtaClick();
    }
  };

  return (
    <section
      id="bonus-exclusivos" data-retina="Bônus"
      className="w-full bg-[#F5F0E7] py-12 md:py-18 px-4 border-t border-[#E8DDD0]"
    >
      <div className="w-full max-w-[1160px] mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14 flex flex-col items-center">
          {/* Headline */}
          <h2
            id="bonus-headline"
            className="text-[28px] sm:text-[34px] md:text-[40px] font-black text-[#171512] tracking-tight leading-tight"
          >
            6 Bônus Exclusivos de Apoio Prático
          </h2>

          {/* Subheadline com Clareza Comercial */}
          <p
            id="bonus-subheadline"
            className="mt-3 text-[15px] sm:text-[17px] font-medium text-[#3F2A1E]/85 max-w-2xl leading-relaxed"
          >
            Os 6 bônus abaixo estão <strong className="text-[#C86A1B] font-bold">100% incluídos no Plano Completo</strong>, sem nenhum custo adicional, para dar suporte da compra de materiais até a finalização e venda das peças.
          </p>
        </div>

        {/* First Row: 4 Cards on Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {firstRowBonuses.map((bonus) => (
            <BonusCard key={bonus.id} bonus={bonus} />
          ))}
        </div>

        {/* Second Row: 2 Cards centered on Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mt-5 sm:mt-6 lg:flex lg:justify-center">
          {secondRowBonuses.map((bonus) => (
            <div key={bonus.id} className="lg:w-[calc(25%-18px)]">
              <BonusCard bonus={bonus} />
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="mt-10 md:mt-14 flex flex-col items-center justify-center">
          <button
            id="bonuses-cta-button"
            onClick={handleCta}
            type="button"
            style={{ backgroundColor: '#008A5B', color: '#ffffff' }}
            className="animate-pulse-cta inline-flex items-center justify-center px-7 sm:px-10 py-3.5 sm:py-4 bg-[#008A5B] hover:bg-[#006E48] text-white text-[15px] sm:text-[17px] font-bold rounded-[14px] shadow-[0_8px_20px_rgba(0,138,91,0.32)] hover:shadow-[0_10px_24px_rgba(0,110,72,0.4)] cursor-pointer uppercase tracking-wider text-center select-none"
          >
            QUERO O PLANO COMPLETO COM OS 6 BÔNUS ↓
          </button>
          <span className="mt-2 text-[12px] text-[#3F2A1E]/70">
            Acesso digital imediato aos 100 projetos + 6 bônus
          </span>
        </div>
      </div>
    </section>
  );
};

