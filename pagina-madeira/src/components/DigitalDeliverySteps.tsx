import React from 'react';
import { Mail, FileDown, Hammer } from 'lucide-react';

export const DigitalDeliverySteps: React.FC = () => {
  return (
    <section
      id="entrega-digital" data-retina="Entrega digital"
      aria-label="Como funciona o acesso"
      className="w-full bg-[#FAF7F2] py-8 sm:py-10 px-4 border-y border-[#E8DDD0]"
    >
      <div className="w-full max-w-[1040px] mx-auto flex flex-col items-center text-center">
        {/* Título simples e direto */}
        <h2 className="text-[19px] sm:text-[22px] md:text-[24px] font-black text-[#171512] tracking-tight">
          Receba seus projetos e comece a construir
        </h2>

        {/* 3 Etapas lado a lado no desktop, compactas no mobile */}
        <div className="mt-6 sm:mt-7 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 w-full max-w-[960px]">
          {/* Etapa 1 */}
          <div className="flex flex-col items-center text-center p-3.5 sm:p-4 rounded-[12px] bg-white/70 border border-[#E8DDD0]/80">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#C86A1B]/10 text-[#C86A1B] flex items-center justify-center mb-2.5">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-[15px] sm:text-[16px] font-bold text-[#171512]">
              Receba no e-mail
            </h3>
            <p className="mt-1 text-[13px] sm:text-[13.5px] text-[#5A4537] leading-relaxed">
              Acesso enviado após a confirmação do pagamento.
            </p>
          </div>

          {/* Etapa 2 */}
          <div className="flex flex-col items-center text-center p-3.5 sm:p-4 rounded-[12px] bg-white/70 border border-[#E8DDD0]/80">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#C86A1B]/10 text-[#C86A1B] flex items-center justify-center mb-2.5">
              <FileDown className="w-5 h-5" />
            </div>
            <h3 className="text-[15px] sm:text-[16px] font-bold text-[#171512]">
              Baixe os PDFs
            </h3>
            <p className="mt-1 text-[13px] sm:text-[13.5px] text-[#5A4537] leading-relaxed">
              Tenha os projetos disponíveis para consultar.
            </p>
          </div>

          {/* Etapa 3 */}
          <div className="flex flex-col items-center text-center p-3.5 sm:p-4 rounded-[12px] bg-white/70 border border-[#E8DDD0]/80">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#C86A1B]/10 text-[#C86A1B] flex items-center justify-center mb-2.5">
              <Hammer className="w-5 h-5" />
            </div>
            <h3 className="text-[15px] sm:text-[16px] font-bold text-[#171512]">
              Comece a fazer
            </h3>
            <p className="mt-1 text-[13px] sm:text-[13.5px] text-[#5A4537] leading-relaxed">
              Escolha uma peça e siga o passo a passo.
            </p>
          </div>
        </div>

        {/* Observação de produto 100% digital */}
        <p className="mt-5 text-[12px] sm:text-[13px] text-[#7A6455] font-medium">
          Produto 100% digital em PDF. Nenhum material físico será enviado.
        </p>
      </div>
    </section>
  );
};
