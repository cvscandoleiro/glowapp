---
story_id: "STORY-{{STORY_NUMBER}}"
title: "{{STORY_TITLE}}"
epic: "EPIC-{{EPIC_NUMBER}}"
status: "backlog"           # backlog | ready | in-progress | review | done | cancelled
priority: "{{STORY_PRIORITY}}"  # critical | high | medium | low
sprint: "Sprint {{SPRINT_NUMBER}}"
points: {{STORY_POINTS}}    # Story points estimate
project: "{{PROJECT_CODE}}"
date_created: "{{DOC_DATE}}"
date_updated: "{{DOC_DATE}}"
assignee: "{{ASSIGNEE}}"
organization: "{{ORG_LEGAL}}"
---

# STORY-{{STORY_NUMBER}}: {{STORY_TITLE}}

**Epic:** EPIC-{{EPIC_NUMBER}}
**Sprint:** Sprint {{SPRINT_NUMBER}}
**Priority:** {{STORY_PRIORITY}}
**Story Points:** {{STORY_POINTS}}
**Assignee:** {{ASSIGNEE}}

---

## User Story

> **As a** *[type of user / role]*
> **I want** *[capability or action to perform]*
> **So that** *[business value or outcome]*

---

## Context

*[Optional: additional context, background, or constraints for this story.]*
*[Link to related ADR, external documentation, or bug report if applicable.]*

---

## Acceptance Criteria

> Each AC must be independently testable. Format: Given/When/Then or observable outcome.

- [ ] **AC-001:** *[Given ... When ... Then ...]*
- [ ] **AC-002:** *[Given ... When ... Then ...]*
- [ ] **AC-003:** *[Given ... When ... Then ...]*

---

## Tasks

> Fine-grained technical tasks for the developer implementing this story.

- [ ] *[Task 1 — e.g., "Write failing test for AC-001"]*
- [ ] *[Task 2 — e.g., "Implement minimum logic to pass test"]*
- [ ] *[Task 3 — e.g., "Refactor and clean up"]*
- [ ] *[Task 4 — e.g., "Update documentation"]*

---

## Definition of Done

- [ ] All ACs verified and checked
- [ ] All tasks completed
- [ ] Tests written and passing (Red → Green → Refactor)
- [ ] No regressions in related functionality
- [ ] Peer code review approved (if team policy requires)
- [ ] Documentation updated (if behavior changes are user-visible)
- [ ] Build passes with no errors

*Build evidence:*
```
✅ Build: [command] — BUILD SUCCESS [YYYY-MM-DD]
```

---

## Technical Notes

*[Optional: implementation hints, findings from code exploration, edge cases.]*
*[Developer can add notes during implementation — keeps learning in the artifact, not in chat.]*

---

## Test Cases

*[Specific test scenarios to confirm ACs. Filled by QA or developer.]*

| Test ID | Description | Expected Result | Type |
|---|---|---|---|
| TC-001 | *[Test description]* | *[Expected outcome]* | unit / integration / e2e |
| TC-002 | *[Test description]* | *[Expected outcome]* | unit / integration / e2e |

---

## Dependencies

| Dependency | STORY/EPIC ID | Status | Notes |
|---|---|---|---|
| *[Depends on]* | STORY-NNN | open / resolved | *[Notes]* |

---

## Change Log

| Date | Change | Agent/Author |
|---|---|---|
| {{DOC_DATE}} | Story created | {{ASSIGNEE}} |

---

*Path: `.github/mma/backlog/stories/STORY-{{STORY_NUMBER}}-{{STORY_SLUG}}.md`*
*Parent: EPIC-{{EPIC_NUMBER}}*
*Maintained by {{ORG_LEGAL}} — {{TEAM_NAME}}*
