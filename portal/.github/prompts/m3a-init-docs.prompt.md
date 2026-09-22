---
description: "MMA Init Docs — Workflow to define documentation strategy before generating any doc. Asks the user about structure, formats (md, html), portal, and defines folders. Must be executed before generating documentation for the project."
agent: "agent"
author: "Edimar Ferla de Almeida"
organization: "Minsait (Indra Company)"
---

# /m3a-init-docs — Documentation Strategy

> **Run before generating any documentation for the project.**  
> Defines scope, folder structure, formats, and portal preferences.

This workflow configures persistent project documentation. For a one-off HTML artifact without project initialization, use `/m3a-create-html` instead.

---

## Behavior Rule

Conducts a conversational interview. **One question at a time.** Never generates documentation directly — configures the strategy. Agents (especially `m3a-docs`) will use the result of this skill.

For any concrete HTML artifact after the strategy is defined, the next step is `/m3a-create-html`, which gathers the mandatory HTML design brief before page generation.

This skill is for persistent docs strategy. `/m3a-create-html` remains valid without `/m3a-init` when the user only needs a punctual HTML deliverable.

---

## STEP 0 — Verify Context

```
IF .github/mma/config.yaml DOES NOT EXIST:
  → "⚠️ /m3a-init must be run first. Run /m3a-init to configure the project."
  → STOP

IF .github/mma/config.yaml.docs.mode ALREADY DEFINED:
  → Show current configuration
  → Ask: "Do you want to review the current documentation strategy?"
  → If no → STOP
```

---

## STEP 1 — Documentation Scope

**Question 1:**
```
"For project {{PROJECT_NAME}}, what types of documentation do you need?
You may select multiple:

[1] Technical docs (architecture, modules, API)
[2] Executive/management docs (reports, summaries)
[3] Operational docs (runbooks, troubleshooting)
[4] Project management (epics, stories, roadmap)
[5] All of the above

Choose the numbers or describe your needs:"
```

---

## STEP 2 — Output Format

**Question 2:**
```
"What documentation format do you prefer?

[1] Markdown only (.md) — simple, versionable in git
[2] Markdown + Minsait HTML — .md docs + HTML version in Minsait branding
[3] Full portal — everything centralized in a navigable HTML portal

Recommendation for large teams: option [3].
For agile teams: option [1] or [2]."
```

---

## STEP 3 — Folder Structure

**Question 3:**
```
"Where do you want the documentation saved?

[1] Default: /docs/ (recommended — project root)
[2] Custom: provide the path"
```

If HTML or portal enabled:
```
"Subfolder for HTMLs:
[1] Default: /docs/html/ (recommended)
[2] Custom: provide the path"
```

---

## STEP 4 — Documentation Portal (if opts 2 or 3)

**Question 4:**
```
"What do you want to call your documentation portal?

Example: '{{PROJECT_NAME}} — Technical Documentation Portal'

Portal title:"
```

**Question 5:**
```
"Portal subtitle (optional):
Example: 'v{{VERSION_CURRENT}} — Architecture & Operations Guide'

Subtitle (or press Enter to skip):"
```

---

## STEP 5 — Document Language

**Question 6:**
```
"In which language should documents be generated?

[1] Portuguese (pt-BR) — team standard
[2] English (en-US)
[3] Spanish (es-ES)

Note: can generate in more than one language if needed."
```

---

## STEP 6 — Rollout Tracker

**Question 7:**
```
"Do you want an HTML Rollout Tracker to visually track epics and sprints?

This is an interactive dashboard with:
- Burndown chart
- Epic and story status
- Sprint Gantt timeline
- Filters and CSV export

[1] Yes — I want the Rollout Tracker
[2] Not right now"
```

---

## STEP 7 — Documentation Owners (Layer 2)

**Question 8:**
```
"For executive documentation (reports for management and client),
what name should appear as responsible?

In reports, we use real engineer names — not AI names.
Agents appear as 'Eng. A', 'Eng. B', 'Eng. C' by default.

Do you want to customize the names?
[1] Keep default (Eng. A, Eng. B, Eng. C)
[2] Customize — provide the names"
```

---

## STEP 8 — Confirmation and Configuration

Show SUMMARY:
```
📋 DOCUMENTATION STRATEGY — {{PROJECT_NAME}}

Scope: [selected]
Format: [selected]
Docs folder: /docs/
HTML folder: /docs/html/ (if enabled)
Portal: [configured title]
Language: [selected]
Rollout Tracker: [yes/no]
Layer 2 owners: [names]

Confirm? [Y/N]"
```

---

## STEP 9 — Apply Configuration

After confirmation:
1. Update `.github/mma/config.yaml` (section `docs:`)
2. Create `docs/` folder if it does not exist
3. If HTML/portal: create `docs/html/` folder and copy template `portal/index.html`
4. If rollout-tracker: copy template `trackers/rollout-tracker.html`
5. If portal: create `docs/html/assets/` (symlink or copy of assets)
6. Create `docs/README.md` with initial index

**Chat output:**
```
✅ Documentation strategy configured: docs/
✅ HTML Portal: docs/html/index.html (configure PORTAL_CONFIG in the file)
✅ Rollout Tracker: docs/html/rollout-tracker.html (if enabled)
📌 Next HTML step: /m3a-create-html to build the mandatory HTML design brief.
📌 Next: use /m3a-init-epic to structure epics and connect to the tracker.
```

---

## Docs Generation Behavior

After this setup, the `m3a-docs` agent (Borges) will automatically use:
- The correct template based on the configuration
- The defined language
- The configured folder structure
- The owner names for Layer 2
- The HTML design brief produced by `/m3a-create-html` before generating any concrete HTML page

**Layer 2 Rule:** Executive documents NEVER mention AI, agents, or M3A Team. They appear as engineering team reports.
