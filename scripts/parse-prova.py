#!/usr/bin/env python3
"""Converte o texto de uma prova (pdftotext -enc UTF-8) + gabarito oficial em JSON de importação do Ascend.

Uso:
  python -X utf8 scripts/parse-prova.py --config provas/config.json

Saída: provas/json/<slug>.json, no formato aceito em Questões → Banco de questões → Importar.
Uso pessoal: as provas ficam em provas/ (fora do git) e são importadas só na sua conta.
"""
import argparse
import json
import re
import sys
from pathlib import Path

# Linhas de cabeçalho/rodapé que o PDF repete em cada página
NOISE = [
    r"^EMPRESA DE TECNOLOGIA E INFORMAÇÕES.*$",
    r"^FGV CONHECIMENTO$",
    r"^TIPO \w+ – PÁGINA \d+$",
    r"^ATI - .* – (TARDE|MANHÃ)$",
    r"^Realização$",
]

SECTIONS = [
    (r"Língua Portuguesa", "conc-portugues"),
    (r"Língua Inglesa", "conc-ingles"),
    (r"Raciocínio Lógico", "conc-rlm"),
    (r"Atualidades", "conc-atualidades"),
    (r"Legislação", "conc-lgpd"),
    (r"Conhecimentos Específicos", "SPECIFIC"),
]

SECTION_LABELS = re.compile(
    r"^\s*(Conhecimentos Gerais|Língua Portuguesa|Língua Inglesa|Raciocínio Lógico Matemático|Atualidades"
    r"|Legislação Acerca de Segurança da Informação e Proteção de Dados|Conhecimentos Específicos)\s*$",
    re.M,
)

# Início de texto de apoio compartilhado por várias questões
SHARED_RX = re.compile(r"(?:Use the following TEXT|Leia o texto a seguir para responder|Texto para as)", re.I)

# Disciplina das questões específicas: vence a que tiver mais ocorrências (enunciado pesa o dobro)
KEYWORDS = [
    ("conc-testes", r"testes? (?:de software|unitári|de integração|automatizad|de regressão|de usabilidade)|\bTDD\b|\bBDD\b|caso de teste|cobertura de (?:código|testes)"),
    ("conc-seguranca", r"segurança da informação|OWASP|criptograf|vulnerabilidade|ataque|autenticação|controle de acesso|X\.800|firewall|malware|assinatura digital|certificados? digita|assinad[oa]s? digitalmente|SSL|TLS|\bSSH\b"),
    ("conc-lgpd", r"\bLGPD\b|13\.709|dados pessoais|titular dos dados"),
    ("conc-bd", r"\bSQL\b|bancos? de dados|relaciona(?:l|is)|OLAP|OLTP|Data Warehous|\bETL\b|normaliza|NoSQL|\bBI\b|Business Intelligence|data lake|ingestão de dados|multidimensiona|Suporte à Decisão"),
    ("conc-redes", r"\bTCP\b|\bUDP\b|endereço IP|roteador|camada de rede|\bDNS\b|modelo OSI|switch|VLAN|intranet|extranet|serviços de rede|tabela de rotas"),
    ("conc-devops", r"DevOps|contêiner|container|Docker|Kubernetes|computação em nuvem|\bcloud\b|CI/CD|Integração Contínua|Entrega Contínua|microsserviço|hexagonal|blockchain|Spring"),
    ("conc-governanca", r"\bITIL\b|\bCOBIT\b|governança de TI|gerenciamento de serviços|\bSLA\b"),
    ("conc-ageis", r"\bScrum\b|\bKanban\b|metodologias? ágil|ágeis|Extreme Programming|\bSprint\b|PMBOK|gerenciamento de projetos|Ágil Híbrida|engenharia de requisitos|Ponto de Função"),
]

