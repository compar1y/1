#!/usr/bin/env python3
"""Calcula métricas do Meta Ads a partir de um CSV exportado do Gerenciador de Anúncios.

Uso:
    python3 scripts/analisar_metricas.py dados/arquivo.csv
    python3 scripts/analisar_metricas.py dados/arquivo.csv --agrupar campanha --ordenar roas
    python3 scripts/analisar_metricas.py dados/arquivo.csv --json
    python3 scripts/analisar_metricas.py dados/arquivo.csv --agrupar dia --filtrar "Criativo A"

Reconhece colunas em português e inglês e aceita CSV separado por vírgula ou
ponto e vírgula, com decimais no formato 1234.56 ou 1.234,56. Só usa a
biblioteca padrão do Python.
"""

import argparse
import csv
import io
import json
import re
import sys
import unicodedata

# Coluna canônica -> nomes possíveis no CSV (já normalizados: minúsculas, sem
# acento, sem pontuação e sem a moeda entre parênteses).
ALIASES = {
    "campanha": ["nome da campanha", "campanha", "campaign name", "campaign"],
    "conjunto": ["nome do conjunto de anuncios", "conjunto de anuncios", "ad set name", "ad set"],
    "anuncio": ["nome do anuncio", "anuncio", "ad name", "ad"],
    "dia": ["dia", "day"],
    "gasto": ["valor usado", "valor gasto", "gasto", "amount spent", "spend"],
    "impressoes": ["impressoes", "impressions"],
    "alcance": ["alcance", "reach"],
    "cliques_link": ["cliques no link", "link clicks"],
    "cliques_todos": ["cliques todos", "clicks all"],
    "lpv": ["visualizacoes da pagina de destino", "landing page views"],
    "video_3s": [
        "reproducoes de video de 3 segundos",
        "visualizacoes de video de 3 segundos",
        "3 second video plays",
        "video plays at 3s",
    ],
    "video_plays": ["reproducoes de video", "video plays"],
    "video_p75": [
        "reproducoes do video ate 75",
        "reproducoes de video ate 75",
        "reproducoes do video em 75",
        "video plays at 75",
    ],
    "thruplay": ["thruplays", "thruplay", "reproducoes thruplay"],
    "resultados": ["resultados", "results"],
    "leads": ["leads", "cadastros"],
    "add_carrinho": ["adicoes ao carrinho", "adds to cart"],
    "checkout": [
        "finalizacoes de compra iniciadas",
        "finalizacoes da compra iniciadas",
        "checkouts initiated",
        "initiate checkout",
    ],
    "compras": ["compras", "purchases"],
    "valor_compras": [
        "valor de conversao de compras",
        "valor de conversao das compras",
        "purchases conversion value",
    ],
}

NIVEIS = ["anuncio", "conjunto", "campanha", "dia"]
SOMAVEIS = [k for k in ALIASES if k not in NIVEIS]

# (chave, rótulo, formato) na ordem em que aparecem no relatório.
METRICAS = [
    ("gasto", "Gasto", "moeda"),
    ("impressoes", "Impr.", "int"),
    ("cpm", "CPM", "moeda"),
    ("frequencia", "Freq.", "dec"),
    ("hook_rate", "Hook%", "pct"),
    ("body_rate", "Body%", "pct"),
    ("hold_rate", "Hold%", "pct"),
    ("ctr_link", "CTR link%", "pct"),
    ("ctr_todos", "CTR todos%", "pct"),
    ("cpc_link", "CPC link", "moeda"),
    ("taxa_lpv", "Connect%", "pct"),
    ("custo_lpv", "Custo LPV", "moeda"),
    ("resultados", "Result.", "int"),
    ("custo_resultado", "Custo/Res.", "moeda"),
    ("checkout", "IC", "int"),
    ("custo_ic", "Custo/IC", "moeda"),
    ("leads", "Leads", "int"),
    ("cpl", "CPL", "moeda"),
    ("taxa_resultado", "Res./LPV%", "pct"),
    ("compras", "Compras", "int"),
    ("taxa_conversao", "Conv.%", "pct"),
    ("cpa", "CPA", "moeda"),
    ("ticket_medio", "Ticket", "moeda"),
    ("valor_compras", "Receita", "moeda"),
    ("roas", "ROAS", "dec"),
]


def normalizar(texto):
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    texto = re.sub(r"\((brl|usd|eur|r\$)\)", " ", texto.lower())
    texto = re.sub(r"[^a-z0-9]+", " ", texto)
    return texto.strip()


