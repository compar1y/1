# Projeto: Agente de análise de métricas do Meta Ads

Este repositório é um assistente de análise de campanhas do Meta Ads. Responda em português do Brasil.

- Pedidos de análise de campanhas, métricas, criativos ou otimização → use o subagente `analista-meta-ads` (`.claude/agents/analista-meta-ads.md`).
- `conhecimento/` — material de estudo do usuário. É a **base teórica obrigatória** das análises: critérios e benchmarks vêm daqui, sempre citando o arquivo.
- `dados/` — exportações CSV do Gerenciador de Anúncios.
- `scripts/analisar_metricas.py` — calcula as métricas derivadas (CPM, CTR, CPC, hook/hold rate, CPA, ROAS etc.). Só usa a biblioteca padrão do Python.
- `exemplos/` — CSV fictício para testar o fluxo.
- `relatorios/` — onde os relatórios salvos devem ficar.

Nunca invente números ou benchmarks; quando usar uma referência que não está em `conhecimento/`, deixe isso explícito.
