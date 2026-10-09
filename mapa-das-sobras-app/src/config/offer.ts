/**
 * Configuração da oferta e de todos os produtos vendidos dentro do app.
 *
 * - `core` e `bonus` vêm da página de vendas atual (Plano Básico / Plano Completo).
 * - `upsell` são SUGESTÕES de novos produtos para aumentar o LTV. Ajuste nomes,
 *   preços e links de checkout antes de publicar.
 * - `pdfUrl`: link de download do PDF (Drive, Kiwify, Hotmart etc.).
 * - `checkoutUrl`: link de checkout do produto. Vazio = botão mostra "em breve".
 */

export type ProductKind = 'core' | 'bonus' | 'upsell';

export interface Product {
  id: string;
  kind: ProductKind;
  name: string;
  tagline: string;
  description: string;
  emoji: string;
  /** Formato do material, ex: "Catálogo visual em PDF" */
  format: string;
  /** Preço em centavos. 0 = sem venda avulsa. */
  price: number;
  /** Preço "de" (riscado), em centavos. */
  compareAt?: number;
  /** Cobrança recorrente mensal. */
  recurring?: boolean;
  pdfUrl: string;
  checkoutUrl: string;
  /** Produtos que este item libera ao ser comprado (ex.: combo). */
  unlocks?: string[];
  highlight?: string;
  /** Prazo de garantia exibido na oferta. Padrão: 7 dias (mínimo do CDC). */
  guaranteeDays?: number;
}

export const BRAND = {
  name: 'Mapa das Sobras',
  author: 'Helena',
  supportEmail: 'suporte@mapadassobras.com.br', // TODO: trocar pelo e-mail real
  salesPage: 'https://tapetesdesobras.vercel.app/',
  guaranteeDays: 180,
};

export const BONUS_IDS = [
  'bonus-cores',
  'bonus-fios',
  'bonus-emendas',
  'bonus-resgate',
  'bonus-medidas',
  'bonus-acabamentos',
] as const;

