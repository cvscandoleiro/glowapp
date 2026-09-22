---
description: "Generates a token usage report from the project's usage.csv log. Reads .github/mma/usage/usage.csv and produces a Markdown summary at .github/mma/usage/usage-report.md. Supports optional filters: sprint, agent, last N entries."
name: "M3A: Docs"
---

# /m3a-usage-report — Token Usage Report

> **Skill:** `m3a-usage-report` | **Agent:** M3A: Docs (Borges) | **Command:** `/m3a-usage-report`

---

## Purpose

Reads `.github/mma/usage/usage.csv` and generates a structured Markdown report at `.github/mma/usage/usage-report.md`.

The report is always **overwritten** — it reflects the current state of the CSV at generation time.

---

## Mandatory Disclaimer (always first section in report)

The generated report MUST open with this block, verbatim:

```markdown
> **Scope & Confidence Warning**
> This report covers **artifact-generating tasks only**. Conversations, status queries and exploratory questions are NOT included.
> Token counts are **estimates** (`char_count ÷ 3.5`). Actual LLM consumption may differ.
> Use as a **baseline reference only** — not as billing-accurate data. `confidence: estimated` for all entries.
```

---

## Execution Steps

**STEP 1 — Verify file existence**
Check if `.github/mma/usage/usage.csv` exists.
- IF NOT EXISTS → emit: `⚠️ WARNING: .github/mma/usage/usage.csv not found. No artifact-generating tasks have been tracked yet.` STOP.
- IF EXISTS → proceed.

**STEP 2 — Parse filters (optional)**
Read the command arguments:
- `sprint=Sprint-NN` → filter rows where `sprint` column matches
- `agent=M3A: X` → filter rows where `agent` column matches
- `last=N` → take only the last N rows (by date order)
- No argument → report all rows

**STEP 3 — Generate report**

Output file: `.github/mma/usage/usage-report.md`

Report structure (mandatory):

```markdown
# M3A Token Usage Report
Generated: YYYY-MM-DD | Source: .github/mma/usage/usage.csv | Filters: [active filters or "none"]

> **Scope & Confidence Warning**
> This report covers **artifact-generating tasks only**. Conversations, status queries and exploratory questions are NOT included.
> Token counts are **estimates** (`char_count ÷ 3.5`). Actual LLM consumption may differ.
> Use as a **baseline reference only** — not as billing-accurate data. `confidence: estimated` for all entries.

---

## Summary

| Metric | Value |
|---|---|
| Total entries | N |
| Total tokens in (est.) | N |
| Total tokens out (est.) | N |
| Date range | YYYY-MM-DD → YYYY-MM-DD |
| Models used | model1, model2 |
| Sprints covered | Sprint-01, Sprint-02, ... |

---

## By Agent

| Agent | Entries | Tokens In (est.) | Tokens Out (est.) |
|---|---|---|---|
| M3A: PM | N | N | N |
| ... | | | |

---

## By Task Type

| Task Type | Entries | Tokens In (est.) | Tokens Out (est.) |
|---|---|---|---|
| epic_creation | N | N | N |
| ... | | | |

---

## By Sprint

| Sprint | Entries | Tokens In (est.) | Tokens Out (est.) |
|---|---|---|---|
| Sprint-01 | N | N | N |
| ... | | | |

---

## Full Log

| Date | Sprint | Agent | Model | Task Type | Artifact | Tokens In | Tokens Out |
|---|---|---|---|---|---|---|---|
| ... | | | | | | | |
```

**STEP 4 — Write file**
Write the report to `.github/mma/usage/usage-report.md` (overwrite if exists).

**STEP 5 — Register own usage**
After writing the report, append one entry to `.github/mma/usage/usage.csv`:
```
[date],no-sprint,M3A: Docs,[model],usage_report,.github/mma/usage/usage-report.md,[tokens_in_est],[tokens_out_est],estimated
```

**STEP 6 — Confirm**
Emit: `✅ usage-report.md: .github/mma/usage/usage-report.md`

---

## Supported Filters

| Filter | Example | Behaviour |
|---|---|---|
| `sprint=Sprint-NN` | `/m3a-usage-report sprint=Sprint-03` | Only rows from that sprint |
| `agent=M3A: X` | `/m3a-usage-report agent=M3A: PM` | Only rows from that agent |
| `last=N` | `/m3a-usage-report last=50` | Last 50 rows by date |
| (none) | `/m3a-usage-report` | All rows |

Filters can be combined: `/m3a-usage-report sprint=Sprint-03 agent=M3A: Developer`

---

## Output Location

`.github/mma/usage/usage-report.md` — always overwritten, never versioned.
The CSV (`.github/mma/usage/usage.csv`) is never modified by this skill — read-only.
