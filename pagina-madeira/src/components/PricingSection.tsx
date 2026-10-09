import React from 'react';
import { Check, X as XIcon, Gift, ShieldCheck } from 'lucide-react';
import { offerConfig } from '../offerConfig';
import { buildCheckoutUrl, trackInitiateCheckout, trackPackageSelected } from '../lib/tracking';

interface PricingSectionProps {
  onBasicClick: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onBasicClick }) => {
  const completeCheckoutUrl = buildCheckoutUrl(offerConfig.checkout.complete);

  const handleCompletePlanClick = () => {
    trackPackageSelected('complete', 27.90);
    trackInitiateCheckout('Plano Completo (+ 6 Bônus)', 27.90, completeCheckoutUrl);
  };

  const handleBasicPlanClick = () => {
    trackPackageSelected('basic', 10.00);
    onBasicClick();
  };

  return (
    <section
      id="planos" data-retina="Planos e preços"
      className="w-full bg-[#1C1A17] text-white py-14 md:py-20 px-4 scroll-mt-6 border-t border-[#3F2A1E]/30"
    >
      <div className="w-full max-w-[1140px] mx-auto flex flex-col items-center">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
          <h2
            id="pricing-title"
            className="text-[26px] sm:text-[34px] md:text-[40px] font-black text-center text-white tracking-tight leading-tight"
          >
            Escolha o plano ideal para os seus projetos
          </h2>
          <p className="mt-3 text-[15px] sm:text-[16px] text-[#D8CEC4] font-normal max-w-xl mx-auto">
            Acesso digital imediato em PDF com instruções visuais completas de montagem.
          </p>
        </div>

        {/* Pricing Cards Container */}
        <div className="w-full flex flex-col lg:flex-row justify-center items-stretch gap-7 md:gap-8 max-w-[940px]">
          {/* ======================= PLANO BÁSICO ======================= */}
          <div
            id="pricing-card-basic"
            className="w-full lg:w-[420px] bg-white text-[#171512] rounded-[18px] p-6 sm:p-7 shadow-xl flex flex-col justify-between border border-[#E8DDD0] relative"
          >
            <div>
              {/* Header Title */}
              <div className="text-center pb-3 border-b border-[#E8DDD0]">
                <h3
                  id="basic-plan-title"
                  className="text-[20px] sm:text-[22px] font-black text-[#3F2A1E] uppercase tracking-wide"
                >
                  PLANO BÁSICO
                </h3>
                <p className="text-[12.5px] text-[#7A6455] mt-1 font-medium">
                  Acesso aos 100 projetos essenciais em PDF
                </p>
              </div>

              {/* Product Mockup Solo */}
              <div className="my-4 flex justify-center items-center h-[135px]">
                <img
                  id="basic-plan-mockup"
                  src={offerConfig.assets.basic}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (offerConfig.assets.basicFallback && target.src !== offerConfig.assets.basicFallback) {
                      target.src = offerConfig.assets.basicFallback;
                    }
                  }}
                  alt="Plano Básico de Projetos com Madeira"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-[175px] object-contain select-none"
                />
              </div>

              {/* Price Area */}
              <div className="text-center my-4 py-3.5 bg-[#FAF7F2] rounded-[12px] border border-[#E8DDD0]/70">
                <span className="text-[12px] text-[#7A6455] font-semibold uppercase tracking-wider block">
                  Pagamento Único
                </span>
                <div
                  id="basic-plan-price"
                  className="text-[38px] sm:text-[42px] font-black text-[#171512] leading-none mt-1"
                >
                  {offerConfig.prices.basic}
                </div>
              </div>

              {/* O QUE VOCÊ LEVA */}
              <div className="mt-5">
                <h4 className="text-[12.5px] font-bold text-[#3F2A1E] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <span className="text-[#008A5B] font-black">✓</span> INCLUÍDO NO BÁSICO:
                </h4>
                <ul className="space-y-2 text-[13px] sm:text-[14px] text-[#3F2A1E]/90 font-medium">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#008A5B] flex-shrink-0 mt-0.5" />
                    <span>100 Projetos com medidas e materiais em PDF</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#008A5B] flex-shrink-0 mt-0.5" />
                    <span>Passo a passo visual de montagem</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#008A5B] flex-shrink-0 mt-0.5" />
                    <span>Organização nas 5 Coleções Temáticas</span>
                  </li>
                </ul>
              </div>

              {/* O QUE NÃO ESTÁ INCLUÍDO */}
              <div
                id="basic-plan-exclusions"
                className="mt-5 p-3.5 bg-[#FAF3F3] border border-[#E52727]/20 rounded-[10px]"
              >
                <h4 className="text-[12px] font-bold text-[#C52222] uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <XIcon className="w-4 h-4 text-[#C52222] flex-shrink-0" />
                  NÃO INCLUSO NESTE PLANO:
                </h4>
                <ul className="space-y-1 text-[12px] text-[#6A4040]">
                  <li>• Sem os 6 bônus exclusivos de apoio</li>
                </ul>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-7 pt-2">
              <button
                id="basic-plan-cta"
                onClick={handleBasicPlanClick}
                type="button"
                className="w-full py-3.5 px-4 bg-[#4A3B32] hover:bg-[#382C25] text-white font-bold text-[15px] rounded-[12px] shadow-sm active:scale-[0.98] transition-all duration-200 cursor-pointer uppercase tracking-wider text-center block"
              >
                ESCOLHER PLANO BÁSICO
              </button>
            </div>
          </div>

          {/* ======================= PLANO COMPLETO ======================= */}
          <div
            id="pricing-card-complete"
            className="w-full lg:w-[460px] bg-white text-[#171512] rounded-[18px] p-6 sm:p-7 shadow-[0_16px_40px_rgba(200,106,27,0.2)] flex flex-col justify-between border-[2.5px] border-[#C86A1B] relative"
          >
            {/* Top Badge */}
            <div
              id="complete-plan-badge"
              className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#C86A1B] text-white text-[12px] font-black uppercase tracking-wider py-1 px-4 rounded-full shadow-md whitespace-nowrap"
            >
              PLANO RECOMENDADO
            </div>

            <div>
              {/* Header Title */}
              <div className="text-center pb-3 border-b border-[#C86A1B]/20 pt-1">
                <h3
                  id="complete-plan-title"
                  className="text-[20px] sm:text-[23px] font-black text-[#C86A1B] uppercase tracking-wide"
                >
                  PLANO COMPLETO
                </h3>
                <p className="text-[12.5px] text-[#7A6455] mt-1 font-medium">
                  100 Projetos + 6 Bônus Exclusivos
                </p>
              </div>

              {/* Product Mockup */}
              <div className="my-4 flex justify-center items-center h-[135px]">
                <img
                  id="complete-plan-mockup"
                  src={offerConfig.assets.hero}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (offerConfig.assets.heroFallback && target.src !== offerConfig.assets.heroFallback) {
                      target.src = offerConfig.assets.heroFallback;
                    }
                  }}
                  alt="Pacote Completo com 100 Projetos e 6 Bônus"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-[200px] object-contain select-none"
                />
              </div>

              {/* Price Area */}
              <div className="text-center my-4 py-3.5 bg-[#EDE3D4]/50 border border-[#C86A1B]/30 rounded-[12px]">
                <span className="text-[12px] text-[#8F5224] font-semibold uppercase tracking-wider block">
                  Acesso Completo e Imediato
                </span>
                <div
                  id="complete-plan-price"
                  className="text-[40px] sm:text-[46px] font-black text-[#008A5B] leading-none mt-1"
                >
                  {offerConfig.prices.complete}
                </div>
                <span className="text-[11.5px] text-[#5A4537] mt-1 block">
                  Pagamento único • Sem mensalidades
                </span>
              </div>

              {/* O QUE VOCÊ LEVA */}
              <div className="mt-5">
                <h4 className="text-[12.5px] font-bold text-[#3F2A1E] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <span className="text-[#008A5B] font-black">✓</span> TUDO INCLUÍDO NO COMPLETO:
                </h4>
                <ul className="space-y-2 text-[13px] sm:text-[14px] text-[#3F2A1E]/95 font-medium">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#008A5B] flex-shrink-0 mt-0.5 font-bold" />
                    <span>100 Projetos completos nas 5 Coleções Temáticas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#008A5B] flex-shrink-0 mt-0.5 font-bold" />
                    <span>Medidas cotadas e planos de corte exatos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#008A5B] flex-shrink-0 mt-0.5 font-bold" />
                    <span>Instruções visuais passo a passo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#008A5B] flex-shrink-0 mt-0.5 font-bold" />
                    <span className="font-bold text-[#C86A1B]">
                      Todos os 6 bônus exclusivos de apoio inclusos
                    </span>
                  </li>
                </ul>
              </div>

              {/* Box verde claro: TODOS OS BÔNUS INCLUSOS */}
              <div
                id="complete-plan-bonuses-box"
                className="mt-4 p-3.5 bg-[#EBF7F2] border border-[#008A5B]/30 rounded-[10px]"
              >
                <h4 className="text-[12px] font-bold text-[#008A5B] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-[#008A5B] flex-shrink-0" />
                  6 BÔNUS SEM CUSTO ADICIONAL:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[12px] text-[#171512]">
                  <span className="flex items-center gap-1">✓ Guia de Madeiras</span>
                  <span className="flex items-center gap-1">✓ Fornecedores</span>
                  <span className="flex items-center gap-1">✓ Guia Precificação</span>
                  <span className="flex items-center gap-1">✓ Lista Ferragens</span>
                  <span className="flex items-center gap-1">✓ Acabamento Peças</span>
                  <span className="flex items-center gap-1">✓ Primeiras Vendas</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-7 pt-2">
              <a
                id="complete-plan-cta"
                href={completeCheckoutUrl}
                onClick={handleCompletePlanClick}
                style={{ backgroundColor: '#008A5B', color: '#ffffff' }}
                className="animate-pulse-cta w-full py-4 px-4 bg-[#008A5B] hover:bg-[#006E48] text-white font-extrabold text-[16px] sm:text-[17px] rounded-[12px] shadow-[0_6px_20px_rgba(0,138,91,0.4)] hover:shadow-[0_8px_24px_rgba(0,110,72,0.5)] cursor-pointer uppercase tracking-wider text-center block select-none"
              >
                QUERO O PLANO COMPLETO
              </a>
            </div>
          </div>
        </div>

        {/* ======================= GARANTIA DE 180 DIAS (SIMPLES E CENTRALIZADA) ======================= */}
        <div
          id="garantia-180-dias"
          className="w-full max-w-[720px] mt-10 sm:mt-14 flex flex-col items-center text-center px-4"
        >
          {/* Selo de Garantia */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#008A5B]/15 border border-[#008A5B]/30 flex items-center justify-center text-[#008A5B] mb-3.5 shadow-sm">
            <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          {/* Título */}
          <h3 className="text-[20px] sm:text-[23px] font-black text-white tracking-tight">
            Garantia Incondicional de 180 Dias
          </h3>

          {/* Texto Centralizado */}
          <p className="mt-2 text-[14px] sm:text-[15px] text-[#D8CEC4] font-normal leading-relaxed">
            Você tem <strong>180 dias (6 meses inteiros)</strong> para testar e construir qualquer um dos projetos. Se por qualquer motivo você não gostar ou achar que o material não facilitou o seu trabalho, basta pedir o reembolso para receber <strong>100% do seu dinheiro de volta</strong>, sem perguntas e sem complicações.
          </p>
        </div>
      </div>
    </section>
  );
};
