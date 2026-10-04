# Dados de campanha

Coloque aqui as exportações do Gerenciador de Anúncios do Meta (formato **CSV**).

## Como exportar

1. Gerenciador de Anúncios → aba **Campanhas**, **Conjuntos de anúncios** ou **Anúncios**.
2. Escolha o período.
3. **Colunas → Personalizar colunas** e inclua, de preferência:
   - Nome da campanha / conjunto / anúncio
   - Valor usado (BRL), Impressões, Alcance, Frequência
   - Cliques no link, CTR (taxa de cliques no link), CPC (custo por clique no link), CPM
   - Visualizações da página de destino
   - Reproduções de vídeo de 3 segundos, Reproduções de vídeo, Reproduções do vídeo até 75%, ThruPlays (para criativos em vídeo)
   - Resultados, Custo por resultado, Finalizações de compra iniciadas
   - Compras, Valor de conversão de compras, ROAS de resultados de compras
4. Para checar critérios de teste (ex.: "3 vendas em 2 dias"), use **Detalhamento → Por tempo → Dia**.
5. **Relatórios → Exportar dados da tabela → .csv**.
6. Salve o arquivo nesta pasta (ex.: `dados/2026-09-campanhas.csv`).

O script `scripts/analisar_metricas.py` reconhece os nomes de coluna em português e em inglês. Colunas que faltarem simplesmente não geram a métrica correspondente.
