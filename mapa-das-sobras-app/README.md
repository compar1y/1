# Mapa das Sobras · App da compradora

Web app (PWA instalável no celular) para quem comprou o **Mapa das Sobras**
(https://tapetesdesobras.vercel.app/). Ele entrega valor real (a cliente cadastra
as sobras e vê quais tapetes cabem nelas) e usa os momentos de uso para vender
mais produtos dentro do app (**LTV**).

## Como funciona

| Aba | O que faz | Onde vende |
|---|---|---|
| **Início** | Resumo (gramas de sobras, modelos que cabem, modelos feitos), atalhos | Banner do upgrade com cronômetro de boas-vindas; "próxima oferta" escolhida pelo momento da cliente (Natal na temporada, guia de venda depois do 1º tapete, etc.) |
| **Sobras** | Cadastro por cor, peso e espessura do barbante | Tabela de Fios (quando ela mistura espessuras) |
| **Modelos** | Compara as sobras com cada modelo, cor por cor, igual à página de vendas (✅ cabe / ⚠️ quase / ❌ não cabe) | Mapa de Resgate (quando falta barbante), Adaptação de Medidas ("quer maior ou menor?") |
| **Terminei este tapete** | Desconta o barbante usado das sobras e comemora | Calculadora de preço gratuita → guia "Venda Seus Tapetes" |
| **Materiais** | Downloads dos PDFs comprados | Bônus bloqueados levam ao upgrade |
| **Ateliê** | Loja com todos os produtos extras | Upgrade, coleções, clube mensal (recorrência), combo |

- **Oferta de boas-vindas**: aparece uma única vez após o primeiro acesso,
  com prazo real de 15 minutos (o cronômetro não reinicia).
- **Checkout pré-preenchido**: os links levam `email` e `name` da cliente,
  as UTMs da primeira visita e `utm_source=app&utm_medium=upsell&utm_content=<posição>`,
  para você saber qual ponto do app vende mais.
- **Meta Pixel** (opcional): `ViewContent` ao abrir uma oferta, `InitiateCheckout`
  ao clicar em comprar, `Lead` no cadastro.

## Antes de publicar (obrigatório)

1. **`src/config/offer.ts`**: preencha `checkoutUrl` e `pdfUrl` de cada produto,
   o `supportEmail` e revise nomes e preços. Os produtos `upsell` (Kit upgrade,
   Banheiro e Cozinha, Natal, Venda Seus Tapetes, Clube, Combo) são **sugestões**:
   crie-os na sua plataforma ou remova os que não vai vender. Produto sem
   `checkoutUrl` aparece como "Disponível em breve".
2. **`src/data/models.ts`**: hoje há **12 modelos de exemplo** (os modelos 23 e 41
   reproduzem os exemplos da página de vendas). Troque pelos 100 modelos reais do PDF:
   peso por cor, medidas, fio, agulha, etapas e página do PDF.
3. **Pixel**: copie `.env.example` para `.env` e preencha `VITE_META_PIXEL_ID`.

## Liberação de acesso

Não há backend: o acesso é liberado pela URL, que você configura como página de
obrigado / link de acesso no e-mail de cada produto:

```
https://SEU-APP/?plano=basico&email={email}&nome={nome}
https://SEU-APP/?plano=completo&email={email}&nome={nome}
https://SEU-APP/?liberar=pack-natal            (um ou mais ids, separados por vírgula)
```

O acesso fica salvo no aparelho (localStorage). Esse modelo é simples, mas não
protege o conteúdo: quem conhecer a URL libera os bônus, e a cliente precisa abrir
o link de novo se trocar de aparelho. Para proteger de verdade, o próximo passo é
um backend pequeno que receba o webhook da plataforma de pagamento e libere por e-mail.

## Rodar e publicar

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # gera dist/
```

Na Vercel: importe o repositório e defina **Root Directory = `mapa-das-sobras-app`**
(framework Vite detectado automaticamente).
