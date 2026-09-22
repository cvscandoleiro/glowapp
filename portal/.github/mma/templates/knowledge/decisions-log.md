---
title: "{{PROJECT_NAME}} — Decisions Log"
project: "{{PROJECT_CODE}}"
version: "1.0.0"
date_created: "{{DOC_DATE}}"
last_updated: "{{DOC_DATE}}"
organization: "{{ORG_LEGAL}}"
path: "{{PATH_DECISIONS}}decisions-log.md"
---

# {{PROJECT_NAME}} — Decisions Log

> Chronological record of all significant technical and architectural decisions.
> Each entry links to its full ADR document in `{{PATH_DECISIONS}}`.
> Maintained by the MMA Architect agent (Vitruvius).

---

## How to Use This Log

- **New decision:** Create ADR file in `{{PATH_DECISIONS}}ADR-NNN-slug.md`, then add entry below
- **Decision update:** Update ADR file status, add note in Log Entry
- **Order:** Most recent decisions at the top of each section

---

## Decision Registry

### Active Decisions

| ID | Title | Status | Date | Category | ADR Link |
|---|---|---|---|---|---|
| ADR-001 | *[First decision title]* | proposed | {{DOC_DATE}} | *[category]* | [ADR-001](ADR-001-slug.md) |

---

### Decision History

*[Decisions are logged below in reverse chronological order.]*
*[Format: date, agent, decision, context.]*

---

#### {{DOC_DATE}} — Initial Project Setup

**Decision ID:** ADR-001
**Title:** *[Title of first decision]*
**Category:** *[architecture / database / security / devops / process]*
**Status:** proposed
**Lead:** m3a-architect (Vitruvius)
**Summary:** *[One-sentence summary of the decision.]*
**ADR File:** `{{PATH_DECISIONS}}ADR-001-slug.md`
**Context:** *[What triggered this decision? Reference to /m3a-init or specific analysis.]*

---

## Learning Log

*[Discoveries that don't warrant a full ADR but are important to preserve.]*
*[Format: [YYYY-MM-DD] [AgentName]: [Learning] | Context: [situation]]*
*[Appended here continuously by any agent per Law 4.]*

---

**[{{DOC_DATE}}] m3a-orchestrator:** Decisions log initialized | Context: /m3a-init project onboarding

---

## Pending Decisions

*[Decisions that have been identified but not yet made. Remove when ADR is created.]*

| Topic | Urgency | Waiting For |
|---|---|---|
| *[Decision needed]* | *[H/M/L]* | *[What information or event is needed before deciding]* |

---

## Superseded Decisions

*[Decisions that were replaced by newer decisions.]*
*[Keep here for historical reference.]*

*(none yet)*

---

*Path: `{{PATH_DECISIONS}}decisions-log.md`*
*Maintained by {{ORG_LEGAL}} — {{TEAM_NAME}}*
