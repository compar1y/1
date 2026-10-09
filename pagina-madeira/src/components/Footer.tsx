import React from 'react';
import { offerConfig } from '../offerConfig';

export const Footer: React.FC = () => {
  return (
    <footer id="main-footer" data-retina="Rodapé" className="w-full bg-[#171512] text-white/80 py-10 px-4 border-t border-[#3F2A1E]">
      <div className="w-full max-w-[1100px] mx-auto text-center flex flex-col items-center">
        {/* Brand / Copyright */}
        <p id="footer-copyright" className="text-[13px] font-normal text-[#D8CEC4]/90">
          {offerConfig.footer.copyright}
        </p>

        {/* Legal Disclaimer */}
        <div className="mt-4 max-w-2xl text-[11px] text-[#A69485]/80 leading-relaxed space-y-2 text-center">
          <p>{offerConfig.footer.disclaimer}</p>
          <p>
            Este site e o produto digital oferecido não possuem vínculo institucional ou afiliação comercial com a Meta, Facebook, Google ou qualquer outra plataforma de anúncios.
          </p>
        </div>
      </div>
    </footer>
  );
};
