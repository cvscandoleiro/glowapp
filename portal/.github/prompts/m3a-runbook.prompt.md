---
description: "MMA Runbook — Generates operational runbooks for specific procedures. Structure: prerequisites, step-by-step, verification, rollback, escalation. Human must review before marking as production-ready."
agent: "agent"
---

# /m3a-runbook — Generate Operational Runbook

> **Step-by-step operational procedures — safe, repeatable, reviewable.**
> Always includes rollback and escalation paths.

---

## Behavior Rule

- **Template-driven** — uses `templates/markdown/runbook.md`
- **Complete** — every runbook MUST have rollback steps
- **Environment-aware** — adapts to the project's deploy target
- **Human-reviewed** — marked as `draft` until human approves

---

## STEP 0 — Verify Context

```
IF .github/mma/config.yaml DOES NOT EXIST:
  → "⚠️ Run /m3a-init first."
  → STOP

Read:
  - .github/mma/config.yaml → stack, deploy target, CI/CD platform
  - .github/mma/knowledge/project-architecture.md → infrastructure context
```

---

## STEP 1 — Runbook Scope

```
"What procedure does this runbook cover?

Examples:
- Deploy to production
- Database migration rollback
- Certificate renewal
- Incident escalation
- Service restart procedure
- Data backup and restore

Describe the procedure:"
```

---

## STEP 2 — Generate Runbook

```markdown
# Runbook: [Procedure Name]

**Status:** Draft — requires human review before production use
**Date:** {{DATE}}
**Author:** M3A: DevOps (Atlas) + M3A: Docs (Borges)
**Project:** {{PROJECT_NAME}}
**Environment:** [production / staging / all]

## Prerequisites

- [ ] [Access/permission requirement]
- [ ] [Tool/CLI requirement]
- [ ] [Environment requirement]

## Procedure

### Step 1 — [Action]
```
[command or action]
```
**Expected result:** [what should happen]
**If it fails:** [go to Rollback section]

### Step 2 — [Action]
```
[command or action]
```
**Expected result:** [what should happen]

### Step N — Verification
```
[verification command]
```
**Success criteria:** [how to know it worked]

## Rollback

### If Step 1 fails:
[rollback instructions]

### If Step 2 fails:
[rollback instructions]

### Full rollback:
[complete rollback to initial state]

## Escalation

| Condition | Action | Contact |
|---|---|---|
| Procedure fails after rollback | Escalate to [team/person] | [contact] |
| Data loss detected | Activate incident protocol | [contact] |
| Service unavailable > 15 min | Notify stakeholders | [contact] |

## History

| Date | Change | Author |
|---|---|---|
| {{DATE}} | Initial version | M3A Team |
```

---

## STEP 3 — Output

Save to: `docs/runbooks/runbook-[slug].md`

```
✅ Runbook created: docs/runbooks/runbook-[slug].md
⚠️ Status: DRAFT — human review required before production use.
```

---

## Changelog

**v1.0.0 (2026-04-24)** — Skill created. Operational runbook with mandatory rollback and escalation.
