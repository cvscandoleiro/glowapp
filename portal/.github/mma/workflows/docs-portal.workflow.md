---
description: "Workflow for creating and publishing the Minsait HTML documentation portal (/m3a-init-docs). Includes: requirements gathering, template selection, assets configuration, portal generation, and continuous update setup."
workflow-id: "docs-portal"
workflow-version: "1.0.0"
author: "Edimar Ferla de Almeida"
organization: "Minsait (Indra Company)"
last-updated: "2026-04-11"
---

# Workflow: Documentation Portal (/m3a-init-docs)

> **Creates the project's navigable HTML portal with Minsait branding.**  
> Transforms Layer 1 content (operational) into Layer 2 (executive/navigable).

---

## Pre-conditions

```
□ .github/mma/config.yaml exists with docs.mode configured
□ At least 1 knowledge base document exists (.github/mma/knowledge/)
□ Minsait assets available (m3a-team/assets/ or installed locally)
```

---

## STEP 1 — Requirements Gathering

Collect via conversation:

```
"I'll configure the documentation portal for {{PROJECT_NAME}}.
A few quick questions to customize it:"

1. "What is the primary audience for the portal?
   [1] Technical (devs, architects, ops)
   [2] Executive (managers, business stakeholders)
   [3] Mixed ← recommended"

2. "Which sections are mandatory?
   (Suggestion: Architecture, Decisions, Sprints, Security — confirm or customize)"

3. "Is there a URL/server where the portal will be published?
   (For inter-document links and asset configuration)"

4. "Current project docs mode: [show current config.yaml value]
   Confirm or change?"
```

---

## STEP 2 — Template Selection

### 2.1 Based on `docs.mode` in config

| docs.mode | Applied template |
|---|---|
| `markdown-only` | Only .md files — no HTML portal |
| `markdown+html` | Basic portal: index + architecture + decisions |
| `full-portal` | Full portal: index + all sections + trackers |

### 2.2 Structure by mode

**markdown+html:**
```
docs/
├── portal/
│   ├── index.html          ← Main dashboard / home
│   ├── architecture.html   ← Current architecture (from project-architecture.md)
│   └── decisions.html      ← ADRs and decisions log
└── assets/ → (link or copy from m3a-team/assets/)
```

**full-portal:**
```
docs/
├── portal/
│   ├── index.html
│   ├── architecture.html
│   ├── decisions.html
│   ├── team.html           ← Team (Eng. A/B/C — no AI names)
│   ├── sprints.html        ← Sprint status
│   ├── security.html       ← Security findings
│   └── dependencies.html   ← Dependency inventory
├── trackers/
│   ├── epic-tracker.html   ← Epic status
│   ├── risk-tracker.html   ← Risk register
│   └── rollout-tracker.html ← Rollout progress
└── assets/
    ├── fonts/
    ├── logos/
    └── css/
```

---

## STEP 3 — Minsait Assets Configuration

```
runSubagent("M3A: Docs", "verify and configure Minsait assets for the portal —
  check: m3a-team/assets/ available or installed locally —
  create: docs/assets/ with fonts, logos, css —
  test: open index.html in browser to confirm visual")
```

### 3.1 Assets checklist

```
□ ForFutureSans-Regular.woff2 available?
□ ForFutureSans-Bold.woff2 available?
□ AF_MINSAIT_LOG_NEG.png available? (white logo for dark backgrounds)
□ AF_MINSAIT_LOG_POS.png available? (dark logo for light backgrounds)
□ AF_MINSAIT_SIM_POS.png available? (favicon)
□ CSS :root variables correct (pruno, fucsia, gris-ceramica)?
```

---

## STEP 4 — Portal Generation

### 4.1 Main page (index.html)

```
runSubagent("M3A: Docs", "generate index.html for {{PROJECT_NAME}} portal —
  base content: .github/mma/knowledge/project-overview.md —
  include: project status dashboard, links to all sections,
  key metrics, last updated date —
  output: docs/portal/index.html")
```

**index.html content:**
- Header with Minsait logo + project name
- Sidebar with navigation to all sections
- Metric cards: completed sprints, active epics, active CVEs, coverage
- Portal last updated timestamp
- Footer with Minsait confidentiality notice

### 4.2 Architecture (architecture.html)

```
runSubagent("M3A: Docs", "generate architecture.html —
  base content: .github/mma/knowledge/project-architecture.md —
  include: rendered Mermaid diagrams, module descriptions,
  tech stack, integration points —
  output: docs/portal/architecture.html")
```

### 4.3 Decisions (decisions.html)

```
runSubagent("M3A: Docs", "generate decisions.html —
  base content: .github/mma/decisions/ (all ADRs) +
    .github/mma/knowledge/project-decisions-log.md —
  order by: date descending —
  filters: by status (proposed/accepted/deprecated) —
  output: docs/portal/decisions.html")
```

### 4.4 Additional pages (full-portal)

For `docs.mode: full-portal`, also generate:

```
runSubagent("M3A: Docs", "generate additional full-portal pages:
  - team.html: project team (Eng. A/B/C, responsibilities)
  - sprints.html: sprint history and metrics
  - security.html: security findings (active CVEs, remediations)
  - dependencies.html: dependency inventory with status
  - trackers/epic-tracker.html: status of all epics
  - trackers/risk-tracker.html: risk register")
```

---

## STEP 5 — Visual Validation

After generation, validate:

```
□ index.html opens without console errors?
□ ForFutureSans fonts loading (not fallback)?
□ Correct colors: pruno + fuchsia + ceramic gray?
□ Minsait logo visible in header and footer?
□ Sidebar works (navigation links)?
□ Content is Layer 2 (no references to agents, Marcus Aurelius, etc.)?
□ Confidentiality footer present?
□ Mobile responsive (basic)?
```

---

## STEP 6 — Continuous Update Setup

### 6.1 When the portal should be updated

Borges keeps the portal updated after:
- End of each sprint (sprint status)
- New epic creation/approval
- New ADR approved
- New critical CVE identified
- Architecture change

### 6.2 Automation (optional)

For teams with CI/CD configured:

```yaml
# .github/workflows/update-docs-portal.yml
# Trigger: push to main + manual (/m3a-update-portal)
name: Update Docs Portal
on:
  workflow_dispatch:
    inputs:
      section:
        description: 'Section to update (all | sprints | decisions | security)'
        default: 'all'
```

---

## Layer 2 Rules — Mandatory for the Entire Portal

```
NEVER write in the portal:
❌ "Marcus Aurelius", "Descartes", "Knuth" or any agent name
❌ "AI", "LLM", "Copilot", "agent", "AI team"
❌ Internal implementation details of the agents
❌ Credentials, tokens or secrets (even test ones)
❌ Personal employee information

ALWAYS write in the portal:
✅ "Eng. A", "Eng. B", "Eng. C" or real configured names
✅ "Engineering team" in executive context
✅ "Security analysis identified..." (without citing the agent)
✅ Business language, not technical (for executive audience)
```

---

## Changelog

**v1.0.0 (2026-04-11)** — Workflow created. 6 steps for portal generation. Templates by mode. Layer 2 rules.
