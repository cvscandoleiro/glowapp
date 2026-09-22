---
description: "MMA Risk Gates — Evaluates go/no-go gate criteria before major releases or migration phases. Produces a risk gate report with pass/fail per criterion and recommendation. ALWAYS requires explicit human approval."
agent: "agent"
---

# /m3a-risk-gates — Go/No-Go Gate Evaluation

> **Critical checkpoint before major releases or migration phases.**
> Multi-agent evaluation. Human decision required — no agent may auto-approve.

---

## Fundamental Rule (INVIOLABLE)

```
Risk Gates ALWAYS require explicit human approval.
No agent — not even the Orchestrator — may auto-approve a risk gate.
The human must provide a written go/no-go decision.
```

---

## STEP 0 — Verify Context

```
IF .github/mma/config.yaml DOES NOT EXIST:
  → "⚠️ Run /m3a-init first."
  → STOP

Read:
  - .github/mma/config.yaml → project phase, version
  - .github/mma/backlog/sprints/sprint-status.yaml → current state
  - .github/mma/knowledge/project-decisions-log.md → relevant decisions
  - docs/quality-gates.md → DoD checklist status
```

---

## STEP 1 — Gate Context

```
"What is this risk gate for?

[1] Major release (version X.Y.Z → production)
[2] Migration phase completion (Phase N → Phase N+1)
[3] Go-live decision
[4] Security gate (before exposing to external traffic)
[5] Custom — describe the gate"
```

---

## STEP 2 — Multi-Agent Evaluation

```
runSubagent("M3A: QA",        "risk gate evaluation: [context] — quality readiness")
runSubagent("M3A: Security",  "risk gate evaluation: [context] — security readiness")
runSubagent("M3A: Architect", "risk gate evaluation: [context] — architectural readiness")
runSubagent("M3A: DevOps",    "risk gate evaluation: [context] — infrastructure readiness")
```

---

## STEP 3 — Generate Risk Gate Report

```markdown
# Risk Gate Report: [Gate Title]

**Date:** {{DATE}}
**Project:** {{PROJECT_NAME}}
**Gate Type:** [release / migration / go-live / security]
**Version/Phase:** [version or phase]

## Evaluation Summary

| Criterion | Agent | Status | Notes |
|---|---|---|---|
| All tests pass | QA (Popper) | ✅/❌ | [details] |
| Zero CRITICAL CVEs | Security (Hobbes) | ✅/❌ | [details] |
| Architecture aligned | Architect (Vitruvius) | ✅/❌ | [details] |
| Infra ready | DevOps (Atlas) | ✅/❌ | [details] |
| Rollback tested | DevOps (Atlas) | ✅/❌ | [details] |
| Documentation complete | Docs (Borges) | ✅/❌ | [details] |
| Performance acceptable | QA (Popper) | ✅/❌ | [details] |

## Recommendation

**Overall:** GO / NO-GO / CONDITIONAL GO

[Justification from consolidated agent evaluations]

## Open Risks (if CONDITIONAL GO)

| Risk | Mitigation | Owner | Deadline |
|---|---|---|---|

## Human Decision

**Decision:** _________________ (GO / NO-GO)
**Date:** _________________
**Authorized by:** _________________
```

---

## STEP 4 — Output

Save to: `docs/risk-gate-report-[version].md`

```
✅ Risk gate report created: docs/risk-gate-report-[version].md
⚠️ HUMAN DECISION REQUIRED — no agent may approve. Fill the Decision section.
```

---

## Changelog

**v1.0.0 (2026-04-24)** — Skill created. Multi-agent risk gate with mandatory human approval.
