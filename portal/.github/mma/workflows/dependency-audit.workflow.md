---
description: "Workflow for dependency audit (/m3a-dependency-audit). Multi-agent coordinated workflow: dependency inventory, CVE severity scan, EOL calendar, recommended updates. Produces risk register updates and security ADR candidates."
workflow-id: "dependency-audit"
workflow-version: "1.0.0"
command: "/m3a-dependency-audit"
author: "Edimar Ferla de Almeida"
organization: "Minsait (Indra Company)"
last-updated: "2026-04-24"
---

# Workflow: Dependency Audit (/m3a-dependency-audit)

> **Know your dependencies. Know your risks.**
> Automated inventory → CVE scan → EOL calendar → actionable recommendations.

---

## Pre-conditions

```
□ .github/mma/config.yaml exists
□ Codebase accessible (dependency manifests readable)
□ Previous audit results available in .github/mma/knowledge/dependencies.md (optional — for delta)
```

---

## PHASE 1 — Inventory

Lead: M3A: Analyst (Descartes)

Scan all dependency manifests in the project:
- `pom.xml` / `build.gradle` (Java)
- `package.json` / `package-lock.json` (Node.js)
- `requirements.txt` / `Pipfile` / `pyproject.toml` (Python)
- `go.mod` (Go)
- `*.csproj` / `packages.config` (.NET)

For each dependency: name, version, license, direct/transitive, last update.

---

## PHASE 2 — CVE Scan

Lead: M3A: Security (Hobbes)

For each dependency, check known CVEs:
- Severity: CRITICAL / HIGH / MEDIUM / LOW
- Fix available? Version with fix.
- Exploitability: known exploits in the wild?

---

## PHASE 3 — EOL Calendar

Lead: M3A: Analyst (Descartes) + M3A: DevOps (Atlas)

For each major component (runtime, framework, DB, OS):
- Current version
- EOL date
- Recommended migration target
- Urgency level

---

## PHASE 4 — Recommendations

Consolidated by: M3A: Orchestrator (Marcus Aurelius)

Categorize recommendations:
1. **Immediate** — CRITICAL CVEs, active exploits
2. **Short-term** — HIGH CVEs, EOL within 6 months
3. **Medium-term** — technical debt, outdated patterns
4. **ADR candidates** — decisions needed for major changes

---

## Outputs

- `.github/mma/knowledge/dependencies.md` — updated inventory
- `docs/security/cve-audit-[date].md` — CVE report
- `docs/eol-calendar.md` — EOL risk calendar
- `.github/mma/knowledge/security-findings.md` — updated findings
- `.github/mma/decisions/` — ADR candidates flagged

---

## Changelog

**v1.0.0 (2026-04-24)** — Workflow created. Multi-agent dependency audit with CVE scan and EOL calendar.
