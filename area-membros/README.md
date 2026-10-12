# Área de membros com ofertas contextuais (back-end de LTV)

Web app (instalável no celular) onde o comprador do **+100 Projetos com Madeira** acessa os entregáveis e encontra
**ofertas pagas presas ao conteúdo que ele já comprou**:

> *Você já tem seus 100 projetos. Agora veja os 15 mais rápidos de fazer e mais procurados para presentear no Natal.*

## O que tem

| | |
|---|---|
| **Login sem senha** | A pessoa digita o e-mail da compra e recebe um link de acesso (válido por 1h, uso único). Na primeira compra, o e-mail de boas-vindas já leva o link. A sessão dura 90 dias. |
| **Meus conteúdos** | Os 100 projetos divididos nas 5 coleções e os bônus. Leitor de PDF dentro do app (funciona em celular antigo, abre por partes), download, "continue de onde parou" e "marcar como feito". |
| **Bônus com cadeado** | Quem comprou só o Básico vê os 6 bônus bloqueados. Tocar em um deles abre o upgrade para o Completo. |
| **Oferta anexada ao entregável** | Cada conteúdo pode ter ofertas ligadas a ele. Aparece **uma por tela**, em três momentos: no card do conteúdo, ao **terminar a leitura** e ao **baixar** o PDF. |
| **Escada de LTV** | O que a pessoa compra no app vira um entregável novo, que pode ter as próprias ofertas anexadas (ex.: Natal → Pack de Divulgação → Peças Premium). |
| **Início e vitrine** | "Para você" na home (até 3 ofertas) e a aba "Mais conteúdos" com tudo o que a pessoa ainda não tem. |
| **Liberação automática** | O webhook da Wiapy libera o conteúdo na hora. Se a pessoa estiver com o app aberto, aparece "🎉 Novo conteúdo liberado". Reembolso ou chargeback revoga o acesso. |
| **Painel `/admin`** | LTV médio, receita de front-end × back-end por dia, **LTV por porta de entrada** (Básico × Completo), e para cada oferta e posição: quantos viram, clicaram, compraram, take rate e receita. Também busca de clientes, liberação manual, link de acesso para mandar pelo WhatsApp e log dos webhooks. |

## Rodar no computador

Requer **Node.js 22.13+**.

```bash
cd area-membros
npm install
npm run simulate        # opcional: 30 dias de dados de teste + links para entrar como cliente
npm run dev             # app em http://localhost:5173  •  servidor em :3100
```

- O terminal mostra a **senha do painel** (`/admin`) e a **URL do webhook**.
- Sem e-mail configurado, o link de acesso aparece no terminal e na própria tela de login ("Modo de teste: entrar agora").

**Ver o fluxo completo** (entrar → oferta → comprar → conteúdo liberado):

1. Entre com o link "Pacote Básico" que o `npm run simulate` mostrou.
2. Toque num bônus com cadeado e depois em **Destravar os bônus**. Com o checkout provisório do catálogo, o app mostra "abre em breve". O clique fica registrado.
3. Simule a compra que a Wiapy confirmaria:
   ```bash
   npm run simulate -- --compra basico@teste.com upgrade-completo
   ```
4. Volte para o app: os bônus aparecem liberados, e no painel a venda aparece atribuída à oferta e à posição em que a pessoa clicou.

Outros comandos: `npm test` (motor de ofertas, webhook e o fluxo inteiro pela API), `npm run lint` (TypeScript), `npm run build` e `npm start` (como em produção, tudo na porta 3100).

## Trocar de produto

Nome, cores, textos, imagem do login e o catálogo inteiro vivem no `catalog.js`. O código do app não tem nada preso a um produto.

- `settings.appName`, `shortName`, `supportEmail`
- `settings.brand.colors`: cores do app e do e-mail. `brand.loginImage`: imagem da tela de login (coloque o arquivo em `web/public/assets/`).
- `settings.texts`: frases que dependem do produto ("O que vamos fazer hoje?", "Bônus do Pacote Completo"...). O que não for definido usa um texto neutro.
- Num entregável do tipo `library`, `itemsTitle` e `itemLabel` dão nome às partes (ex.: "Módulos" / "Módulo 01").
- Ícone do app: o servidor gera um ícone com as cores da marca. Para usar o seu, coloque `icon.svg`, `icon-192.png` e `icon-512.png` em `web/public/`.

## Cadastrar uma oferta nova

Tudo fica no **`catalog.js`**. Para uma oferta nova, você mexe em três blocos:

```js
// 1. O produto (o que se compra na Wiapy) e o que ele libera
products: {
  'kit-dia-das-maes': {
    name: 'Kit Dia das Mães', price: 19.9,
    grants: ['kit-dia-das-maes'],
    match: ['CODIGO_DO_CHECKOUT_NA_WIAPY'],   // é assim que o webhook reconhece a compra
  },
},

// 2. O entregável (o que aparece em "Meus conteúdos" depois da compra)
deliverables: {
  'kit-dia-das-maes': { type: 'pdf', title: 'Kit Dia das Mães', icon: '💐', file: 'kit-dia-das-maes.pdf' },
},

// 3. A oferta (como ele é vendido dentro do app)
offers: {
  'kit-dia-das-maes': {
    product: 'kit-dia-das-maes',
    title: 'Kit Dia das Mães',
    hook: 'Você já tem a coleção Ateliê. Agora veja as peças que mais saem como presente no Dia das Mães.',
    bullets: ['10 projetos de presente', 'Embalagens', 'Calendário de produção'],
    price: 19.9, priceFrom: 47,
    checkoutUrl: 'https://pay.wiapy.com/XXXX',
    attachTo: ['projetos-100/atelie', 'acabamento'],   // onde ela aparece
    priority: 70,
    startsAt: '2027-04-01', endsAt: '2027-05-09',      // opcional: campanha sazonal
  },
},
```

