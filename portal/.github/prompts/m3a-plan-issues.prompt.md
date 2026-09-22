---
description: "MMA Plan Issues — Creates standardized GitHub/GitLab issues from backlog items (epics or stories). Applies issue templates, labels, milestones. Requires /m3a-init completed."
agent: "agent"
---

# /m3a-plan-issues — Create Issues from Backlog

> **Transforms MMA backlog items into platform issues (GitHub/GitLab).**
> Applies templates, labels, and milestones consistently.

---

## Behavior Rule

- **Never creates issues without reading the backlog first**
- **Anti-duplicate** — checks existing issues before creating
- **Batch-capable** — can create issues for an entire epic or sprint
- **Platform-aware** — adapts format to GitHub Issues or GitLab Issues

---

## STEP 0 — Verify Context

```
IF .github/mma/config.yaml DOES NOT EXIST:
  → "⚠️ Run /m3a-init first."
  → STOP

Read:
  - .github/mma/config.yaml → project name, repo URL, CI/CD platform
  - .github/mma/backlog/sprints/sprint-status.yaml → current sprint items
  - .github/mma/backlog/epics/ → available epics
  - .github/mma/backlog/stories/ → available stories
```

---

## STEP 1 — Scope Selection

```
"What do you want to create issues for?

[1] Entire epic — all stories become issues
[2] Current sprint — all sprint items become issues
[3] Specific stories — provide story IDs
[4] Custom list — provide titles and descriptions"
```

---

## STEP 2 — Issue Template

For each backlog item, generate:

```markdown
### Issue: [STORY-NNN] [Story Title]

**Epic:** EPIC-NNN — [Epic Title]
**Sprint:** Sprint N
**Priority:** [from story]
**Assignee:** [if defined]

**Description:**
[Story description from backlog]

**Acceptance Criteria:**
- [ ] [AC 1]
- [ ] [AC 2]
- [ ] [AC N]

**Labels:** `mma`, `epic-NNN`, `sprint-N`, `[priority]`
**Milestone:** Sprint N
```

---

## STEP 3 — Preview and Confirm

```
"I will create [N] issues:

1. [STORY-001] — [title]
2. [STORY-002] — [title]
...

Platform: [GitHub/GitLab]
Labels: [list]
Milestone: [sprint]

Confirm? [Y/n]"
```

Only proceed after human confirmation.

---

## STEP 4 — Creation

If `gh` CLI is available → use `gh issue create` for each issue.
If not → output the issues as markdown for manual creation.

Report:
```
✅ Created [N] issues:
  - #101: [STORY-001] [title]
  - #102: [STORY-002] [title]
```

---

## Changelog

**v1.0.0 (2026-04-24)** — Skill created. Backlog-to-issues conversion with anti-duplicate check.
