---
epic_id: "EPIC-{{EPIC_NUMBER}}"
title: "{{EPIC_TITLE}}"
status: "draft"             # draft | in-review | approved | in-progress | done | archived
priority: "{{EPIC_PRIORITY}}"  # critical | high | medium | low
complexity: "{{EPIC_COMPLEXITY}}"  # simple | complex
project: "{{PROJECT_CODE}}"
sprint_target: "Sprint {{SPRINT_TARGET}}"
date_created: "{{DOC_DATE}}"
date_updated: "{{DOC_DATE}}"
organization: "{{ORG_LEGAL}}"
owner: "{{ENG_A}}"
---

# EPIC-{{EPIC_NUMBER}}: {{EPIC_TITLE}}

**Project:** {{PROJECT_NAME}}
**Priority:** {{EPIC_PRIORITY}}
**Status:** draft
**Sprint Target:** Sprint {{SPRINT_TARGET}}
**Owner:** {{ENG_A}}

---

## Motivation

*[Why does this epic exist? What problem does it solve?]*
*[Link to business goal, technical debt item, or strategic objective.]*

---

## Objective

*[Clear, measurable objective for this epic.]*
*[What does "done" look like at the epic level?]*

---

## Scope

### In-Scope

- *[List capabilities, modules, or components explicitly included]*
- *[Be specific — cite module names, class names, or feature names if applicable]*

### Out-of-Scope

- *[List what is explicitly excluded — prevents scope creep]*
- *[Reference other epics that handle excluded topics if applicable]*

---

## Tasks

> Format: `- [ ] TASK-NNN — [Description] — Effort: [h]`
> Law 8: Tasks in Sprint N fully detailed; Sprint N+1 outline only.

**Sprint {{SPRINT_TARGET}} (fully detailed):**
- [ ] TASK-001 — *[Task description]* — Effort: Xh
- [ ] TASK-002 — *[Task description]* — Effort: Xh
- [ ] TASK-003 — *[Task description]* — Effort: Xh

**Sprint {{SPRINT_TARGET}}+1 (outline only):**
- TASK-004 — *[Task title only]* (not yet detailed)
- TASK-005 — *[Task title only]* (not yet detailed)

**Total estimated effort (Sprint {{SPRINT_TARGET}}):** Xh
**Total estimated effort (all sprints):** ~Xh

---

## Acceptance Criteria

> AC-NNN format. Each AC must be testable and unambiguous.
> Given/When/Then or concrete observable outcome.

- [ ] **AC-001:** *[Given ... When ... Then ...]*
- [ ] **AC-002:** *[Given ... When ... Then ...]*
- [ ] **AC-003:** *[Given ... When ... Then ...]*

---

## Definition of Done

- [ ] All tasks marked `[x]`
- [ ] All acceptance criteria verified (ACs checked above)
- [ ] No regression in existing functionality
- [ ] Tests written and passing
- [ ] Code review completed (if applicable)
- [ ] Documentation updated (if applicable)
- [ ] Build passes — see Build Evidence below
- [ ] All 12 agents approved (Multi-Agent Review complete)

---

## Multi-Agent Review

> Law 9: All 12 agents review. One ❌ BLOCKED freezes this epic.
> Valid verdicts: ✅ Approved | ⚠️ Approved with conditions | ❌ Blocked | pending

| Agent | Verdict | Conditions / Notes | Date |
|---|---|---|---|
| m3a-orchestrator | pending | | |
| m3a-analyst | pending | | |
| m3a-architect | pending | | |
| m3a-pm | pending | | |
| m3a-sm | pending | | |
| m3a-dev | pending | | |
| m3a-qa | pending | | |
| m3a-security | pending | | |
| m3a-devops | pending | | |
| m3a-docs | pending | | |
| m3a-ux | pending | | |
| m3a-dba | pending | | |

---

## Dependencies

| Dependency | Type | Epic/Story/System | Status | Notes |
|---|---|---|---|---|
| *[Dependency]* | blocks / blocked-by / relates-to | EPIC-NNN or external | open / resolved | *[Notes]* |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| *[Risk description]* | H/M/L | H/M/L | *[Mitigation strategy]* |

---

## Sprint Assignments

| Sprint | Tasks | Notes |
|---|---|---|
| Sprint {{SPRINT_TARGET}} | TASK-001, TASK-002, TASK-003 | Fully detailed |
| Sprint {{SPRINT_TARGET}}+1 | TASK-004, TASK-005 (outline) | Detail in next sprint planning |

---

## Stories

*[Stories decomposed from this epic. Created by m3a-sm.]*

| Story ID | Title | Sprint | Points | Status |
|---|---|---|---|---|
| STORY-NNN | *[Story title]* | Sprint {{SPRINT_TARGET}} | — | backlog |

*Stories in: `{{PATH_STORIES}}`*

---

## Build Evidence

*[Required before status can move to `done` — Law 12.]*
*[Fill this when implementation is complete.]*

```
✅ Build: [build command] — [MODULE/CONTEXT] — BUILD SUCCESS [YYYY-MM-DD]
```

---

## Change Log

| Date | Change | Author |
|---|---|---|
| {{DOC_DATE}} | Epic created | {{ENG_A}} |

---

*Path: `{{PATH_EPICS}}EPIC-{{EPIC_NUMBER}}-{{EPIC_SLUG}}.md`*
*Maintained by {{ORG_LEGAL}} — {{TEAM_NAME}}*
