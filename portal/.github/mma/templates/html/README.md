# M3A Team — HTML Templates

Production-ready Minsait-branded HTML templates for project documentation portals and related premium HTML artifacts.
Zero build step required — open in any browser after filling in the config block.

These templates are the primary building blocks reused by `/m3a-create-html` and portal-oriented documentation flows.

---

## Available Templates

### `portal/index.html` — Documentation Portal

A full documentation portal with sidebar navigation, document hub, and client-side search.

| Feature | Details |
|---|---|
| Layout | Fixed header + collapsible sidebar (280px) + main content |
| Navigation | Dynamic from `PORTAL_CONFIG.navLinks` array |
| Document cards | Dynamic from `PORTAL_CONFIG.docLinks` array, grouped by category |
| Search | Client-side, searches document titles and descriptions |
| Stats | Configurable stat cards in the page header |
| Sections | Document Hub · Project Overview · Tech Stack · Architecture · Release Notes |
| Responsive | Collapses sidebar on < 1024px, hides search on mobile |
| Print | Sidebar/header hidden, 2-column card grid |
| Assets | `assets/` folder with ForFutureSans fonts + Minsait logos |

**When to use:** As the main documentation home for a project — links out to all other documents.

---

### `trackers/rollout-tracker.html` — Rollout Tracker

A real-time sprint and epic tracker with charts, inline-editable stories table, Gantt timeline, and CSV export.

| Feature | Details |
|---|---|
| Charts | Donut (story status) · Burndown (project-wide) · Epic progress bar · Assignee bar |
| Stories table | Inline editable status, assignee, dates, notes; filter by status/assignee/priority/epic |
| Epic panorama | Progress bars per epic with live story counts |
| Gantt timeline | Sprint × Epic grid with gate markers |
| Risk gates | Configurable gate cards (pending/ok/fail) |
| Blockers | Active blocker cards |
| Save to file | Uses File System Access API to overwrite the HTML file in place (Chrome/Edge) |
| CSV export | Exports current filtered view as CSV |
| Print | Optimized print layout (sidebar/header hidden) |
| Chart.js | Loaded from CDN (4.4.0) — requires internet connection |

**When to use:** As the live sprint tracker for an ongoing project — updated daily or per sprint.

`/m3a-create-html` can also adapt this tracker family for rollout dashboards, status pages, and report-style HTML artifacts after the mandatory HTML design brief is completed.

---

## Usage Guide

### Step 1 — Copy the assets folder

The templates expect an `assets/` folder with:

```
assets/
├── AF_MINSAIT_LOG_NEG.png        # Logo for dark backgrounds (header)
├── AF_MINSAIT_LOG_POS.png        # Logo for light backgrounds (footer)
├── AF_MINSAIT_SIM_POS.png        # Symbol/favicon
├── AF_MINSAIT_SIM_NEG.png        # Symbol for dark backgrounds
└── fonts/
    └── Web Fonts/
        └── WOFF2/
            ├── ForFutureSans-Light.woff2
            ├── ForFutureSans-Regular.woff2
            ├── ForFutureSans-Medium.woff2
            ├── ForFutureSans-Bold.woff2
            └── ForFutureSans-Black.woff2
```

