// Catálogo usado só nos testes (o da oferta de madeira). O catálogo real do app é o ../../catalog.js.
// Catálogo da área de membros: o ÚNICO arquivo que você precisa editar para
// cadastrar produtos, entregáveis e ofertas. O servidor lê este arquivo ao subir
// (reinicie depois de editar). Veja o README para o passo a passo.
//
// Como as peças se ligam:
//   produto (o que se compra na Wiapy)  →  libera entregáveis (o que aparece em "Meus conteúdos")
//   oferta  (como um produto é vendido dentro do app)  →  se anexa a entregáveis que a pessoa JÁ TEM
//
// Datas no formato 'AAAA-MM-DD' (fuso de São Paulo). Preços em reais (número).

/**
 * @typedef {Object} Product
 * @property {string} name
 * @property {number} price                 preço de referência (usado nas métricas quando o webhook não traz valor)
 * @property {string[]} grants              ids dos entregáveis que a compra libera
 * @property {string[]} match               textos que identificam este produto no webhook da Wiapy
 *                                          (código do checkout, id do produto ou nome exato). Use o código do checkout: é único.
 * @property {boolean} [frontEnd]           true para os produtos da página de vendas (entram no cálculo de "LTV por porta de entrada")
 *
 * @typedef {Object} DeliverableItem
 * @property {string} id
 * @property {string} title
 * @property {string} [subtitle]
 * @property {string} [image]
 * @property {string} [file]                PDF dentro da pasta content/
 * @property {string[]} [highlights]
 *
 * @typedef {Object} Deliverable
 * @property {string} title
 * @property {string} [subtitle]
 * @property {string} [description]
 * @property {string} [image]
 * @property {string} [icon]                usado quando não há imagem (emoji)
 * @property {'library'|'pdf'|'link'} type  library = várias partes (ex.: coleções); pdf = um arquivo; link = link externo (planilha, Canva, Drive...)
 * @property {string} [file]                para type 'pdf'
 * @property {string} [url]                 para type 'link'
 * @property {DeliverableItem[]} [items]    para type 'library'
 * @property {string} [lockedOffer]         quem NÃO tem este entregável o vê com cadeado e esta oferta para destravar
 * @property {string} [itemsTitle]          título da lista de partes (ex.: 'Coleções', 'Módulos')
 * @property {string} [itemLabel]           rótulo de cada parte (ex.: 'Coleção' vira 'Coleção 01')
 * @property {number} [order]
 *
 * @typedef {Object} Offer
 * @property {string} product               id do produto vendido
 * @property {string} title
 * @property {string} [hook]                a frase de contexto: "Você já tem X…"  ({nome} vira o primeiro nome do cliente)
 * @property {string} [subtitle]
 * @property {string[]} [bullets]
 * @property {string} [image]
 * @property {string} [icon]
 * @property {string} [badge]
 * @property {number} price
 * @property {number} [priceFrom]
 * @property {string} checkoutUrl
 * @property {string} [cta]
 * @property {string[]} attachTo            entregáveis (ou 'entregavel/parte') em que a oferta aparece
 * @property {('inline'|'end'|'home'|'store'|'locked')[]} [placements]  padrão: todas
 * @property {number} [priority]            maior aparece primeiro (empate = rotação diária)
 * @property {string} [startsAt]
 * @property {string} [endsAt]
 * @property {{ requires?: string[], excludes?: string[] }} [audience]   ids de produtos
 */

