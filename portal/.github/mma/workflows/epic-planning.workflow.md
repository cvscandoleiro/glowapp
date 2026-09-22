---
description: "Workflow for epic creation (/m3a-init-epic). Includes: anti-duplicate check, mandatory brainstorming, PRD creation or validation against existing PRD, multi-agent review, human approval, and rollout tracker setup."
workflow-id: "epic-planning"
workflow-version: "1.0.0"
author: "Edimar Ferla de Almeida"
organization: "Minsait (Indra Company)"
last-updated: "2026-04-11"
---

# Workflow: Epic Planning (/m3a-init-epic)

> **Every epic goes through this workflow — no exceptions.**  
> Anti-duplicate → Brainstorm → Multi-Agent Review → Human Approval → Sprint

---

## Fundamental Rule

```
No epic exists without:
1. Anti-duplicate check (passed?)
2. Brainstorm with Drucker (completed?)
3. Multi-agent review by 12 agents (zero ❌?)
4. Explicit human approval (confirmed?)

IF any of these steps is skipped → the epic is not valid.
```

---

## PHASE 1 — Anti-Duplicate (MANDATORY)

```
runSubagent("M3A: PM", "anti-duplicate check for new epic: [topic]")
```

### Checks

```
1. Read all .github/mma/backlog/epics/ — status != cancelled
2. Read sprint-status.yaml — items in progress
3. Read .github/mma/knowledge/project-decisions-log.md — decisions that cover the topic

Classification:
┌─ EXACT DUPLICATE
│  → Inform: "EPIC-NNN already covers this. Path: [path]"
│  → STOP completely.
│
├─ PARTIAL OVERLAP
│  → "EPIC-NNN touches this topic in section [X].
│     Do you want: (a) add a story to EPIC-NNN, (b) create a separate epic"
│  → Await human decision.
│
├─ TOO SMALL (story, not epic)
│  → "Small scope = Story, not Epic.
│     Delegate to @m3a-sm to create Story in existing EPIC-NNN."
│  → Do not create epic.
│
└─ NEW AND VALID
   → Proceed to PHASE 2.
```

---

## PHASE 2 — Guided Brainstorm

```
runSubagent("M3A: PM", "conduct brainstorm for epic: [topic] —
  use maximum 5 questions —
  output: epic draft at .github/mma/backlog/epics/EPIC-NNN-draft.md")
```

### Brainstorm Structure

```
Drucker (PM) leads — maximum 5 questions.
The team already knows a lot about the project from config.yaml and knowledge base.
Only ask what cannot be inferred:

Mandatory to discover:
- Trigger: why now? (external or internal urgency?)
- Success criterion: what does "done" mean?
- Dependencies: does it block or is it blocked by something?
- Constraint: is there a specific technical or business constraint?

Inferable (do not ask):
- Which modules are affected (Descartes will identify)
- Which CVEs are in scope (Hobbes will identify)
- Technical estimate (Knuth will estimate)
```

---

## PHASE 3 — PRD Validation (for new projects)

```
IF project.type = new AND .github/mma/knowledge/prd.md exists:
  runSubagent("M3A: PM", "validate alignment of new epic with PRD —
    epic: [draft] —
    PRD: .github/mma/knowledge/prd.md —
    check: is the epic within the PRD's IN scope? —
    output: 'PRD Alignment' section in the epic file")

IF epic is OUTSIDE PRD scope:
  "⚠️ WARNING: This epic is not within the approved PRD scope.
   Options: (a) update the PRD to include it, (b) reject the epic"
  → Await human decision.
```

---

## PHASE 4 — Context Specialists (Parallel)

Before multi-agent review, enrich the epic with analysis from key specialists:

```
runSubagent("M3A: Analyst", "AS-IS analysis of epic [NNN] scope —
  identify: affected modules, hidden dependencies, CVEs in scope —
  output: 'Descartes' section in EPIC-NNN.md")

runSubagent("M3A: Architect", "architectural analysis of epic [NNN] —
  check: technical feasibility, build dependencies, execution order —
  output: 'Vitruvius' section in EPIC-NNN.md")

[run in parallel — do not wait for one before starting the other]
```

