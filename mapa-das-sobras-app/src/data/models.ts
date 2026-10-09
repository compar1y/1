/**
 * Catálogo de modelos usado pelo "Encaixe" (comparação sobras × modelo).
 *
 * ATENÇÃO: estes são DADOS DE EXEMPLO para o app funcionar. Os modelos 23 e 41
 * repetem os exemplos ilustrativos da página de vendas. Antes de publicar,
 * substitua esta lista pelos 100 modelos reais do PDF (peso por cor, medidas,
 * fio, agulha e página do PDF de cada um).
 */

export type Shape = 'redondo' | 'retangular' | 'oval' | 'quadrado';
export type Thickness = '4/6' | '6' | '8';

export interface ColorSlot {
  /** Papel da cor no tapete, ex: "Cor principal" */
  role: string;
  grams: number;
  /** Cor de referência usada na foto do modelo */
  refName: string;
  refHex: string;
}

export interface RugModel {
  number: number;
  name: string;
  shape: Shape;
  size: string;
  thickness: Thickness;
  needle: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  slots: ColorSlot[];
  steps: string[];
  /** Página do modelo no PDF */
  pdfPage: number;
}

const C = {
  cru: ['Cru', '#EDE3D1'],
  terracota: ['Terracota', '#B8603C'],
  salvia: ['Verde-sálvia', '#8E9E7E'],
  mostarda: ['Mostarda', '#D3A23E'],
  rosa: ['Rosa antigo', '#C98F8B'],
  marinho: ['Azul-marinho', '#2F3E57'],
  cinza: ['Cinza', '#9A9792'],
  preto: ['Preto', '#2A2623'],
  caramelo: ['Caramelo', '#A8713F'],
  azul: ['Azul-céu', '#8DB3C9'],
} as const;

const slot = (role: string, grams: number, c: readonly [string, string]): ColorSlot => ({
  role,
  grams,
  refName: c[0],
  refHex: c[1],
});

