# Aula: Facebook Ads 2026 — métricas, teste de criativos e escala

Fonte: transcrição de aula em vídeo (conteúdo de mentoria) carregada pelo usuário em 2026-10-04.
Abreviações: **IC** = Initiate Checkout (finalização de compra iniciada); **BM** = Business Manager; estrutura **1-X-1** = 1 campanha, X conjuntos de anúncios, 1 anúncio por conjunto.

---

## 1. Hierarquia das métricas

**Principais** (são as que decidem):
1. **Custo por IC** — custo por finalização de compra iniciada.
2. **CPC** — custo por clique no link.
3. **CPA** — custo por conversão (compra) no gerenciador.

**Importante, à parte:** **Connect rate** (carregamento da página).

**Secundárias** (diagnóstico, não decidem sozinhas): hook rate, body rate, CPM, CTR.

> Regra do material: métricas secundárias abaixo da referência **não são motivo para pausar** um criativo. Ex.: hook rate abaixo de 55% **não** significa pausar.

## 2. Fórmulas e referências

| Métrica | Fórmula (métrica personalizada no Gerenciador) | Referência do material |
|---|---|---|
| **Hook rate** | Reproduções de vídeo de no mínimo 3 s ÷ Impressões | **Bom: > 55%**. Abaixo disso o gancho é fraco, mas **não é motivo para pausar**. Mede os primeiros 3–5 s do criativo (o que chama atenção). |
| **Body rate** | Reproduções do vídeo até 75% ÷ Reproduções de vídeo | **Bom: > 5%**, para criativos "normais" (até ~3 min). Criativos longos (10–20 min) nunca chegam a 5% — **não aplicar** a referência a eles. Mede o meio do anúncio. |
| **Connect rate** | Visualizações da página de destino ÷ Cliques no link | **> 85%: ok · 90–95%: ótimo · < 85%: perigoso** (investigar a página/carregamento). "Extremamente importante". |
| **CPC** | Valor usado ÷ Cliques no link | **Depende do nicho.** Ex.: emagrecimento, mercado americano: CPC de R$ 12–13 ainda é ok/bom. |
| **Custo por IC** | Valor usado ÷ Finalizações de compra iniciadas | **Depende do nicho.** Ex.: emagrecimento: bom entre **R$ 190 e R$ 200**. |
| **CPA** | Valor usado ÷ Compras | Métrica principal; referência depende da comissão/ticket (ver seção 3). |
| **CPM** | Valor usado ÷ Impressões × 1000 | **Depende da segmentação.** Sobe com: nicho concorrido, público de interesse, criativo muito parecido com o de concorrentes (modelado). |
| **CTR (link)** | Cliques no link ÷ Impressões | **Bom: > 4%**, mas é secundária: criativos já escalaram com CTR de 1–2%. |

## 3. Teste de criativos

Critério de validação em **todas** as etapas: **3 vendas no intervalo de 2 dias** (tanto faz a distribuição: 1+2, 3+0 etc.). Quem não bate isso não avança.

Dica de caixa: com pouco caixa, concentre os testes **no fim de semana** (são os dias que mais vendem).

### Método A — ABO "método baiano" (orçamento no conjunto)
- Indicado para **nutracêutico** / tickets maiores.
- Estrutura de teste: **ABO 1-50-1**, orçamento **mínimo** por conjunto (~US$ 1,50; no Brasil ~R$ 6–7).
- **Nunca aumentar o orçamento dos conjuntos** no ABO — em nenhuma etapa.
- Operacional: subir primeiro em 1-1-1, esperar a aprovação e só então duplicar o conjunto aprovado até chegar ao 1-50-1.

### Método B — CBO tradicional (orçamento na campanha)
- Estrutura de teste: **CBO 1-1-1**, **1 campanha por criativo**.
- Orçamento diário por campanha: **1/3 da comissão**. Ex.: comissão US$ 47 → 47 ÷ 3 ≈ **15/dia**.
- Duração: **2 dias**.

Exemplo: criativo A (3 vendas) e criativo B (2 vendas) → **só A** segue para o teste de estrutura.

## 4. Teste de estrutura (com o criativo que validou)

- **ABO:** duplicar o 1-50-1 vencedor para **1-10-1** (na transcrição aparece "1,101"), com o orçamento mínimo por conjunto (US$ 1–1,50 / R$ 6–7). **Não duplicar** estruturas (apenas 1 campanha ABO).
- **CBO:** testar 3 estruturas com orçamento = **valor cheio da comissão** (ex.: 47): **1-1-1, 1-3-1 e 1-5-1**.
- Critério: de novo **3 vendas em 2 dias**. Ex.: 1-1-1 = 2 vendas (sai), 1-3-1 = 3 e 1-5-1 = 3 (as duas avançam).

## 5. Escala

- Sempre com **otimização diária** (aumentos de orçamento feitos no dia).
- **ABO:** após as 3 vendas, ir para **1-25-1**, sem mexer no orçamento dos conjuntos, e **duplicar 6 vezes** (6 campanhas para o dia seguinte).
- **CBO:** **duplicar 6 vezes** cada estrutura campeã, com orçamento de **no mínimo 3× a comissão** por campanha. Ex.: 47 × 3 = **141**; duas estruturas campeãs → 6 campanhas de 141 para cada uma.

## 6. ABO ou CBO?

Não existe método melhor universal: o ideal é um **ecossistema de campanhas** (ABO e CBO na mesma conta), testando os dois e vendo qual funciona para a oferta/nicho.

## Lacunas deste material

- Regras de otimização (quando aumentar, reduzir ou pausar) foram prometidas para uma "parte 2" e **não estão aqui**.
- Não há referências numéricas de CPM nem de CPA absoluto; dependem de nicho e comissão.

## Informações que o agente deve pedir ao usuário

- **Comissão** (ou ticket/margem) por venda → necessária para orçamentos de teste (1/3), estrutura (1×) e escala (3×), e para julgar o CPA.
- **Nicho e mercado** (BR, EUA…) → contextualiza CPC, custo por IC e CPM.
- **Exportação com detalhamento por dia** (coluna "Dia") → necessária para checar "3 vendas em 2 dias".