---

## PHASE 5 — 12-Agent Multi-Agent Review

Marcus Aurelius distributes for review by all:

```
For each agent:
runSubagent("M3A: [Agent]", "review epic EPIC-NNN for approval —
  file: .github/mma/backlog/epics/EPIC-NNN-*.md —
  respond: ✅ Approved | ⚠️ Approved with caveat | ❌ Blocked —
  fill '[Persona]' section in the multi-agent review table")
```

### Review Table (Filled in PHASE 5)

```markdown
## Multi-Agent Review

| Agent | Status | Notes |
|--------|--------|-------|
| 📊 Descartes (Analyst) | ✅/⚠️/❌ | [note] |
| 🏗️ Vitruvius (Architect) | | |
| 📋 Drucker (PM) | ✅ Approved | Epic created by me |
| 🏃 Deming (SM) | | |
| 💻 Knuth (Dev) | | |
| 🔍 Popper (QA) | | |
| 🔒 Hobbes (Security) | | |
| ☁️ Atlas (DevOps) | | |
| 🗄️ Codd (DBA) | | |
| 📄 Borges (Docs) | | |
| 🎨 Norman (UX) | | |

**Justified N/A:** [list agents that marked N/A + reason]
```

### N/A Rules

```
N/A is accepted when the agent explains in 1 line why the epic does not affect their area.
Valid examples:
- Codd N/A: "Epic does not touch the database — UI/UX only"
- Norman N/A: "Infra epic — no user interface affected"
- Atlas N/A: "Pure code epic — no Dockerfile or pipeline changes"

N/A is INVALID when:
- Agent uses N/A without justification
- The epic clearly affects the agent's area
```

---

## PHASE 6 — Consolidation and Decision

```
IF zero ❌:
  → Marcus Aurelius changes status: draft → approved
  → Notify human: "EPIC-NNN approved by all 12 agents."

IF ⚠️ exists:
  → Marcus Aurelius consolidates caveats
  → Present to human: list of caveats + proposed adjustments
  → IF human confirms adjustments → update epic → re-verify

IF ❌ exists (Hobbes or other):
  → ❌ BLOCKED — present to human:
    "EPIC-NNN blocked by [Agent]. Reason: [reason]
     Unblocking condition: [specific action]"
  → Await human to resolve the condition or abandon epic
```

---

## PHASE 7 — Human Approval (FINAL GATE)

```
⚠️ MANDATORY GATE: Even with zero ❌, Marcus Aurelius awaits human confirmation.

"EPIC-NNN approved by the team. Review:
  ✅ [N] agents approved
  ⚠️ [N] caveats (incorporated)
  N/A: [list]

Confirm epic approval? (yes / no / adjust)"
```

---

## PHASE 8 — Post-Approval Setup

After human approval:

```
1. Update EPIC-NNN.md: status: approved, approved-at: YYYY-MM-DD

2. Update rollout tracker (if docs.mode = full-portal):
   runSubagent("M3A: Docs", "create/update rollout-tracker.html —
     include EPIC-NNN in the progress grid")

3. Notify SM to plan sprint:
   runSubagent("M3A: Scrum Master", "EPIC-NNN approved — plan stories
     for next available sprint")

4. Log decision:
   runSubagent("M3A: Docs", "record EPIC-NNN approval in
     .github/mma/knowledge/project-decisions-log.md")
```

---

## Criteria for a Good Epic

Before approving, verify:

```
□ Title: specific and actionable (not "improve the system")
□ Objective: clear, with measurable benefit
□ ACs: all verifiable (yes/no, not "works better")
□ Estimate: rough but present
□ Dependencies: mapped (blocked by / blocks)
□ Risks: main ones identified
□ High-level stories: at least 3 suggested
□ Hobbes: no active veto
□ Size: not too large (> 6 months = split) nor too small (< 1 sprint = story)
```

---

## Changelog

**v1.0.0 (2026-04-11)** — Workflow created. 8 complete phases. Strict anti-duplicate. Multi-agent review with justified N/A. Mandatory human gate.
