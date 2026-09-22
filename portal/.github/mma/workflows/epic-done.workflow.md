---
description: "Epic completion systemic quality gate. Triggered by M3A: Scrum Master at epic closure. All stories must be done first. Coordinates up to 9 agents in parallel with elevated veto powers. Blocks epic closure if any veto is raised."
workflow-id: "epic-done"
workflow-version: "1.0.0"
command: "/m3a-epic-done"
author: "Edimar Ferla de Almeida"
organization: "Minsait (Indra Company)"
last-updated: "2026-04-24"
depends-on: "story-done.workflow.md"
---

# Workflow: Epic Done Gate (`/m3a-epic-done`)

> **Every epic closure goes through this gate — no exceptions.**
> Systemic review of the consolidated impact of all stories delivered under the epic.
> More thorough than `story-done` — answers: "Is this epic truly complete and solid as a whole?"

---

## Fundamental Rule

```
An epic is ONLY closed when:
1. ALL stories under the epic have status: done (each passed story-done gate)
2. All reviewing agents have responded (✅ / ⚠️ / ❌ / N/A)
3. Zero ❌ verdicts remain open
4. Marcus Aurelius has issued the final consolidation

IF any story is still open → gate is BLOCKED before agent review even starts.
IF any agent raises ❌ → epic is NOT closed.
```

---

## Trigger

### Primary — Via Scrum Master (recommended)

When human requests epic closure, Deming triggers this gate automatically:

```
Human: "close epic EPIC-NNN"
→ M3A: Scrum Master reads sprint-status.yaml
→ M3A: Scrum Master checks all stories under EPIC-NNN are status: done
→ M3A: Scrum Master calls: runSubagent("M3A: Orchestrator", "/m3a-epic-done EPIC-NNN")
→ Marcus Aurelius runs the gate
→ Gate result determines if epic is actually closed
```

### Fallback — Manual
```
Human: "/m3a-epic-done EPIC-NNN"
→ Marcus Aurelius runs the gate directly
```

---

## PHASE 1 — Pre-flight Check

```
Marcus Aurelius reads:
  1. .github/mma/backlog/epics/EPIC-NNN.md           → epic exists, has ACs?
  2. .github/mma/backlog/sprints/sprint-status.yaml   → all stories done?
  3. .github/mma/backlog/stories/                     → list all stories for EPIC-NNN

IF epic not found              → ❌ BLOCKED: "EPIC-NNN not found in backlog."
IF epic already closed         → ⚠️ WARNING: "EPIC-NNN is already closed. Re-review?"
IF any story not done          → ❌ BLOCKED: "N story/stories still open:
                                   - STORY-NNN: [status]
                                   Close all stories first (/m3a-story-done for each)."
IF no ACs on epic              → ❌ BLOCKED: "Epic has no Acceptance Criteria. Define ACs first."

Conditional agent inclusion (based on epic content):
  Any story touched "schema|migration|database|table|query" → include M3A: DBA
  Any story touched "docker|pipeline|ci|cd|infra|deploy"   → include M3A: DevOps
  Any story touched "ui|frontend|screen|component|ux|css"  → include M3A: UX
```

---

## PHASE 2 — Parallel Agent Review

Marcus Aurelius dispatches all reviewing agents simultaneously:

```
// Always included:
runSubagent("M3A: QA",        "epic-done review: EPIC-NNN — verify all ACs and regression coverage")
runSubagent("M3A: Security",  "epic-done review: EPIC-NNN — verify full attack surface after epic")
runSubagent("M3A: Developer", "epic-done review: EPIC-NNN — verify accumulated technical debt")
runSubagent("M3A: Architect", "epic-done review: EPIC-NNN — verify TO-BE architectural alignment")
runSubagent("M3A: Docs",      "epic-done review: EPIC-NNN — verify portal and knowledge base completeness")
runSubagent("M3A: PM",        "epic-done review: EPIC-NNN — verify all epic acceptance criteria delivered")

// Conditional:
IF DBA triggered    → runSubagent("M3A: DBA",    "epic-done review: EPIC-NNN — verify final schema integrity")
IF DevOps triggered → runSubagent("M3A: DevOps", "epic-done review: EPIC-NNN — verify pipeline and infra state")
IF UX triggered     → runSubagent("M3A: UX",     "epic-done review: EPIC-NNN — verify end-to-end user flow")
```

### Review scope per agent

**M3A: QA (Popper)**
- Are ALL epic-level ACs covered across all stories?
- Is there an end-to-end test or integration test covering the epic's main flow?
- Is the regression suite complete and passing?
- Any acceptance criterion that was never tested?

**M3A: Security (Hobbes)**
- What is the full attack surface of the module/feature after the epic?
- Were any new exposure points introduced across the stories?
- Is a dependency audit recommended after this epic?
- Are secrets, credentials, and sensitive data properly handled across all stories?

**M3A: Developer (Knuth)**
- Is there accumulated technical debt across the epic's stories?
- Is the code consistent in conventions and style across all stories?
- Are there TODOs, tech debt markers, or deferred items that should be tracked?
- Was complexity managed appropriately across the epic lifecycle?

