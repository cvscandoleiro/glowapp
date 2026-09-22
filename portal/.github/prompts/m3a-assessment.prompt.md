---
description: "MMA Assessment — Full technical diagnosis: module inventory, technical debt map, CVE/EOL summary, risk register, and modernization recommendations. Layer 1: assessment-report.md. Layer 2: HTML executive summary."
agent: "agent"
---

# /m3a-assessment — Full Technical Assessment

> **Comprehensive project health check.**
> Module inventory + debt + CVEs + risks + recommendations.

---

## Behavior Rule

- **Systematic** — follows a structured assessment framework
- **Multi-agent** — coordinates Analyst, Architect, Security, DevOps, DBA
- **Two layers** — Layer 1 (technical report) + Layer 2 (executive HTML)
- **Read-only** — assesses only, never modifies code

---

## STEP 0 — Verify Context

```
IF .github/mma/config.yaml DOES NOT EXIST:
  → "⚠️ Run /m3a-init first."
  → STOP

Read:
  - .github/mma/config.yaml → stack, project type
  - .github/mma/knowledge/ → existing knowledge (avoid re-scanning)
```

---

## STEP 1 — Assessment Scope

```
"What is the scope of this assessment?

[1] Full assessment — all modules, all dimensions
[2] Module-specific — assess only [module name]
[3] Dimension-specific — only security, or only architecture, etc.
[4] Pre-migration — focused on migration readiness

Depth?
[1] Quick overview (1 session)
[2] Standard (2-3 sessions) ← recommended
[3] Deep dive (4+ sessions)"
```

---

## STEP 2 — Multi-Agent Analysis

```
runSubagent("M3A: Analyst",   "full assessment: module inventory + technical debt for {{PROJECT_NAME}}")
runSubagent("M3A: Architect", "full assessment: architectural health for {{PROJECT_NAME}}")
runSubagent("M3A: Security",  "full assessment: CVE scan + security posture for {{PROJECT_NAME}}")
runSubagent("M3A: DevOps",    "full assessment: infrastructure + CI/CD health for {{PROJECT_NAME}}")
runSubagent("M3A: DBA",       "full assessment: database health + schema analysis for {{PROJECT_NAME}}")
```

---

## STEP 3 — Generate Assessment Report (Layer 1)

```markdown
# Technical Assessment: {{PROJECT_NAME}}

**Date:** {{DATE}}
**Version:** {{VERSION_CURRENT}}
**Assessed by:** M3A Team (5 agents)

## Executive Summary
[2-3 paragraph overview of project health]

## 1. Module Inventory
| Module | LOC | Language | Framework | Health | Notes |
|---|---|---|---|---|---|

## 2. Technical Debt Map
| Debt Item | Module | Severity | Effort to Fix | Priority |
|---|---|---|---|---|

## 3. CVE / Security Summary
| CVE | Dependency | Severity | Status |
|---|---|---|---|

## 4. EOL Risk Calendar
| Component | Version | EOL | Urgency |
|---|---|---|---|

## 5. Architecture Health
[Architectural observations, coupling analysis, patterns]

## 6. Infrastructure & CI/CD
[Pipeline health, deployment patterns, container status]

## 7. Database Health
[Schema quality, query performance, migration status]

## 8. Risk Register
| Risk | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|

## 9. Recommendations
### Immediate
1. [action]

### Short-term (1-3 sprints)
1. [action]

### Medium-term (1-2 quarters)
1. [action]

## 10. Suggested Epics
- EPIC: [title] — [brief description]
```

---

## STEP 4 — Generate Executive Summary (Layer 2)

If `docs.mode` includes HTML, generate `docs/html/assessment-executive.html` with Minsait branding.

---

## STEP 5 — Output

Save to:
- `docs/assessment-report.md` — full technical report
- `docs/html/assessment-executive.html` — executive summary (if HTML mode)
- `.github/mma/knowledge/` — update relevant knowledge files

```
✅ Assessment complete:
  Layer 1: docs/assessment-report.md
  Layer 2: docs/html/assessment-executive.html
  Findings: [N] debt items, [N] CVEs, [N] risks
```

---

## Changelog

**v1.0.0 (2026-04-24)** — Skill created. Multi-agent technical assessment with two output layers.
