export interface BonusItem {
  id: string;
  number: string;
  name: string;
  image: string;
  imageFallback?: string;
  description: string;
  originalPrice: string;
  badge: string;
}

export interface FAQItemData {
  question: string;
  answer: string;
}

export const offerConfig = {
  name: "+100 Projetos Lucrativos com Madeira",
  
  // Controle de Urgência / Promoção
  urgency: {
    active: true, // Se falso, oculta a barra superior de urgência
    text: "CONDIÇÃO ESPECIAL DE LANÇAMENTO LIBERADA POR TEMPO LIMITADO",
    date: null as string | null // Preencha com uma data real caso haja encerramento datado (ex: "25/09/2026")
  },

  assets: {
    hero: "/assets/hero/basic-mockup.webp",
    heroFallback: "/assets/hero/hero-mockup.png",
    basic: "/assets/hero/basic-mockup.webp",
    basicFallback: "https://i.postimg.cc/KvbF0hFw/Chat-GPT-Image-22-de-set-de-2026-08-38-08-(1).webp",
    marcelo: "/assets/about/marcelo-nunes.webp",
    marceloFallback: "https://i.postimg.cc/V6QRQRKt/Chat-GPT-Image-22-de-set-de-2026-07-59-22.webp",
    projects: [
      "/assets/projects/project-1.webp",
      "/assets/projects/project-2.webp",
      "/assets/projects/project-3.webp",
      "/assets/projects/project-4.webp",
      "/assets/projects/project-5.webp",
      "/assets/projects/project-6.webp",
      "/assets/projects/project-7.webp",
      "/assets/projects/project-8.webp",
      "/assets/projects/project-9.webp",
      "/assets/projects/project-10.webp"
    ],
    projectFallbacks: [
      "https://i.postimg.cc/bvdhgDwf/Design-sem-nome-(1).webp",
      "https://i.postimg.cc/k52080Tc/Design-sem-nome-(1)-(1).webp",
      "https://i.postimg.cc/25WHCrHv/Design-sem-nome-(2).webp",
      "https://i.postimg.cc/MZ9Y2nWN/Design-sem-nome-(3).webp",
      "https://i.postimg.cc/900ZFBmH/Design-sem-nome-(4).webp",
      "https://i.postimg.cc/CLfnP5dj/Design-sem-nome-(5).webp",
      "https://i.postimg.cc/yY9XJvhC/Design-sem-nome-(6).webp",
      "https://i.postimg.cc/nLwQSDYx/Design-sem-nome-(7).webp",
      "https://i.postimg.cc/d0XLjKv4/Design-sem-nome-(8).webp",
      "https://i.postimg.cc/KzSmYcmX/Design-sem-nome-(10).webp"
    ]
  },

  bonuses: [
    {
      id: "bonus-1",
      number: "Bônus #01",
      name: "Lista de Fornecedores",
      image: "/assets/bonuses/bonus-1.webp",
      imageFallback: "https://i.postimg.cc/J4GJJKb0/Chat-GPT-Image-21-de-set-de-2026-13-20-13.webp",
      description: "Um guia prático para localizar onde encontrar madeira, ferragens, acessórios e materiais com melhor custo-benefício.",
      originalPrice: "R$27",
      badge: "INCLUSO NO COMPLETO"
    },
    {
      id: "bonus-2",
      number: "Bônus #02",
      name: "Guia de Madeiras e Espessuras",
      image: "/assets/bonuses/bonus-2.webp",
      imageFallback: "https://i.postimg.cc/bvj27h4b/Chat-GPT-Image-21-de-set-de-2026-13-21-09.webp",
      description: "Entenda os tipos de madeira mais usados, espessuras recomendadas e possíveis substituições para cada tipo de peça.",
      originalPrice: "R$37",
      badge: "INCLUSO NO COMPLETO"
    },
    {
      id: "bonus-3",
      number: "Bônus #03",
      name: "Guia de Precificação",
      image: "/assets/bonuses/bonus-3.webp",
      imageFallback: "https://i.postimg.cc/bvj27h4b/Chat-GPT-Image-21-de-set-de-2026-13-21-09.webp",
      description: "Aprenda a calcular materiais, tempo e custos operacionais para chegar a uma referência de preço justa e lucrativa sem chutar.",
      originalPrice: "R$47",
      badge: "INCLUSO NO COMPLETO"
    },
    {
      id: "bonus-4",
      number: "Bônus #04",
      name: "Lista de Materiais e Ferragens",
      image: "/assets/bonuses/bonus-4.webp",
      imageFallback: "https://i.postimg.cc/NMCFjqCm/Chat-GPT-Image-21-de-set-de-2026-13-24-29.webp",
      description: "Material de consulta organizado com os principais consumíveis, dobradiças, parafusos e ferragens aplicados nos projetos.",
      originalPrice: "R$29,90",
      badge: "INCLUSO NO COMPLETO"
    },
    {
      id: "bonus-5",
      number: "Bônus #05",
      name: "Guia de Acabamento de Peças",
      image: "/assets/bonuses/bonus-5.webp",
      imageFallback: "https://i.postimg.cc/mZcC1834/Chat-GPT-Image-21-de-set-de-2026-13-26-06.webp",
      description: "Orientações práticas sobre lixamento, selamento, óleos e acabamentos para valorizar a apresentação visual das suas peças.",
      originalPrice: "R$35,90",
      badge: "INCLUSO NO COMPLETO"
    },
    {
      id: "bonus-6",
      number: "Bônus #06",
      name: "Kit Primeiras Vendas",
      image: "/assets/bonuses/bonus-6.webp",
      imageFallback: "https://i.postimg.cc/L5zsBY6Q/Chat-GPT-Image-21-de-set-de-2026-13-28-25.webp",
      description: "Recurso introdutório com dicas simples para fotografar, divulgar e oferecer suas primeiras peças para amigos, vizinhos e redes sociais.",
      originalPrice: "R$47",
      badge: "INCLUSO NO COMPLETO"
    }
  ] as BonusItem[],

  prices: {
    basic: "R$10,00",
    basicOriginal: "R$47,00",
    complete: "R$27,90",
    completeOriginal: "R$97,00",
    completeSavings: "ECONOMIA IMEDIATA",
    exit1: "R$22,90",
    exit1Original: "R$27,90",
    exit2: "R$17,90",
    exit2Original: "R$27,90"
  },

  checkout: {
    basic: "https://pay.wiapy.com/eiu2dIDEi_2N",
    complete: "https://pay.wiapy.com/VIB5O5IAEWDa",
    exit1: "https://pay.wiapy.com/YQ2RhCk7O0Pd",
    exit2: "https://pay.wiapy.com/gPeRvaElgMwB"
  },

  exit2: {
    url: "https://pay.wiapy.com/gPeRvaElgMwB",
    price: "R$17,90",
    headline: "Leve o Pacote Completo por Apenas R$17,90",
    description: "Para você não ficar sem os 6 bônus exclusivos, liberamos uma condição especial de checkout: leve o pacote completo por R$17,90."
  },

  faqs: [
    {
      question: "1. Como recebo acesso aos projetos?",
      answer: "Assim que o pagamento for confirmado pela plataforma de pagamento, você receberá instantaneamente um e-mail com os dados de acesso para visualizar e baixar todos os arquivos em formato digital (PDF)."
    },
    {
      question: "2. Os projetos vêm com medidas?",
      answer: "Sim. Todos os projetos foram elaborados com cotas e medidas em milímetros/centímetros, lista de peças e instruções visuais para orientar cada etapa da montagem."
    },
    {
      question: "3. Preciso ter experiência prévia com marcenaria?",
      answer: "Não. A biblioteca reúne projetos de nível fácil a intermediário. Você pode começar pelas peças simples de montagem rápida e evoluir conforme ganha prática."
    },
    {
      question: "4. Preciso ter ferramentas profissionais e caras?",
      answer: "Não. A maioria dos projetos utiliza ferramentas manuais e elétricas comuns (como serrote/serra tico-tico, parafusadeira/furadeira, lixas e trena). Cada ficha indica exatamente o que é necessário antes de iniciar."
    },
    {
      question: "5. Os materiais físicos (madeira, parafusos) estão incluídos?",
      answer: "Não. Este é um produto 100% digital composto por arquivos PDF, guias e fichas técnicas. As madeiras e ferragens físicas devem ser adquiridas separadamente."
    },
    {
      question: "6. Posso baixar e imprimir os projetos?",
      answer: "Sim. Todos os arquivos estão em formato PDF de alta resolução, prontos para você visualizar no celular, tablet, computador ou imprimir para levar até sua bancada de trabalho."
    },
    {
      question: "7. O Pacote Básico inclui os bônus?",
      answer: "Não. O Pacote Básico (R$10,00) contém os 100 projetos em PDF com medidas e passos. Os 6 bônus exclusivos (Guias de Precificação, Madeiras, Fornecedores, etc.) fazem parte exclusivamente do Pacote Completo (R$27,90)."
    },
    {
      question: "8. Posso produzir as peças para vender?",
      answer: "Sim. Você tem total liberdade para construir as peças físicas e comercializá-las para clientes, amigos ou pela internet. Os projetos servem como referência técnica de produção."
    },
    {
      question: "9. Existe garantia de lucro ou renda?",
      answer: "Não. Não existe garantia de ganhos financeiros ou resultados automáticos. O sucesso na venda depende exclusivamente da sua execução, capricho no acabamento, precificação correta e divulgação local."
    },
    {
      question: "10. Como funciona a garantia de 180 dias e reembolso?",
      answer: "Você conta com uma garantia incondicional de 180 dias (6 meses inteiros). Se durante esse período você analisar os projetos e achar que o material não facilitou o seu trabalho ou não atendeu às suas expectativas, basta solicitar o cancelamento pela plataforma para receber 100% do seu dinheiro de volta, sem burocracias."
    }
  ] as FAQItemData[],

  footer: {
    brand: "+100 Projetos Lucrativos com Madeira",
    supportEmail: "suporte@projetoscommadeira.com",
    copyright: "© 2026 +100 Projetos Lucrativos com Madeira. Todos os direitos reservados.",
    disclaimer: "Aviso: Os resultados práticos e eventuais vendas de peças físicas dependem exclusivamente do esforço individual, habilidade manual, ferramentas disponíveis e condições de mercado de cada pessoa. Não prometemos ganhos financeiros garantidos."
  }
};

