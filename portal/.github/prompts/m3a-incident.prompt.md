---
description: "MMA Incident — Activates Incident War Room with all 12 agents in collaborative mode. Produces incident log, root cause analysis, mitigation steps, lessons learned. MUST be triggered explicitly by a human — Law 5."
agent: "agent"
---

# /m3a-incident — Incident War Room

> **All 12 agents mobilized. Human-only trigger. Law 5 enforced.**
> Incident log → RCA → Mitigation → Lessons learned.

---

## Fundamental Rule (INVIOLABLE)

```
/m3a-incident can ONLY be triggered by a human.
No agent may auto-activate this skill — Law 5: War Room = Human Only.
```

---

## STEP 0 — Verify Context

```
IF .github/mma/config.yaml DOES NOT EXIST:
  → "⚠️ Run /m3a-init first."
  → STOP

Verify trigger source:
  → MUST be explicit human command
  → If triggered by another agent → ❌ BLOCKED: "Law 5 — War Room requires human trigger."
```

---

## STEP 1 — Incident Registration

```
"🚨 Incident War Room activated.

1. What is the incident? (brief description)
2. When did it start? (timestamp or approximate)
3. What is the impact? (users affected, services down, data at risk)
4. What is the current severity?
   [1] Critical — production down, data loss risk
   [2] High — major feature broken, workaround exists
   [3] Medium — degraded performance, non-critical feature affected
   [4] Low — minor issue, no user impact
5. What has been tried so far?"
```

---

## STEP 2 — War Room Dispatch

All 12 agents analyze the incident in parallel:

```
runSubagent("M3A: Analyst",   "incident analysis: [description] — affected modules and dependencies")
runSubagent("M3A: Architect", "incident analysis: [description] — architectural root cause candidates")
runSubagent("M3A: Developer", "incident analysis: [description] — code-level root cause candidates")
runSubagent("M3A: DBA",       "incident analysis: [description] — database state and query issues")
runSubagent("M3A: DevOps",    "incident analysis: [description] — infrastructure and deployment state")
runSubagent("M3A: Security",  "incident analysis: [description] — security breach indicators")
runSubagent("M3A: QA",        "incident analysis: [description] — test gaps that allowed this")
```

---

## STEP 3 — Generate Incident Report

```markdown
# Incident Report: [Title]

**ID:** INC-[date]-[seq]
**Date:** {{DATE}}
**Severity:** [Critical / High / Medium / Low]
**Status:** Open → Investigating → Mitigated → Resolved → Closed
**Duration:** [start] → [end]

## Timeline
| Time | Event | Actor |
|---|---|---|
| [time] | Incident detected | [who] |
| [time] | War room activated | Human |
| [time] | Root cause identified | [agent] |
| [time] | Mitigation applied | [agent] |
| [time] | Service restored | [agent] |

## Root Cause Analysis
[Consolidated from all agent analyses]

### Contributing Factors
1. [factor]
2. [factor]

## Mitigation Steps
1. [immediate action taken]
2. [follow-up action]

## Impact Assessment
- Users affected: [count/scope]
- Data loss: [yes/no — details]
- Financial impact: [if applicable]

## Lessons Learned
1. [lesson]
2. [lesson]

## Prevention Actions
| Action | Owner | Deadline | Status |
|---|---|---|---|
| [action] | [agent/team] | [date] | Pending |

## Knowledge Base Updates
- [ ] Update `.github/mma/knowledge/` with new findings
- [ ] Create ADR if architectural decision was made
- [ ] Update security baseline if vulnerability was found
- [ ] Add regression test for the specific failure
```

---

## STEP 4 — Output

Save to: `docs/incidents/incident-[date]-[slug].md`
Update: `.github/mma/knowledge/` with lessons learned.

```
✅ Incident report created: docs/incidents/incident-[date]-[slug].md
⚠️ Ensure all prevention actions are tracked as stories.
```

---

## Changelog

**v1.0.0 (2026-04-24)** — Skill created. War Room incident protocol with mandatory human trigger.
