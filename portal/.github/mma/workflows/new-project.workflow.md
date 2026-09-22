---
description: "Complete workflow for starting a new project from scratch with M3A Team. Includes: /m3a-init, brainstorming, mandatory PRD, C4 architecture design, stack decision, ADRs, epic creation, and sprint planning."
workflow-id: "new-project"
workflow-version: "1.0.0"
author: "Edimar Ferla de Almeida"
organization: "Minsait (Indra Company)"
last-updated: "2026-04-11"
---

# Workflow: New Project from Scratch

> **Estimated duration:** 3-5 working sessions  
> **Triggered by:** Orchestrator when `project.type = new` or `project.type = greenfield`  
> **Prerequisite:** None — this workflow creates everything from scratch

---

## Phase Overview

```
PHASE 1: Setup          → /m3a-init + .github/mma/ structure
PHASE 2: Discovery      → PM + Architect + UX brainstorming
PHASE 3: PRD            → Mandatory requirements document
PHASE 4: Architecture   → C4 design + stack decision
PHASE 5: ADRs           → Documented technical decisions
PHASE 6: Epics          → Creation and multi-agent review
PHASE 7: Sprint 1       → First sprint planning
```

---

## PHASE 1 — Initial Setup

### 1.1 Run /m3a-init

```
runSubagent("M3A: Orchestrator", "/m3a-init — new project")
```

Deliver: `.github/mma/config.yaml` populated with `project.type: new`

### 1.2 Completeness check

Before advancing to PHASE 2, confirm:
- [ ] `.github/mma/config.yaml` exists with stack defined
- [ ] `.github/mma/knowledge/team-config.md` exists with 13 Laws
- [ ] `.github/mma/backlog/sprints/sprint-status.yaml` exists

---

## PHASE 2 — Product Brainstorming

### 2.1 Discovery session (PM + Architect + UX)

```
Mandatory participants:
- M3A: PM (Drucker) — product vision, problem to solve, personas
- M3A: Architect (Vitruvius) — technical feasibility, candidate stacks
- M3A: UX (Norman) — personas, user journeys, UI complexity

runSubagent("M3A: PM", "product discovery session —
  identify: core problem, personas, MVP scope, out-of-scope —
  output: PRD draft at .github/mma/knowledge/prd-draft.md")
  
runSubagent("M3A: Architect", "evaluate technical feasibility of the product —
  identify: stack candidates, initial candidate architecture, NFRs —
  output: technical section of PRD + stack candidates")
  
runSubagent("M3A: UX", "define personas and user journeys —
  identify: target users, critical use cases, 
  required frontend complexity —
  output: personas section of PRD")
```

### 2.2 PHASE 2 output checklist

- [ ] Business problem defined in 1 paragraph
- [ ] Personas identified (minimum 2)
- [ ] MVP scope defined: IN and OUT
- [ ] Stack candidates identified (2-3 options)

---

## PHASE 3 — PRD (Product Requirements Document)

### 3.1 PRD is MANDATORY for new projects

```
runSubagent("M3A: PM", "create complete PRD for {{PROJECT_NAME}} —
  based on PHASE 2 draft —
  output: .github/mma/knowledge/prd.md — status: draft")
```

### PRD Structure

```markdown
---
prd-version: "1.0"
project: "{{PROJECT_NAME}}"
status: draft
---

## 1. Executive Summary
[1 paragraph: what the product solves, for whom, what the impact is]

## 2. Problem
[Business problem statement — 5W2H]

## 3. Product Objective
[SMART objective: specific, measurable, achievable, relevant, time-bound]

## 4. Personas
| Persona | Profile | Primary need | Pain points |
|---|---|---|---|

## 5. Features: MVP Scope
### 5.1 IN (mandatory for v1)
- [Feature 1]

### 5.2 OUT (outside MVP)
- [Excluded feature]

## 6. Non-Functional Requirements (NFRs)
| NFR | Requirement | Criticality |
|---|---|---|
| Performance | Response time < 2s p95 | High |
| Security | Authentication + authorization | Critical |
| Availability | 99.5% uptime | High |

## 7. Success Metrics
| Metric | Baseline | MVP Target | Deadline |
|---|---|---|---|

## 8. Constraints
- Deadline: [if applicable]
- Budget: [if relevant]
- Mandatory stack: [if client defined one]

## 9. Main Risks
| Risk | Probability | Impact | Mitigation |
|---|---|---|---|

## 10. Approval
- Requester: [name]
- Approved by: ___
- Date: ___
```