export default {
  settings: {
    appName: '+100 Projetos com Madeira',
    shortName: 'Projetos Madeira',
    supportEmail: 'suporte@projetoscommadeira.com',
    // Parâmetros que o app acrescenta ao link do checkout. Confirme na Wiapy o nome
    // do parâmetro que pré-preenche o e-mail; se ela não aceitar, não tem problema, é ignorado.
    checkoutParams: { email: 'email', name: 'name' },
    // Ofertas por tela: home mostra até N em "Para você".
    homeOffers: 3,
    // Identidade visual (cores do app e do e-mail) e imagem da tela de login
    brand: {
      loginImage: '/assets/basic-mockup.webp',
      colors: { primary: '#C86A1B', primaryDark: '#9E4E0D', dark: '#3F2A1E', mid: '#6F4528', bg: '#F5F0E7', paper: '#FAF7F2', line: '#E8DDD0', ink: '#171512', success: '#008A5B' },
    },
    // Textos do app que dependem do produto ({titulo} = nome do conteúdo)
    texts: {
      homeSubtitle: 'O que vamos construir hoje?',
      lockedSection: 'Bônus do Pacote Completo',
      lockedHint: 'Você ainda não tem estes materiais. Toque em um deles para ver como destravar.',
      lockedIntro: '🔒 "{titulo}" faz parte do Pacote Completo',
      lockedNotice: 'Este material faz parte do Pacote Completo.',
      storeIntro: 'Materiais para ir além dos seus projetos. Depois da compra, eles aparecem aqui no app automaticamente.',
      installHint: 'Fica com um ícone na tela inicial e abre direto nos seus projetos, sem precisar procurar o e-mail.',
      welcomeEmail: 'Seu acesso está liberado. Toque no botão abaixo para entrar e começar pelos seus projetos.',
    },
  },

  /** @type {Record<string, Product>} */
  products: {
    basico: {
      name: 'Pacote Básico',
      price: 10,
      grants: ['projetos-100'],
      match: ['eiu2dIDEi_2N'],
      frontEnd: true,
    },
    completo: {
      name: 'Pacote Completo',
      price: 27.9,
      grants: ['projetos-100', 'fornecedores', 'guia-madeiras', 'precificacao', 'materiais-ferragens', 'acabamento', 'primeiras-vendas'],
      // checkout principal + os dois checkouts dos popups de saída
      match: ['VIB5O5IAEWDa', 'YQ2RhCk7O0Pd', 'gPeRvaElgMwB'],
      frontEnd: true,
    },
    'upgrade-completo': {
      name: 'Upgrade para o Pacote Completo',
      price: 17.9,
      grants: ['fornecedores', 'guia-madeiras', 'precificacao', 'materiais-ferragens', 'acabamento', 'primeiras-vendas'],
      match: ['TROCAR_CODIGO_UPGRADE'],
    },
    'natal-15': {
      name: '15 Projetos Campeões de Natal',
      price: 19.9,
      grants: ['natal-15'],
      match: ['TROCAR_CODIGO_NATAL'],
    },
    'planilha-precificacao': {
      name: 'Planilha de Precificação Automática',
      price: 14.9,
      grants: ['planilha-precificacao'],
      match: ['TROCAR_CODIGO_PLANILHA'],
    },
    'pack-divulgacao': {
      name: 'Pack de Divulgação',
      price: 17.9,
      grants: ['pack-divulgacao'],
      match: ['TROCAR_CODIGO_PACK'],
    },
    'planos-de-corte': {
      name: 'Planos de Corte Otimizados',
      price: 19.9,
      grants: ['planos-de-corte'],
      match: ['TROCAR_CODIGO_CORTE'],
    },
    'premium-encomenda': {
      name: 'Peças Premium sob Encomenda',
      price: 27.9,
      grants: ['premium-encomenda'],
      match: ['TROCAR_CODIGO_PREMIUM'],
    },
    'jardim-primavera': {
      name: 'Coleção Jardim de Primavera',
      price: 14.9,
      grants: ['jardim-primavera'],
      match: ['TROCAR_CODIGO_JARDIM'],
    },
  },

  /** @type {Record<string, Deliverable>} */
  deliverables: {
    'projetos-100': {
      order: 1,
      type: 'library',
      itemsTitle: 'Coleções',
      itemLabel: 'Coleção',
      title: '+100 Projetos com Madeira',
      subtitle: '5 coleções • 100 projetos com medidas e passo a passo',
      image: '/assets/basic-mockup.webp',
      description: 'Sua biblioteca completa. Escolha uma coleção, abra os projetos no celular ou baixe para imprimir e levar para a bancada.',
      items: [
        { id: 'decoracao', title: 'Decoração & Organização', subtitle: '20 projetos • Nível fácil', image: '/assets/collections/colecao-01-decoracao-organizacao.webp', file: 'colecao-01-decoracao-organizacao.pdf', highlights: ['Prateleiras Flutuantes', 'Nichos Hexagonais', 'Porta-Chaves com Nicho', 'Organizadores de Mesa'] },
        { id: 'cozinha', title: 'Casa, Cozinha & Utilitários', subtitle: '20 projetos • Fácil a intermediário', image: '/assets/collections/colecao-02-casa-cozinha-utilitarios.webp', file: 'colecao-02-casa-cozinha-utilitarios.pdf', highlights: ['Porta-Talheres com Divisórias', 'Suporte para Xícaras & Canecas', 'Porta-Temperos de 2 Níveis', 'Fruteiras & Suportes de Taças'] },
        { id: 'jardim', title: 'Jardim, Plantas & Varanda', subtitle: '20 projetos • Fácil a intermediário', image: '/assets/collections/colecao-03-jardim-plantas-varanda.webp', file: 'colecao-03-jardim-plantas-varanda.pdf', highlights: ['Jardineiras de Pinus', 'Cachepôs Ripados', 'Mini Horta Vertical', 'Suportes para Vasos'] },
        { id: 'moveis', title: 'Móveis Compactos & Modernos', subtitle: '20 projetos • Intermediário', image: '/assets/collections/colecao-04-moveis-compactos-modernos.webp', file: 'colecao-04-moveis-compactos-modernos.pdf', highlights: ['Mesa Lateral em C', 'Criado-Mudo em Nicho', 'Aparadores Slim', 'Mesas Dobráveis de Parede'] },
        { id: 'atelie', title: 'Ateliê Premium & Presentes', subtitle: '20 projetos • Fácil a intermediário', image: '/assets/collections/colecao-05-atelie-premium-presentes.webp', file: 'colecao-05-atelie-premium-presentes.pdf', highlights: ['Porta-Joias com Divisórias', 'Estojos para Vinhos', 'Caixas de Chá & Memórias', 'Expositores de Relógios'] },
      ],
    },
    fornecedores: { order: 2, type: 'pdf', title: 'Lista de Fornecedores', subtitle: 'Bônus #01', image: '/assets/bonuses/bonus-1.webp', file: 'bonus-01-lista-de-fornecedores.pdf', lockedOffer: 'upgrade-completo', description: 'Onde encontrar madeira, ferragens, acessórios e materiais com melhor custo-benefício.' },
    'guia-madeiras': { order: 3, type: 'pdf', title: 'Guia de Madeiras e Espessuras', subtitle: 'Bônus #02', image: '/assets/bonuses/bonus-2.webp', file: 'bonus-02-guia-de-madeiras.pdf', lockedOffer: 'upgrade-completo', description: 'Tipos de madeira, espessuras recomendadas e substituições para cada peça.' },
    precificacao: { order: 4, type: 'pdf', title: 'Guia de Precificação', subtitle: 'Bônus #03', image: '/assets/bonuses/bonus-3.webp', file: 'bonus-03-guia-de-precificacao.pdf', lockedOffer: 'upgrade-completo', description: 'Calcule materiais, tempo e custos para chegar a um preço justo e lucrativo.' },
    'materiais-ferragens': { order: 5, type: 'pdf', title: 'Lista de Materiais e Ferragens', subtitle: 'Bônus #04', image: '/assets/bonuses/bonus-4.webp', file: 'bonus-04-materiais-e-ferragens.pdf', lockedOffer: 'upgrade-completo', description: 'Consumíveis, dobradiças, parafusos e ferragens usados nos projetos.' },
    acabamento: { order: 6, type: 'pdf', title: 'Guia de Acabamento de Peças', subtitle: 'Bônus #05', image: '/assets/bonuses/bonus-5.webp', file: 'bonus-05-guia-de-acabamento.pdf', lockedOffer: 'upgrade-completo', description: 'Lixamento, selamento, óleos e acabamentos que valorizam suas peças.' },
    'primeiras-vendas': { order: 7, type: 'pdf', title: 'Kit Primeiras Vendas', subtitle: 'Bônus #06', image: '/assets/bonuses/bonus-6.webp', file: 'bonus-06-kit-primeiras-vendas.pdf', lockedOffer: 'upgrade-completo', description: 'Como fotografar, divulgar e oferecer suas primeiras peças.' },

    // Entregáveis das ofertas de back-end (aparecem quando a pessoa compra)
    'natal-15': { order: 10, type: 'pdf', title: '15 Projetos Campeões de Natal', subtitle: 'Edição de fim de ano', icon: '🎄', file: 'natal-15-projetos.pdf', description: 'Os projetos mais rápidos de fazer e mais procurados para presentear no fim de ano.' },
    'planilha-precificacao': { order: 11, type: 'link', title: 'Planilha de Precificação Automática', subtitle: 'Google Planilhas', icon: '📊', url: 'https://docs.google.com/spreadsheets/TROCAR', description: 'Faça uma cópia, coloque seus custos e a planilha calcula o preço de venda.' },
    'pack-divulgacao': { order: 12, type: 'pdf', title: 'Pack de Divulgação', subtitle: '50 artes + legendas + roteiros', icon: '📣', file: 'pack-de-divulgacao.pdf', description: 'Artes, legendas e roteiros de WhatsApp prontos para divulgar suas peças.' },
    'planos-de-corte': { order: 13, type: 'pdf', title: 'Planos de Corte Otimizados', subtitle: 'Aproveitamento de chapa', icon: '📐', file: 'planos-de-corte.pdf', description: 'Como encaixar as peças na chapa para desperdiçar menos material.' },
    'premium-encomenda': { order: 14, type: 'pdf', title: 'Peças Premium sob Encomenda', subtitle: 'Projetos de ticket alto', icon: '💎', file: 'premium-sob-encomenda.pdf', description: 'Projetos sofisticados para encomendas e presentes personalizados.' },
    'jardim-primavera': { order: 15, type: 'pdf', title: 'Coleção Jardim de Primavera', subtitle: '12 projetos para a estação', icon: '🌱', file: 'jardim-de-primavera.pdf', description: 'Peças de jardim e varanda que combinam com a procura da primavera.' },
  },

  /** @type {Record<string, Offer>} */
  offers: {
    'upgrade-completo': {
      product: 'upgrade-completo',
      title: 'Destrave os 6 bônus do Pacote Completo',
      hook: 'Você já tem os 100 projetos. Falta o que transforma projeto em venda.',
      subtitle: 'Fornecedores, precificação, acabamento, materiais e o Kit Primeiras Vendas.',
      bullets: ['Lista de Fornecedores', 'Guia de Madeiras e Espessuras', 'Guia de Precificação', 'Lista de Materiais e Ferragens', 'Guia de Acabamento de Peças', 'Kit Primeiras Vendas'],
      image: '/assets/bonuses/bonus-3.webp',
      badge: 'SÓ PARA QUEM JÁ É ALUNO',
      price: 17.9,
      priceFrom: 27.9,
      checkoutUrl: 'https://pay.wiapy.com/TROCAR-UPGRADE',
      cta: 'Destravar os bônus',
      attachTo: ['projetos-100'],
      priority: 100,
      audience: { requires: ['basico'], excludes: ['completo'] },
    },
    'natal-15': {
      product: 'natal-15',
      title: '15 Projetos Campeões de Natal',
      hook: 'Você já tem seus 100 projetos. Agora veja os 15 mais rápidos de fazer e mais procurados para presentear no Natal.',
      subtitle: 'Peças pequenas, de material barato, que dá para produzir em série até dezembro.',
      bullets: ['15 projetos com medidas e passo a passo', 'Lista de quais fazer primeiro (os mais rápidos)', 'Sugestão de embalagem para presente', 'Calendário de produção até o Natal'],
      icon: '🎄',
      badge: 'EDIÇÃO DE NATAL',
      price: 19.9,
      priceFrom: 47,
      checkoutUrl: 'https://pay.wiapy.com/TROCAR-NATAL',
      cta: 'Quero os projetos de Natal',
      attachTo: ['projetos-100', 'projetos-100/atelie', 'projetos-100/decoracao'],
      priority: 90,
      startsAt: '2026-10-01',
      endsAt: '2026-12-24',
    },
    'planilha-precificacao': {
      product: 'planilha-precificacao',
      title: 'Planilha de Precificação Automática',
      hook: 'Você já sabe como calcular o preço. Agora deixe a planilha fazer a conta por você.',
      subtitle: 'Coloque o custo da madeira, das ferragens e as suas horas. Ela devolve o preço de venda.',
      bullets: ['Funciona no celular (Google Planilhas)', 'Calcula material, tempo e margem', 'Já vem com os 100 projetos cadastrados'],
      icon: '📊',
      price: 14.9,
      priceFrom: 37,
      checkoutUrl: 'https://pay.wiapy.com/TROCAR-PLANILHA',
      cta: 'Quero a planilha',
      attachTo: ['precificacao'],
      priority: 50,
    },
    'pack-divulgacao': {
      product: 'pack-divulgacao',
      title: 'Pack de Divulgação',
      hook: 'Você já sabe como fazer as primeiras vendas. Agora tenha o material pronto para divulgar.',
      subtitle: '50 artes editáveis, legendas e roteiros de WhatsApp para oferecer suas peças.',
      bullets: ['50 artes editáveis no Canva', 'Legendas prontas para Instagram e Status', 'Roteiros de conversa no WhatsApp', 'Modelos de catálogo'],
      icon: '📣',
      price: 17.9,
      priceFrom: 47,
      checkoutUrl: 'https://pay.wiapy.com/TROCAR-PACK',
      cta: 'Quero o pack',
      attachTo: ['primeiras-vendas', 'natal-15'],
      priority: 50,
    },
    'planos-de-corte': {
      product: 'planos-de-corte',
      title: 'Planos de Corte Otimizados',
      hook: 'Você já sabe onde comprar. Agora aproveite cada chapa sem desperdício.',
      subtitle: 'Diagramas de encaixe das peças na chapa para gastar menos material em cada projeto.',
      bullets: ['Diagramas por projeto', 'Medidas de chapa mais comuns', 'Sobras reaproveitáveis indicadas'],
      icon: '📐',
      price: 19.9,
      priceFrom: 39,
      checkoutUrl: 'https://pay.wiapy.com/TROCAR-CORTE',
      cta: 'Quero os planos de corte',
      attachTo: ['fornecedores', 'materiais-ferragens', 'projetos-100/moveis'],
      priority: 40,
    },
    'premium-encomenda': {
      product: 'premium-encomenda',
      title: 'Peças Premium sob Encomenda',
      hook: 'Você já tem a coleção Ateliê. Agora vá para as peças de ticket alto.',
      subtitle: 'Projetos sofisticados para encomendas, presentes corporativos e datas especiais.',
      bullets: ['Projetos de maior valor percebido', 'Acabamentos que valorizam a peça', 'Como apresentar um orçamento de encomenda'],
      icon: '💎',
      price: 27.9,
      priceFrom: 67,
      checkoutUrl: 'https://pay.wiapy.com/TROCAR-PREMIUM',
      cta: 'Quero as peças premium',
      attachTo: ['projetos-100/atelie', 'acabamento', 'pack-divulgacao'],
      priority: 40,
    },
    'jardim-primavera': {
      product: 'jardim-primavera',
      title: 'Coleção Jardim de Primavera',
      hook: 'Você já tem a coleção de jardim. Agora veja os projetos que combinam com a primavera.',
      subtitle: '12 projetos de jardim e varanda para a época em que mais se procura esse tipo de peça.',
      bullets: ['12 projetos novos', 'Peças para apartamento e varanda', 'Acabamento para área externa'],
      icon: '🌱',
      badge: 'PRIMAVERA',
      price: 14.9,
      priceFrom: 37,
      checkoutUrl: 'https://pay.wiapy.com/TROCAR-JARDIM',
      cta: 'Quero a coleção de primavera',
      attachTo: ['projetos-100/jardim'],
      priority: 60,
      startsAt: '2026-09-01',
      endsAt: '2026-12-15',
    },
  },
};
