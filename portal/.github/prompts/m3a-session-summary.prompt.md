---
description: "M3A Session Summary — Generates a compact, structured session summary (≤ 400 tokens) at the end of a work session. Enables cross-session continuity: the Orchestrator loads only this summary at next session start instead of multiple knowledge files."
agent: "agent"
---

# /m3a-session-summary — End-of-Session Summary Generator

> **Generate a compact session summary to enable continuity in the next session.**
> The Orchestrator will load this summary instead of reloading multiple knowledge files.

---

## Behavior Rules

- **Compact first** — target ≤ 400 tokens for the generated file
- **Facts only** — no narration; bullet points, tables, checkboxes
- **Session ID format** — `SESSION-YYYYMMDD-NNN` (NNN = sequential number for the day)
- **Save location** — `.github/mma/knowledge/session-log/SESSION-ID.md`
- **Also update** — `.github/mma/knowledge/session-log/latest.md` (symlink/copy to most recent)

---

## STEP 1 — Gather Session Context

Ask or infer from current context:
```
1. What was worked on today? (list artifacts created/modified)
2. What decisions were made? (check project-decisions-log.md for today's entries)
3. What is pending / next steps?
4. Any open blockers?
```

If context is available from the current conversation → use it directly without asking.

---

## STEP 2 — Generate Session ID

```
Format: SESSION-YYYYMMDD-NNN
Example: SESSION-20260530-001

Check .github/mma/knowledge/session-log/ for existing sessions today
→ increment NNN accordingly (001, 002, etc.)
```

---

## STEP 3 — Generate Summary File

Use the template from `templates/knowledge/session-log/SESSION-ID-template.md`.

Fill in:
- SESSION_ID: generated in STEP 2
- SESSION_DATE: today's date
- PROJECT_NAME: from config.yaml
- What Was Done: bullet list of actions taken
- Decisions Made: table of decisions (reference ADRs if applicable)
- Artifacts Generated: table of files created/modified
- Next Steps: checkbox list
- Open Blockers: list or "None"

Enforce: total file size ≤ 400 tokens. Summarize if needed.

---

## STEP 4 — Save Files

```
1. Save to: .github/mma/knowledge/session-log/SESSION-ID.md
2. Overwrite: .github/mma/knowledge/session-log/latest.md (same content)
```

---

## STEP 5 — Confirm

Report in chat:
```
✅ Session summary saved: .github/mma/knowledge/session-log/SESSION-20260530-001.md
   [N] tokens | [N] decisions | [N] next steps
   Next session: Orchestrator will load this summary automatically.
```
