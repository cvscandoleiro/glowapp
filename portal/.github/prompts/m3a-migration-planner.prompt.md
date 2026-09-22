---
description: "MMA Migration Planner — Creates a full stack migration plan: AS-IS baseline, TO-BE target, gap analysis, risk matrix, phased roadmap, rollback strategy. Does NOT execute code rewrites — produces plan for human approval only."
agent: "agent"
---

# /m3a-migration-planner — Stack Migration Plan

> **Plan before you migrate. Never auto-rewrite.**
> AS-IS → TO-BE → Gap → Risk → Roadmap → Rollback.

---

## Fundamental Rule (INVIOLABLE)

```
/m3a-migration-planner:
  1. ANALYZE — current state (AS-IS)
  2. DESIGN — target state (TO-BE)
  3. GAP — what needs to change
  4. RISK — what can go wrong
  5. PLAN — phased roadmap with milestones
  6. ROLLBACK — how to undo at every phase
  7. WAIT — EXPLICIT human approval

NEVER auto-executes migration. NEVER rewrites code without an approved story.
```

---

## STEP 0 — Verify Context

```
IF .github/mma/config.yaml DOES NOT EXIST:
  → "⚠️ Run /m3a-init first."
  → STOP

Read:
  - .github/mma/config.yaml → current stack
  - .github/mma/knowledge/project-architecture.md → current modules
  - .github/mma/knowledge/dependencies.md → dependency inventory
```

---

## STEP 1 — Migration Scope

```
"What migration are you planning?

1. What is the current state? (e.g., Java 8 + JSP + Oracle)
2. What is the target state? (e.g., Java 17 + Vue.js + PostgreSQL)
3. What is the deadline or constraint? (e.g., Oracle EOL in 6 months)
4. What is the migration driver? (cost, performance, security, EOL, modernization)
5. Are there components that MUST NOT change? (frozen zones)"
```

---

## STEP 2 — Multi-Agent Analysis

```
runSubagent("M3A: Analyst",   "AS-IS baseline for migration: [scope]")
runSubagent("M3A: Architect", "TO-BE design for migration: [scope]")
runSubagent("M3A: Security",  "security implications of migration: [scope]")
runSubagent("M3A: DBA",       "database migration assessment: [scope]")
runSubagent("M3A: DevOps",    "infrastructure impact of migration: [scope]")
```

---

## STEP 3 — Generate Migration Plan

```markdown
# Migration Plan: [Title]

**Date:** {{DATE}}
**Project:** {{PROJECT_NAME}}
**Status:** Draft — requires human approval

## 1. AS-IS Baseline
[Current state summary from Descartes]

## 2. TO-BE Target
[Target architecture from Vitruvius]

## 3. Gap Analysis
| Component | Current | Target | Effort | Risk |
|---|---|---|---|---|

## 4. Risk Matrix
| Risk | Probability | Impact | Mitigation |
|---|---|---|---|

## 5. Phased Roadmap
### Phase 1: [Name] (Sprint N – N+X)
- [Deliverables]
- [Milestone]
- [Rollback point]

### Phase 2: [Name] (Sprint N+X – N+Y)
- [Deliverables]
- [Milestone]
- [Rollback point]

## 6. Rollback Strategy
[Per-phase rollback procedures]

## 7. Success Criteria
[Measurable criteria for migration completion]
```

---

## STEP 4 — Output

Save to: `docs/migration-plan.md`

```
✅ Migration plan created: docs/migration-plan.md
⚠️ Status: DRAFT — human approval required before any execution.
```

---

## Changelog

**v1.0.0 (2026-04-24)** — Skill created. Multi-agent migration planning with mandatory human approval.
