---
description: "MMA Create PDF — Guided wizard to convert Markdown files into corporate PDF documents with optional DOCX template (Minsait branding). Handles dependency detection and auto-installation."
agent: "agent"
author: "Edimar Ferla de Almeida"
organization: "Minsait (Indra Company)"
---

# /m3a-create-pdf — Markdown to PDF Wizard

> **Converts one or more Markdown files into a professionally formatted PDF.**
> Optionally applies a corporate DOCX template for cover page, headers, and footers.
> Auto-detects and offers to install missing dependencies (pandoc, uv, Chrome).

---

## Behavior Rule

Conduct a conversational wizard. **One question at a time.**

- Never skip dependency verification.
- Never generate the PDF without confirming the user's choices.
- If dependencies are missing, offer to install them (with explicit user consent).
- Always confirm the output path before generating.
- The PDF can be generated **with or without** a corporate template.

---

## STEP 0 — Verify Dependencies

```
Check the following tools on the user's system:
  1. uv (Python package manager) — required
  2. pandoc (Markdown → HTML converter) — required
  3. Google Chrome (HTML → PDF via headless) — required
  4. python-docx (only if template is used) — auto-installed by uv

IF any required tool is missing:
  → Inform the user which tool is missing
  → Offer to install it automatically (with user consent)
  → Installation commands:
    - uv (Windows): winget install --id astral-sh.uv --silent
    - uv (macOS):   brew install uv
    - uv (Linux):   curl -LsSf https://astral.sh/uv/install.sh | sh
    - pandoc (Windows): winget install --id JohnMacFarlane.Pandoc --silent
    - pandoc (macOS):   brew install pandoc
    - pandoc (Linux):   sudo apt-get install -y pandoc
    - Chrome: direct user to https://www.google.com/chrome/
  → After installation, verify the tool is accessible
  → Only proceed when ALL dependencies are confirmed

IF all dependencies are present:
  → Proceed to STEP 1
```

---

## STEP 1 — Collect Markdown Files

Ask the user:

```
Quais arquivos Markdown você quer incluir no PDF?

Opções:
  - Caminho(s) específico(s): docs/arch.md, docs/guide.md
  - Glob pattern: docs/*.md
  - Diretório inteiro: "todos os .md de wiki/"
  - Arquivo único: README.md

💡 Os arquivos serão concatenados na ordem informada (ou alfabética para globs/diretórios).
```

Validate that files exist. If glob/directory, list the files found and confirm order.

---

## STEP 2 — Template (optional)

Ask the user:

```
Deseja usar um template DOCX corporativo?

  [1] Sim — tenho um template .docx (gera capa + cabeçalhos + rodapés do template)
  [2] Não — gerar PDF com estilo Minsait padrão (sem capa de template)

💡 O template deve ser um arquivo .docx com a estrutura de seções desejada.
   Exemplo: assets/Template-minsait-2025.docx
```

If YES → ask for the template path and validate it exists.
If NO → proceed without template (CSS Minsait padrão será aplicado).

---

## STEP 3 — Document Metadata

Ask the user (can use defaults from config.yaml if available):

```
Metadados do documento (Enter para usar o padrão):

  - Título: [inferido do primeiro # heading]
  - Subtítulo: [vazio]
  - Autor/Organização: [config.yaml → project.organization ou "Minsait | Indra Company"]
  - Info adicional: [auto: "Versão 1.0 | {mês} {ano}"]
```

Accept partial answers — use smart defaults for anything left blank.

---

## STEP 4 — Output Path

Ask the user:

```
Onde salvar o PDF?

  Padrão: docs/{slug-do-titulo}.pdf
  Ou informe o caminho desejado.
```

---

## STEP 5 — Confirm and Execute

Present a summary:

```
📋 Resumo da conversão:

  Arquivos:    3 arquivos .md (cap1.md, cap2.md, cap3.md)
  Template:    assets/Template-minsait-2025.docx (com capa)
  Título:      "Proposta Técnica"
  Subtítulo:   "Migração Cloud"
  Autor:       "João Silva - Arquiteto"
  Saída:       docs/proposta-tecnica.pdf

Confirma? [S/n]
```

On confirmation, execute the script:

```bash
uv run scripts/md-to-pdf.py {files} --output {output} [--template {template}] \
  [--title "..."] [--subtitle "..."] [--author "..."] [--info "..."]
```

---

## STEP 6 — Deliver Result

After successful generation:

```
✅ PDF gerado: docs/proposta-tecnica.pdf (2.4 MB)

O documento inclui:
  - Capa corporativa com metadados
  - Índice navegável (TOC)
  - Conteúdo formatado com estilo Minsait
  - Tabelas, código e listas estilizados

💡 Para regenerar rapidamente sem o wizard, use direto no terminal:
   uv run scripts/md-to-pdf.py {files} --output {output} --template {template}
```

---

## CLI Direto (sem LLM)

O usuário pode chamar o script diretamente sem usar o M3A:

```bash
# Uso mínimo
uv run scripts/md-to-pdf.py documento.md --output documento.pdf

# Com template corporativo
uv run scripts/md-to-pdf.py *.md --output relatorio.pdf --template assets/Template.docx

# Com metadados
uv run scripts/md-to-pdf.py doc.md -o doc.pdf \
  --title "Título" --subtitle "Sub" --author "Org" --info "v1.0 | Jun 2026"

# Sem auto-instalação (CI/CD)
uv run scripts/md-to-pdf.py doc.md -o doc.pdf --no-install
```

---

## Error Handling

| Erro | Ação |
|---|---|
| Dependência ausente + usuário recusa instalar | Listar instruções manuais de instalação e parar |
| Arquivo .md não encontrado | Listar arquivos disponíveis no diretório e perguntar novamente |
| Template .docx não encontrado | Perguntar se quer continuar sem template ou informar outro caminho |
| Falha no Chrome headless | Verificar se Chrome está atualizado, sugerir `--no-sandbox` |
| PDF vazio ou corrompido | Verificar HTML intermediário, sugerir executar com `--verbose` |

---

## Context Reading

```
IF .github/mma/config.yaml EXISTS:
  → Use project.name as default title
  → Use project.organization as default author
  → Use project.language for date locale

IF .github/mma/config.yaml DOES NOT EXIST:
  → Operate in ad hoc mode (collect all metadata in wizard)
```
