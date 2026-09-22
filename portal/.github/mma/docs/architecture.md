---
title: "M3A Team — Architecture"
version: "1.0.0"
last-updated: "2026-04-11"
audience: "architects, developers, maintainers"
---

# Architecture

This document describes the technical architecture of M3A Team — how it is structured, how agents interact, how knowledge is managed, and how the framework is installed and activated.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Agent Interaction Model](#2-agent-interaction-model)
3. [Knowledge Base Architecture](#3-knowledge-base-architecture)
4. [Installation Architecture](#4-installation-architecture)
5. [/m3a-init Onboarding Flow](#5-m3a-init-onboarding-flow)
6. [Two-Layer Output Model](#6-two-layer-output-model)
7. [Configuration Schema](#7-configuration-schema)

---

## 1. System Overview

M3A Team is a **prompt-driven multi-agent framework** that runs inside an IDE AI assistant (GitHub Copilot, Cursor, etc.). It is not a software application — it is a collection of structured instruction files, configuration schemas, and workflows that direct AI models to behave as specialized team members.

```
┌─────────────────────────────────────────────────────────────────┐
│  User / Developer                                               │
│                                                                 │
│  "@m3a-devops: generate a Dockerfile for Java 21"               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  IDE AI Assistant (GitHub Copilot / Cursor)                     │
│                                                                 │
│  Context loaded:                                                │
│  ├── .github/agents/m3a-*.agent.md       (agent instructions)  │
│  ├── .github/copilot-instructions.md     (routing rules)       │
│  └── .mma/config.yaml                    (project context)     │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  @m3a-orchestrator (Marcus Aurelius)                              │
│  Routes to → @m3a-devops (Atlas)                                │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  @m3a-devops (Atlas)                                            │
│  Reads: .mma/config.yaml (stack context)                        │
│  Generates: Dockerfile, Kubernetes manifest, etc.               │
│  Output: ✅ agents/m3a-devops.agent.md: [path]                  │
└─────────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Location | Description |
|---|---|---|
| Agent files | `agents/m3a-*.agent.md` | Instruction sets for each of the 12 agents |
| Skills | `skills/m3a-*.prompt.md` | Single-purpose slash commands |
| Workflows | `workflows/*.workflow.md` | Multi-step orchestrated procedures |
| Templates | `templates/` | Markdown and HTML templates with placeholders |
| Config schema | `core/mma.config.schema.json` | JSON Schema for project configuration validation |
| Registry | `core/registry/` | Agent, skill, and workflow catalogs |
| Scripts | `scripts/` | Install, init, and doctor scripts |

---

## 2. Agent Interaction Model

### The 12-Agent Team

```
                    ┌─────────────────────┐
                    │  @m3a-orchestrator  │
                    │  (Marcus Aurelius)    │
                    │  Routes all requests│
                    └────────┬────────────┘
                             │
           ┌─────────────────┼─────────────────┐
           ▼                 ▼                 ▼
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │ @m3a-    │      │ @m3a-    │      │ @m3a-    │
    │ analyst  │      │ architect│      │ pm       │
    │(Descartes│      │(Vitruvius│      │(Drucker) │
    └──────────┘      └──────────┘      └──────────┘
           ▼                 ▼                 ▼
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │ @m3a-sm  │      │ @m3a-dev │      │ @m3a-qa  │
    │ (Deming) │      │ (Knuth)  │      │ (Popper) │
    └──────────┘      └──────────┘      └──────────┘
           ▼                 ▼                 ▼
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │ @m3a-    │      │ @m3a-    │      │ @m3a-    │
    │ security │      │ devops   │      │ docs     │
    │ (Hobbes) │      │ (Atlas)  │      │ (Borges) │
    └──────────┘      └──────────┘      └──────────┘
           ▼                 ▼
    ┌──────────┐      ┌──────────┐
    │ @m3a-ux  │      │ @m3a-dba │
    │ (Norman) │      │ (Codd)   │
    └──────────┘      └──────────┘
```

### Routing Rules

The orchestrator uses these routing criteria (defined in `core/registry/agents.registry.yaml`):

| Request Type | Routed To |
|---|---|
| AS-IS analysis, CVE scan, module inventory | `@m3a-analyst` |
| Architecture diagrams, ADRs, TO-BE design | `@m3a-architect` |
| Epics, backlog, roadmap, PRD | `@m3a-pm` |
| Stories, DoD, sprint planning | `@m3a-sm` |
| Code implementation, refactoring | `@m3a-dev` |
| Test planning, quality gates | `@m3a-qa` |
| CVEs, OWASP, security review | `@m3a-security` |
| Docker, Kubernetes, CI/CD, scripts | `@m3a-devops` |
| Technical docs, HTML portals | `@m3a-docs` |
| UX/UI, wireframes, design systems | `@m3a-ux` |
| SQL, database design, migrations | `@m3a-dba` |

### Security Veto (Law 10)

`@m3a-security` has unconditional veto power. The flow when a veto is issued:

```
@m3a-architect proposes a change
    │
    ▼
@m3a-orchestrator routes to @m3a-security for review
    │
    ▼
@m3a-security: ❌ SECURITY VETO
    │
    ▼
ALL AGENTS STOP
    │
    ▼
Human must resolve or accept risk with explicit sign-off
```

---

## 3. Knowledge Base Architecture

After `/m3a-init`, each project has a local knowledge base at `.mma/knowledge/`:

```
.mma/knowledge/
├── team-config.md              ← 13 Laws (localized to project language)
├── project-architecture.md     ← AS-IS summary (populated by /m3a-init-knowledge)
├── project-conventions.md      ← Coding/ops conventions detected
├── project-decisions-log.md    ← ADR log (append-only)
└── README.md                   ← Knowledge base index
```

### Knowledge Lifecycle

```
/m3a-init
    │ Populates team-config.md with 13 Laws
    │ Creates empty architecture/conventions/decisions files
    ▼
/m3a-init-knowledge  (or /m3a-init-existing-project sub-workflow)
    │ @m3a-analyst scans codebase
    │ Populates project-architecture.md
    │ Populates project-conventions.md
    ▼
Ongoing operation
    │ @m3a-architect appends to project-decisions-log.md
    │ @m3a-security appends security decisions
    │ Human reviews and approves
    ▼
/m3a-release-notes
    │ Synthesizes decisions log into release notes
```

---

## 4. Installation Architecture

### Project-Level Install

```
<project-root>/
├── .m3a-team/                 ← Git-ignored: M3A Team source
│   ├── agents/
│   ├── skills/
│   ├── workflows/
│   └── ...
├── .github/
│   ├── agents/                ← Copied from .m3a-team/agents/
│   ├── prompts/               ← Copied from .m3a-team/skills/
│   └── copilot-instructions.md ← Template, filled by /m3a-init
└── .mma/                      ← Created by /m3a-init (NOT by install)
    └── config.yaml
```

### User-Level Install

```
~/.m3a-team/                   ← Global M3A Team install
    ├── agents/
    ├── skills/
    └── scripts/

<project-root>/                ← Target project (any project)
├── .github/
│   ├── agents/                ← Symlinked or copied from ~/.m3a-team/agents/
│   └── prompts/               ← Symlinked or copied from ~/.m3a-team/skills/
└── .mma/
    └── config.yaml            ← Per-project, created by /m3a-init
```

---

## 5. /m3a-init Onboarding Flow

```mermaid
flowchart TD
    A[User runs /m3a-init] --> B{.mma/config.yaml exists?}
    B -- Yes --> C{Re-init confirmation}
    C -- No --> Z[Abort]
    C -- Yes --> D[Q1: Select language]
    B -- No --> D
    D --> E[Q2-Q14: Project onboarding questions]
    E --> F[Generate .mma/config.yaml]
    F --> G[Generate .mma/knowledge/ scaffold]
    G --> H[Copy/link agent files to .github/agents/]
    H --> I[Generate .github/copilot-instructions.md]
    I --> J{Project type?}
    J -- New --> K[/m3a-init-new-project]
    J -- Existing --> L[/m3a-init-existing-project]
    J -- Docs only --> M[/m3a-init-docs]
    J -- Assessment --> N[/m3a-assessment]
    J -- Migration --> O[/m3a-migration-planner]
    K & L & M & N & O --> P[Log to .mma/logs/m3a-init.log]
    P --> Q[M3A Team ACTIVATED]
```

### Pre-Init Guard

Before `/m3a-init` completes, all agent commands respond with:

```
⚠️ /m3a-init is required to activate M3A Team on this project.
Run /m3a-init to configure context, language, stack, and governance.
```

Only these commands are available pre-init:
- `/m3a-init` — run onboarding
- `/m3a-help` — list available commands
- `/m3a-about` — show version/credits
- `/m3a-doctor` — run environment diagnostics

---

## 6. Two-Layer Output Model

M3A Team produces outputs in two layers for most significant deliverables:

| Layer | Format | Audience | Generated By |
|---|---|---|---|
| **Layer 1 — Operational** | Markdown (`.md`) | Development team | Analyst, Architect, DevOps, etc. |
| **Layer 2 — Executive** | HTML (Minsait-branded) | Project manager, client, stakeholders | `@m3a-docs` with Minsait brand templates |

### Example: Assessment Workflow Output

```
/m3a-assessment
    │
    ├── Layer 1 (Operational)
    │   ├── docs/assessment-report.md       ← Technical detail
    │   ├── docs/dependency-inventory.md    ← Dependency list
    │   └── docs/risk-register.md           ← Risk matrix
    │
    └── Layer 2 (Executive)
        └── docs/html/assessment-exec-summary.html  ← Minsait-branded
            ├── ForFutureSans fonts
            ├── Minsait color palette
            └── Summary tables, charts (no deep technical detail)
```

### HTML Templates Location

Minsait-branded HTML templates are in `templates/html/`:
- `templates/html/portal/` — Main documentation portal
- `templates/html/trackers/` — Epic, rollout, and risk trackers

Brand assets (fonts, logos, CSS) are in `assets/`.

---

## 7. Configuration Schema

The project configuration is validated against `core/mma.config.schema.json` (JSON Schema draft-07).

### Key Config Fields

```yaml
# .mma/config.yaml (example structure)
mma_version: "1.0.0"
project:
  name: "{{PROJECT_NAME}}"
  code: "{{PROJECT_CODE}}"
  description: "{{PROJECT_DESCRIPTION}}"
  language: "en-US"   # en-US | es-ES | pt-BR
  type: "existing"    # new | existing | docs | assessment | migration
  repository: "{{REPO_URL}}"
  version_current: "{{VERSION_CURRENT}}"
  version_target: "{{VERSION_TARGET}}"
stack:
  runtime: "{{STACK_RUNTIME}}"
  runtime_version: "{{STACK_RUNTIME_VERSION}}"
  os: "{{STACK_OS}}"
  database: "{{STACK_DB}}"
  cicd: "{{STACK_CI}}"
  deploy: "{{STACK_DEPLOY}}"
governance:
  quality_gates: true
  risk_gates: true
  adr_mandatory: true
  sprint_tracking: true
  epic_backlog: true
team:
  size: "small"   # solo | small | medium | large
  organization: "{{ORG_NAME}}"
  client: "{{CLIENT_NAME}}"
docs:
  output: "portal"  # markdown | markdown_html | portal
  branding_tagline: "Tech for impact"
```

Full schema: [`core/mma.config.schema.json`](../core/mma.config.schema.json)
