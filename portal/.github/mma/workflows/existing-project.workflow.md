---
description: "Complete workflow for onboarding an existing or legacy project into M3A Team. Includes: /m3a-init, /m3a-init-knowledge (AS-IS scan), /m3a-assessment (technical debt), /m3a-dependency-audit (CVE/EOL), priority matrix, and improvement epic creation."
workflow-id: "existing-project"
workflow-version: "1.0.0"
author: "Edimar Ferla de Almeida"
organization: "Minsait (Indra Company)"
last-updated: "2026-04-11"
---

# Workflow: Existing / Legacy Project

> **Estimated duration:** 4-8 working sessions (varies by project size)  
> **Triggered by:** Orchestrator when `project.type = existing | legacy | assessment`  
> **Prerequisite:** Access to the project repository

---

## Phase Overview

```
PHASE 1: Setup          → /m3a-init + .github/mma/ structure
PHASE 2: AS-IS Scan     → /m3a-init-knowledge (systematic analysis)
PHASE 3: Assessment     → /m3a-assessment (executive diagnosis)
PHASE 4: Dep Audit      → /m3a-dependency-audit (CVEs, EOL)
PHASE 5: Prioritization → Modernization matrix
PHASE 6: Epics          → Improvement epic creation
PHASE 7: Sprint 1       → First sprint planning
```

---

## PHASE 1 — Initial Setup

### 1.1 Run /m3a-init

```
runSubagent("M3A: Orchestrator", "/m3a-init — existing project")
```

Configure `project.type: existing` or `project.type: legacy`.

### 1.2 First context collection

Before automated analysis, collect manually:

```
Ask the human (max 5 questions):
1. "What is the main pain/problem that motivated bringing in M3A Team?"
2. "Is there any external deadline or constraint (audit, forced EOL)?"
3. "Are there modules that should NOT be touched in this cycle?"
4. "What is the current test coverage level (estimate)?"
5. "Is there existing documentation I should read before starting?"
```

---

## PHASE 2 — AS-IS Knowledge Bootstrap

### 2.1 Run /m3a-init-knowledge

```
runSubagent("M3A: Analyst", "/m3a-init-knowledge — 
  project: {{PROJECT_NAME}} — 
  depth: [chosen by human in PHASE 1]")
```

**Expected outputs:**
- `.github/mma/knowledge/project-overview.md`
- `.github/mma/knowledge/project-architecture.md`
- `.github/mma/knowledge/dependencies.md`
- `.github/mma/knowledge/technical-debt.md`
- `.github/mma/knowledge/module-[name].md` per module

**PHASE 2 Gate:**
```
□ All modules listed in project-overview.md analyzed?
□ Complexity and LOC estimated?
□ Main dependencies mapped?
IF NO → continue analysis before proceeding
```

---

## PHASE 3 — Technical Assessment

### 3.1 Executive diagnosis

```
runSubagent("M3A: Analyst", "run complete assessment of {{PROJECT_NAME}} —
  based on knowledge base generated in PHASE 2 —
  output: docs/assessment-[date].md")
```

### Assessment Structure

```markdown
---
type: assessment
project: "{{PROJECT_NAME}}"
date: YYYY-MM-DD
assessor: M3A: Analyst
---

# Technical Assessment — {{PROJECT_NAME}}

## Executive Summary
[3-5 lines: current system state, main problem, greatest risk]

## Health Score by Dimension
| Dimension | Score | Justification |
|---|---|---|
| Security | 🔴 Critical / 🟡 Attention / 🟢 OK | |
| Technology (EOL) | | |
| Code Quality | | |
| Test Coverage | | |
| Documentation | | |
| Infra/DevOps | | |
| Performance | | |

**Overall Score:** [X/10]

## Top 3 Critical Risks
1. [Risk 1: description + impact if not resolved]
2. [Risk 2]
3. [Risk 3]

## Estimated Technical Debt
- Total identified: [N eng-days]
- High priority: [N eng-days]
- Deadline to address before real risk: [estimate]

## Recommendations
[Ordered by urgency]

## As-Is vs. Could-Be Comparison
| Dimension | Today | With 3 months of M3A Team |
|---|---|---|
```

