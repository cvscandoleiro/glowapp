---
description: "MMA Create HTML — Guided HTML intake wizard for portals, dashboards, rollout trackers, reports, landing pages, and equivalent HTML artifacts. Collects a structured HTML design brief before any generation."
agent: "agent"
author: "Edimar Ferla de Almeida"
organization: "Minsait (Indra Company)"
---

# /m3a-create-html — HTML Design Brief Wizard

> **Run this before generating any HTML artifact when the request is weak, incomplete, or still exploratory.**
> Produces a structured **HTML design brief** that becomes the mandatory base for the final generation.

---

## Behavior Rule

Conduct a conversational wizard. **One question at a time.**

- Never ask the full questionnaire in a single message.
- Never skip directly to HTML generation when the brief is incomplete.
- Never improvise branding beyond the approved Minsait asset set.
- Always default the visual direction to **modern premium**. Never fall back to a simplistic layout.
- Treat the brief as the source of truth for later portal, dashboard, tracker, report, or landing-page generation.

---

## STEP 0 — Verify Context

```
IF .github/mma/config.yaml EXISTS:
   → Read it first and use the project context normally

IF .github/mma/config.yaml DOES NOT EXIST:
   → Continue in ad hoc / one-off mode
   → Collect missing context in the wizard itself
   → Treat branding, language / locale, output destination, and any project naming inputs as mandatory intake data

Read before starting:
   - .github/mma/config.yaml (when present)
  - .github/mma/knowledge/ (if the user cites MMA knowledge as a source)
  - any user-provided markdown / JSON / CSV / notes mentioned in the request

IF the user already supplied a full HTML design brief:
  → Validate it against STEP 2 mandatory fields
  → If complete, skip the wizard and use the brief directly
  → If incomplete, ask only for the missing fields, one question at a time
```

This wizard may operate in two valid modes:

- **Project-aware mode** — use `.github/mma/config.yaml` when it exists
- **Ad hoc mode** — continue without `/m3a-init` for punctual HTML artifacts and collect the missing context during intake

---

## STEP 1 — Wizard Entry Policy

Use this skill whenever one of the following is true:

- The user asks for HTML, portal, dashboard, tracker, landing page, executive page, or report without enough design context
- The user provides only a weak prompt such as "create a portal", "make a dashboard", or "generate an HTML page"
- The requested artifact depends on layout, sections, branding, content source, or interactivity choices that are not yet explicit
- The user asks for direct HTML generation outside this command, but the intake is still missing

If the request is already complete, restate the final brief and proceed.

---

## STEP 2 — Mandatory Intake Questions

Ask these topics in sequence, **one question per message**. Adapt wording, but do not skip the topic.

1. **Artifact type**
   - Portal
   - Dashboard
   - Rollout tracker
   - Report page
   - Landing page
   - Equivalent HTML artifact (user describes)

2. **Primary goal**
   - What the HTML must achieve for the user or stakeholder

3. **Target audience**
   - Executive leadership, delivery team, technical team, client, mixed audience, other

4. **Branding**
   - Current supported option: **Minsait only**
   - If the user asks for another brand, state that future expansion can be mapped later, but the current generation is restricted to official Minsait assets
   - In ad hoc mode, confirm any missing project or artifact naming needed to apply approved Minsait branding correctly

5. **Theme**
   - Dark or light

6. **Visual direction / style**
   - Mandatory default: **modern premium**
   - Ask for preferred emphasis inside that direction: corporate, data-rich, editorial, product-style, immersive, restrained, etc.
   - Never accept or suggest "simple", "plain", or low-fidelity fallback styling

7. **Detail level**
   - Lean summary
   - Balanced
   - Deep / executive-ready
   - Deep / operational

8. **Content source**
   - MMA knowledge base (`.github/mma/knowledge/*.md`)
   - User markdown
   - Structured data (JSON / CSV)
   - Manual content provided in chat
   - Hybrid

9. **Build mode**
   - Final static HTML
   - HTML derived from markdown
   - HTML with embedded data
   - Narrative plus metrics / tables
   - Tracker / dashboard composition
   - Other clearly described mode

10. **Required blocks / sections**
    - Mandatory sections the page must contain

11. **Interactivity needs**
    - Filters
    - Search
    - Sort
    - Expand / collapse
    - Export
    - Inline edit
    - None
    - Other interaction needs

12. **Expected output path / file**
    - Exact target path when known
    - If unknown, ask for the preferred folder and final filename

Optional follow-up questions when needed:

- Language or locale
- Data refresh expectation
- Source-of-truth file priority when there are multiple sources
- KPI / metric definitions
- Device priority (desktop-first, responsive, executive tablet, etc.)
- Constraints on size, performance, offline viewing, or sharing
- Project / artifact name when `.github/mma/config.yaml` is absent
- Destination folder conventions when this is a one-off artifact outside a configured docs structure

---

## STEP 3 — Brief Assembly Rules

After collecting all required answers:

1. Consolidate them into a single **HTML design brief**.
2. Normalize vague language into implementation-ready statements.
3. Preserve unresolved gaps as explicit `OPEN QUESTIONS` instead of guessing.
4. Keep branding locked to approved Minsait assets only.
5. Keep visual direction locked to `modern premium` unless the user requested a more specific premium variant.
6. If the user asked for a simplistic layout, elevate the request into a premium interpretation instead of honoring the simplistic wording.
7. In ad hoc mode, explicitly mark that the brief was assembled without `/m3a-init` and therefore carries its own project, locale, and destination decisions.

---

## STEP 4 — HTML Design Brief Output Format

Produce the final brief using this structure:

```md
# HTML Design Brief

## 1. Artifact Summary
- Type:
- Primary goal:
- Target audience:
- Detail level:
- Operating mode: project-aware / ad hoc

## 2. Brand and Visual Direction
- Branding:
- Supported brand scope:
- Project / artifact name for branding:
- Theme:
- Visual direction:
- Layout quality bar: modern premium (mandatory)

## 3. Content Strategy
- Content source:
- Source files / datasets:
- Build mode:
- Content priority / source of truth:

## 4. Information Architecture
- Required sections:
- Optional sections:
- Narrative flow:

## 5. Data and Interaction
- Metrics / tables / charts needed:
- Interactivity requirements:
- Search / filters / export / edit expectations:

## 6. Output Definition
- Output path:
- Output filename:
- Artifact family:
- Language / locale:

## 7. Constraints and Approvals
- Approved branding assets only:
- Not in scope now:
- Open questions:

## 8. Generation Readiness
- Ready for HTML generation: yes / no
- If no, missing inputs:
```

---

## STEP 5 — Handoff Policy

When the brief is complete:

- State that the HTML generation must now use this brief as the baseline
- If the user wants the final page immediately, continue using the brief without re-interviewing
- If another Docs flow is invoked later (`/m3a-create-doc-portal`, direct HTML request, dashboard request, tracker request), reuse the brief and ask only for missing deltas
- If the brief was created in ad hoc mode, keep using it without forcing `/m3a-init`

When the brief is incomplete:

- Do not generate HTML
- Continue the wizard one question at a time until the brief is complete or the human stops

---

## Output Behavior

```
✅ HTML design brief ready: [path or session artifact]
📌 Next: use this brief as the mandatory base for HTML generation.
```

---

## Changelog

**v1.0.0 (2026-05-15)** — Skill created. Introduces the guided HTML design brief wizard for portals, dashboards, rollout trackers, reports, landing pages, and related HTML outputs.