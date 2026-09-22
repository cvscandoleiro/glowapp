---
description: "Detailed guide for running /m3a-init-knowledge. Describes how to scope the analysis, perform a module-by-module scan, what populates the knowledge base, validation criteria, and how to use the results to create epics."
workflow-id: "knowledge-bootstrap"
workflow-version: "1.0.0"
author: "Edimar Ferla de Almeida"
organization: "Minsait (Indra Company)"
last-updated: "2026-04-11"
---

# Guide: Knowledge Bootstrap (/m3a-init-knowledge)

> **This document complements the skill `m3a-init-knowledge.prompt.md`.**  
> Provides practical guidance on how to conduct and validate the AS-IS analysis.

---

## When to Run

```
RUN when:
- Existing or legacy project newly onboarded to M3A Team
- Knowledge base is empty or outdated (> 3 sprints without update)
- Significant new module or component added to the project
- Prerequisite for creating modernization epics

DO NOT RUN:
- On new projects (use /m3a-init-epic + Architect)
- As a substitute for specific epic analysis (use @m3a-analyst directly)
- If knowledge base was recently populated and project has not changed
```

---

## How to Scope the Analysis

### 1. Define depth per module

Not every module deserves the same depth. Use this matrix:

| Module | High-Priority Criterion | Recommended Depth |
|---|---|---|
| Business core | Directly touches main business logic | Deep |
| Modules with CRITICAL CVE | Hobbes identified high risk | Deep |
| Critical integrations | External APIs, payments, auth | Deep |
| Main utility modules | Commons, shared libs | Intermediate |
| Administrative modules | Admin panels, dashboards | Shallow |
| Test modules | Test utilities, mocks | Shallow |
| Deprecated/obsolete modules | Known as partial legacy | Shallow |

### 2. Prioritize by EOL risk

```
CRITICAL (analyze in SESSION 1):
- Runtime/language at EOL or near EOL
- Main framework with active critical CVEs
- Database EOL

IMPORTANT (analyze in SESSION 2):
- Modules with the highest number of dependencies
- Most frequently touched modules (hot paths)

NORMAL (analyze in remaining sessions):
- Stable and rarely modified modules
```

---

## Module-by-Module Scan Execution

### Scan template per module

For each module, the Analyst follows this script:

#### Shallow Level (15-30 min)

```
1. Open dependency manifest:
   - pom.xml → Maven dependencies
   - package.json → npm dependencies
   - requirements.txt / pyproject.toml → Python dependencies
   - go.mod → Go modules
   - *.csproj → .NET packages

2. Record:
   - Name and version of each dependency
   - Dependencies flagged as internal (other project modules)
   - Declared runtime/language version

3. List directory structure (2 levels)
4. Identify entry file (main.py, App.java, index.js, etc.)
5. Identify main configuration file
```

#### Intermediate Level (+1h)

```
Add to shallow:
1. Analyze transitive dependencies (top 5 by size/impact)
2. Check CVEs for direct dependencies via:
   - NVD (nvd.nist.gov)
   - OSV (osv.dev)
   - Snyk DB
3. Identify predominant code patterns
4. Map integrations: HTTP/REST, messaging, database, cache, filesystem
5. Identify existing tests: directory, framework, coverage estimate
```

#### Deep Level (+2h)

```
Add to intermediate:
1. Read the 10 most important classes/functions (by size or references)
2. Map business logic by domain
3. Identify: god classes, code duplication, tight coupling
4. Analyze database queries (if applicable): N+1, missing indexes
5. Estimate: LOC, cyclomatic complexity (if tools available)
6. Document: "what this module does" in executive language
```

---

## What Goes in the Knowledge Base

### .github/mma/knowledge/project-overview.md

```
Always include:
- Number of modules/components
- Language and runtime version (confirmed, not just from config)
- Total LOC estimate
- Macro architecture (monolith | modular | microservices)
- Public entry points (APIs, UI, CLI)
- Identified external integrations
```

### .github/mma/knowledge/project-architecture.md

```
Always include:
- Module dependency diagram (Mermaid graph)
- Build/deploy order
- Architecture layers
- Identified patterns (MVC, Clean, Hexagonal, etc.)
- Breaking points: what fails if X goes down?
```

### .github/mma/knowledge/module-[name].md

```
Mandatory fields (minimum for shallow level):
- Type: app | lib | service | infra | test
- Language + version
- Direct dependencies: N total, N with CVE
- Integrations: input and output
- Criticality: high | medium | low
- Analysis date
```

### .github/mma/knowledge/dependencies.md

```
Format per dependency:
| Name | Version | EOL Date | CVEs | CVSS max | Modules using | Recommended version |
```

### .github/mma/knowledge/technical-debt.md

```
Format per debt item:
| ID | Type | Module | Description | Severity | Rough effort | Priority |

Types: security | eol | architecture | testing | documentation | performance
```

---

## Validation Criteria

Before considering the knowledge bootstrap complete:

```
COMPLETENESS CHECKLIST:

Structure:
□ project-overview.md: LOC estimate + number of modules filled in?
□ project-architecture.md: Mermaid diagram present?
□ dependencies.md: all direct dependencies listed?
□ technical-debt.md: minimum 5 items identified (or confirmed absence)?
□ module-[name].md: one file per active module exists?

Quality:
□ Each finding has evidence (file/line cited when possible)?
□ CVEs have CVSS score and link to NVD?
□ Effort estimates are "rough" (not precise)?
□ No assumptions presented as facts?

Coverage:
□ Critical modules analyzed at intermediate or deep level?
□ EOL dependencies identified with expiration date?
□ All external integrations mapped?
```

---

## How to Use the Results

### For creating epics

```
1. Open .github/mma/knowledge/technical-debt.md
2. Filter by severity: critical → high → medium
3. Group related items (e.g. all security CVEs = 1 epic)
4. Take to @m3a-pm: "create epics based on technical-debt.md"
```

### For sprint planning

```
1. severity=critical epics first (active CVEs, imminent EOL)
2. severity=high epics second
3. Never plan modernization without:
   - Baseline regression tests in the same sprint
   - Documented rollback plan
```

### For periodic updates

```
Knowledge base should be updated:
- After each sprint that touches analyzed modules
- After each /m3a-dependency-audit
- When a new dependency version is discovered
- When a new CVE is published for a project component
```

---

## Analysis Sessions — Duration Guidance

| Project Size | Sessions for Complete Bootstrap |
|---|---|
| Small (< 10k LOC, 1-3 modules) | 1-2 sessions |
| Medium (10k-100k LOC, 4-10 modules) | 3-4 sessions |
| Large (100k-500k LOC, 10-20 modules) | 5-7 sessions |
| Enterprise (> 500k LOC, 20+ modules) | 8-12+ sessions (multi-sprint) |

**Enterprise Recommendation:**
Split into phases: analyze critical modules first (PHASE A), then secondary modules (PHASE B).

---

## Changelog

**v1.0.0 (2026-04-11)** — Workflow created. Complete guide for /m3a-init-knowledge. Scan templates by level. Validation criteria. Duration guidance by project size.
