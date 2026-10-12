# Retina + página de madeira + área de membros

- **[`retina/`](retina/)**: o Retina, um tracker de comportamento para páginas de vendas (retenção por seção, heatmaps, replay, ao vivo, compradores × não compradores, webhook de vendas). Veja o [README](retina/README.md).
- **[`pagina-madeira/`](pagina-madeira/)**: a página de vendas "+100 Projetos Lucrativos com Madeira", já instrumentada com o Retina.
- **[`area-membros/`](area-membros/)**: o funil de back-end da Fábrica de Panetones Caseiros. É a área de membros (web app instalável) com as receitas e os bônus, o cadeado nos bônus para quem comprou o Kit Essencial, ofertas pagas anexadas a cada conteúdo e o painel de LTV. Veja o [README](area-membros/README.md).

Teste rápido:

```bash
cd retina
npm run simulate   # dados de teste
npm start          # http://localhost:3000 (a senha aparece no terminal)
```
