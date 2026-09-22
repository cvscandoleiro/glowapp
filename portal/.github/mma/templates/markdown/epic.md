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
*[Link to business goal or technical debt item.]*

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

---

## Tasks

> Format: `- [ ] TASK-NNN — [Description] — Effort: [h]`

- [ ] TASK-001 — *[Task description]* — Effort: Xh
- [ ] TASK-002 — *[Task description]* — Effort: Xh
- [ ] TASK-003 — *[Task description]* — Effort: Xh

**Total estimated effort:** Xh

---

## Acceptance Criteria

> AC-NNN format. Each AC must be testable and unambiguous.

- [ ] **AC-001:** *[Given/When/Then or concrete observable outcome]*
- [ ] **AC-002:** *[Given/When/Then or concrete observable outcome]*
- [ ] **AC-003:** *[Given/When/Then or concrete observable outcome]*

---

## Definition of Done

- [ ] All tasks marked `[x]` in the Tasks section
- [ ] All acceptance criteria verified (ACs checked above)
- [ ] No regression in existing functionality (test suite green)
- [ ] Code review completed (if applicable)
- [ ] Documentation updated (if applicable)
- [ ] Build passes: `BUILD SUCCESS` evidence recorded below
- [ ] Approved by all 12 agents (see Multi-Agent Review below)

---

## Multi-Agent Review

> Law 9: All 12 agents review. One ❌ BLOCKED freezes this epic.
> Valid verdicts: ✅ Approved | ⚠️ Approved with conditions | ❌ Blocked

| Agent | Verdict | Conditions / Notes |
|---|---|---|
| m3a-orchestrator | pending | |
| m3a-analyst | pending | |
| m3a-architect | pending | |
| m3a-pm | pending | |
| m3a-sm | pending | |
| m3a-dev | pending | |
| m3a-qa | pending | |
| m3a-security | pending | |
| m3a-devops | pending | |
| m3a-docs | pending | |
| m3a-ux | pending | |
| m3a-dba | pending | |

---

## Dependencies

| Dependency | Type | Status | Notes |
|---|---|---|---|
| *[Epic/Story/ADR/System]* | blocks / blocked-by / relates-to | open / resolved | *[Notes]* |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| *[Risk description]* | H/M/L | H/M/L | *[Mitigation]* |

---

## Sprint Assignments

*[Distribute tasks across sprints per Law 8: never detail beyond Sprint N+1.]*

| Sprint | Tasks | Status |
|---|---|---|
| Sprint {{SPRINT_TARGET}} | TASK-001, TASK-002 | planned |
| Sprint {{SPRINT_TARGET}}+1 | TASK-003 (outline only) | — |

---

## Build Evidence

*[Required before status can move to `done` — Law 12.]*

```
# Format: BUILD SUCCESS evidence
✅ Build: [build command] — [MODULE] — BUILD SUCCESS [YYYY-MM-DD]
```

---

## Change Log

| Date | Change | Author |
|---|---|---|
| {{DOC_DATE}} | Epic created | {{ENG_A}} |

---

*Path: `.github/mma/backlog/epics/EPIC-{{EPIC_NUMBER}}-{{EPIC_SLUG}}.md`*
*Maintained by {{ORG_LEGAL}} — {{TEAM_NAME}}*
