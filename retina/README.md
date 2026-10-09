# ◉ Retina

**Tracker de comportamento para páginas de vendas.** É a VTurb da sua página: em vez de "onde a pessoa parou no vídeo", mostra **em qual bloco da página ela parou de ler, onde fechou, onde ficou olhando, em que clicou e o que quem compra faz diferente de quem não compra**.

Sem dependências: um servidor Node.js com banco SQLite embutido, um script leve (~6 KB comprimido) para colar na página e um painel completo.

---

## O que ele mede

| Na página | Como aparece no painel |
|---|---|
| Quantos chegam em cada seção | **Curva de retenção por seção** (o "gráfico da VTurb" da página) |
| Onde a pessoa fecha a página | % de saídas por seção + lista das sessões que saíram ali |
| Quanto tempo fica (de verdade) | Tempo de **atenção**: só conta com a aba visível e interação nos últimos 30s |
| Onde a tela fica parada | **Heatmap de atenção** sobre a página real |
| Velocidade de rolagem | Ritmo por seção: *lendo*, *escaneando* ou *passando batido* |
| Até onde rola | Curva de profundidade de rolagem + heatmap de rolagem |
| Em que clica | **Heatmap de cliques**, ranking de elementos, **cliques mortos** (em coisas que não são botão) e **rage clicks** |
| Volta para reler | % que voltou a uma seção já vista (normalmente preço e garantia) |
| Popups | Quantos viram, quanto tempo ficaram e se clicaram |
| Copiou texto, deu play em vídeo, focou em formulário, intenção de saída, erros de JS | Aba "Cliques e eventos" |
| Origem (UTM, criativo, navegador in-app) | Comparativo de atenção, checkout, conversão e **receita por visita** por criativo |
| A visita inteira | **Replay**: a página real rolando como o lead rolou, com os cliques, popups e o ponto de saída |
| Quem está na página agora | **Ao vivo**, com a seção que cada pessoa está vendo |
| **Quem comprou** | O webhook da plataforma liga cada venda à visita. Daí sai o comparativo **compradores × não compradores** por seção |

O painel também gera **insights automáticos** ("31% não passam do Hero", "56 cliques numa imagem que não é botão", "no celular a conversão é metade do desktop"...).

---

## Rodar em 1 minuto (teste local)

Requer **Node.js 22.13+** (usa o SQLite nativo do Node, então não precisa de `npm install`).

```bash
cd retina
npm run simulate           # opcional: gera 1.500 visitas e vendas de teste (14 dias)
npm start                  # sobe o painel em http://localhost:3000
```

A senha do painel aparece no terminal na primeira execução. Para definir a sua, use `RETINA_PASSWORD=minhasenha npm start` ou crie um `.env` (veja `.env.example`).

Para ver visitantes **ao vivo** chegando, em outro terminal:

```bash
npm run simulate -- --live
```

### Com a página de demonstração (madeira)

```bash
cd pagina-madeira && npm install && npm run build   # gera pagina-madeira/dist já com o tracker
cd ../retina && npm start                            # painel em :3000 e página demo em :4000
```

Abra `http://localhost:4000/?retina_test=1&utm_source=facebook&utm_content=criativo-a`, navegue, e acompanhe em **Ao vivo** e **Sessões**.

> `?retina_test=1` só serve para testes com navegadores automatizados (que normalmente são filtrados como robô).

---

## Instalar na sua página

1. **Script**: cole no `<head>` (o painel mostra o código pronto em *Instalação*):

   ```html
   <script async src="https://SEU-RETINA.com/r.js" data-site="CHAVE_DO_SITE"></script>
   ```

2. **Nomeie as seções** (recomendado). É isso que vira a curva de retenção:

   ```html
   <section data-retina="Headline">…</section>
   <section data-retina="Depoimentos">…</section>
   <section data-retina="Oferta">…</section>
   <div data-retina="Popup de saída" data-retina-kind="popup">…</div>
   ```

   No **Elementor**: *Avançado → Atributos* → `data-retina|Depoimentos`.
   Sem marcação, o Retina usa automaticamente as `<section>`, `<header>` e `<footer>` que têm `id`.

3. **Webhook de vendas**: cole a URL que aparece em *Instalação* (`https://SEU-RETINA.com/webhook/CHAVE/TOKEN`) na sua plataforma, nos eventos de compra aprovada e reembolso.

### Como a venda é ligada ao comportamento

