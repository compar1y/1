import React from 'react';
import { Check } from 'lucide-react';

interface ProjectCategoriesSectionProps {
  onCtaClick?: () => void;
}

interface CategoryCardData {
  id: string;
  badge: string;
  count: string;
  title: string;
  level: string;
  salesAppeal: string;
  image: string;
  localImage: string;
  alt: string;
  highlights: string[];
}

const categoriesData: CategoryCardData[] = [
  {
    id: 'cat-1',
    badge: 'Coleção 01',
    count: '20 Projetos',
    title: 'Decoração & Organização',
    level: 'Nível Fácil',
    salesAppeal: 'Alta procura para presentes e decoração de ambientes',
    image: 'https://i.postimg.cc/pXQNqKN7/colecao-01-decoracao-organizacao-(2).webp',
    localImage: '/assets/collections/colecao-01-decoracao-organizacao.webp',
    alt: 'Coleção 01 — Decoração & Organização em Madeira',
    highlights: [
      'Prateleiras Flutuantes',
      'Nichos Hexagonais',
      'Porta-Chaves com Nicho',
      'Organizadores de Mesa',
    ],
  },
  {
    id: 'cat-2',
    badge: 'Coleção 02',
    count: '20 Projetos',
    title: 'Casa, Cozinha & Utilitários',
    level: 'Fácil a Intermediário',
    salesAppeal: 'Itens utilitários para o dia a dia com venda rápida',
    image: 'https://i.postimg.cc/pT548FYZ/colecao-02-casa-cozinha-utilitarios-(1).webp',
    localImage: '/assets/collections/colecao-02-casa-cozinha-utilitarios.webp',
    alt: 'Coleção 02 — Casa, Cozinha & Utilitários em Madeira',
    highlights: [
      'Porta-Talheres com Divisórias',
      'Suporte para Xícaras & Canecas',
      'Porta-Temperos de 2 Níveis',
      'Fruteiras & Suportes de Taças',
    ],
  },
  {
    id: 'cat-3',
    badge: 'Coleção 03',
    count: '20 Projetos',
    title: 'Jardim, Plantas & Varanda',
    level: 'Fácil a Intermediário',
    salesAppeal: 'Tendência forte para apartamentos e áreas verdes',
    image: 'https://i.postimg.cc/sx9n99Qj/colecao-03-jardim-plantas-varanda-(1).webp',
    localImage: '/assets/collections/colecao-03-jardim-plantas-varanda.webp',
    alt: 'Coleção 03 — Jardim, Plantas & Varanda em Madeira',
    highlights: [
      'Jardineiras de Pinus',
      'Cachepôs Ripados Elegantes',
      'Mini Horta Vertical com Caixas',
      'Escadas e Suportes para Vasos',
    ],
  },
  {
    id: 'cat-4',
    badge: 'Coleção 04',
    count: '20 Projetos',
    title: 'Móveis Compactos & Modernos',
    level: 'Intermediário',
    salesAppeal: 'Móveis compactos com alta margem de lucro',
    image: 'https://i.postimg.cc/cCmm8xj2/colecao-04-moveis-compactos-modernos-(1).webp',
    localImage: '/assets/collections/colecao-04-moveis-compactos-modernos.webp',
    alt: 'Coleção 04 — Móveis Compactos & Modernos em Madeira',
    highlights: [
      'Mesa Lateral em C (Encaixe no Sofá)',
      'Criado-Mudo em Nicho',
      'Aparadores Slim para Corredor',
      'Mesas Dobráveis para Parede',
    ],
  },
  {
    id: 'cat-5',
    badge: 'Coleção 05',
    count: '20 Projetos',
    title: 'Ateliê Premium & Presentes',
    level: 'Fácil a Intermediário',
    salesAppeal: 'Peças requintadas com alto valor agregado',
    image: 'https://i.postimg.cc/YCj3hw3t/colecao-05-atelie-premium-presentes-(1).webp',
    localImage: '/assets/collections/colecao-05-atelie-premium-presentes.webp',
    alt: 'Coleção 05 — Ateliê Premium & Presentes em Madeira',
    highlights: [
      'Porta-Jóias com Divisórias',
      'Estojos Nobres para Vinhos',
      'Caixas de Chá & Memórias',
      'Expositores de Relógios e Acessórios',
    ],
  },
];