export const PRODUCTS: Product[] = [
  {
    id: 'core',
    kind: 'core',
    name: '100 Modelos de Tapetes',
    tagline: 'O Mapa das Sobras completo em PDF',
    description:
      '100 modelos organizados em mapas visuais, com peso total, divisão do barbante por cor, medidas, fio, agulha e etapas visuais.',
    emoji: '🧶',
    format: 'PDF com índice por peso, espessura e cores',
    price: 1000,
    pdfUrl: '', // TODO
    checkoutUrl: '', // TODO: checkout do Plano Básico
  },

  // ---- Bônus do Plano Completo (Kit Aproveitamento Total das Sobras) ----
  {
    id: 'bonus-cores',
    kind: 'bonus',
    name: '60 Combinações de Cores para Sobras',
    tagline: '“Quais cores ficam bonitas juntas?”',
    description:
      'Paletas prontas e referências de distribuição para combinar os fios guardados e escolher cores de destaque e borda.',
    emoji: '🎨',
    format: 'Catálogo visual em PDF',
    price: 0,
    pdfUrl: '',
    checkoutUrl: '',
  },
  {
    id: 'bonus-fios',
    kind: 'bonus',
    name: 'Tabela de Fios, Espessuras e Agulhas',
    tagline: '“Posso usar esses fios no mesmo tapete?”',
    description:
      'Compare espessuras, escolha a agulha e saiba quando é melhor separar os barbantes em projetos diferentes.',
    emoji: '📏',
    format: 'Tabela visual em PDF',
    price: 0,
    pdfUrl: '',
    checkoutUrl: '',
  },
  {
    id: 'bonus-emendas',
    kind: 'bonus',
    name: 'Guia de Emendas Invisíveis',
    tagline: '“Como aproveito os pedaços menores?”',
    description:
      'Formas de unir fios, trocar cores e esconder pontas para deixar as emendas discretas e o acabamento limpo.',
    emoji: '🪡',
    format: 'Guia visual em PDF',
    price: 0,
    pdfUrl: '',
    checkoutUrl: '',
  },
  {
    id: 'bonus-resgate',
    kind: 'bonus',
    name: 'Mapa de Resgate do Tapete',
    tagline: '“E se uma cor acabar antes da hora?”',
    description:
      'Alternativas de troca de cor, borda e finalização para lidar com imprevistos sem decidir tudo no improviso.',
    emoji: '🛟',
    format: 'Guia de consulta em PDF',
    price: 0,
    pdfUrl: '',
    checkoutUrl: '',
  },
  {
    id: 'bonus-medidas',
    kind: 'bonus',
    name: 'Tabela de Adaptação de Medidas',
    tagline: '“Quero esse modelo maior ou menor.”',
    description:
      'Ajuste o tamanho dos modelos, preserve as proporções e veja o impacto no consumo de barbante.',
    emoji: '📐',
    format: 'Tabelas práticas em PDF',
    price: 0,
    pdfUrl: '',
    checkoutUrl: '',
  },
  {
    id: 'bonus-acabamentos',
    kind: 'bonus',
    name: '25 Acabamentos para Valorizar o Tapete',
    tagline: '“Como deixo a peça bem finalizada?”',
    description: 'Referências de bordas, bicos e arremates para dar o toque final ao seu tapete.',
    emoji: '✨',
    format: 'Biblioteca visual em PDF',
    price: 0,
    pdfUrl: '',
    checkoutUrl: '',
  },

  // ---- Produtos vendidos dentro do app (sugestões, ajuste antes de publicar) ----
  {
    id: 'upgrade-completo',
    kind: 'upsell',
    name: 'Kit Aproveitamento Total das Sobras',
    tagline: 'Os 6 bônus do Plano Completo. Pague só a diferença.',
    description:
      'Para quem entrou no Plano Básico: libera as 60 combinações de cores, a tabela de fios, as emendas invisíveis, o mapa de resgate, a adaptação de medidas e os 25 acabamentos.',
    emoji: '🎁',
    format: '6 materiais em PDF',
    price: 1790,
    compareAt: 2790,
    pdfUrl: '',
    checkoutUrl: '', // TODO: checkout do upgrade
    unlocks: [...BONUS_IDS],
    highlight: 'Mais escolhido',
    guaranteeDays: 180,
  },
  {
    id: 'pack-casa',
    kind: 'upsell',
    name: 'Jogos de Banheiro e Cozinha com Sobras',
    tagline: 'Conjuntos que combinam entre si, no mesmo formato de mapa.',
    description:
      'Jogos de banheiro (3 peças), passadeiras e tapetes de pia, cada um com peso total e divisão por cor para montar o conjunto com o que você já tem.',
    emoji: '🛁',
    format: 'Coleção em PDF',
    price: 1990,
    compareAt: 3700,
    pdfUrl: '',
    checkoutUrl: '', // TODO
  },
  {
    id: 'pack-natal',
    kind: 'upsell',
    name: 'Coleção de Natal com Sobras',
    tagline: 'Tapetes, sousplats e enfeites para vender e presentear no fim de ano.',
    description:
      'Modelos natalinos pensados para sobras de vermelho, verde, cru e dourado, com consumo por cor e etapas visuais.',
    emoji: '🎄',
    format: 'Coleção em PDF',
    price: 1490,
    compareAt: 2900,
    pdfUrl: '',
    checkoutUrl: '', // TODO
    highlight: 'Temporada',
  },
  {
    id: 'guia-venda',
    kind: 'upsell',
    name: 'Venda Seus Tapetes',
    tagline: 'Preço certo, fotos que vendem e onde anunciar.',
    description:
      'Planilha de precificação, roteiro de fotos com o celular, modelos de legenda e de mensagem para vender pelo WhatsApp, Instagram e feirinhas.',
    emoji: '💰',
    format: 'Guia + planilha',
    price: 2490,
    compareAt: 4700,
    pdfUrl: '',
    checkoutUrl: '', // TODO
  },
  {
    id: 'clube',
    kind: 'upsell',
    name: 'Clube das Sobras',
    tagline: 'Modelos novos todo mês, no mesmo formato de mapa.',
    description:
      'Todo mês chegam novos modelos com peso e divisão por cor, uma paleta do mês para suas sobras e desafios da comunidade. Cancele quando quiser.',
    emoji: '📬',
    format: 'Assinatura mensal',
    price: 1990,
    recurring: true,
    pdfUrl: '',
    checkoutUrl: '', // TODO
  },
  {
    id: 'combo',
    kind: 'upsell',
    name: 'Combo Ateliê Completo',
    tagline: 'Banheiro e Cozinha + Natal + Venda Seus Tapetes.',
    description: 'As três coleções extras juntas, com desconto em relação à compra separada.',
    emoji: '🏆',
    format: '3 materiais em PDF',
    price: 3990,
    compareAt: 5970,
    pdfUrl: '',
    checkoutUrl: '', // TODO
    unlocks: ['pack-casa', 'pack-natal', 'guia-venda'],
    highlight: 'Melhor custo',
  },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);

export const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Duração da oferta de boas-vindas (upgrade) mostrada após o primeiro acesso. */
export const WELCOME_OFFER_MINUTES = 15;
