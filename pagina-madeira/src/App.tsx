import React, { useEffect, useState } from 'react';
import { TopUrgencyBar } from './components/TopUrgencyBar';
import { Hero } from './components/Hero';
import { DigitalDeliverySteps } from './components/DigitalDeliverySteps';
import { ProjectsInside } from './components/ProjectsInside';
import { WhoIsItForSection } from './components/WhoIsItForSection';
import { ProjectCategoriesSection } from './components/ProjectCategoriesSection';
import { BonusesSection } from './components/BonusesSection';
import { PricingSection } from './components/PricingSection';
import { AboutProjectSection } from './components/AboutProjectSection';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { ExitPopups } from './components/ExitPopups';
import { initTracking } from './lib/tracking';

export default function App() {
  const [exitModal, setExitModal] = useState<'exit1' | 'exit2' | null>(null);
  const [isBelowFoldLoaded, setIsBelowFoldLoaded] = useState(false);

  useEffect(() => {
    // Initialize tracking after critical paint
    const trackingTimer = setTimeout(() => {
      initTracking();
    }, 400);

    // Defer loading of below-the-fold components to ensure instant FCP and LCP on mobile
    const timer = setTimeout(() => {
      setIsBelowFoldLoaded(true);
    }, 60);

    return () => {
      clearTimeout(trackingTimer);
      clearTimeout(timer);
    };
  }, []);

  const scrollToPricing = () => {
    const section = document.getElementById('planos');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenExit1 = () => {
    setExitModal('exit1');
  };

  const handleOpenExit2 = () => {
    setExitModal('exit2');
  };

  const handleCloseExitModals = () => {
    setExitModal(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E7] text-[#171512] selection:bg-[#C86A1B]/20 selection:text-[#3F2A1E]">
      {/* 1. Barra superior de aviso/urgência */}
      <TopUrgencyBar />

      <main className="flex-1 w-full flex flex-col">
        {/* 2. Hero com proposta de valor direta (Critical for LCP & FCP) */}
        <Hero onCtaClick={scrollToPricing} />

        {isBelowFoldLoaded ? (
          <>
            {/* 3. Amostra dos projetos por dentro (Galeria) */}
            <ProjectsInside onCtaClick={scrollToPricing} />

            {/* 4. Para Quem São Esses Projetos? */}
            <WhoIsItForSection />

            {/* 5. As 5 Coleções Temáticas + Mecanismo dos Projetos */}
            <ProjectCategoriesSection onCtaClick={scrollToPricing} />

            {/* 6. Seção de bônus complementares */}
            <BonusesSection onCtaClick={scrollToPricing} />

            {/* 7. Entrega Digital em 3 Passos */}
            <DigitalDeliverySteps />

            {/* 8. Planos de Preço */}
            <PricingSection onBasicClick={handleOpenExit1} />

            {/* 9. Contexto e Transparência do Projeto */}
            <AboutProjectSection onCtaClick={scrollToPricing} />

            {/* 10. Perguntas Frequentes (FAQ) */}
            <FAQSection onCtaClick={scrollToPricing} />
          </>
        ) : (
          <div className="py-12 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#C86A1B] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </main>

      {/* 9. Footer com dados legais, políticas e suporte */}
      {isBelowFoldLoaded && <Footer />}

      {/* Popups de Saída / Downsell */}
      <ExitPopups
        currentModal={exitModal}
        onClose={handleCloseExitModals}
        onOpenExit2={handleOpenExit2}
      />
    </div>
  );
}

