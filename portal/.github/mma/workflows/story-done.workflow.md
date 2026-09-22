---
description: "Story completion quality gate. Triggered by M3A: Scrum Master at story closure. Coordinates QA, Security, Developer, Architect and Docs agents in parallel. Blocks story closure if any veto is raised."
workflow-id: "story-done"
workflow-version: "1.0.0"
command: "/m3a-story-done"
author: "Edimar Ferla de Almeida"
organization: "Minsait (Indra Company)"
last-updated: "2026-04-24"
---

# Workflow: Story Done Gate (`/m3a-story-done`)

> **Every story closure goes through this gate — no exceptions.**
> Surgical review scoped to the changes delivered in this story only.

---

## Fundamental Rule

```
A story is ONLY closed when:
1. All reviewing agents have responded (✅ / ⚠️ / ❌ / N/A)
2. Zero ❌ verdicts remain open
3. Marcus Aurelius has issued the final consolidation

IF any step is skipped → the story is NOT closed.
```

---

## Trigger

### Primary — Via Scrum Master (recommended)

When human requests story closure, Deming triggers this gate automatically:

```
Human: "close story STORY-NNN"
→ M3A: Scrum Master verifies story is in status: in-progress or review
→ M3A: Scrum Master calls: runSubagent("M3A: Orchestrator", "/m3a-story-done STORY-NNN")
→ Marcus Aurelius runs the gate
→ Gate result determines if story is actually closed in sprint-status.yaml
```

### Fallback — Manual
```
Human: "/m3a-story-done STORY-NNN"
→ Marcus Aurelius runs the gate directly
```

---

## PHASE 1 — Pre-flight Check

```
Marcus Aurelius reads:
  1. .github/mma/backlog/stories/STORY-NNN.md       → story exists and has ACs?
  2. .github/mma/backlog/sprints/sprint-status.yaml  → story is in current sprint?
  3. story status                             → must be in-progress or review (not pending/done)

IF story not found         → ❌ BLOCKED: "STORY-NNN not found in backlog."
IF story already done      → ⚠️ WARNING: "STORY-NNN is already closed. Re-review?"
IF story not in sprint     → ❌ BLOCKED: "STORY-NNN is not in the active sprint."
IF no ACs defined          → ❌ BLOCKED: "Story has no Acceptance Criteria. Define ACs first."

Conditional agent inclusion (based on story content keywords):
  story contains "schema|migration|database|table|query" → include M3A: DBA
  story contains "docker|pipeline|ci|cd|infra|deploy"   → include M3A: DevOps
  story contains "ui|frontend|screen|component|ux|css"  → include M3A: UX
```

---

## PHASE 2 — Parallel Agent Review

### Handoff Protocol (Pipeline Efficiency)

Each reviewing agent writes its output to `handoff/[step]-[agent]-output.md` (≤ 500 tokens).
The Orchestrator reads handoff files when consolidating — not the full agent output.

**Agents receive (scope-locked input):**
- Artifact Summary (~200 tokens) — NOT the full story file
- Their own specialization instructions
- NOT: full knowledge base, other agents' verdicts

**Handoff location:** `.github/mma/handoff/` (cleared after gate closes)

Marcus Aurelius dispatches all reviewing agents simultaneously:

```
runSubagent("M3A: QA",        "story-done review: STORY-NNN — verify ACs and test coverage")
runSubagent("M3A: Security",  "story-done review: STORY-NNN — verify no vulnerability introduced")
runSubagent("M3A: Developer", "story-done review: STORY-NNN — verify conventions and no regression")
runSubagent("M3A: Architect", "story-done review: STORY-NNN — verify no architectural debt introduced")
runSubagent("M3A: Docs",      "story-done review: STORY-NNN — verify documentation needs")

// Conditional:
IF DBA triggered  → runSubagent("M3A: DBA",     "story-done review: STORY-NNN — verify schema changes")
IF DevOps triggered → runSubagent("M3A: DevOps","story-done review: STORY-NNN — verify infra changes")
IF UX triggered   → runSubagent("M3A: UX",      "story-done review: STORY-NNN — verify UI/UX changes")
```

### Review scope per agent

**M3A: QA (Popper)**
- Are all ACs covered by the implementation?
- Are tests written for the changes (unit + integration as applicable)?
- Is the DoD checklist satisfied?
- Any edge case missing in test coverage?

**M3A: Security (Hobbes)**
- Does the code introduce any OWASP Top 10 vulnerability?
- Are sensitive data or credentials properly handled?
- Is input validated at system boundaries?
- Does the change expand the attack surface?

**M3A: Developer (Knuth)**
- Does the code follow project conventions (`.github/mma/knowledge/project-conventions.md`)?
- Is there visible regression risk in adjacent modules?
- Is complexity appropriate — no over-engineering or under-engineering?
- Are there TODOs, dead code, or commented-out blocks that should not be committed?

**M3A: Architect (Vitruvius)**
- Does the implementation respect the defined TO-BE architecture?
- Was any architectural decision bypassed or ignored?
- Is technical debt introduced that should be tracked?

**M3A: Docs (Borges)**
- Does any documentation need updating as a result of this story?
- Knowledge base, runbooks, API docs, or portal content affected?

---

## PHASE 3 — Verdict per Agent

Each agent returns exactly one of:

| Verdict | Meaning | Blocks closure? |
|---|---|---|
| `✅ APPROVED` | Story meets all criteria for this dimension | No |
| `⚠️ WARNING [items]` | Pending items found, non-blocking | No — human decides |
| `❌ BLOCKED: [reason]` | Critical issue — story cannot be closed | **YES** |
| `N/A` | Dimension does not apply to this story | No |

---

## PHASE 4 — Consolidation by Orchestrator

```
ALL ✅ or N/A:
  → Status: ✅ STORY DONE
  → Instruct Deming: update sprint-status.yaml story status = done
  → Heartbeat: ⚡ Marcus Aurelius | EXEC → story STORY-NNN closed

Any ⚠️, zero ❌:
  → Status: ⚠️ STORY DONE WITH WARNINGS
  → Report warnings in chat
  → Ask: "Close story despite warnings, or address them first?"
  → Await human decision. Do NOT auto-close.

Any ❌:
  → Status: ❌ STORY BLOCKED
  → Do NOT close story
  → Report all veto agents + unblocking conditions
  → Story remains in status: review until veto is resolved
```

---

## PHASE 5 — Output in Chat

```
⚡ Marcus Aurelius | EXEC → story-done gate STORY-NNN

| Agent      | Result | Note                                    |
|------------|--------|-----------------------------------------|
| QA         | ✅     | All ACs covered, tests passing          |
| Security   | ❌     | SQL injection risk in UserDAO.java      |
| Developer  | ⚠️     | Missing null-check in service layer     |
| Architect  | ✅     | No architectural debt detected          |
| Docs       | ⚠️     | knowledge/user-module.md needs update   |

Status: ❌ STORY BLOCKED
Unblocking condition: Fix SQL injection in UserDAO.java (Security veto — Hobbes)
```

---

## Re-review after fix

After the developer fixes the veto:

```
Human: "/m3a-story-done STORY-NNN"   (or "re-review story STORY-NNN")
→ Gate runs again from PHASE 2
→ Only agents with ❌ or ⚠️ need to re-review (Orchestrator may skip ✅ agents)
```

---

## Versioning Rule

When updated: (1) increment `workflow-version` in frontmatter, (2) update `last-updated`, (3) entry in `CHANGELOG.md`.
