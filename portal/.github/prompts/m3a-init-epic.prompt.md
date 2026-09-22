---
description: "MMA Init Epic — Workflow to structure epic, story, and roadmap creation. Aligns with the user before creating anything, suggests HTML Rollout Tracker. Must be run before creating epics and stories."
agent: "agent"
author: "Edimar Ferla de Almeida"
organization: "Minsait (Indra Company)"
---

# /m3a-init-epic — Epic and Roadmap Structure Setup

> **Run before creating epics and stories.**  
> Aligns methodology, backlog structure, and optionally configures the HTML Rollout Tracker.

---

## Behavior Rule

Conducts a conversational interview. **One question at a time.**  
Anti-duplicate check is mandatory before any creation.  
Never creates epics directly — configures the structure and delegates to `m3a-pm`.

---

## STEP 0 — Verify Context

```
IF .github/mma/config.yaml DOES NOT EXIST:
  → "⚠️ Run /m3a-init first."
  → STOP

Anti-duplicate check:
  → .github/mma/backlog/epics/ — existing epics?
  → .github/mma/backlog/sprints/sprint-status.yaml — active sprint?
  → If yes: show what exists → ask if user wants to add NEW epic or review existing ones
```

---

## STEP 1 — Epic Context

**Question 1:**
```
"You are creating epics for:

[1] New feature set (feature epics)
[2] Refactoring / technical modernization
[3] Technology/stack migration
[4] Performance or security improvements
[5] Documentation initiative
[6] Other — describe

Or describe in your own words what you want to deliver."
```

---

## STEP 2 — Roadmap Scope

**Question 2:**
```
"What is the planning horizon?

[1] Single sprint (1-2 weeks)
[2] Release (1-3 months)
[3] Quarter (3 months)
[4] Semi-annual/Annual
[5] Not defined yet"
```

**Question 3:**
```
"Do you already have a list of initiatives/themes in mind,
or would you prefer the team to brainstorm?

[1] I already have a list — I will provide it
[2] I want a guided brainstorm with the team (PM + Architect)
[3] Combination — I have some ideas but want to enrich them"
```

---

## STEP 3 — PRD (if applicable)

**Conditional — if type = new project or major refactoring:**
```
"For new projects or significant refactors,
we recommend creating a PRD (Product Requirements Document) BEFORE epics.

A PRD defines:
- Problem to solve and objective
- Target audience / stakeholders
- Features and constraints
- Success criteria
- Risks

Would you like to create a PRD first?
[1] Yes — create PRD (recommended for large initiatives)
[2] No — go straight to epics (smaller or already-defined projects)"
```

If yes → trigger `m3a-pm` with context to create PRD using template `templates/markdown/prd.md`

---

## STEP 4 — Backlog Structure

**Question 4:**
```
"How would you like to organize the backlog?

[1] Epics → Stories → Tasks (standard Scrum)
[2] Epics → Stories (no explicit tasks)
[3] Milestones → Epics → Stories

Recommendation: option [1] for teams using sprints."
```

**Question 5:**
```
"What numbering format for epics?

[1] EPIC-001, EPIC-002... (default)
[2] Project prefix: {{PROJECT_CODE}}-EPIC-001...
[3] Custom — specify the format"
```

---

## STEP 5 — Rollout Tracker

**Question 6:**
```
"Would you like an HTML Rollout Tracker to track progress?

This tracker is an interactive dashboard with:
- Roadmap overview (all epics)
- Sprint burndown chart
- Real-time story status (editable)
- Sprint Gantt timeline
- CSV export

[1] Yes — configure Rollout Tracker now
[2] No — only .md structure"
```

If yes:
```
"For the Rollout Tracker I need:
[a] Target project version: (e.g. v2.0.0)
[b] Project start date:
[c] Target completion date:
[d] Estimated total sprints:
[e] Estimated sprint velocity (story points):

Provide these values (or estimates):"
```

---

## STEP 6 — Confirmation and Next Steps

Show SUMMARY:
```
📋 EPIC STRUCTURE — {{PROJECT_NAME}}

Type: [feature / refactor / migration / etc.]
Horizon: [sprint / release / quarterly]
PRD: [yes/no]
Backlog structure: [Epics → Stories → Tasks]
Numbering: [EPIC-001...]
Rollout Tracker: [yes/no]

Next steps:
[1] Trigger m3a-pm for epic brainstorm
[2] Create PRD (if enabled)
[3] Configure HTML Rollout Tracker (if enabled)

Confirm? [Y/N]"
```

---

## STEP 7 — Execute

After confirmation:

1. Create `.github/mma/backlog/` structure if it does not exist:
   - `.github/mma/backlog/epics/`
   - `.github/mma/backlog/stories/`
   - `.github/mma/backlog/sprints/`
   - `.github/mma/backlog/sprints/sprint-status.yaml` (from template)

2. If PRD enabled → `runSubagent("M3A: PM", "create PRD for {{PROJECT_NAME}} — context: [collected]")`

3. If Rollout Tracker enabled → `runSubagent("M3A: Docs", "configure rollout-tracker.html with data: {{collected data}}")`

4. Trigger `runSubagent("M3A: PM", "brainstorm epics for {{PROJECT_NAME}} — type: [type] — horizon: [horizon]")` to start epic creation

**Chat output:**
```
✅ Backlog structure: .github/mma/backlog/
✅ Sprint status: .github/mma/backlog/sprints/sprint-status.yaml
✅ Rollout Tracker: docs/html/rollout-tracker.html (if enabled)
🔄 Triggering m3a-pm for epic brainstorm...
```

---

## Anti-Duplicate (Mandatory)

Before any epic creation:
1. Check `.github/mma/backlog/epics/` — does a similar epic exist?
2. If it exists → inform user + do NOT create duplicate
3. If it partially covers it → check if it is a Story within an existing epic
4. Only if NEW → proceed

This check is managed by `m3a-pm` during the creation of each epic.
