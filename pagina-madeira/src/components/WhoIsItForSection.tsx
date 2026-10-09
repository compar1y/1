import React from 'react';
import { Ruler, Hammer, Store } from 'lucide-react';

export const WhoIsItForSection: React.FC = () => {
  return (
    <section
      id="para-quem-e" data-retina="Para quem é"
      aria-label="Para quem são esses projetos"
      className="w-full bg-[#FAF7F2] py-12 md:py-16 px-4 border-t border-[#6F4528]/10"
    >
      <div className="w-full max-w-[1080px] mx-auto">
        {/* Título Centralizado */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <h2
            id="who-is-it-for-title"
            className="text-[24px] sm:text-[30px] md:text-[34px] font-black text-[#171512] tracking-tight leading-tight"
          >
            Esses projetos são para você que...
          </h2>
        </div>

        {/* 3 Cards Lado a Lado no Desktop / Empilhados no Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          {/* Card 01 — Falta de Medidas */}
          <div
            id="target-card-1"
            className="bg-white rounded-[16px] p-6 sm:p-7 border border-[#E8DDD0] shadow-[0_4px_16px_rgba(63,42,30,0.05)] flex flex-col items-center text-center justify-start"
          >
            <div className="w-12 h-12 rounded-full bg-[#C86A1B]/10 text-[#C86A1B] flex items-center justify-center mb-4 flex-shrink-0">
              <Ruler className="w-6 h-6" />
            </div>
            <h3 className="text-[17px] sm:text-[18px] font-bold text-[#171512] leading-snug">
              Encontra ideias, mas faltam as medidas
            </h3>
            <p className="mt-2 text-[13.5px] sm:text-[14px] text-[#5A4537] leading-relaxed">
              Salva fotos de peças que gostaria de fazer, mas acaba desistindo porque não tem as medidas ou instruções para começar.
            </p>
          </div>

          {/* Card 02 — Falta de Tempo / Construir sem começar do zero */}
          <div
            id="target-card-2"
            className="bg-white rounded-[16px] p-6 sm:p-7 border border-[#E8DDD0] shadow-[0_4px_16px_rgba(63,42,30,0.05)] flex flex-col items-center text-center justify-start"
          >
            <div className="w-12 h-12 rounded-full bg-[#C86A1B]/10 text-[#C86A1B] flex items-center justify-center mb-4 flex-shrink-0">
              <Hammer className="w-6 h-6" />
            </div>
            <h3 className="text-[17px] sm:text-[18px] font-bold text-[#171512] leading-snug">
              Quer construir sem começar do zero
            </h3>
            <p className="mt-2 text-[13.5px] sm:text-[14px] text-[#5A4537] leading-relaxed">
              Gosta de colocar a mão na massa, mas não quer perder horas calculando medidas e descobrindo cada etapa da montagem.
            </p>
          </div>

          {/* Card 03 — Desejo de Comercializar */}
          <div
            id="target-card-3"
            className="bg-white rounded-[16px] p-6 sm:p-7 border border-[#E8DDD0] shadow-[0_4px_16px_rgba(63,42,30,0.05)] flex flex-col items-center text-center justify-start"
          >
            <div className="w-12 h-12 rounded-full bg-[#C86A1B]/10 text-[#C86A1B] flex items-center justify-center mb-4 flex-shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="text-[17px] sm:text-[18px] font-bold text-[#171512] leading-snug">
              Quer fazer peças para vender
            </h3>
            <p className="mt-2 text-[13.5px] sm:text-[14px] text-[#5A4537] leading-relaxed">
              Tem vontade de comercializar seus trabalhos, mas ainda não sabe quais projetos escolher para começar a produzir.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