NUMBER_WORDS = {"two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "duas": 2, "três": 3, "quatro": 4, "cinco": 5, "seis": 6}


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def clean(text: str) -> str:
    lines = []
    for line in text.splitlines():
        s = line.strip()
        if any(re.match(p, s) for p in NOISE):
            continue
        lines.append(line.rstrip())
    return "\n".join(lines)


def classify(stem: str, options: list[str]) -> str:
    best, best_score = "conc-engsoft", 0
    for subject, rx in KEYWORDS:
        score = 2 * len(re.findall(rx, stem, re.I)) + len(re.findall(rx, " ".join(options), re.I))
        if score > best_score:
            best, best_score = subject, score
    return best


def section_of(pos: int, marks: list[tuple[int, str]]) -> str:
    current = "conc-engsoft"
    for p, subject in marks:
        if p <= pos:
            current = subject
    return current


def parse_answers_ufsc(gabarito: str, total: int) -> list[str]:
    """Gabarito da UFSC/Coperve: pares "número  letra" ou "número  ANULADA"."""
    answers = ["*"] * total
    for num, ans in re.findall(r"(?m)^\s*(\d{1,2})\s+(ANULADA|[A-E])\s*$", gabarito):
        n = int(num)
        if 1 <= n <= total:
            answers[n - 1] = "*" if ans == "ANULADA" else ans
    return answers


def parse_answers(gabarito: str, header: str, total: int) -> list[str]:
    """Bloco do gabarito: <título> 1 2 3 … 20 EDCC… 21 22 … (*) Questão Anulada.
    Removendo números e espaços sobram as letras (A–E) e * para anulada."""
    idx = gabarito.find(header)
    if idx < 0:
        sys.exit(f"Gabarito: bloco '{header}' não encontrado")
    block = gabarito[idx + len(header):]
    end = block.find("(*)")
    block = block[: end if end >= 0 else None]
    letters = re.sub(r"\d+|\s+", "", block)
    if len(letters) != total or not re.fullmatch(r"[A-E*]+", letters):
        sys.exit(f"Gabarito '{header}': esperava {total} respostas, li {len(letters)}: {letters[:80]}")
    return list(letters)


def split_questions(text: str, total: int, fmt: str = "fgv", first: int = 1) -> list[tuple[int, int, str]]:
    """Encontra o início de cada questão first..total, em ordem."""
    starts = []
    pos = 0
    taken: set[int] = set()
    for n in range(first, total + 1):
        if fmt == "ufsc":
            rx = re.compile(rf"(?:^|\s){n:02d}\)\s")
        else:
            rx = re.compile(rf"(?:^|\n|(?<=[.?!”\"):]) )[ \t]*{n}(?:(?:[ \t]*\n)+|[ \t]+)(?=\S)")
        # Em ordem, de preferência; se a extração embaralhou colunas, aceita fora de ordem
        m = rx.search(text, pos) or next((c for c in rx.finditer(text) if c.start() not in taken), None)
        if not m:
            sys.exit(f"Questão {n} não encontrada")
        taken.add(m.start())
        starts.append((n, m.start(), m.end()))
        pos = max(pos, m.end())
    ordered = sorted(starts, key=lambda s: s[1])
    out = []
    for i, (n, _s, body_start) in enumerate(ordered):
        end = ordered[i + 1][1] if i + 1 < len(ordered) else len(text)
        out.append((n, body_start, text[body_start:end]))
    return sorted(out)


def parse_block(block: str, fmt: str = "fgv"):
    option_rx = r"(?:^|\s)([A-E]) \(\s*\)" if fmt == "ufsc" else r"\(([A-E])\)"
    m = re.search(option_rx.replace("([A-E])", "(A)"), block)
    if not m:
        return None
    first = m.start()
    stem = block[:first]
    parts = re.split(option_rx, block[first:])
    options = {}
    for i in range(1, len(parts) - 1, 2):
        options[parts[i]] = parts[i + 1]
    if list(options) != list("ABCDE"):
        return None
    # A última alternativa às vezes carrega o texto de apoio das próximas questões
    tail = ""
    e = options["E"]
    marker = SHARED_RX.search(e)
    if marker:
        tail, options["E"] = e[marker.start():], e[: marker.start()]
    else:
        cut = re.search(r"\n[ \t]*\n", e)
        if cut and len(e) > 220:
            tail, options["E"] = e[cut.end():], e[: cut.start()]
    stem = SECTION_LABELS.sub("", stem)
    options["E"] = SECTION_LABELS.sub("", options["E"])
    return norm(stem), [norm(options[k]) for k in "ABCDE"], tail


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    configs = json.loads(Path(ap.parse_args().config).read_text(encoding="utf-8"))
    out_dir = Path("provas/json")
    out_dir.mkdir(parents=True, exist_ok=True)

    for cfg in configs:
        raw = clean(Path(cfg["text"]).read_text(encoding="utf-8"))
        gabarito = Path(cfg["gabarito"]).read_text(encoding="utf-8")
        total = cfg.get("total", 70)
        fmt = cfg.get("format", "fgv")
        first_q = cfg.get("from", 1)
        answers = parse_answers_ufsc(gabarito, total) if fmt == "ufsc" else parse_answers(gabarito, cfg["gabaritoHeader"], total)

        marks = sorted((m.start(), subject) for pattern, subject in SECTIONS if (m := re.search(pattern, raw)))

        questions, skipped = [], []
        context, context_left = "", 0
        for n, start, block in split_questions(raw, total, fmt, first_q):
            parsed = parse_block(block, fmt)
            if not parsed:
                skipped.append(n)
                continue
            stem, options, tail = parsed
            own = stem  # enunciado como veio no PDF, antes de colar contexto

            # 1) Texto de apoio herdado de uma questão anterior
            if context_left > 0 and not SHARED_RX.search(own):
                stem = f"{context}\n\n{stem}"
                context_left -= 1

            # 2) Texto de apoio que começa no próprio enunciado: vale para esta e as próximas
            inline = SHARED_RX.search(own)
            if inline:
                found = re.search(r"(?:next|próximas)\s+(\w+)\s+quest", own, re.I)
                count = NUMBER_WORDS.get(found.group(1).lower(), 0) if found else 0
                context, context_left = own, max(0, count - 1)

            # 3) Texto de apoio que veio colado na alternativa E: vale para as próximas
            if tail.strip():
                found = re.search(r"(?:next|próximas)\s+(\w+)\s+quest", tail, re.I)
                if found:
                    context = norm(SECTION_LABELS.sub("", tail))
                    context_left = NUMBER_WORDS.get(found.group(1).lower(), 0)

            answer = answers[n - 1]
            if answer == "*":
                skipped.append(n)
                continue
            subject = "SPECIFIC" if fmt == "ufsc" else section_of(start, marks)
            if subject == "SPECIFIC":
                subject = classify(stem, options)
            has_figure = bool(re.search(r"figura|imagem a seguir|tabela a seguir|gráfico|código a seguir|trecho de código|diagrama|seguinte tabela|quadro abaixo|código.{0,40}a seguir|diagramas? UML", stem, re.I)) or (
                len(own) < 90 and re.match(r"(Nesse|Neste|Com base|Considerando) ", own) is not None
            )
            questions.append({
                "id": f"{cfg['slug']}-q{n:02d}",
                "subject": subject,
                "stem": stem + ("\n\n[Confira a figura, tabela ou código no PDF original]" if has_figure else ""),
                "options": options,
                "correct": [ord(answer) - 65],
                "explanation": f"Gabarito oficial: {answer}. Questão {n} da prova original.",
                "source": cfg["name"],
                "source_url": cfg["sourceUrl"],
                "board": cfg["board"],
                "year": cfg["year"],
                "tags": [f"prova:{cfg['slug']}"],
            })

        result = {
            "prova": {
                "slug": cfg["slug"],
                "name": cfg["name"],
                "subject": cfg.get("subject", "concursos"),
                "durationMin": cfg["durationMin"],
                "passPct": cfg.get("passPct", 60),
                "officialUrl": cfg["sourceUrl"],
            },
            "questions": questions,
        }
        path = out_dir / f"{cfg['slug']}.json"
        path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        by_subject: dict[str, int] = {}
        for q in questions:
            by_subject[q["subject"]] = by_subject.get(q["subject"], 0) + 1
        print(f"{path}: {len(questions)} questões; puladas {skipped or 'nenhuma'}; {by_subject}")


if __name__ == "__main__":
    main()