export const ProjectCategoriesSection: React.FC<ProjectCategoriesSectionProps> = ({
  onCtaClick,
}) => {
  return (
    <section
      id="estrutura-e-categorias" data-retina="Coleções"
      className="w-full bg-[#FAF7F2] py-12 md:py-20 px-4 border-t border-[#6F4528]/10"
    >
      <div className="w-full max-w-[1160px] mx-auto">
        {/* Cabeçalho Único da Seção */}
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10">
          <h2
            id="categories-title"
            className="text-[26px] sm:text-[32px] md:text-[38px] font-black text-[#171512] tracking-tight leading-tight"
          >
            Como Cada Projeto é Estruturado por Dentro
          </h2>

          <p
            id="categories-subtitle"
            className="mt-3 text-[15px] sm:text-[16px] text-[#3F2A1E]/85 font-normal leading-relaxed"
          >
            Os 4 passos visuais presentes em todas as fichas técnicas para você executar sem dúvidas:
          </p>
        </div>

        {/* 1. A ESTRUTURA VISUAL DE CADA FICHA (4 Pilares Tangíveis) */}
        <div className="bg-white rounded-[20px] p-5 sm:p-7 md:p-8 border border-[#E8DDD0] shadow-[0_8px_24px_rgba(63,42,30,0.06)] mb-12 md:mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Card 01 — Medidas Finais Cotadas */}
            <div
              id="feature-card-01"
              className="bg-white rounded-[14px] p-3.5 sm:p-4 md:p-5 border border-[#E8DDD0] shadow-xs flex flex-col items-center text-center"
            >
              <div
                className="w-full rounded-[12px] overflow-hidden bg-[#FAF7F2] relative border border-[#E8DDD0]/60"
                style={{ aspectRatio: '3 / 2' }}
              >
                <img
                  src="/assets/features/medidas-finais-cotadas.webp"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== 'https://i.postimg.cc/ZqcSf31H/medidas-finais-cotadas.webp') {
                      target.src = 'https://i.postimg.cc/ZqcSf31H/medidas-finais-cotadas.webp';
                    }
                  }}
                  alt="Medidas Finais Cotadas"
                  loading="eager"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  width={1536}
                  height={1024}
                  style={{ aspectRatio: '3 / 2', width: '100%', height: '100%', objectFit: 'cover' }}
                  className="block w-full h-full object-cover object-center rounded-[12px] select-none"
                />
              </div>
              <h4 className="text-[17px] sm:text-[18px] font-bold text-[#171512] mt-3.5 sm:mt-4 leading-snug text-center">
                Medidas Finais Cotadas
              </h4>
              <p className="text-[13px] sm:text-[14px] text-[#41403B] mt-1.5 leading-relaxed text-center max-w-[420px]">
                Desenhos com altura, largura e profundidade para você visualizar as dimensões da peça.
              </p>
            </div>

            {/* Card 02 — Plano de Corte Exato */}
            <div
              id="feature-card-02"
              className="bg-white rounded-[14px] p-3.5 sm:p-4 md:p-5 border border-[#E8DDD0] shadow-xs flex flex-col items-center text-center"
            >
              <div
                className="w-full rounded-[12px] overflow-hidden bg-[#FAF7F2] relative border border-[#E8DDD0]/60"
                style={{ aspectRatio: '3 / 2' }}
              >
                <img
                  src="/assets/features/plano-de-corte-exato.webp"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== 'https://i.postimg.cc/R0VSxX1D/plano-de-corte-exato.webp') {
                      target.src = 'https://i.postimg.cc/R0VSxX1D/plano-de-corte-exato.webp';
                    }
                  }}
                  alt="Plano de Corte Exato"
                  loading="eager"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  width={1536}
                  height={1024}
                  style={{ aspectRatio: '3 / 2', width: '100%', height: '100%', objectFit: 'cover' }}
                  className="block w-full h-full object-cover object-center rounded-[12px] select-none"
                />
              </div>
              <h4 className="text-[17px] sm:text-[18px] font-bold text-[#171512] mt-3.5 sm:mt-4 leading-snug text-center">
                Plano de Corte Exato
              </h4>
              <p className="text-[13px] sm:text-[14px] text-[#41403B] mt-1.5 leading-relaxed text-center max-w-[420px]">
                Confira a quantidade e o tamanho de cada peça antes de começar a cortar.
              </p>
            </div>

            {/* Card 03 — Materiais & Ferramentas */}
            <div
              id="feature-card-03"
              className="bg-white rounded-[14px] p-3.5 sm:p-4 md:p-5 border border-[#E8DDD0] shadow-xs flex flex-col items-center text-center"
            >
              <div
                className="w-full rounded-[12px] overflow-hidden bg-[#FAF7F2] relative border border-[#E8DDD0]/60"
                style={{ aspectRatio: '3 / 2' }}
              >
                <img
                  src="/assets/features/materiais-e-ferramentas.webp"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== 'https://i.postimg.cc/X7SnYVcs/materiais-e-ferramentas.webp') {
                      target.src = 'https://i.postimg.cc/X7SnYVcs/materiais-e-ferramentas.webp';
                    }
                  }}
                  alt="Materiais & Ferramentas"
                  loading="eager"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  width={1536}
                  height={1024}
                  style={{ aspectRatio: '3 / 2', width: '100%', height: '100%', objectFit: 'cover' }}
                  className="block w-full h-full object-cover object-center rounded-[12px] select-none"
                />
              </div>
              <h4 className="text-[17px] sm:text-[18px] font-bold text-[#171512] mt-3.5 sm:mt-4 leading-snug text-center">
                Materiais & Ferramentas
              </h4>
              <p className="text-[13px] sm:text-[14px] text-[#41403B] mt-1.5 leading-relaxed text-center max-w-[420px]">
                Lista com madeiras sugeridas, parafusos, colas e ferragens necessárias para a montagem.
              </p>
            </div>

            {/* Card 04 — Passo a Passo em 6 Fotos */}
            <div
              id="feature-card-04"
              className="bg-white rounded-[14px] p-3.5 sm:p-4 md:p-5 border border-[#E8DDD0] shadow-xs flex flex-col items-center text-center"
            >
              <div
                className="w-full rounded-[12px] overflow-hidden bg-[#FAF7F2] relative border border-[#E8DDD0]/60"
                style={{ aspectRatio: '3 / 2' }}
              >
                <img
                  src="/assets/features/passo-a-passo-em-6-fotos.webp"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== 'https://i.postimg.cc/mkQfHHNy/passo-a-passo-em-6-fotos.webp') {
                      target.src = 'https://i.postimg.cc/mkQfHHNy/passo-a-passo-em-6-fotos.webp';
                    }
                  }}
                  alt="Passo a Passo em 6 Fotos"
                  loading="eager"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  width={1536}
                  height={1024}
                  style={{ aspectRatio: '3 / 2', width: '100%', height: '100%', objectFit: 'cover' }}
                  className="block w-full h-full object-cover object-center rounded-[12px] select-none"
                />
              </div>
              <h4 className="text-[17px] sm:text-[18px] font-bold text-[#171512] mt-3.5 sm:mt-4 leading-snug text-center">
                Passo a Passo em 6 Fotos
              </h4>
              <p className="text-[13px] sm:text-[14px] text-[#41403B] mt-1.5 leading-relaxed text-center max-w-[420px]">
                Acompanhe visualmente as principais etapas de montagem, do primeiro corte ao acabamento.
              </p>
            </div>
          </div>
        </div>

        {/* 2. OS 5 CARDS VISUAIS DAS CATEGORIAS (LAYOUT LIMPO E ORGANIZADO) */}
        <div>
          <div className="text-center mb-8">
            <h3 className="text-[22px] sm:text-[26px] font-black text-[#171512] tracking-tight">
              Tudo Isso Dividido em 5 Coleções Práticas (100 Projetos)
            </h3>
            <p className="text-xs sm:text-sm text-[#3F2A1E]/75 mt-1.5">
              Escolha a categoria e comece a construir hoje mesmo na sua oficina ou quintal.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-5 sm:gap-6 w-full">
            {categoriesData.map((cat, index) => (
              <div
                key={cat.id}
                id={`category-card-${index}`}
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] lg:max-w-[360px] bg-white rounded-[18px] overflow-hidden border border-[#E8DDD0] shadow-[0_4px_16px_rgba(63,42,30,0.06)] hover:shadow-[0_10px_24px_rgba(63,42,30,0.1)] transition-all duration-300 flex flex-col group"
              >
                {/* Imagem representativa da categoria (proporção 3:2) */}
                <div
                  className="w-full bg-[#EDE3D4] overflow-hidden rounded-t-[17px] border-b border-[#E8DDD0]"
                  style={{ aspectRatio: '3 / 2' }}
                >
                  <img
                    src={cat.localImage}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== cat.image) {
                        target.src = cat.image;
                      }
                    }}
                    alt={cat.alt}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    width={1536}
                    height={1024}
                    style={{
                      aspectRatio: '3 / 2',
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                    }}
                    className="block w-full h-full object-cover object-center select-none group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>

                {/* Conteúdo do Card Organizado */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Linha de Identificação Limpa & Alinhada */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-bold text-[#C86A1B] uppercase tracking-wide">
                        {cat.badge} • {cat.count}
                      </span>
                      <span className="text-[11px] font-semibold text-[#008A5B] bg-[#008A5B]/10 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        {cat.level}
                      </span>
                    </div>

                    {/* Título da Coleção */}
                    <h4 className="text-[19px] sm:text-[20px] font-black text-[#171512] mt-2 leading-snug">
                      {cat.title}
                    </h4>

                    {/* Descrição Direta (Sem caixas poluídas) */}
                    <p className="mt-1 text-[13px] text-[#7A6455] leading-relaxed">
                      {cat.salesAppeal}
                    </p>

                    {/* Lista Visual Limpa de Peças */}
                    <div className="mt-4 pt-3.5 border-t border-[#E8DDD0]/80">
                      <span className="text-[11px] font-bold text-[#8F5224] uppercase tracking-wider block mb-2.5">
                        Exemplos de projetos:
                      </span>
                      <ul className="space-y-2">
                        {cat.highlights.map((h, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-[12.5px] sm:text-[13px] text-[#33271E] font-medium"
                          >
                            <Check className="w-4 h-4 text-[#008A5B] flex-shrink-0" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Rodapé do Card Discreto */}
                  <div className="mt-5 pt-3 border-t border-[#E8DDD0]/70 text-center">
                    <span className="text-[11.5px] font-semibold text-[#8F5224]/80">
                      + outras 16 peças completas nesta coleção
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA no Fim da Seção */}
        <div className="mt-12 md:mt-16 flex flex-col items-center text-center">
          <button
            id="categories-section-cta"
            onClick={onCtaClick}
            type="button"
            style={{ backgroundColor: '#008A5B', color: '#ffffff' }}
            className="animate-pulse-cta inline-flex items-center justify-center px-8 sm:px-10 py-4 bg-[#008A5B] hover:bg-[#006E48] text-white text-[15px] sm:text-[17px] font-bold rounded-[14px] shadow-[0_8px_20px_rgba(0,138,91,0.32)] hover:shadow-[0_10px_24px_rgba(0,110,72,0.4)] cursor-pointer uppercase tracking-wider text-center select-none"
          >
            DESBLOQUEAR TODOS OS 100 PROJETOS ↓
          </button>
          <span className="mt-2 text-xs text-[#6F4528]/80 font-medium">
            Receba agora no seu e-mail com as 5 coleções e os 6 bônus inclusos
          </span>
        </div>
      </div>
    </section>
  );
};
