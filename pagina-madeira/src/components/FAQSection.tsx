import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { offerConfig } from '../offerConfig';

interface FAQSectionProps {
  onCtaClick?: () => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ onCtaClick }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq-section" data-retina="FAQ"
      className="w-full bg-[#F5F0E7] py-14 md:py-20 px-4"
    >
      <div className="w-full max-w-[700px] mx-auto">
        {/* Title */}
        <div className="text-center mb-10 md:mb-12">
          <h2
            id="faq-title"
            className="text-[28px] sm:text-[34px] md:text-[38px] font-black text-[#171512] tracking-tight leading-tight"
          >
            Perguntas Frequentes
          </h2>
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5">
          {offerConfig.faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={`faq-${index}`}
                id={`faq-item-${index}`}
                className="bg-white rounded-[12px] border border-[#5A462D]/15 shadow-[0_3px_10px_rgba(63,42,30,0.04)] overflow-hidden transition-colors"
              >
                <button
                  id={`faq-toggle-${index}`}
                  onClick={() => toggleIndex(index)}
                  type="button"
                  aria-expanded={isOpen}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-[#FAF7F2]/60 transition-colors"
                >
                  <span
                    id={`faq-question-${index}`}
                    className="text-[15px] sm:text-[16px] font-bold text-[#171512] leading-snug"
                  >
                    {faq.question}
                  </span>

                  {/* Circular Copper Icon with + or - */}
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#C86A1B] text-white flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-200">
                    {isOpen ? (
                      <Minus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                    ) : (
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${index}`}
                    className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 text-[14px] sm:text-[15px] text-[#3F2A1E]/85 leading-relaxed border-t border-[#5A462D]/10 bg-[#FAF7F2]/40 animate-fadeIn"
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA Button: Foco em IC */}
        <div className="mt-10 md:mt-12 flex justify-center">
          <button
            id="faq-cta-button"
            onClick={onCtaClick}
            type="button"
            style={{ backgroundColor: '#008A5B', color: '#ffffff' }}
            className="animate-pulse-cta inline-flex items-center justify-center px-7 sm:px-9 py-3.5 sm:py-4 bg-[#008A5B] hover:bg-[#006E48] text-white text-[15px] sm:text-[17px] font-bold rounded-[14px] shadow-[0_8px_20px_rgba(0,138,91,0.32)] hover:shadow-[0_10px_24px_rgba(0,110,72,0.4)] cursor-pointer uppercase tracking-wider text-center select-none"
          >
            ESCOLHER MEU PLANO COM DESCONTO ↑
          </button>
        </div>
      </div>
    </section>
  );
};
