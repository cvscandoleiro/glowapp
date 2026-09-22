---
description: "MMA Refactor — Refactoring planning skill via War Room. Never executes automatically — orchestrates multi-agent analysis, proposes a collaborative plan, and awaits human approval before creating any epic or story. Use when significant architectural or module refactoring is needed."
agent: "agent"
---

# /m3a-refactor — Refactoring War Room

> **This workflow NEVER executes refactoring automatically.**  
> Orchestrates collective analysis → proposes plan → awaits human approval → creates epics.

---

## Fundamental Rule (INVIOLABLE)

```
/m3a-refactor:
  1. ANALYZE — all agents examine the scope
  2. DEBATE  — agents exchange perspectives (no automatic veto)
  3. PROPOSE — refactoring plan with epics/stories
  4. WAIT    — EXPLICIT human approval
  5. EXECUTE — only after human confirmation

NEVER auto-executes. NEVER creates epics without confirmation.
NEVER starts implementation without an approved story.
```

---

## When to Use This Workflow

```
/m3a-refactor IS APPROPRIATE for:
- Refactoring that touches 3+ modules or 5+ files
- Significant architectural change (e.g.: monolith → modules, MVC → clean arch)
- Domain extraction (DDD bounded context)
- Replacement of a framework or core library
- Migration of data access pattern (JDBC → JPA, etc.)
- Frontend modernization (JSP → Vue, jQuery → React)

/m3a-refactor IS NOT NEEDED for:
- Renaming a variable or method
- Extracting a method < 50 lines
- Refactoring within 1 file, 1 engineer, < 1 day
→ In those cases: create a story directly via @m3a-pm
```

---

## STEP 0 — Preparation and Verification

```
1. Verify .github/mma/config.yaml exists
2. Load context: project, stack, current sprint
3. Check existing epics — is there a similar refactoring epic?
   IF EXISTS: "EPIC-NNN already exists and is similar. Relate or create independently?"
4. Present to human: "This workflow involves all 12 agents. Confirm start?"
```

---

## STEP 1 — Scope Briefing

Collect via conversation:

```
"For the Refactoring War Room, I need to understand the scope.

1. What needs to be refactored? (module, component, specific pattern)
2. Why now? (accumulated technical debt, new requirement, performance, security)
3. What is the expected result? (new architecture, new pattern, better testability)
4. Is there a deadline or gate motivating this refactoring?
5. Are there architectural decisions already made that guide the result?"
```

---

## STEP 2 — Multi-Agent Analysis (In Parallel)

With the scope defined, orchestrate simultaneous analysis:

### 2.1 AS-IS Analysis
```
runSubagent("M3A: Analyst", 
  "deep analysis of refactoring scope: [scope] —
   identify: affected classes, dependencies, couplings, 
   problematic patterns — output: 'Descartes' section in war-room-[id].md")
```

### 2.2 Architectural Analysis
```
runSubagent("M3A: Architect",
  "evaluate refactoring scope: [scope] —
   propose TO-BE Design with Clean Architecture/DDD —
   identify: necessary ADRs, technical risks, migration sequence —
   output: 'Vitruvius' section + C4 diagram in war-room-[id].md")
```

### 2.3 Security Analysis
```
runSubagent("M3A: Security",
  "review refactoring scope: [scope] —
   identify: CVEs in scope, introduced attack surfaces, 
   necessary remediations before refactoring —
   output: 'Hobbes' section in war-room-[id].md")
```

### 2.4 Testability Analysis
```
runSubagent("M3A: QA",
  "evaluate refactoring testability: [scope] —
   propose: regression test strategy, minimum coverage, 
   tests that must exist BEFORE refactoring starts —
   output: 'Popper' section in war-room-[id].md")
```

### 2.5 Database Analysis (if applicable)
```
runSubagent("M3A: DBA",
  "evaluate refactoring impact on database: [scope] —
   identify: necessary schema changes, migrations, 
   impact on queries/repositories —
   output: 'Codd' section in war-room-[id].md")
```

### 2.6 UX Analysis (if applicable)
```
runSubagent("M3A: UX",
  "evaluate refactoring impact on UX: [scope] —
   identify: flow/interface changes, consistency with design system —
   output: 'Norman' section in war-room-[id].md")
```

---

## STEP 3 — War Room Document

Create consolidated document:

`.github/mma/knowledge/war-room-refactor-[slug]-[date].md`

```markdown
---
type: war-room
topic: "Refactoring: [scope]"
date: YYYY-MM-DD
status: analysis | proposal | approved | rejected | in-progress
---

# War Room — Refactoring: [Scope]

## Scope
[Description of what will be refactored and why]

## Multi-Agent Analysis

### 📊 Descartes (AS-IS)
[Analysis of current state: what exists, couplings, identified problems]

### 🏗️ Vitruvius (TO-BE Architecture)
[New architecture proposal: C4 diagram, ADRs, migration sequence]

### 🔒 Hobbes (Security)
[CVEs in scope, necessary remediations, security gates]

### 🔍 Popper (Testability)
[Test strategy: what to test before, during, and after refactoring]

### 🗄️ Codd (Database)
[Schema impact, necessary migrations, impact on repositories]

### 🎨 Norman (UX/UI)
[Frontend impact, affected flows, design system]

### ☁️ Atlas (DevOps)
[Container/pipeline impact, new infra needed]

## Team Consensus
| Agent | Position | Notes |
|---|---|---|
| ...all agents... | ✅ | |

## Refactoring Plan Proposal

### Preconditions (before starting)
- [ ] [Regression tests written to cover the scope]
- [ ] [Critical CVEs remediated (if Hobbes identified them)]
- [ ] [Relevant ADRs approved]

### Phases
| Phase | Description | Epic | Dependencies |
|---|---|---|---|
| 1 | [What to do first] | EPIC-NNN | — |
| 2 | [What to do next] | EPIC-NNN | Phase 1 |

### Estimate
- Total rough: [N] engineer-days
- Sprints: minimum [N] sprints
- Regression risk: [low/medium/high]

## Human Decision
⏳ AWAITING HUMAN APPROVAL

☐ Approve and create epics
☐ Approve with modifications
☐ Reject — maintain current state
☐ Defer to a specific sprint
```

---

## STEP 4 — Presentation to Human

After consolidating analyses:

```
"⚡ War Room complete — Refactoring Proposal: [Scope]

Full document: .github/mma/knowledge/war-room-refactor-[id].md

EXECUTIVE SUMMARY:
- Affected scope: [N components, N files]
- Estimate: [N eng-days | N sprints]  
- Main risk: [the biggest identified risk]
- Critical precondition: [what must be done first]
- Team consensus: [N approvals / N reservations / N blocks]

Hobbes: [✅ approved | ⚠️ reservations | ❌ BLOCKED by: ...]

To proceed, confirm: 'APPROVE' or 'REJECT' or 'defer to sprint X'"
```

---

## STEP 5 — After Human Approval

```
IF humanConfirms("APPROVE"):
  runSubagent("M3A: PM", "create epics for approved refactoring — 
    based on war-room-refactor-[id].md — 
    create EPIC-NNN per phase of the plan")
    
  runSubagent("M3A: Scrum Master", "plan start sprint for refactoring —
    include preconditions as stories in current sprint")

IF humanConfirms("REJECT"):
  → Record decision in project-decisions-log.md
  → "Refactoring rejected. Recorded in decisions-log for future reference."

IF humanConfirms("defer"):
  → Record in backlog with target sprint note
```

---

## Changelog

**v1.0.0 (2026-04-11)** — Skill created. Complete War Room with multi-agent analysis. Mandatory human approval block. War room document template.
