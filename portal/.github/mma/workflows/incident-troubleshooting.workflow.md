---
description: "Workflow for incident troubleshooting (/m3a-incident). War Room protocol with all 12 agents. Human-only trigger enforced (Law 5). Produces incident report, root cause analysis, mitigation steps, and lessons learned."
workflow-id: "incident-troubleshooting"
workflow-version: "1.0.0"
command: "/m3a-incident"
author: "Edimar Ferla de Almeida"
organization: "Minsait (Indra Company)"
last-updated: "2026-04-24"
---

# Workflow: Incident Troubleshooting (/m3a-incident)

> **War Room protocol. All agents. Human trigger only.**
> Incident log → Root cause → Mitigation → Lessons learned.

---

## Fundamental Rule (Law 5)

```
This workflow can ONLY be activated by a human.
No agent may trigger this workflow autonomously.
Violation of this rule = Law 5 breach = immediate STOP.
```

---

## Pre-conditions

```
□ .github/mma/config.yaml exists
□ Explicit human command to activate
□ Incident description provided
```

---

## PHASE 1 — Incident Registration

Collect from human:
- Incident description
- Start time
- Impact scope (users, services, data)
- Severity (Critical / High / Medium / Low)
- Actions already taken

Create incident log: `docs/incidents/incident-[date]-[slug].md`

---

## PHASE 2 — War Room Analysis

All relevant agents analyze in parallel:

```
runSubagent("M3A: Analyst",   "incident: [description] — affected modules and dependencies")
runSubagent("M3A: Architect", "incident: [description] — architectural root cause candidates")
runSubagent("M3A: Developer", "incident: [description] — code-level root cause candidates")
runSubagent("M3A: DBA",       "incident: [description] — database state and query issues")
runSubagent("M3A: DevOps",    "incident: [description] — infrastructure and deployment state")
runSubagent("M3A: Security",  "incident: [description] — security breach indicators")
runSubagent("M3A: QA",        "incident: [description] — test gaps that allowed this")
```

---

## PHASE 3 — Root Cause Analysis

Marcus Aurelius consolidates all agent analyses:
1. Identify primary root cause
2. Identify contributing factors
3. Map the failure chain
4. Determine if this was preventable

---

## PHASE 4 — Mitigation

Based on root cause:
1. Immediate mitigation (stop the bleeding)
2. Short-term fix (restore service)
3. Long-term fix (prevent recurrence)

Each step requires human confirmation before execution.

---

## PHASE 5 — Post-Incident

1. Update incident report with resolution
2. Document lessons learned
3. Create prevention stories in backlog
4. Update knowledge base
5. Schedule post-mortem (if Critical/High)

---

## Outputs

- `docs/incidents/incident-[date]-[slug].md` — full incident report
- `.github/mma/knowledge/` — lessons learned integrated
- `.github/mma/backlog/stories/` — prevention stories created
- `.github/mma/decisions/` — ADR if architectural decision was made

---

## Changelog

**v1.0.0 (2026-04-24)** — Workflow created. War Room incident protocol with Law 5 enforcement.