Depois, coloque o PDF em `content/` e reinicie o servidor. Se algo estiver errado (um entregável que não existe, uma data fora do formato), o servidor avisa ao subir e o painel lista as pendências.

### Regras do motor de ofertas

- **Nunca mostra o que a pessoa já tem.** Isso vale tanto para o produto quanto para quando ela já tem todos os entregáveis que ele libera.
- **Uma oferta por conteúdo**: a de maior `priority`. Quando há empate, a escolhida gira por cliente e por dia (fica estável durante o dia e muda no outro).
- **`attachTo`** aceita um entregável (`'precificacao'`) ou uma parte dele (`'projetos-100/jardim'`). Uma parte sem oferta própria usa a do entregável.
- **`audience`** (opcional): `requires` = precisa ter **pelo menos um** desses produtos; `excludes` = não pode ter **nenhum**. O upgrade usa `requires: ['basico'], excludes: ['completo']`.
- **`placements`** (opcional) limita onde a oferta aparece: `inline` (no conteúdo), `end` (fim da leitura e download), `home`, `store` (vitrine) e `locked` (bônus bloqueado). Sem esse campo, a oferta aparece em todos.
- **`startsAt` / `endsAt`** usam o horário de São Paulo. Faltando 21 dias ou menos para o fim, o card mostra "Termina em X dias".
- **`hook`** aceita `{nome}`, que vira o primeiro nome do cliente.

### Como a venda é atribuída à oferta

O botão da oferta passa por `/go/<oferta>`, que registra o clique e redireciona para o checkout com:

- `utm_source=area-membros`, `utm_medium=<posição>`, `utm_campaign=<oferta>`, `utm_content=<oferta>_<posição>`
- `src` e `sck` com o id do clique (`am_…`)
- o e-mail e o nome do cliente (`settings.checkoutParams`: **confirme na Wiapy o nome do parâmetro que pré-preenche o e-mail**)

Quando a Wiapy devolve o `src`/`sck` no webhook, a venda é ligada ao clique exato. Se não devolver, a venda é atribuída ao último clique do cliente numa oferta daquele produto nos últimos 14 dias.

## Colocar no ar

1. **Wiapy**:
   - Troque os `TROCAR_*` do `catalog.js` pelos códigos de checkout e pelos links reais.
   - Cadastre a URL do webhook (aparece no painel, aba *Webhooks*) para os eventos de **compra aprovada, reembolso e chargeback**.
   - Na página de obrigado de cada produto do back-end, redirecione para `https://SEU-APP/?comprou=1`. Assim o app fica conferindo até o conteúdo ser liberado.
2. **E-mail**: crie uma conta na [Resend](https://resend.com), verifique seu domínio e defina `RESEND_API_KEY` e `EMAIL_FROM`.
3. **Servidor** (Railway/Render/Fly com Docker): crie um serviço apontando para a pasta `area-membros/` (ela tem `Dockerfile`), monte um volume em `/data`, defina `PUBLIC_URL`, `ADMIN_PASSWORD`, `WEBHOOK_TOKEN` e as variáveis de e-mail. Coloque os PDFs em `/data/content`.
4. **Retina** (opcional): defina `RETINA_WEBHOOK_URL` com a URL de webhook do Retina. Cada venda que chega aqui é repassada para lá, então você cadastra **uma URL só** na Wiapy.

Variáveis: veja `.env.example`.

## Estrutura

```
area-membros/
├── catalog.js            ← produtos, entregáveis e ofertas (o único arquivo que você edita no dia a dia)
├── content/              ← PDFs (fora do Git)
├── server/
│   ├── index.js          ← HTTP: login, biblioteca, PDFs, /go, webhook, painel, arquivos do app
│   ├── offers.js         ← motor de ofertas (funções puras, testadas)
│   ├── webhook.js        ← leitura universal do webhook de vendas
│   ├── store.js          ← clientes, compras (com atribuição), progresso, eventos
│   ├── admin.js          ← métricas do painel
│   ├── email.js, pdf.js, db.js
├── web/                  ← app (React + Tailwind, mesma identidade da página de vendas)
├── scripts/simulate.js   ← dados de teste e compra simulada
└── test/                 ← npm test
```

Servidor sem dependências (Node + SQLite nativo, como o Retina). O `npm install` serve só para compilar o app.

## Copy das ofertas

As ofertas de exemplo vendem **resultado de produção e de venda** ("os mais rápidos de fazer", "os mais procurados para presentear"), sem prometer valor em reais. É a mesma linha do aviso de resultados da página de vendas, e reduz reembolso e problema com a plataforma de pagamento.