export const MODELS: RugModel[] = [
  {
    number: 3,
    name: 'Tapete redondo de centro liso',
    shape: 'redondo',
    size: '60 cm de diâmetro',
    thickness: '6',
    needle: '4,0 mm',
    level: 'Iniciante',
    slots: [slot('Cor principal', 260, C.cru), slot('Borda', 60, C.terracota)],
    steps: ['Anel mágico com 12 pa', 'Aumentos em 12 por carreira', 'Borda em pb com a segunda cor'],
    pdfPage: 8,
  },
  {
    number: 7,
    name: 'Mini tapete de pia bicolor',
    shape: 'retangular',
    size: '40 × 25 cm',
    thickness: '6',
    needle: '4,0 mm',
    level: 'Iniciante',
    slots: [slot('Cor principal', 110, C.salvia), slot('Detalhe', 40, C.cru)],
    steps: ['Correntinha de base de 50 cm', 'Carreiras de pa alternando cores', 'Arremate em pb'],
    pdfPage: 16,
  },
  {
    number: 12,
    name: 'Tapete oval de cabeceira',
    shape: 'oval',
    size: '70 × 45 cm',
    thickness: '6',
    needle: '4,0 mm',
    level: 'Iniciante',
    slots: [slot('Cor principal', 300, C.cinza), slot('Faixa central', 80, C.mostarda), slot('Borda', 50, C.cru)],
    steps: ['Base de correntinhas', 'Voltas ovais com aumentos nas pontas', 'Faixa central', 'Borda em pb'],
    pdfPage: 26,
  },
  {
    number: 18,
    name: 'Quadrado da vovó para porta',
    shape: 'quadrado',
    size: '50 × 50 cm',
    thickness: '6',
    needle: '4,0 mm',
    level: 'Iniciante',
    slots: [
      slot('Centro', 70, C.mostarda),
      slot('Anel 2', 90, C.rosa),
      slot('Anel 3', 110, C.salvia),
      slot('Borda', 90, C.cru),
    ],
    steps: ['Centro em anel mágico', 'Grupos de 3 pa nos cantos', 'Troca de cor a cada 2 voltas', 'Borda em pb'],
    pdfPage: 38,
  },
  {
    number: 23,
    name: 'Tapete redondo em anéis',
    shape: 'redondo',
    size: '70 cm de diâmetro',
    thickness: '6',
    needle: '4,0 mm',
    level: 'Iniciante',
    slots: [slot('Cor principal', 180, C.cru), slot('Anéis', 100, C.terracota), slot('Borda', 80, C.salvia)],
    steps: ['Anel mágico com 12 pa', 'Aumentos regulares por volta', 'Anéis alternados de cor', 'Borda final'],
    pdfPage: 48,
  },
  {
    number: 29,
    name: 'Passadeira listrada estreita',
    shape: 'retangular',
    size: '120 × 40 cm',
    thickness: '6',
    needle: '4,0 mm',
    level: 'Iniciante',
    slots: [slot('Cor principal', 280, C.cru), slot('Listra 1', 90, C.marinho), slot('Listra 2', 60, C.azul)],
    steps: ['Base de correntinhas', 'Carreiras de pb', 'Listras a cada 8 carreiras', 'Borda nas laterais'],
    pdfPage: 60,
  },
  {
    number: 34,
    name: 'Tapete de sol com raios',
    shape: 'redondo',
    size: '65 cm de diâmetro',
    thickness: '8',
    needle: '5,0 mm',
    level: 'Intermediário',
    slots: [slot('Miolo', 120, C.mostarda), slot('Raios', 150, C.caramelo), slot('Borda', 90, C.cru)],
    steps: ['Miolo em pa', 'Raios em leque', 'União dos raios', 'Borda em bico'],
    pdfPage: 70,
  },
  {
    number: 41,
    name: 'Tapete retangular listrado',
    shape: 'retangular',
    size: '80 × 50 cm',
    thickness: '6',
    needle: '4,0 mm',
    level: 'Iniciante',
    slots: [slot('Cor principal', 230, C.cru), slot('Listra 1', 90, C.terracota), slot('Listra 2', 70, C.salvia)],
    steps: ['Base de correntinhas', 'Carreiras de pa', 'Listras alternadas', 'Borda em pb'],
    pdfPage: 84,
  },
  {
    number: 52,
    name: 'Tapete oval degradê',
    shape: 'oval',
    size: '90 × 55 cm',
    thickness: '8',
    needle: '5,0 mm',
    level: 'Intermediário',
    slots: [
      slot('Centro', 160, C.marinho),
      slot('Transição', 140, C.azul),
      slot('Externa', 120, C.cru),
      slot('Borda', 60, C.cinza),
    ],
    steps: ['Base oval', 'Degradê em 3 faixas', 'Aumentos nas curvas', 'Borda em pb'],
    pdfPage: 106,
  },
  {
    number: 66,
    name: 'Tapete de patchwork em quadradinhos',
    shape: 'quadrado',
    size: '60 × 60 cm',
    thickness: '6',
    needle: '4,0 mm',
    level: 'Intermediário',
    slots: [
      slot('Quadrados A', 120, C.rosa),
      slot('Quadrados B', 120, C.salvia),
      slot('Quadrados C', 100, C.mostarda),
      slot('União e borda', 110, C.cru),
    ],
    steps: ['9 quadradinhos de 20 cm', 'Distribuição das cores', 'União em pb', 'Borda contínua'],
    pdfPage: 134,
  },
  {
    number: 78,
    name: 'Tapete redondo flor de mandala',
    shape: 'redondo',
    size: '80 cm de diâmetro',
    thickness: '6',
    needle: '4,0 mm',
    level: 'Avançado',
    slots: [
      slot('Miolo', 80, C.terracota),
      slot('Pétalas', 160, C.rosa),
      slot('Fundo', 220, C.cru),
      slot('Borda', 70, C.salvia),
    ],
    steps: ['Miolo em pa', 'Pétalas em leque', 'Preenchimento do fundo', 'Borda em bico'],
    pdfPage: 158,
  },
  {
    number: 91,
    name: 'Tapete de entrada geométrico',
    shape: 'retangular',
    size: '70 × 45 cm',
    thickness: '8',
    needle: '5,0 mm',
    level: 'Intermediário',
    slots: [slot('Fundo', 260, C.preto), slot('Losangos', 110, C.cru), slot('Detalhe', 50, C.mostarda)],
    steps: ['Base de correntinhas', 'Gráfico de losangos', 'Troca de cor por carreira', 'Borda em pb'],
    pdfPage: 184,
  },
];
