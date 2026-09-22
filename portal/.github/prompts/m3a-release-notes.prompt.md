---
description: "MMA Release Notes — Generates release notes from version scope (git log, story list, or epic list). Layer 1: CHANGELOG.md update. Layer 2: HTML executive release notes page."
agent: "agent"
---

# /m3a-release-notes — Generate Release Notes

> **Structured release notes from your backlog and git history.**
> Two layers: operational CHANGELOG + executive HTML summary.

---

## Behavior Rule

- **Source-driven** — reads git log, story list, or epic list
- **Two layers** — Layer 1 (CHANGELOG.md) + Layer 2 (HTML executive)
- **Keep a Changelog** — follows keepachangelog.com format
- **Non-destructive** — appends to CHANGELOG, never overwrites

---

## STEP 0 — Verify Context

```
IF .github/mma/config.yaml DOES NOT EXIST:
  → "⚠️ Run /m3a-init first."
  → STOP

Read:
  - .github/mma/config.yaml → project name, current version
  - .github/mma/backlog/sprints/sprint-status.yaml → completed stories
  - .github/mma/backlog/epics/ → completed epics
  - CHANGELOG.md → existing entries
```

---

## STEP 1 — Version Scope

```
"Generate release notes for which version?

[1] Auto-detect — use completed stories since last release
[2] Specific version — I will provide the version number
[3] Sprint-based — all items completed in Sprint N

Version number (semver): "
```

---

## STEP 2 — Collect Changes

Sources (in priority order):
1. Completed stories in sprint-status.yaml
2. Completed epics
3. Git log since last tag (if available)
4. Manual additions from human

Categorize into Keep a Changelog sections:
- `Added` — new features
- `Changed` — changes in existing functionality
- `Deprecated` — soon-to-be removed features
- `Removed` — removed features
- `Fixed` — bug fixes
- `Security` — vulnerability fixes

---

## STEP 3 — Generate Layer 1 (CHANGELOG.md)

```markdown
## [X.Y.Z] — YYYY-MM-DD

### Added
- [Description] ([STORY-NNN])

### Changed
- [Description] ([STORY-NNN])

### Fixed
- [Description] ([STORY-NNN])

### Security
- [Description] ([STORY-NNN])
```

Append under `## [Unreleased]` or create new version section.

---

## STEP 4 — Generate Layer 2 (HTML Executive Summary)

If `docs.mode` includes HTML:

```html
<!-- docs/html/release-notes-X.Y.Z.html -->
<!-- Minsait-branded executive summary -->
<!-- Audience: managers, stakeholders -->
<!-- Content: high-level what changed, business impact, next steps -->
```

---

## STEP 5 — Output

```
✅ Release notes generated:
  Layer 1: CHANGELOG.md updated with [X.Y.Z]
  Layer 2: docs/html/release-notes-X.Y.Z.html
```

---

## Changelog

**v1.0.0 (2026-04-24)** — Skill created. Two-layer release notes from backlog and git history.
