---
description: "MMA Troubleshooting — Structured diagnosis skill. Follows symptoms → probable causes → fixes → prevention. Produces a troubleshooting report artifact, not chat narration. Use for runtime errors, build failures, integration issues."
agent: "agent"
---

# /m3a-troubleshooting — Structured Diagnosis

> **Symptoms → Probable causes → Fixes → Prevention.**
> Produces a troubleshooting report — not a chat conversation.

---

## Behavior Rule

- **Artifact-first** — output goes to a `.md` file, not chat
- **Structured** — always follow the 4-phase template
- **Evidence-based** — cite logs, stack traces, config values
- **Non-destructive** — suggest fixes, never auto-apply without confirmation

---

## STEP 0 — Verify Context

```
IF .github/mma/config.yaml DOES NOT EXIST:
  → "⚠️ Run /m3a-init first."
  → STOP

Read project context: stack, runtime, framework, known issues from knowledge base.
```

---

## STEP 1 — Symptom Collection

```
"Describe the problem you are experiencing:

1. What is happening? (error message, unexpected behavior)
2. When does it happen? (build, runtime, deploy, specific action)
3. Is it reproducible? (always, intermittent, only in specific environment)
4. What changed recently? (new dependency, config change, code change)

Paste any relevant error output or stack trace."
```

---

## STEP 2 — Automated Context Gathering

Before analysis, gather:

```
1. Read .github/mma/knowledge/project-architecture.md — current modules
2. Read .github/mma/knowledge/dependencies.md — dependency versions
3. If stack trace mentions a module → read that module's knowledge file
4. Check .github/mma/knowledge/project-conventions.md — coding patterns
5. If CI/CD related → check pipeline config
```

---

## STEP 3 — Diagnosis

Produce structured analysis:

```markdown
# Troubleshooting Report: [Issue Title]

**Date:** {{DATE}}
**Reporter:** [human]
**Project:** {{PROJECT_NAME}}
**Stack:** {{STACK_RUNTIME}} / {{STACK_FRAMEWORK}}

## 1. Symptoms
- [Observed behavior]
- [Error messages / stack traces]

## 2. Probable Causes (ranked by likelihood)
1. **[Most likely cause]** — [evidence]
2. **[Second cause]** — [evidence]
3. **[Third cause]** — [evidence]

## 3. Recommended Fixes
### Fix for Cause 1
- Steps: [detailed steps]
- Risk: [low/medium/high]
- Rollback: [how to undo]

### Fix for Cause 2
- Steps: [detailed steps]
- Risk: [low/medium/high]
- Rollback: [how to undo]

## 4. Prevention
- [What to change to prevent recurrence]
- [Monitoring / alerting suggestion]
- [Knowledge base update needed?]
```

---

## STEP 4 — Output

Save report to: `docs/troubleshooting/troubleshoot-[date]-[slug].md`

If the issue reveals a gap in the knowledge base → suggest updating `.github/mma/knowledge/`.

---

## Changelog

**v1.0.0 (2026-04-24)** — Skill created. Structured diagnosis flow with 4-phase template.
