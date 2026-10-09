import React, { useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { offerConfig } from '../offerConfig';
import { buildCheckoutUrl, trackInitiateCheckout } from '../lib/tracking';

interface ExitPopupsProps {
  currentModal: 'exit1' | 'exit2' | null;
  onClose: () => void;
  onOpenExit2: () => void;
}

export const ExitPopups: React.FC<ExitPopupsProps> = ({
  currentModal,
  onClose,
  onOpenExit2,
}) => {
  useEffect(() => {
    if (!currentModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (currentModal === 'exit1') {
          onOpenExit2();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [currentModal, onClose, onOpenExit2]);

  if (!currentModal) return null;

  const handleOverlayClick = () => {
    if (currentModal === 'exit1') {
      onOpenExit2();
    } else {
      onClose();
    }
  };

  const exit1CheckoutUrl = buildCheckoutUrl(offerConfig.checkout.exit1);
  const exit2CheckoutUrl = buildCheckoutUrl(offerConfig.checkout.exit2);
  const basicCheckoutUrl = buildCheckoutUrl(offerConfig.checkout.basic);

  return (
    <div
      id="exit-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 animate-fadeIn"
      onClick={handleOverlayClick}
    >
      {/* ===================== EXIT POPUP 01 (R$ 22,90) ===================== */}
      {currentModal === 'exit1' && (
        <div
          id="exit-popup-01" data-retina="Popup desconto R$22,90" data-retina-kind="popup"
          className="bg-[#FAF7F2] text-[#171512] rounded-[20px] max-w-[500px] w-full p-5 sm:p-7 shadow-2xl relative border-2 border-[#C86A1B] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            id="exit1-close-btn"
            onClick={onOpenExit2}
            type="button"
            aria-label="Fechar janela"
            className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-black rounded-full hover:bg-[#EDE3D4] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Eyebrow */}
          <div className="text-center">
            <span
              id="exit1-eyebrow"
              className="inline-block px-3 py-1 bg-[#C86A1B]/15 text-[#9E4E0D] text-xs font-bold uppercase tracking-wider rounded-full mb-2"
            >
              CONDIÇÃO ESPECIAL
            </span>

            {/* Headline */}
            <h3
              id="exit1-headline"
              className="text-[20px] sm:text-[24px] font-black text-[#171512] leading-tight"
            >
              Leve o Pacote Completo por uma condição única
            </h3>

            {/* Subheadline */}
            <p
              id="exit1-subheadline"
              className="mt-2 text-[13px] sm:text-[14px] text-[#3F2A1E]/85 leading-relaxed max-w-md mx-auto"
            >
              Antes de finalizar apenas com os projetos básicos, você pode garantir a biblioteca completa com todos os 6 bônus por {offerConfig.prices.exit1}.
            </p>
          </div>

          {/* Product Mockup */}
          <div className="my-3.5 flex justify-center items-center h-[120px]">
            <img
              id="exit1-mockup"
              src={offerConfig.assets.hero}
              onError={(e) => {
                const target = e.currentTarget;
                if (offerConfig.assets.heroFallback && target.src !== offerConfig.assets.heroFallback) {
                  target.src = offerConfig.assets.heroFallback;
                }
              }}
              alt="Pacote Completo com Desconto Especial"
              referrerPolicy="no-referrer"
              className="max-h-full max-w-[170px] object-contain select-none drop-shadow-sm"
            />
          </div>

          {/* Special Price Display */}
          <div
            id="exit1-price-box"
            className="bg-white border border-[#008A5B]/30 rounded-[12px] p-3 text-center mb-4 shadow-xs"
          >
            <div className="text-[11.5px] text-[#3F2A1E]/70 font-semibold uppercase tracking-wider">
              DE <span className="line-through text-[#E52727]">{offerConfig.prices.exit1Original}</span> POR APENAS
            </div>
            <div
              id="exit1-price-current"
              className="text-[34px] sm:text-[38px] font-black text-[#008A5B] leading-none mt-1"
            >
              {offerConfig.prices.exit1}
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-[#EDE3D4]/50 rounded-[10px] p-3 mb-4">
            <ul className="space-y-1.5 text-[12.5px] font-semibold text-[#3F2A1E]">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#008A5B] flex-shrink-0" />
                <span>100 Projetos com medidas e corte exato</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#008A5B] flex-shrink-0" />
                <span>Todos os 6 bônus de apoio inclusos</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#008A5B] flex-shrink-0" />
                <span>Download imediato em PDF</span>
              </li>
            </ul>
          </div>

          {/* Primary CTA */}
          <div>
            <a
              id="exit1-cta-accept"
              href={exit1CheckoutUrl}
              onClick={() => trackInitiateCheckout('Downsell 1 (Completo R$22,90)', 22.90, exit1CheckoutUrl)}
              className="w-full py-3.5 px-4 bg-[#008A5B] hover:bg-[#006E48] text-white text-[15px] sm:text-[16px] font-black rounded-[12px] shadow-[0_4px_14px_rgba(0,138,91,0.3)] active:scale-[0.98] transition-all text-center block uppercase tracking-wide cursor-pointer"
            >
              SIM, QUERO O COMPLETO POR {offerConfig.prices.exit1}
            </a>
          </div>

          {/* Refusal Link */}
          <div className="text-center mt-3">
            <button
              id="exit1-refusal-btn"
              onClick={onOpenExit2}
              type="button"
              className="text-[12px] text-[#3F2A1E]/70 hover:text-[#3F2A1E] underline font-medium cursor-pointer transition-colors bg-transparent border-none"
            >
              Não, obrigado. Quero somente os projetos básicos.
            </button>
          </div>
        </div>
      )}

      {/* ===================== EXIT POPUP 02 (R$ 17,90) ===================== */}
      {currentModal === 'exit2' && (
        <div
          id="exit-popup-02" data-retina="Popup desconto R$17,90" data-retina-kind="popup"
          className="bg-[#FAF7F2] text-[#171512] rounded-[20px] max-w-[500px] w-full p-5 sm:p-7 shadow-2xl relative border-2 border-[#C86A1B] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            id="exit2-close-btn"
            onClick={onClose}
            type="button"
            aria-label="Fechar janela"
            className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-black rounded-full hover:bg-[#EDE3D4] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Eyebrow */}
          <div className="text-center">
            <span
              id="exit2-eyebrow"
              className="inline-block px-3 py-1 bg-[#C86A1B]/15 text-[#9E4E0D] text-xs font-bold uppercase tracking-wider rounded-full mb-2"
            >
              ÚLTIMA OPORTUNIDADE
            </span>

            {/* Headline */}
            <h3
              id="exit2-headline"
              className="text-[20px] sm:text-[24px] font-black text-[#171512] leading-tight"
            >
              Leve o Pacote Completo por {offerConfig.prices.exit2}
            </h3>

            {/* Subheadline */}
            <p
              id="exit2-subheadline"
              className="mt-2 text-[13px] sm:text-[14px] text-[#3F2A1E]/85 leading-relaxed max-w-md mx-auto"
            >
              Para que você tenha todos os materiais e os 6 bônus de apoio sem restrições, liberamos esta condição final.
            </p>
          </div>

          {/* Product Mockup */}
          <div className="my-3.5 flex justify-center items-center h-[120px]">
            <img
              id="exit2-mockup"
              src={offerConfig.assets.hero}
              onError={(e) => {
                const target = e.currentTarget;
                if (offerConfig.assets.heroFallback && target.src !== offerConfig.assets.heroFallback) {
                  target.src = offerConfig.assets.heroFallback;
                }
              }}
              alt="Pacote Completo por R$17,90"
              referrerPolicy="no-referrer"
              className="max-h-full max-w-[170px] object-contain select-none drop-shadow-sm"
            />
          </div>

          {/* Special Price Display */}
          <div
            id="exit2-price-box"
            className="bg-white border border-[#008A5B]/30 rounded-[12px] p-3 text-center mb-4 shadow-xs"
          >
            <div className="text-[11.5px] text-[#3F2A1E]/70 font-semibold uppercase tracking-wider">
              DE <span className="line-through text-[#E52727]">{offerConfig.prices.exit2Original}</span> POR APENAS
            </div>
            <div
              id="exit2-price-current"
              className="text-[34px] sm:text-[38px] font-black text-[#008A5B] leading-none mt-1"
            >
              {offerConfig.prices.exit2}
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-[#EDE3D4]/50 rounded-[10px] p-3 mb-4">
            <ul className="space-y-1.5 text-[12.5px] font-semibold text-[#3F2A1E]">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#008A5B] flex-shrink-0" />
                <span>100 Projetos + Coleções Temáticas</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#008A5B] flex-shrink-0" />
                <span>Todos os 6 bônus de apoio inclusos</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#008A5B] flex-shrink-0" />
                <span>Acesso imediato e vitalício</span>
              </li>
            </ul>
          </div>

          {/* CTA: Aceitar por R$ 17,90 */}
          <div>
            <a
              id="exit2-cta-accept"
              href={exit2CheckoutUrl}
              onClick={() => trackInitiateCheckout('Downsell 2 (Completo R$17,90)', 17.90, exit2CheckoutUrl)}
              className="w-full py-3.5 px-4 bg-[#008A5B] hover:bg-[#006E48] text-white text-[15px] sm:text-[16px] font-black rounded-[12px] shadow-[0_4px_14px_rgba(0,138,91,0.3)] active:scale-[0.98] transition-all text-center block uppercase tracking-wide cursor-pointer"
            >
              SIM, QUERO O COMPLETO POR {offerConfig.prices.exit2}
            </a>
          </div>

          {/* Recusa Exit 2 -> Leva ao Checkout do Pacote Básico (R$ 10,00) */}
          <div className="text-center mt-3">
            <a
              id="exit2-refusal-btn"
              href={basicCheckoutUrl}
              onClick={() => trackInitiateCheckout('Pacote Básico (Via Recusa)', 10.00, basicCheckoutUrl)}
              className="text-[12px] text-[#3F2A1E]/80 hover:text-[#C52222] underline font-semibold cursor-pointer transition-colors block py-1"
            >
              Continuar para o Pacote Básico por {offerConfig.prices.basic}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
