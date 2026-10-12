// Catálogo da área de membros da Fábrica de Panetones Caseiros: o ÚNICO arquivo que você
// precisa editar para cadastrar produtos, entregáveis, ofertas, textos e cores.
// O servidor lê este arquivo ao subir (reinicie depois de editar). Veja o README.
//
// Como as peças se ligam:
//   produto (o que se compra na Wiapy)  →  libera entregáveis (o que aparece em "Meus conteúdos")
//   oferta  (como um produto é vendido dentro do app)  →  se anexa a entregáveis que a pessoa JÁ TEM
//
// Tudo que está como TROCAR precisa do dado real (código do checkout, link, arquivo).
// Datas no formato 'AAAA-MM-DD' (fuso de São Paulo). Preços em reais (número).

/**
 * @typedef {Object} Product
 * @property {string} name
 * @property {number} price                 preço de referência (usado nas métricas quando o webhook não traz valor)
 * @property {string[]} grants              ids dos entregáveis que a compra libera
 * @property {string[]} match               textos que identificam este produto no webhook da Wiapy
 *                                          (código do checkout, id do produto ou nome exato). Use o código do checkout: é único.
 * @property {boolean} [frontEnd]           true para os produtos da página de vendas (entram no "LTV por porta de entrada")
 *
 * @typedef {Object} DeliverableItem
 * @property {string} id
 * @property {string} title
 * @property {string} [subtitle]
 * @property {string} [image]
 * @property {string} [icon]
 * @property {string} [file]                PDF próprio desta parte (dentro de content/). Sem ele, usa o PDF do entregável…
 * @property {number} [page]                …abrindo nesta página (ex.: onde a categoria começa no e-book)
 * @property {string[]} [highlights]
 *
 * @typedef {Object} Deliverable
 * @property {string} title
 * @property {string} [subtitle]
 * @property {string} [description]
 * @property {string} [image]
 * @property {string} [icon]                usado quando não há imagem (emoji)
 * @property {'library'|'pdf'|'link'} type  library = várias partes (ex.: categorias); pdf = um arquivo; link = link externo (planilha, Canva, Drive...)
 * @property {string} [file]                PDF dentro da pasta content/
 * @property {string} [url]                 para type 'link'
 * @property {DeliverableItem[]} [items]    para type 'library'
 * @property {string} [itemsTitle]          título da lista de partes (ex.: 'Categorias')
 * @property {string} [itemLabel]           rótulo de cada parte (ex.: 'Categoria' vira 'Categoria 01')
 * @property {string} [lockedOffer]         quem NÃO tem este entregável o vê com cadeado e esta oferta para destravar
 * @property {number} [order]
 *
 * @typedef {Object} Offer
 * @property {string} product               id do produto vendido
 * @property {string} title
 * @property {string} [hook]                a frase de contexto: "Você já tem X…"  ({nome} vira o primeiro nome da cliente)
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

const BONUS = ['guia-embalagem', 'kits-natal', 'cardapio-whatsapp', 'mensagens-prevenda', 'planejador', 'plano-b-trufado', 'receitas-natal-50'];

export default {
  settings: {
    appName: 'Fábrica de Panetones Caseiros',
    shortName: 'Fábrica de Panetones',
    supportEmail: 'TROCAR@seudominio.com',
    // Parâmetros que o app acrescenta ao link do checkout. Confirme na Wiapy o nome
    // do parâmetro que pré-preenche o e-mail; se ela não aceitar, é só ignorado.
    checkoutParams: { email: 'email', name: 'name' },
    homeOffers: 3,
    brand: {
      loginImage: null,          // ex.: '/assets/mockup-completo.webp' (coloque o arquivo em web/public/assets/)
      loginIcon: '🎄',           // aparece no login enquanto não há imagem
      colors: {
        primary: '#B3261E',      // vermelho de Natal (botões)
        primaryDark: '#7F1A14',
        dark: '#3A2116',         // marrom chocolate (barras, textos)
        mid: '#7A4A2A',          // gradiente das capas sem imagem
        bg: '#FBF5EC',           // creme
        paper: '#FFFBF4',
        line: '#EBDDC9',
        ink: '#1E1410',
        success: '#1E7A4C',      // verde de Natal (concluído)
      },
    },
    texts: {
      homeSubtitle: 'Qual fornada vamos fazer hoje?',
      lockedSection: 'Bônus do Kit Completo',
      lockedHint: 'Você ainda não tem estes materiais. Toque em um deles para ver como liberar.',
      lockedIntro: '🔒 "{titulo}" faz parte do Kit Completo',
      lockedNotice: 'Este material faz parte do Kit Completo.',
      storeIntro: 'Materiais para ir além das suas receitas. Depois da compra, eles aparecem aqui no app automaticamente.',
      installHint: 'Fica com um ícone na tela inicial e abre direto nas suas receitas, até com a mão suja de farinha.',
      welcomeEmail: 'Seu acesso está liberado. Toque no botão abaixo para entrar e escolher a sua primeira receita.',
      loginSubtitle: 'Entre com o mesmo e-mail que você usou na compra. Enviamos um link de acesso, sem senha.',
    },
  },

  /** @type {Record<string, Product>} */
  products: {
    essencial: {
      name: 'Kit Essencial',
      price: 10,
      grants: ['receitas-100', 'guia-massa', 'calculadora'],
      match: ['TROCAR_CODIGO_KIT_ESSENCIAL'],
      frontEnd: true,
    },
    completo: {
      name: 'Kit Completo',
      price: 27.9,
      grants: ['receitas-100', 'guia-massa', 'calculadora', ...BONUS],
      // coloque aqui o código do checkout principal e o de qualquer popup/oferta de saída do Kit Completo
      match: ['TROCAR_CODIGO_KIT_COMPLETO'],
      frontEnd: true,
    },
    'upgrade-completo': {
      name: 'Upgrade para o Kit Completo',
      price: 17.9,
      grants: BONUS,
      match: ['TROCAR_CODIGO_UPGRADE'],
    },
    'top-15-natal': {
      name: 'Top 15: As Mais Fáceis e Mais Pedidas do Natal',
      price: 19.9,
      grants: ['top-15-natal'],
      match: ['TROCAR_CODIGO_TOP15'],
    },
    'rotulos-tags': {
      name: 'Rótulos, Tags e Etiquetas de Natal',
      price: 14.9,
      grants: ['rotulos-tags'],
      match: ['TROCAR_CODIGO_ROTULOS'],
    },
    'pack-divulgacao': {
      name: 'Pack de Divulgação de Natal',
      price: 17.9,
      grants: ['pack-divulgacao'],
      match: ['TROCAR_CODIGO_PACK'],
    },
    'planilha-encomendas': {
      name: 'Planilha de Encomendas e Entregas',
      price: 14.9,
      grants: ['planilha-encomendas'],
      match: ['TROCAR_CODIGO_PLANILHA'],
    },
    'linha-gourmet': {
      name: 'Linha Gourmet: Panetones Premium',
      price: 24.9,
      grants: ['linha-gourmet'],
      match: ['TROCAR_CODIGO_GOURMET'],
    },
    'venda-empresas': {
      name: 'Kits Corporativos: Venda Para Empresas',
      price: 19.9,
      grants: ['venda-empresas'],
      match: ['TROCAR_CODIGO_EMPRESAS'],
    },
    'pascoa-ovos': {
      name: 'Páscoa Caseira: Ovos de Colher e Trufados',
      price: 19.9,
      grants: ['pascoa-ovos'],
      match: ['TROCAR_CODIGO_PASCOA'],
    },
  },

  /** @type {Record<string, Deliverable>} */
  deliverables: {
    'receitas-100': {
      order: 1,
      type: 'library',
      title: '+100 Receitas de Panetones e Chocotones',
      subtitle: 'Passo a passo • massa por forma • ponto de forno',
      icon: '📖',
      file: 'receitas-100-panetones.pdf',
      description: 'Suas receitas organizadas por categoria. Comece pela seleção "Comece por aqui" ou escolha uma categoria. Abra no celular ou baixe para imprimir.',
      itemsTitle: 'Categorias',
      itemLabel: 'Categoria',
      // TROCAR: "page" = página do e-book onde cada categoria começa. Se você tiver um PDF por
      // categoria, troque "page" por file: 'nome-do-arquivo.pdf'.
      items: [
        { id: 'comece-por-aqui', title: 'Comece por aqui', subtitle: '5 receitas para a primeira fornada', icon: '⭐', page: 1, highlights: ['As 5 mais fáceis para iniciantes'] },
        { id: 'tradicionais', title: 'Panetones Tradicionais', subtitle: 'Frutas cristalizadas e uvas-passas', icon: '🍞', page: 1, highlights: ['Panetone Tradicional (002)', 'Frutas Vermelhas (097)'] },
        { id: 'chocotones', title: 'Chocotones', subtitle: 'Gotas de chocolate e coberturas', icon: '🍫', page: 1, highlights: ['Chocotone Caseiro (001)', 'Creme de Avelã (005)', 'Cobertura Marmorizada (010)'] },
        { id: 'recheados', title: 'Recheados', subtitle: 'Brigadeiro, leite em pó, maracujá e mais', icon: '🍯', page: 1, highlights: ['Brigadeiro (011)', 'Leite em Pó (012)', 'Maracujá (015)', 'Doce de Leite'] },
        { id: 'minitones', title: 'Minitones', subtitle: 'Inclusive na air fryer', icon: '🧁', page: 1, highlights: ['Minichocotone de Brigadeiro (032)', 'Caixinha degustação'] },
        { id: 'premium', title: 'Premium', subtitle: 'Sabores para vender mais caro', icon: '✨', page: 1, highlights: ['Chocotone com Pistache (008)'] },
        { id: 'especiais', title: 'Especiais', subtitle: 'Frutas e sabores diferentes', icon: '🍓', page: 1, highlights: ['Panetone de Frutas Vermelhas (097)'] },
      ],
    },
    'guia-massa': { order: 2, type: 'pdf', title: 'Guia da Massa Que Cresce', subtitle: 'Incluso no seu kit', icon: '🥣', file: 'guia-da-massa-que-cresce.pdf', description: 'O que fazer para a massa crescer, não murchar e não endurecer.' },
    calculadora: { order: 3, type: 'link', title: 'Calculadora de Custo e Preço', subtitle: 'Incluso no seu kit', icon: '🧮', url: 'https://TROCAR-link-da-calculadora', description: 'Coloque seus custos e veja quanto cobrar por tamanho, com a sua margem.' },

    // Bônus do Kit Completo (quem tem o Essencial vê com cadeado)
    'guia-embalagem': { order: 4, type: 'pdf', title: 'Guia de Embalagem Que Vende', subtitle: 'Bônus 01', icon: '🎁', file: 'bonus-01-guia-de-embalagem.pdf', lockedOffer: 'upgrade-completo', description: 'Papel, fita e caixa de loja de festa para o panetone parecer de vitrine, com lista de materiais e custos.' },
    'kits-natal': { order: 5, type: 'pdf', title: '20 Ideias de Kits de Natal', subtitle: 'Bônus 02', icon: '🧺', file: 'bonus-02-kits-de-natal.pdf', lockedOffer: 'upgrade-completo', description: 'Caixinha degustação, kit família, amigo secreto, presentes para empresas e cestas.' },
    'cardapio-whatsapp': { order: 6, type: 'pdf', title: 'Cardápio Pronto Para o WhatsApp', subtitle: 'Bônus 03', icon: '📱', file: 'bonus-03-cardapio-whatsapp.pdf', lockedOffer: 'upgrade-completo', description: 'Cardápio formatado para copiar, trocar os preços e enviar, com roteiro para fotografar o corte.' },
    'mensagens-prevenda': { order: 7, type: 'pdf', title: 'Mensagens de Pré-venda e Encomenda', subtitle: 'Bônus 04', icon: '💬', file: 'bonus-04-mensagens-pre-venda.pdf', lockedOffer: 'upgrade-completo', description: 'Textos para abrir encomendas, passar orçamento e confirmar pedidos sem parecer spam.' },
    planejador: { order: 8, type: 'pdf', title: 'Planejador de Produção até 24/12', subtitle: 'Bônus 05', icon: '🗓️', file: 'bonus-05-planejador-producao.pdf', lockedOffer: 'upgrade-completo', description: 'Quantas fornadas por dia, quando comprar os insumos e quando entregar cada pedido.' },
    'plano-b-trufado': { order: 9, type: 'pdf', title: 'Plano B: Trufado Rápido', subtitle: 'Bônus 06', icon: '🍫', file: 'bonus-06-plano-b-trufado.pdf', lockedOffer: 'upgrade-completo', description: 'Como rechear e decorar um chocotone pronto quando faltar tempo na véspera.' },
    'receitas-natal-50': { order: 10, type: 'pdf', title: '+50 Receitas do Cardápio de Natal', subtitle: 'Bônus extra', icon: '🍪', file: 'bonus-extra-50-receitas-natal.pdf', lockedOffer: 'upgrade-completo', description: 'Pão de mel, biscoito natalino decorado, rabanada, bolotone e cookies para ampliar o cardápio.' },

    // Entregáveis das ofertas de back-end (aparecem quando a pessoa compra)
    'top-15-natal': { order: 20, type: 'pdf', title: 'Top 15: As Mais Fáceis e Mais Pedidas', subtitle: 'Seleção de Natal', icon: '🏆', file: 'top-15-natal.pdf', description: 'As 15 receitas com menos etapas e mais procura nas encomendas de Natal, na ordem para produzir.' },
    'rotulos-tags': { order: 21, type: 'link', title: 'Rótulos, Tags e Etiquetas de Natal', subtitle: 'Editáveis no Canva', icon: '🏷️', url: 'https://TROCAR-link-do-canva', description: 'Tags, adesivos de validade e etiquetas de sabor para imprimir em casa.' },
    'pack-divulgacao': { order: 22, type: 'link', title: 'Pack de Divulgação de Natal', subtitle: 'Artes editáveis no Canva', icon: '📣', url: 'https://TROCAR-link-do-canva', description: 'Artes para Status, Instagram e grupos, com legendas prontas para abrir encomendas.' },
    'planilha-encomendas': { order: 23, type: 'link', title: 'Planilha de Encomendas e Entregas', subtitle: 'Google Planilhas', icon: '📋', url: 'https://docs.google.com/spreadsheets/TROCAR', description: 'Pedidos, sinal, sabores, data e endereço de entrega num lugar só. Mostra a lista de compras da semana.' },
    'linha-gourmet': { order: 24, type: 'pdf', title: 'Linha Gourmet: Panetones Premium', subtitle: 'Receitas de ticket alto', icon: '👑', file: 'linha-gourmet.pdf', description: 'Recheios trufados, pistache, frutas nobres e acabamentos que justificam um preço maior.' },
    'venda-empresas': { order: 25, type: 'pdf', title: 'Kits Corporativos: Venda Para Empresas', subtitle: 'Pedidos em quantidade', icon: '🏢', file: 'venda-para-empresas.pdf', description: 'Como montar, precificar e oferecer kits de fim de ano para empresas e condomínios.' },
    'pascoa-ovos': { order: 26, type: 'pdf', title: 'Páscoa Caseira: Ovos de Colher e Trufados', subtitle: 'Para depois do Natal', icon: '🐣', file: 'pascoa-ovos-de-colher.pdf', description: 'Ovos de colher, trufados e kits de Páscoa para continuar produzindo depois do Natal.' },
  },

  /** @type {Record<string, Offer>} */
  offers: {
    // Essencial → Completo: aparece nos bônus com cadeado e nos materiais do kit
    'upgrade-completo': {
      product: 'upgrade-completo',
      title: 'Libere os 7 bônus do Kit Completo',
      hook: 'Você já tem as 100 receitas. Agora falta o que faz o panetone vender: embalagem, kits, cardápio e mensagens prontas.',
      subtitle: 'Tudo o que vem no Kit Completo, pela diferença de preço.',
      bullets: ['Guia de Embalagem Que Vende', '20 Ideias de Kits de Natal', 'Cardápio Pronto Para o WhatsApp', 'Mensagens de Pré-venda e Encomenda', 'Planejador de Produção até 24/12', 'Plano B: Trufado Rápido', '+50 Receitas do Cardápio de Natal'],
      icon: '🎁',
      badge: 'SÓ PARA QUEM JÁ É ALUNA',
      price: 17.9,
      priceFrom: 27.9,
      checkoutUrl: 'https://pay.wiapy.com/TROCAR-UPGRADE',
      cta: 'Liberar os bônus',
      attachTo: ['receitas-100', 'guia-massa', 'calculadora'],
      priority: 100,
      audience: { requires: ['essencial'], excludes: ['completo'] },
    },
    // A ideia do "você já tem as 100… agora as 15 mais fáceis para o Natal"
    'top-15-natal': {
      product: 'top-15-natal',
      title: 'Top 15: As Mais Fáceis e Mais Pedidas do Natal',
      hook: 'Você já tem as suas 100 receitas. Agora veja as 15 mais fáceis de fazer e mais pedidas nas encomendas de Natal.',
      subtitle: 'Para não perder tempo escolhendo: as 15 que dão menos trabalho e mais saem, na ordem para produzir.',
      bullets: ['15 receitas com menos etapas e ingredientes de mercado', 'Ordem de produção: das que duram mais às de última hora', 'Rendimento por fornada no forno de casa', 'Sugestão de sabor para cada tipo de cliente'],
      icon: '🏆',
      badge: 'SELEÇÃO DE NATAL',
      price: 19.9,
      priceFrom: 47,
      checkoutUrl: 'https://pay.wiapy.com/TROCAR-TOP15',
      cta: 'Quero as 15 mais pedidas',
      attachTo: ['receitas-100', 'receitas-100/comece-por-aqui', 'receitas-100/chocotones', 'receitas-100/tradicionais'],
      priority: 90,
      endsAt: '2026-12-20',
    },
    'rotulos-tags': {
      product: 'rotulos-tags',
      title: 'Rótulos, Tags e Etiquetas de Natal',
      hook: 'Você já sabe embalar. Agora coloque a etiqueta que faz o panetone parecer de loja.',
      subtitle: 'Tags de presente, etiqueta de sabor e adesivo de validade, editáveis no Canva e prontos para imprimir.',
      bullets: ['Tags "Feito com carinho" e de presente', 'Etiquetas de sabor e de validade', 'Modelos para caixa de minitones', 'Edita no celular, imprime em casa'],
      icon: '🏷️',
      price: 14.9,
      priceFrom: 37,
      checkoutUrl: 'https://pay.wiapy.com/TROCAR-ROTULOS',
      cta: 'Quero os rótulos',
      attachTo: ['guia-embalagem', 'kits-natal', 'receitas-100/minitones'],
      priority: 60,
    },
    'pack-divulgacao': {
      product: 'pack-divulgacao',
      title: 'Pack de Divulgação de Natal',
      hook: 'Você já tem o cardápio e as mensagens. Agora tenha as artes para postar e abrir encomendas.',
      subtitle: 'Artes de Natal editáveis para Status, Instagram e grupos, com as legendas prontas.',
      bullets: ['Artes de "Encomendas abertas" e "Últimas unidades"', 'Modelos de cardápio em imagem', 'Legendas para cada arte', 'Calendário de postagens até 24/12'],
      icon: '📣',
      price: 17.9,
      priceFrom: 47,
      checkoutUrl: 'https://pay.wiapy.com/TROCAR-PACK',
      cta: 'Quero o pack',
      attachTo: ['cardapio-whatsapp', 'mensagens-prevenda', 'top-15-natal'],
      priority: 60,
      endsAt: '2026-12-24',
    },
    'planilha-encomendas': {
      product: 'planilha-encomendas',
      title: 'Planilha de Encomendas e Entregas',
      hook: 'Você já sabe quanto cobrar. Agora controle cada pedido sem se perder em dezembro.',
      subtitle: 'Pedidos, sinal recebido, sabores, data e endereço de entrega num lugar só, no celular.',
      bullets: ['Funciona no Google Planilhas (celular)', 'Mostra quanto falta receber de cada cliente', 'Gera a lista de compras de ingredientes da semana', 'Agenda de entregas por dia'],
      icon: '📋',
      price: 14.9,
      priceFrom: 37,
      checkoutUrl: 'https://pay.wiapy.com/TROCAR-PLANILHA',
      cta: 'Quero a planilha',
      attachTo: ['calculadora', 'planejador'],
      priority: 50,
    },
    'linha-gourmet': {
      product: 'linha-gourmet',
      title: 'Linha Gourmet: Panetones Premium',
      hook: 'Você já faz os recheados. Agora aprenda os sabores que dá para vender mais caro.',
      subtitle: 'Receitas premium com recheios trufados, pistache, frutas nobres e acabamento de confeitaria.',
      bullets: ['Recheios trufados e cremosos', 'Coberturas e decoração de vitrine', 'Tamanhos e preços sugeridos para a linha premium', 'Como apresentar o gourmet no cardápio'],
      icon: '👑',
      price: 24.9,
      priceFrom: 67,
      checkoutUrl: 'https://pay.wiapy.com/TROCAR-GOURMET',
      cta: 'Quero a linha gourmet',
      attachTo: ['receitas-100/premium', 'receitas-100/recheados', 'plano-b-trufado'],
      priority: 55,
    },
    'venda-empresas': {
      product: 'venda-empresas',
      title: 'Kits Corporativos: Venda Para Empresas',
      hook: 'Você já tem as ideias de kits. Agora leve para quem compra em quantidade: empresas e condomínios.',
      subtitle: 'Como montar, precificar e oferecer kits de fim de ano para empresas, com proposta pronta.',
      bullets: ['Modelos de kit por faixa de preço', 'Proposta comercial pronta para enviar', 'Como produzir pedidos grandes no forno de casa', 'Prazo e sinal para pedidos corporativos'],
      icon: '🏢',
      price: 19.9,
      priceFrom: 47,
      checkoutUrl: 'https://pay.wiapy.com/TROCAR-EMPRESAS',
      cta: 'Quero vender para empresas',
      attachTo: ['kits-natal', 'linha-gourmet'],
      priority: 50,
      endsAt: '2026-12-15',
    },
    // Depois do Natal o app continua vendendo: a próxima data é a Páscoa
    'pascoa-ovos': {
      product: 'pascoa-ovos',
      title: 'Páscoa Caseira: Ovos de Colher e Trufados',
      hook: 'Você já produziu no Natal. A próxima data de encomendas é a Páscoa, e a sua cozinha já está pronta.',
      subtitle: 'Ovos de colher, trufados e kits de Páscoa para continuar vendendo depois do Natal.',
      bullets: ['Ovos de colher com recheios que você já domina', 'Trufados e kits de Páscoa', 'Embalagem e precificação de Páscoa'],
      icon: '🐣',
      badge: 'PRÓXIMA TEMPORADA',
      price: 19.9,
      priceFrom: 47,
      checkoutUrl: 'https://pay.wiapy.com/TROCAR-PASCOA',
      cta: 'Quero as receitas de Páscoa',
      attachTo: ['receitas-100', 'receitas-natal-50', 'top-15-natal'],
      priority: 95,
      startsAt: '2026-12-26',
      endsAt: '2027-04-04',
    },
  },
};