### 3.2 Assessment review

```
runSubagent("M3A: Security", "review assessment — add security context —
  confirmed CVEs, OWASP violations, current attack surface")
  
runSubagent("M3A: Architect", "review assessment with architecture lens —
  add: architectural debts, modernization opportunities")
```

---

## PHASE 4 — Dependency Audit

### 4.1 Run /m3a-dependency-audit

```
runSubagent("M3A: Security", "/m3a-dependency-audit —
  project: {{PROJECT_NAME}} —
  output: docs/security/cve-audit-[date].md + .github/mma/knowledge/dependencies.md")
```

**Output checklist:**
- [ ] CRITICAL CVEs cataloged with CVSS score
- [ ] HIGH CVEs cataloged
- [ ] EOL components identified with EOL date
- [ ] Licenses audited (no contaminating GPL)

---

## PHASE 5 — Prioritization Matrix

### 5.1 Generate modernization matrix

```
runSubagent("M3A: PM", "generate modernization prioritization matrix —
  inputs: assessment + cve-audit + technical-debt —
  criteria: urgency × impact × effort × risk —
  output: .github/mma/knowledge/priority-matrix.md")
```

### Matrix Structure

```markdown
# Prioritization Matrix — {{PROJECT_NAME}}

## Prioritization Criteria
| Criterion | Weight | Scale |
|---|---|---|
| Urgency (deadline/risk) | 40% | 1-5 |
| Business impact | 30% | 1-5 |
| Ease of execution | 20% | 1-5 (5=easy) |
| Regression risk | 10% | 1-5 (5=low risk) |

## Prioritized Items
| # | Topic | Urgency | Impact | Ease | Risk | Score | Candidate epic |
|---|---|---|---|---|---|---|---|
| 1 | CVE-XXXX in [component] | 5 | 5 | 3 | 2 | 4.4 | EPIC-001 |

## Modernization Roadmap (Draft)
| Horizon | Topic | Epics | Estimate |
|---|---|---|---|
| Immediate (Sprint 1-2) | [critical topic] | [epics] | [eng-days] |
| Short term (1-3 months) | | | |
| Medium term (3-6 months) | | | |
```

### 5.2 Matrix approval by human

```
⚠️ MANDATORY GATE: Matrix must be validated by the human.

"Prioritization matrix at .github/mma/knowledge/priority-matrix.md
Confirm prioritization? (or reorganize according to your business priorities)"
```

---

## PHASE 6 — Improvement Epic Creation

```
runSubagent("M3A: PM", "create modernization epics for {{PROJECT_NAME}} —
  based on approved prioritization matrix —
  output: .github/mma/backlog/epics/EPIC-NNN-*.md")
```

### 6.1 Multi-agent review of epics

Each epic goes through a 12-agent review before `status: approved`.

---

## PHASE 7 — Sprint 1

```
runSubagent("M3A: Scrum Master", "plan Sprint 1 for {{PROJECT_NAME}} —
  priority: highest-urgency approved epics —
  MANDATORY: include pre-condition stories (baseline regression tests) —
  output: .github/mma/backlog/stories/ + sprint-status.yaml")
```

---

## Special Rule for Legacy Projects

For `project.type: legacy`, apply:

```
LEGACY FIRST PRINCIPLES:
1. Never refactor without existing regression tests first
2. Never update dependencies in cascade — 1 per sprint
3. Always maintain backward compatibility (no public API broken without an ADR)
4. Document BEFORE implementing
5. Every production change must have a tested rollback
```

---

## Changelog

**v1.0.0 (2026-04-11)** — Workflow created. 7 phases for onboarding existing/legacy projects.
