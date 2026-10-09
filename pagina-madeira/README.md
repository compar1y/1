# +100 Projetos Lucrativos com Madeira — página de vendas

Página de vendas (React + Vite + Tailwind) já instrumentada com o **Retina** (`../retina`).

- Cada bloco tem `data-retina="Nome da seção"`. É isso que vira a curva de retenção no painel.
- Os popups de saída têm `data-retina-kind="popup"`.
- O script do Retina é injetado no build pelo plugin em `vite.config.ts`.

```bash
npm install
# aponta o tracker para o seu servidor Retina e para a chave do site
RETINA_URL=https://retina.seudominio.com RETINA_SITE=demo npm run build
# sem variáveis, usa https://1-production-ba4e.up.railway.app e o site "demo"
```

O resultado fica em `dist/`. Suba essa pasta em qualquer hospedagem estática (Vercel, Netlify, Cloudflare Pages, Hostinger...).
