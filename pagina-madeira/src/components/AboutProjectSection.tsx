import React from 'react';
import { Check } from 'lucide-react';
import { offerConfig } from '../offerConfig';

interface AboutProjectSectionProps {
  onCtaClick?: () => void;
}

export const AboutProjectSection: React.FC<AboutProjectSectionProps> = ({ onCtaClick }) => {
  return (
    <section
      id="sobre-o-marcelo" data-retina="Sobre o Marcelo"
      className="w-full bg-[#F5F0E7] py-9 sm:py-12 px-5 sm:px-6"
    >
      <div className="w-full max-w-[1000px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] items-center gap-8 md:gap-16">
          {/* Coluna Esquerda: Texto Integralmente Centralizado */}
          <div className="flex flex-col items-center text-center max-w-[520px] mx-auto w-full">
            {/* Título */}
            <h2
              id="about-marcelo-title"
              className="text-[24px] font-[800] text-[#171512] leading-[1.3] tracking-tight text-center"
            >
              Conheça o Marcelo
            </h2>

            {/* Nome em Destaque */}
            <span
              id="about-marcelo-name"
              className="mt-1.5 text-[11px] font-[700] text-[#B16D32] uppercase tracking-wider text-center"
            >
              MARCELO NUNES
            </span>

            {/* Descrição em dois parágrafos com text-align: center */}
            <div className="mt-5 space-y-3 text-[15px] font-normal text-[#41403B] leading-[1.65] text-center">
              <p>
                Marcelo é o rosto da nossa coleção de projetos de madeira, feita para quem gosta de colocar a mão na massa e quer transformar peças de madeira em projetos bonitos, funcionais e fáceis de vender sob encomenda ou usar em casa.
              </p>
              <p>
                Com mais de 100 projetos prontos, você não precisa perder horas procurando medidas ou tentando descobrir como montar cada peça. É só escolher o projeto, conferir os materiais e seguir o passo a passo — produzindo itens com excelente acabamento e alta procura.
              </p>
            </div>

            {/* Selos - Container e Itens Centralizados */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-[460px]">
              {/* Selo 1 */}
              <div className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 rounded-full border border-[#B16D32] flex items-center justify-center flex-shrink-0 text-[#B16D32]">
                  <Check className="w-3 h-3 text-[#B16D32] stroke-[3]" />
                </span>
                <span className="text-[11px] font-[700] text-[#171512] uppercase tracking-wide">
                  +100 PROJETOS EM PDF
                </span>
              </div>

              {/* Selo 2 */}
              <div className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 rounded-full border border-[#B16D32] flex items-center justify-center flex-shrink-0 text-[#B16D32]">
                  <Check className="w-3 h-3 text-[#B16D32] stroke-[3]" />
                </span>
                <span className="text-[11px] font-[700] text-[#171512] uppercase tracking-wide">
                  5 COLEÇÕES TEMÁTICAS
                </span>
              </div>

              {/* Selo 3 */}
              <div className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 rounded-full border border-[#B16D32] flex items-center justify-center flex-shrink-0 text-[#B16D32]">
                  <Check className="w-3 h-3 text-[#B16D32] stroke-[3]" />
                </span>
                <span className="text-[11px] font-[700] text-[#171512] uppercase tracking-wide">
                  MEDIDAS E CORTE EXATO
                </span>
              </div>

              {/* Selo 4 */}
              <div className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 rounded-full border border-[#B16D32] flex items-center justify-center flex-shrink-0 text-[#B16D32]">
                  <Check className="w-3 h-3 text-[#B16D32] stroke-[3]" />
                </span>
                <span className="text-[11px] font-[700] text-[#171512] uppercase tracking-wide">
                  FÁCEIS DE PRODUZIR E VENDER
                </span>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Fotografia do Marcelo Nunes */}
          <div className="flex flex-col items-center justify-center">
            <img
              id="marcelo-photo"
              src={offerConfig.assets.marcelo}
              onError={(e) => {
                const target = e.currentTarget;
                if (offerConfig.assets.marceloFallback && target.src !== offerConfig.assets.marceloFallback) {
                  target.src = offerConfig.assets.marceloFallback;
                }
              }}
              alt="Marcelo Nunes em sua oficina de marcenaria com uma peça de madeira"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="block w-full max-w-[340px] h-auto rounded-[16px] object-cover object-center shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
            />
          </div>
        </div>

        {/* CTA Button: Foco em IC */}
        <div className="mt-9 sm:mt-12 flex justify-center">
          <button
            id="about-marcelo-cta-button"
            onClick={onCtaClick}
            type="button"
            style={{ backgroundColor: '#008A5B', color: '#ffffff' }}
            className="animate-pulse-cta inline-flex items-center justify-center px-7 sm:px-9 py-3.5 sm:py-4 bg-[#008A5B] hover:bg-[#006E48] text-white text-[15px] sm:text-[17px] font-bold rounded-[14px] shadow-[0_8px_20px_rgba(0,138,91,0.32)] hover:shadow-[0_10px_24px_rgba(0,110,72,0.4)] cursor-pointer uppercase tracking-wider text-center select-none"
          >
            RECEBER O PASSO A PASSO DETALHADO ↓
          </button>
        </div>
      </div>
    </section>
  );
};