Copy the `assets/` folder from any existing Minsait portal (e.g., DRACO's `docs/html/assets/`).

### Step 2 — Set up folder structure

Recommended layout in your project:

```
docs/html/
├── assets/                        # Copy from source project
├── index.html                     # → portal/index.html (filled in)
├── rollout-tracker.html           # → trackers/rollout-tracker.html (filled in)
└── [your-other-documents].html
```

> **Note:** When deploying, adjust the `assetsPath` and relative paths in the templates
> to match your folder layout. The tracker uses `../portal/assets/` by default.

### Step 3 — Fill in `PORTAL_CONFIG` (portal)

Open `portal/index.html` and edit the `PORTAL_CONFIG` block at the top of the `<script>` section:

```javascript
const PORTAL_CONFIG = {
    projectName:    "My Platform",
    projectCode:    "MMP",
    version:        "1.0.0",
    versionTarget:  "2.0.0",
    organization:   "Minsait (An Indra Company)",
    tagline:        "Tech for impact",
    language:       "en-US",
    docYear:        "2026",
    portalSubtitle: "Centralized technical documentation hub",

    stats: [
        { number: "12",  label: "Technical Documents" },
        { number: "8",   label: "Modules Analyzed" },
        { number: "150+", label: "Dependencies Catalogued" },
    ],

    docLinks: [
        { id: "exec-summary", category: "overview", icon: "📊", featured: true,
          label: "Executive Summary", href: "executive-summary.html",
          description: "High-level project status and strategic direction.",
          meta: "Updated: 2026-05-01" },
        // Add more documents here...
    ],
};
```

No other changes needed — all rendering is automatic.

### Step 4 — Fill in project data (tracker)

Open `trackers/rollout-tracker.html` and edit the project data block:

```javascript
const PROJETO = { nome: "My Platform", versao: "2.0.0", ... };
const SPRINT_ATUAL = { numero: 1, nome: "Sprint 1 — Foundation", ... };
const EPICS = [
    { id: "EPIC-001", codigo: "EP-01", titulo: "Foundation Setup", ... },
];
const STORIES = [
    { id: "US-001", epicId: "EPIC-001", titulo: "Set up pipeline", ... },
];
const BURNDOWN_REAL = [{ data: "2026-05-01", concluidas: 0 }];
const SPRINT_CALENDAR = [
    { id: "S01", label: "S01", inicio: "2026-05-01", fim: "2026-05-14" },
];
```

### Step 5 — Open in browser

No build step, no server required. Open `index.html` directly in Chrome or Edge.

> **Chrome/Edge recommended** for the 💾 Save feature (File System Access API).
> The tracker works read-only in all other browsers.

---

## How `/m3a-init-docs` and `/m3a-create-html` Use These Templates

When the M3A Team Docs agent runs `/m3a-init-docs`, it:

1. Copies these templates to `docs/html/` in the target project.
2. Reads project metadata from `.github/mma/config.yaml`.
3. Replaces `{{PLACEHOLDER}}` values with actual project data using the agent's
   `generate_from_template` skill.
4. Copies the `assets/` folder if not already present.
5. Commits the generated files to the repository.

When the M3A Team Docs agent runs `/m3a-create-html`, it:

1. Conducts conversational intake one question at a time and assembles the mandatory HTML design brief before any generation starts.
2. Reuses `.github/mma/config.yaml` when it exists; otherwise it runs in ad hoc mode and explicitly collects Minsait branding, language/locale, naming, and output destination.
3. Selects or adapts the closest template family for portal, dashboard, rollout tracker, report page, landing page, and equivalent HTML artifacts.
4. Keeps branding restricted to approved Minsait assets and preserves the modern premium visual quality bar.

When `/m3a-init-epic` runs, it creates a new epic HTML file and adds a link
to the `docLinks` array in `index.html` automatically.

---

## Minsait Branding Reference

| Token | Value |
|---|---|
| `--minsait-pruno` | `rgb(72, 14, 42)` — dark wine (primary) |
| `--minsait-fucsia` | `rgb(255, 0, 84)` — fuchsia (accent) |
| `--minsait-pruno-oscuro` | `rgb(38, 7, 23)` — deep wine (gradient dark) |
| `--minsait-gris-ceramica` | `rgb(227, 226, 218)` — ceramic grey |
| Font | ForFutureSans (weights: 300/400/500/700/800) |
| Header gradient | `linear-gradient(90deg, pruno-oscuro 0%, pruno 100%)` |
| Accent usage | Sidebar active border, section underlines, featured card border, badges |

> **Rule:** Never change CSS variable names or the color palette. Only change content.

---

## Template Version

| Template | Version | Last Updated |
|---|---|---|
| `portal/index.html` | 1.0.0 | 2026-04-11 |
| `trackers/rollout-tracker.html` | 1.0.0 | 2026-04-11 |
| `README.md` | 1.0.0 | 2026-04-11 |
