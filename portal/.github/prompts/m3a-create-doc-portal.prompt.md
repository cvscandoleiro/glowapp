---
description: "MMA Create Doc Portal — Generates a Minsait-branded HTML documentation portal with navigation, architecture pages, decision logs, and team pages. Uses ForFutureSans fonts and Minsait brand palette."
agent: "agent"
---

# /m3a-create-doc-portal — Generate Documentation Portal

> **Creates a navigable HTML portal with Minsait branding.**
> Reads project context from `.github/mma/config.yaml` and knowledge base.

`/m3a-create-html` can run without `/m3a-init` for one-off HTML artifacts. This portal flow remains project-context oriented and should prefer initialized project data whenever available.

---

## Behavior Rule

- **Brand-compliant** — uses ForFutureSans fonts, Minsait color palette, CSS variables
- **Content-driven** — generates pages from existing knowledge base content
- **Non-destructive** — if `docs/portal/` exists, asks before overwriting
- **Responsive** — mobile-friendly, accessible (WCAG 2.1 AA)
- **Brief-first** — requires a complete HTML design brief before generating the portal

---

## STEP 0 — Verify Context

```
IF .github/mma/config.yaml DOES NOT EXIST:
  → "⚠️ Project context missing for portal generation. Run /m3a-init and /m3a-init-docs for persistent documentation strategy, or use /m3a-create-html for a one-off HTML artifact."
  → STOP

Read:
  - .github/mma/config.yaml → project name, subtitle, tagline, docs.mode
  - .github/mma/knowledge/ → available content for portal pages
  - assets/ → verify Minsait fonts and logos are accessible

HTML design brief policy:
  1. Validate whether a complete HTML design brief already exists in the current request or prior context.
  2. If the brief is missing or weak, run the same conversational intake as `/m3a-create-html`.
  3. Ask one question at a time until the brief covers: artifact type, primary goal, target audience, Minsait-only branding, theme, modern premium visual direction, detail level, content source, build mode, required sections, interactivity needs, and expected output path.
  4. Only generate the portal after the brief is complete.
  5. Distinction: `/m3a-create-html` supports ad hoc HTML creation without `/m3a-init`; `/m3a-create-doc-portal` still expects initialized project context because it generates persistent project documentation.

Brand asset policy:
  1. Try the canonical path for the HTML type first.
     - docs/portal/*.html → assets/AF_MINSAIT_LOG_NEG.png, assets/AF_MINSAIT_LOG_POS.png, assets/AF_MINSAIT_SIM_POS.png, assets/fonts/Web Fonts/WOFF2/...
     - docs/trackers/*.html → ../portal/assets/AF_MINSAIT_LOG_NEG.png, ../portal/assets/AF_MINSAIT_LOG_POS.png, ../portal/assets/AF_MINSAIT_SIM_POS.png, ../portal/assets/fonts/Web Fonts/WOFF2/...
  2. If the canonical path fails, scan the project/workspace for an assets/ directory containing only the approved MMA branding whitelist:
     - AF_MINSAIT_LOG_NEG.png
     - AF_MINSAIT_LOG_POS.png
     - AF_MINSAIT_SIM_POS.png
     - AF_MINSAIT_SIM_NEG.png
     - fonts/Web Fonts/WOFF2/ForFutureSans-Light.woff2
     - fonts/Web Fonts/WOFF2/ForFutureSans-Regular.woff2
     - fonts/Web Fonts/WOFF2/ForFutureSans-Medium.woff2
     - fonts/Web Fonts/WOFF2/ForFutureSans-Bold.woff2
     - fonts/Web Fonts/WOFF2/ForFutureSans-Black.woff2
  3. Recalculate the relative asset path from the HTML file being generated.
  4. If no approved asset set is found, stop and ask the human for a decision.
  5. Never improvise a text logo, never use arbitrary images, never use assets/logos/... or assets/fonts/fonts.css.

IF docs/portal/index.html ALREADY EXISTS:
  → "Portal already exists. Regenerate? [y/N]"
  → If N → STOP
```

---

## STEP 1 — Portal Structure

Generate the following structure:

```
docs/portal/
├── index.html              ← main landing page
├── architecture.html       ← C4 diagrams, module overview
├── decisions.html          ← ADR list, decision log
├── sprints.html            ← sprint status, velocity
├── security.html           ← CVE summary, security baseline
├── team.html               ← agent roster, responsibilities
└── assets/
    ├── portal.css          ← Minsait-branded styles
    └── portal.js           ← navigation, search, i18n
```

---

## STEP 2 — Branding

CSS variables structure (`:root`):
```css
:root {
  --minsait-primary: #E4002B;
  --minsait-secondary: #1A1A2E;
  --minsait-accent: #FF6B35;
  --minsait-bg: #FAFAFA;
  --minsait-text: #333333;
  --minsait-font: 'ForFutureSans', 'Segoe UI', sans-serif;
}
```

- All logo `src` paths must remain relative (e.g., `assets/AF_MINSAIT_LOG_NEG.png` for portal pages)
- Fonts must reference the official WOFF2 files directly (e.g., `assets/fonts/Web Fonts/WOFF2/ForFutureSans-Regular.woff2`)
- Use only the approved MMA branding whitelist discovered in STEP 0
- If approved assets are not available, pause generation and ask the human instead of falling back to text or arbitrary imagery
- Never inline project-specific colors — use CSS variables

---

## STEP 3 — Content Population

For each portal page, read the corresponding knowledge base file and transform to HTML:

| Portal Page | Source |
|---|---|
| Architecture | `.github/mma/knowledge/project-architecture.md` |
| Decisions | `.github/mma/knowledge/project-decisions-log.md` |
| Sprints | `.github/mma/backlog/sprints/sprint-status.yaml` |
| Security | `.github/mma/knowledge/security-findings.md` |
| Team | `agents.registry.yaml` |

---

## STEP 4 — Output

```
✅ Documentation portal created:
  docs/portal/index.html + [N] pages

Generated from the approved HTML design brief.

Open docs/portal/index.html in a browser to preview.
```

---

## Changelog

**v1.0.0 (2026-04-24)** — Skill created. Minsait-branded HTML portal generation from knowledge base.
**v1.1.0 (2026-05-15)** — Added mandatory branding asset resolution policy, corrected obsolete logo/font references, and blocked improvised fallbacks.
**v1.2.0 (2026-05-15)** — Portal generation now requires the same one-question-at-a-time HTML design brief intake used by `/m3a-create-html` whenever the request is incomplete.
