---
description: "Workflow for stack migration planning (/m3a-migration-planner). Multi-agent coordinated workflow: AS-IS baseline, TO-BE target, gap analysis, risk matrix, phased roadmap, rollback strategy. Requires human approval before any execution."
workflow-id: "migration-planner"
workflow-version: "1.0.0"
command: "/m3a-migration-planner"
author: "Edimar Ferla de Almeida"
organization: "Minsait (Indra Company)"
last-updated: "2026-04-24"
---

# Workflow: Migration Planner (/m3a-migration-planner)

> **Plan before you migrate. Execute only after human approval.**
> Multi-agent analysis → phased plan → rollback at every phase.

---

## Fundamental Rule

```
No migration step is executed without:
1. AS-IS baseline documented (Descartes)
2. TO-BE target designed (Vitruvius)
3. Gap analysis completed (all agents)
4. Risk matrix reviewed (Hobbes)
5. Phased roadmap with rollback points
6. Explicit human approval

IF any step is skipped → the migration plan is not valid.
```

---

## Pre-conditions

```
□ .github/mma/config.yaml exists
□ Knowledge base has project architecture (.github/mma/knowledge/project-architecture.md)
□ Dependency inventory available (or /m3a-dependency-audit run first)
```

---

## PHASE 1 — Scope Definition

Collect from human:
- Source stack (AS-IS)
- Target stack (TO-BE)
- Migration driver (EOL, cost, performance, modernization)
- Constraints (frozen components, deadlines, budget)
- Success criteria (measurable outcomes)

---

## PHASE 2 — Multi-Agent Analysis

### 2.1 AS-IS Baseline (Descartes)
```
runSubagent("M3A: Analyst", "AS-IS baseline for migration: [scope]")
```
Output: Module inventory, coupling map, dependency graph.

### 2.2 TO-BE Design (Vitruvius)
```
runSubagent("M3A: Architect", "TO-BE design for migration: [scope]")
```
Output: Target architecture, C4 diagrams, ADR candidates.

### 2.3 Security Impact (Hobbes)
```
runSubagent("M3A: Security", "security impact assessment for migration: [scope]")
```
Output: New attack surface, deprecated security controls, new requirements.

### 2.4 Database Impact (Codd)
```
runSubagent("M3A: DBA", "database migration assessment: [scope]")
```
Output: Schema changes needed, data migration strategy, compatibility risks.

### 2.5 Infrastructure Impact (Atlas)
```
runSubagent("M3A: DevOps", "infrastructure changes for migration: [scope]")
```
Output: New infra requirements, pipeline changes, deployment strategy.

---

## PHASE 3 — Gap Analysis

Consolidate all agent analyses into a gap matrix:

| Component | AS-IS | TO-BE | Gap | Effort | Risk |
|---|---|---|---|---|---|

---

## PHASE 4 — Phased Roadmap

Break the migration into phases, each with:
- Deliverables
- Duration estimate
- Dependencies
- Rollback point
- Success criteria for the phase

---

## PHASE 5 — Risk Matrix

| Risk | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|

---

## PHASE 6 — Human Approval Gate

```
Present the complete plan to human.
⚠️ HUMAN MUST APPROVE before any implementation begins.
No agent may auto-approve a migration plan.
```

---

## Outputs

- `docs/migration-plan.md` — complete migration plan
- `docs/risk-matrix.md` — risk matrix
- `.github/mma/decisions/ADR-NNN-migration-decision.md` — ADR for the migration decision
- `.github/mma/backlog/epics/` — epics created from migration phases (after approval)

---

## Changelog

**v1.0.0 (2026-04-24)** — Workflow created. Multi-agent migration planning with mandatory human approval.
