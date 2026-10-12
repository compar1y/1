// Identidade e textos do app, lidos de catalog.settings (com padrões neutros).
// Trocar de produto = trocar o catalog.js; nada de nome, cor ou texto fica preso no código.

const DEFAULT_COLORS = {
  primary: '#C86A1B',      // botões e destaques
  primaryDark: '#9E4E0D',  // sombra do botão e textos de destaque
  dark: '#3F2A1E',         // barra do leitor, textos secundários
  mid: '#6F4528',          // gradiente das capas sem imagem
  bg: '#F5F0E7',           // fundo
  paper: '#FAF7F2',        // blocos claros
  line: '#E8DDD0',         // bordas
  ink: '#171512',          // títulos
  success: '#008A5B',      // concluído, confirmações
};

const DEFAULT_TEXTS = {
  homeSubtitle: 'Bom te ver por aqui.',
  lockedSection: 'Você ainda não tem',
  lockedHint: 'Toque em um deles para ver como liberar.',
  lockedIntro: '🔒 "{titulo}" ainda não está liberado na sua conta',
  lockedNotice: 'Este material ainda não está liberado na sua conta.',
  storeIntro: 'Materiais para ir além. Depois da compra, eles aparecem aqui no app automaticamente.',
  installHint: 'Fica com um ícone na tela inicial e abre direto nos seus conteúdos, sem precisar procurar o e-mail.',
  welcomeEmail: 'Seu acesso está liberado. Toque no botão abaixo para entrar.',
  loginSubtitle: 'Entre com o mesmo e-mail que você usou na compra. Enviamos um link de acesso, sem senha.',
  itemsTitle: 'Conteúdo',
  itemLabel: 'Parte',
};

export function brand(cat) {
  const s = cat.settings || {};
  return {
    appName: s.appName || 'Área de membros',
    shortName: s.shortName || s.appName || 'Membros',
    supportEmail: s.supportEmail || null,
    loginImage: s.brand?.loginImage || null,
    loginIcon: s.brand?.loginIcon || null,
    icon: s.brand?.icon || '/icon.svg',
    colors: { ...DEFAULT_COLORS, ...(s.brand?.colors || {}) },
    texts: { ...DEFAULT_TEXTS, ...(s.texts || {}) },
  };
}

export function manifest(cat) {
  const b = brand(cat);
  return {
    name: `${b.appName} • Área de Membros`,
    short_name: b.shortName,
    start_url: '/', scope: '/', display: 'standalone', lang: 'pt-BR',
    background_color: b.colors.bg, theme_color: b.colors.dark,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}

/** Ícone padrão (livro aberto) nas cores da marca, para quando não há ícone próprio em web/public. */
export function iconSvg(cat) {
  const c = brand(cat).colors;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${c.dark}"/>`
    + `<path d="M256 168c-40-28-92-36-136-32v208c44-4 96 4 136 32 40-28 92-36 136-32V136c-44-4-96 4-136 32z" fill="none" stroke="${c.bg}" stroke-width="24" stroke-linejoin="round"/>`
    + `<path d="M256 168v208" stroke="${c.primary}" stroke-width="24" stroke-linecap="round"/></svg>`;
}