O tracker anexa o ID da visita (`rt_…`) nos links de checkout da página, nos parâmetros `sck`, `src`, `utm_id` e `rsid`, sem sobrescrever os que já existirem. As plataformas devolvem esses parâmetros no webhook. O Retina varre o JSON recebido procurando o ID, o valor, o status e o ID da transação, então funciona com **Hotmart, Kiwify, Wiapy, Eduzz, Braip, Ticto, Perfect Pay, Cakto, Monetizze, Greenn, Lastlink, Yampi** e qualquer outra que repasse UTMs.

- Domínio de checkout que não está na lista? Adicione no script: `data-checkout="pay.minhaplataforma.com"`.
- O checkout é aberto por JavaScript (não por link)? Use `window.Retina.decorate(url)` antes de redirecionar.
- Sem webhook? Use o pixel na página de obrigado: `<img src="https://SEU-RETINA.com/cv?site=CHAVE&sid=ID&value=97">`.

### API do script

```js
Retina.sid                         // ID da visita
Retina.track('assistiu_depoimento', { id: 3 })  // evento personalizado
Retina.conversion(97)              // marca conversão manual
Retina.decorate(urlDoCheckout)     // anexa o ID da visita a uma URL
```

Para não rastrear você mesmo: abra a página uma vez com `?retina_off` ou rode `localStorage.retina_off = '1'` no console.

---

## Colocar no ar (produção)

O Retina é **um único processo Node** e guarda tudo em um arquivo SQLite. Precisa de um disco persistente.

**Railway / Render / Fly.io** (Docker):
1. Crie o serviço apontando para a pasta `retina/` (tem `Dockerfile`).
2. Monte um volume em `/data`.
3. Defina `RETINA_PASSWORD`.
4. Use a URL HTTPS gerada no `src` do script e no webhook.

**VPS (Hostinger, Contabo, DigitalOcean...)**:
```bash
docker compose up -d       # usa docker-compose.yml (edite a senha antes)
```
ou, sem Docker: `npm start` com o `pm2`/`systemd` atrás de um Nginx/Caddy com HTTPS.

| Variável | Padrão | Para quê |
|---|---|---|
| `PORT` | `3000` | porta do painel e da coleta |
| `RETINA_PASSWORD` | gerada | senha do painel |
| `RETINA_DATA_DIR` | `./data` | onde fica o `retina.db` |
| `RETINA_TZ` | `America/Sao_Paulo` | fuso dos gráficos |
| `RETINA_RETENTION_DAYS` | `180` | histórico mantido |
| `DEMO_PORT` | `4000` | servidor da página demo (`0` desliga) |

**Escala:** SQLite em modo WAL aguenta tranquilamente dezenas de milhares de visitas por dia num servidor de R$30/mês. Para milhões de eventos por dia, o caminho é trocar o banco por ClickHouse ou Tinybird mantendo o mesmo tracker.

**Privacidade/LGPD:** não grava IP, não lê o que é digitado em campos (só registra que o campo foi focado) e não usa cookies de terceiros. O ID de visitante fica no `localStorage` da própria página. Mesmo assim, mencione a coleta de dados de navegação na sua política de privacidade.

---

## Estrutura

```
retina/
├── public/r.js            ← o tracker (o que vai na página)
├── server/
│   ├── index.js           ← HTTP: coleta, webhooks, API do painel, login, arquivos estáticos
│   ├── collect.js         ← recebe e grava os lotes do tracker
│   ├── analytics.js       ← todas as análises (retenção, heatmaps, comparativos, insights)
│   ├── webhook.js         ← webhook universal de vendas
│   ├── db.js              ← esquema SQLite
│   └── ua.js              ← dispositivo/navegador (detecta in-app de Instagram/Facebook/TikTok)
├── dashboard/             ← painel (HTML/CSS/JS puro, sem build)
├── scripts/simulate.js    ← gerador de tráfego de teste (histórico ou ao vivo)
├── test/                  ← testes (`npm test`)
├── Dockerfile, docker-compose.yml
```

### Endpoints

| | |
|---|---|
| `GET /r.js` | tracker |
| `POST /c` | coleta (lotes a cada 5s + `sendBeacon` ao sair) |
| `POST /webhook/:site/:token` | vendas |
| `GET /cv?site&sid&value&tx` | pixel de conversão |
| `GET /health` | health check |
| `/api/*` | API do painel (exige login) |
| `GET /api/export.csv` | exporta as sessões do período |
