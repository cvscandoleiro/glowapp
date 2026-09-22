---
description: "MMA ADR — Generates a single Architecture Decision Record from decision context. Uses the standard ADR template. ADR MUST include context, decision, rationale, rejected alternatives, and consequences."
agent: "agent"
---

# /m3a-adr — Generate Architecture Decision Record

> **Every significant technical decision deserves an ADR.**
> Structured, reviewable, versioned — never lost in chat.

---

## Behavior Rule

- **Template-driven** — uses `templates/markdown/adr.md`
- **Complete** — MUST include rejected alternatives (mandatory)
- **Auto-numbered** — reads existing ADRs and increments the number
- **Linked** — references related epics, stories, or previous ADRs

---

## STEP 0 — Verify Context

```
IF .github/mma/config.yaml DOES NOT EXIST:
  → "⚠️ Run /m3a-init first."
  → STOP

Read:
  - .github/mma/decisions/ → existing ADRs (for auto-numbering)
  - .github/mma/knowledge/project-architecture.md → architectural context
  - .github/mma/knowledge/project-decisions-log.md → previous decisions
```

---

## STEP 1 — Decision Context

```
"What decision needs to be recorded?

1. What is the context? (What problem or need triggered this decision?)
2. What was decided? (The chosen approach)
3. What alternatives were considered? (At least 1 rejected alternative is MANDATORY)
4. What are the consequences? (Trade-offs, risks, benefits)
5. Who was involved in the decision?"
```

---

## STEP 2 — Generate ADR

Auto-number: read `.github/mma/decisions/` → find highest `ADR-NNN` → increment.

```markdown
# ADR-NNN: [Decision Title]

**Status:** Accepted | Proposed | Deprecated | Superseded by ADR-XXX
**Date:** {{DATE}}
**Deciders:** [list]
**Epic:** [EPIC-NNN if applicable]

## Context

[What is the issue that motivated this decision?]

## Decision

[What is the change that we are proposing and/or doing?]

## Rationale

[Why is this the best option given the constraints?]

## Alternatives Considered

### Alternative 1: [Name]
- **Description:** [brief]
- **Pros:** [list]
- **Cons:** [list]
- **Why rejected:** [reason]

### Alternative 2: [Name]
- **Description:** [brief]
- **Pros:** [list]
- **Cons:** [list]
- **Why rejected:** [reason]

## Consequences

### Positive
- [benefit 1]
- [benefit 2]

### Negative
- [trade-off 1]
- [risk 1]

### Neutral
- [observation]

## Related
- [Links to epics, stories, other ADRs]
```

---

## STEP 3 — Output

Save to: `.github/mma/decisions/ADR-NNN-[slug].md`
Update: `.github/mma/knowledge/project-decisions-log.md` with summary entry.

```
✅ ADR created: .github/mma/decisions/ADR-NNN-[slug].md
```

---

## Changelog

**v1.0.0 (2026-04-24)** — Skill created. ADR generation with mandatory rejected alternatives.