def para_numero(valor):
    """Converte '1.234,56', '1234.56', 'R$ 10', '2,5%' ou '' em float (ou None)."""
    if valor is None:
        return None
    v = re.sub(r"[^\d,.\-]", "", str(valor))
    if not v or v in "-.,":
        return None
    if "," in v and "." in v:
        if v.rfind(",") > v.rfind("."):
            v = v.replace(".", "").replace(",", ".")
        else:
            v = v.replace(",", "")
    elif "," in v:
        v = v.replace(",", ".") if v.count(",") == 1 else v.replace(",", "")
    elif v.count(".") > 1:
        v = v.replace(".", "")
    try:
        return float(v)
    except ValueError:
        return None


def ler_csv(caminho):
    for encoding in ("utf-8-sig", "latin-1"):
        try:
            with open(caminho, encoding=encoding, newline="") as f:
                conteudo = f.read()
            break
        except UnicodeDecodeError:
            continue
    try:
        dialeto = csv.Sniffer().sniff(conteudo[:4096], delimiters=",;\t")
    except csv.Error:
        dialeto = csv.excel
    leitor = csv.DictReader(io.StringIO(conteudo), dialect=dialeto)

    mapa = {}  # coluna do CSV -> chave canônica
    for coluna in leitor.fieldnames or []:
        n = normalizar(coluna)
        for chave, nomes in ALIASES.items():
            if chave not in mapa.values() and n in nomes:
                mapa[coluna] = chave
                break

    linhas = []
    for bruta in leitor:
        linha = {}
        for coluna, chave in mapa.items():
            valor = bruta.get(coluna)
            linha[chave] = (valor or "").strip() if chave in NIVEIS else para_numero(valor)
        linhas.append(linha)
    nao_reconhecidas = [c for c in leitor.fieldnames or [] if c not in mapa]
    return linhas, set(mapa.values()), nao_reconhecidas


def razao(linhas, num, den, fator=1.0):
    """Soma num/den apenas nas linhas que têm os dois valores.

    Assim o hook rate ignora impressões de anúncios sem vídeo e o CPA ignora o
    gasto de campanhas que não registram compras.
    """
    soma_num = soma_den = 0.0
    tem = False
    for linha in linhas:
        n, d = linha.get(num), linha.get(den)
        if n is not None and d is not None:
            soma_num += n
            soma_den += d
            tem = True
    if not tem or not soma_den:
        return None
    return soma_num / soma_den * fator


def somar(linhas, chave):
    valores = [l[chave] for l in linhas if l.get(chave) is not None]
    return sum(valores) if valores else None


def calcular(linhas):
    for linha in linhas:
        linha["base_conv"] = linha.get("lpv") if linha.get("lpv") is not None else linha.get("cliques_link")
    m = {k: somar(linhas, k) for k in SOMAVEIS}
    m["_linhas"] = len(linhas)
    m["cpm"] = razao(linhas, "gasto", "impressoes", 1000)
    m["frequencia"] = razao(linhas, "impressoes", "alcance")
    m["hook_rate"] = razao(linhas, "video_3s", "impressoes", 100)
    m["body_rate"] = razao(linhas, "video_p75", "video_plays", 100)
    m["hold_rate"] = razao(linhas, "thruplay", "video_3s", 100)
    m["ctr_link"] = razao(linhas, "cliques_link", "impressoes", 100)
    m["ctr_todos"] = razao(linhas, "cliques_todos", "impressoes", 100)
    m["cpc_link"] = 1 / v if (v := razao(linhas, "cliques_link", "gasto")) else None
    m["taxa_lpv"] = razao(linhas, "lpv", "cliques_link", 100)
    m["custo_lpv"] = 1 / v if (v := razao(linhas, "lpv", "gasto")) else None
    m["custo_resultado"] = 1 / v if (v := razao(linhas, "resultados", "gasto")) else None
    m["taxa_resultado"] = razao(linhas, "resultados", "base_conv", 100)
    m["custo_ic"] = 1 / v if (v := razao(linhas, "checkout", "gasto")) else None
    m["cpl"] = 1 / v if (v := razao(linhas, "leads", "gasto")) else None
    m["taxa_conversao"] = razao(linhas, "compras", "base_conv", 100)
    m["cpa"] = 1 / v if (v := razao(linhas, "compras", "gasto")) else None
    m["ticket_medio"] = razao(linhas, "valor_compras", "compras")
    m["roas"] = razao(linhas, "valor_compras", "gasto")
    return m


