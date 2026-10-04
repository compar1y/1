# Analista de Meta Ads

Um agente para o Claude Code que analisa métricas do Meta Ads usando **o seu material de estudo** como referência.

## Como usar

1. **Carregue o material de estudo** em `conhecimento/`: anotações, benchmarks, regras de otimização (`.md`, `.txt`, `.pdf`, `.csv`). Veja `conhecimento/LEIAME.md`.
2. **Carregue os dados** das campanhas em `dados/`: CSV exportado do Gerenciador de Anúncios. Veja `dados/LEIAME.md`.
3. **Peça a análise** no Claude Code, por exemplo:
   - "Analise as campanhas de `dados/setembro.csv`"
   - "Quais anúncios devo pausar e quais devo escalar?"
   - "Por que meu CPA subiu? Compare `dados/agosto.csv` com `dados/setembro.csv`"
   - "Avalie meus criativos pelo hook rate e hold rate"

O Claude delega para o subagente `analista-meta-ads`, que lê o material de estudo, calcula as métricas e entrega resumo, diagnóstico do funil e recomendações priorizadas, citando a fonte de cada critério.

## Calcular as métricas manualmente

```bash
python3 scripts/analisar_metricas.py exemplos/exemplo-anuncios.csv
python3 scripts/analisar_metricas.py dados/arquivo.csv --agrupar campanha --ordenar roas
python3 scripts/analisar_metricas.py dados/arquivo.csv --json
```

Métricas calculadas: CPM, frequência, hook rate (3s/impressões), hold rate (ThruPlay/3s), CTR (link e todos), CPC (link), taxa de carregamento da página (LPV/cliques), custo por LPV, custo por resultado, CPL, taxa de conversão, CPA, ticket médio e ROAS.