### 3.2 PRD Review

```
runSubagent("M3A: Security", "review PRD with security lens —
  identify: missing security NFRs, required compliance —
  output: comments in PRD Security Review section")

runSubagent("M3A: Architect", "review PRD with technical lens —
  identify: implicit undocumented NFRs, stack risks —
  output: comments in PRD Tech Review section")
```

### 3.3 PRD Approval

```
⚠️ MANDATORY GATE: PRD must be approved by the human before continuing.

Present to human: "PRD at .github/mma/knowledge/prd.md
Status: draft — requires your approval to continue.
Confirm PRD? (or request specific adjustments)"

IF approved → update status: approved + approved-by + approved-at
IF not approved → iterate per feedback
```

---

## PHASE 4 — Architecture Design

### 4.1 Stack Decision

```
runSubagent("M3A: Architect", "propose stack decision for {{PROJECT_NAME}} —
  candidates identified in PHASE 2 —
  analysis: performance, maintainability, team expertise, ecosystem —
  output: ADR-001-stack-decision.md at .github/mma/decisions/")
```

### 4.2 Initial Architecture (C4 Model)

```
runSubagent("M3A: Architect", "initial C4 architecture design for {{PROJECT_NAME}} —
  based on approved PRD and decided stack —
  deliver:
    L1: Context diagram (system and external actors)
    L2: Container diagram (services, database, frontend)
  output: .github/mma/knowledge/project-architecture.md")
```

### 4.3 Architecture Review

```
runSubagent("M3A: Security", "security design review of the architecture —
  verify: authentication, authorization, OWASP A04 (Insecure Design) —
  output: Security section in architecture doc")

runSubagent("M3A: DBA", "review initial data model —
  verify: normalization, indexes, connection to domain model —
  output: DB section in architecture doc")
```

---

## PHASE 5 — Initial ADRs

Minimum 3 ADRs for new projects:

```
runSubagent("M3A: Architect", "create initial ADRs:
  ADR-001: Stack decision (language + framework + DB)
  ADR-002: Authentication/authorization strategy
  ADR-003: Deployment strategy (cloud/on-prem/hybrid)
  output: .github/mma/decisions/ADR-00N-*.md")
```

---

## PHASE 6 — Epic Creation

```
runSubagent("M3A: PM", "create MVP epics based on approved PRD:
  - Setup/infrastructure epic
  - One epic per product domain (1 epic per main area)
  - Security baseline epic
  output: .github/mma/backlog/epics/EPIC-NNN-*.md")
```

### 6.1 Multi-agent review of epics

For each created epic:
- Distribute to all 12 agents for review
- Consolidate ✅/⚠️/❌
- Status `approved` only with zero ❌

---

## PHASE 7 — Sprint 1 Planning

```
runSubagent("M3A: Scrum Master", "plan Sprint 1 for {{PROJECT_NAME}} —
  available approved epics: [list]
  priority: setup + foundations + first business feature —
  output: 
    .github/mma/backlog/stories/STORY-NNN-*.md (5-8 stories)
    .github/mma/backlog/sprints/sprint-status.yaml (updated)")
```

---

## Workflow Completion Criteria

```
□ config.yaml exists and is complete
□ PRD approved by human
□ ADR-001 (stack) approved
□ C4 L1 + L2 architecture documented
□ Minimum 1 approved epic
□ Sprint 1 planned with stories
□ Quality gates configured
```

---

## Changelog

**v1.0.0 (2026-04-11)** — Workflow created. 7 complete phases. Mandatory PRD. Multi-agent review.