def agrupar(linhas, nivel):
    grupos = {}
    for linha in linhas:
        nome = linha.get(nivel) if nivel else "Total"
        if nome:
            grupos.setdefault(nome, []).append(linha)
    return grupos


def formatar(valor, tipo):
    if valor is None:
        return "-"
    if tipo == "int":
        return f"{valor:,.0f}".replace(",", ".")
    if tipo == "moeda":
        return f"{valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{valor:.2f}".replace(".", ",")


def imprimir_tabela(resultados, colunas):
    cab = ["Nome"] + [rot for _, rot, _ in colunas]
    linhas = []
    for nome, m in resultados:
        nome = nome if len(nome) <= 40 else nome[:37] + "..."
        linhas.append([nome] + [formatar(m.get(k), tipo) for k, _, tipo in colunas])
    larguras = [max(len(str(x)) for x in col) for col in zip(cab, *linhas)]
    def linha_fmt(vals):
        return "  ".join(
            str(v).ljust(w) if i == 0 else str(v).rjust(w) for i, (v, w) in enumerate(zip(vals, larguras))
        )
    print(linha_fmt(cab))
    print("  ".join("-" * w for w in larguras))
    for i, l in enumerate(linhas):
        if i == len(linhas) - 1 and len(linhas) > 1:
            print("  ".join("-" * w for w in larguras))
        print(linha_fmt(l))


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("csv", help="arquivo CSV exportado do Gerenciador de Anúncios")
    p.add_argument("--agrupar", choices=NIVEIS, help="nível de agrupamento (padrão: o mais detalhado disponível)")
    p.add_argument("--ordenar", default="gasto", help="métrica para ordenar, decrescente (padrão: gasto)")
    p.add_argument("--filtrar", help="mantém só linhas cuja campanha, conjunto ou anúncio contém este texto")
    p.add_argument("--json", action="store_true", help="saída em JSON")
    args = p.parse_args()

    linhas, presentes, nao_reconhecidas = ler_csv(args.csv)
    if args.filtrar:
        alvo = args.filtrar.lower()
        linhas = [l for l in linhas if any(alvo in (l.get(n) or "").lower() for n in NIVEIS[:3])]
    if not linhas:
        sys.exit("CSV vazio, sem linhas de dados ou nenhuma linha corresponde ao filtro.")

    nivel = args.agrupar or next((n for n in NIVEIS[:3] if n in presentes), None)
    if nivel and nivel not in presentes:
        sys.exit(f"O CSV não tem a coluna de '{nivel}'.")

    grupos = agrupar(linhas, nivel)
    resultados = [(nome, calcular(ls)) for nome, ls in grupos.items()]
    if nivel == "dia":
        resultados.sort(key=lambda r: r[0])
    else:
        resultados.sort(key=lambda r: (r[1].get(args.ordenar) is None, -(r[1].get(args.ordenar) or 0)))

    total = calcular(linhas)

    avisos = []
    if "alcance" in presentes and (len(linhas) > 1):
        avisos.append(
            "Alcance não é somável entre linhas (há sobreposição de público); "
            "a frequência do TOTAL e de grupos com várias linhas é aproximada."
        )
    if "compras" in presentes and any(l.get("compras") is None for l in linhas):
        avisos.append(
            "Há linhas sem Compras (ex.: campanhas de leads): CPA, taxa de conversão, ticket "
            "e ROAS consideram só o gasto/tráfego das linhas com compras."
        )
    if nao_reconhecidas:
        avisos.append("Colunas ignoradas: " + ", ".join(nao_reconhecidas))

    colunas = [c for c in METRICAS if total.get(c[0]) is not None]

    if args.json:
        saida = {
            "arquivo": args.csv,
            "nivel": nivel,
            "linhas_lidas": len(linhas),
            "colunas_reconhecidas": sorted(presentes),
            "avisos": avisos,
            "itens": [
                {"nome": nome, **{k: m.get(k) for k, _, _ in colunas}, "linhas": m["_linhas"]}
                for nome, m in resultados
            ],
            "total": {k: total.get(k) for k, _, _ in colunas},
        }
        print(json.dumps(saida, ensure_ascii=False, indent=2))
        return

    print(f"Arquivo: {args.csv} | {len(linhas)} linhas | agrupado por: {nivel or 'total'}\n")
    imprimir_tabela(resultados + [("TOTAL", total)], colunas)
    if avisos:
        print()
        for a in avisos:
            print(f"Aviso: {a}")


if __name__ == "__main__":
    main()