**M3A: Architect (Vitruvius)** ← elevated to veto for epics
- Is the system architecture still consistent with the TO-BE design after this epic?
- Were any architectural decisions bypassed or circumvented?
- Is an ADR required to document a decision made during implementation?
- Does the C4 diagram or architecture documentation need updating?

**M3A: Docs (Borges)**
- Is the documentation portal updated with the new module/feature?
- Is the knowledge base complete for the delivered epic?
- Are runbooks, API docs, or executive reports required?

**M3A: PM (Drucker)**
- Were ALL epic acceptance criteria delivered? Any left out of scope?
- Is the epic goal fully achieved from the product perspective?
- Should any deferred items become a new epic or backlog story?

**M3A: DBA (Codd)** — conditional
- Is the final database schema consistent and normalized?
- Are all migrations reversible and tested?
- Is there any data integrity risk after all stories?

**M3A: DevOps (Atlas)** — conditional
- Is the CI/CD pipeline still valid and functional after the epic?
- Is the infrastructure consistent with what was delivered?
- Is a deployment runbook needed?

**M3A: UX (Norman)** — conditional
- Does the full user flow work end-to-end after all stories?
- Is WCAG compliance maintained across the delivered screens?
- Are there usability issues that surfaced only at the epic level?

---

## PHASE 3 — Verdict per Agent

Each agent returns exactly one of:

| Verdict | Meaning | Blocks closure? |
|---|---|---|
| `✅ APPROVED` | Epic meets all criteria for this dimension | No |
| `⚠️ WARNING [items]` | Pending items found, non-blocking | No — human decides |
| `❌ BLOCKED: [reason]` | Critical issue — epic cannot be closed | **YES** |
| `N/A` | Dimension does not apply to this epic | No |

**Agents with veto power in epic-done** (elevated vs. story-done):

| Agent | Veto in story-done | Veto in epic-done |
|---|---|---|
| M3A: QA | ✅ Yes | ✅ Yes |
| M3A: Security | ✅ Yes | ✅ Yes |
| M3A: Developer | ✅ Yes | ✅ Yes |
| M3A: Architect | ⚠️ Warning only | ✅ **Elevated to veto** |
| M3A: DBA | ⚠️ Warning only | ✅ **Elevated to veto** (if included) |
| M3A: Docs | ⚠️ Warning only | ⚠️ Warning only |
| M3A: DevOps | ⚠️ Warning only | ⚠️ Warning only |
| M3A: UX | ⚠️ Warning only | ⚠️ Warning only |
| M3A: PM | Not included | ⚠️ Warning only |

---

## PHASE 4 — Consolidation by Orchestrator

```
ALL ✅ or N/A:
  → Status: ✅ EPIC DONE
  → Instruct Deming: update sprint-status.yaml epic status = done
  → Trigger M3A: Docs to generate executive summary (if docs.mode = portal or markdown+html)
  → Heartbeat: ⚡ Marcus Aurelius | EXEC → epic EPIC-NNN closed

Any ⚠️, zero ❌:
  → Status: ⚠️ EPIC DONE WITH WARNINGS
  → Report all warnings in chat
  → Ask: "Close epic despite warnings, or address them first?"
  → Await human decision. Do NOT auto-close.

Any ❌:
  → Status: ❌ EPIC BLOCKED
  → Do NOT close epic
  → Report all veto agents + unblocking conditions
  → Epic remains open until all vetoes are resolved
```

---

## PHASE 5 — Output in Chat

```
⚡ Marcus Aurelius | EXEC → epic-done gate EPIC-003

All 8 stories verified done ✅

| Agent      | Result | Note                                              |
|------------|--------|---------------------------------------------------|
| QA         | ✅     | All 12 ACs covered, regression suite passing      |
| Security   | ✅     | No new attack surface detected                    |
| Developer  | ⚠️     | 3 TODOs left in code — non-blocking               |
| Architect  | ❌     | Module X bypasses API gateway — ADR required      |
| Docs       | ⚠️     | Portal not updated with new module                |
| PM         | ✅     | All epic acceptance criteria delivered            |
| DBA        | ✅     | Schema consistent, all migrations reversible      |
| DevOps     | N/A    | No infrastructure changes in this epic            |
| UX         | N/A    | No frontend changes in this epic                  |

Status: ❌ EPIC BLOCKED
Unblocking condition: Architect veto — API gateway bypass in Module X.
Options: (a) fix the bypass, or (b) create ADR documenting the architectural decision.
```

---

## Post-closure actions (automatic when gate passes)

```
1. Deming updates sprint-status.yaml: epic status = done
2. IF docs.mode = portal OR markdown+html:
   → runSubagent("M3A: Docs", "generate epic-done executive summary for EPIC-NNN")
3. Marcus Aurelius notifies Drucker (PM) for backlog reprioritization
4. IF M3A: ROI agent is installed:
   → runSubagent("M3A: ROI", "calculate efficiency for EPIC-NNN")
```

---

## Re-review after fix

After veto conditions are resolved:

```
Human: "/m3a-epic-done EPIC-NNN"   (or "re-review epic EPIC-NNN")
→ Gate runs again from PHASE 2
→ Only agents with ❌ or ⚠️ need to re-review (Orchestrator may skip ✅ agents)
```

---

## Versioning Rule

When updated: (1) increment `workflow-version` in frontmatter, (2) update `last-updated`, (3) entry in `CHANGELOG.md`.
