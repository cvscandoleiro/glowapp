---
description: "MMA Dependency Audit — Performs dependency inventory, CVE severity scan summary, EOL calendar, and recommended updates. Updates risk register. Flags security ADR candidates."
agent: "agent"
---

# /m3a-dependency-audit — Dependency & CVE Audit

> **Know your dependencies. Know your risks.**
> Inventory → CVE scan → EOL calendar → recommendations.

---

## Behavior Rule

- **Evidence-based** — reads actual dependency files, not assumptions
- **Severity-ranked** — CRITICAL → HIGH → MEDIUM → LOW
- **Actionable** — every finding has a recommendation
- **Non-destructive** — reports only, never auto-updates dependencies

---

## STEP 0 — Verify Context

```
IF .github/mma/config.yaml DOES NOT EXIST:
  → "⚠️ Run /m3a-init first."
  → STOP

Read:
  - .github/mma/config.yaml → stack, runtime versions
  - pom.xml / package.json / requirements.txt / go.mod / *.csproj → dependencies
  - .github/mma/knowledge/dependencies.md → previous audit (if exists)
```

---

## STEP 1 — Dependency Inventory

Scan all dependency manifests:

| Source | File |
|---|---|
| Java/Maven | `pom.xml`, `build.gradle` |
| Node.js | `package.json`, `package-lock.json` |
| Python | `requirements.txt`, `Pipfile`, `pyproject.toml` |
| .NET | `*.csproj`, `packages.config` |
| Go | `go.mod`, `go.sum` |

For each dependency, record:
- Name, current version, latest version
- License type
- Direct vs transitive
- Last update date

---

## STEP 2 — CVE Scan

For each dependency, check known CVEs:

```markdown
## CVE Summary

| Dependency | Version | CVE | Severity | Fix Version | Status |
|---|---|---|---|---|---|
| [name] | [current] | CVE-YYYY-NNNNN | CRITICAL | [fix ver] | Action needed |
| [name] | [current] | CVE-YYYY-NNNNN | HIGH | [fix ver] | Action needed |
```

---

## STEP 3 — EOL Calendar

```markdown
## End-of-Life Calendar

| Component | Current Version | EOL Date | Recommended Version | Urgency |
|---|---|---|---|---|
| [runtime] | [version] | [date] | [target] | 🔴 Critical / 🟡 Medium / 🟢 Low |
```

---

## STEP 4 — Recommendations

```markdown
## Recommended Actions

### Immediate (CRITICAL/HIGH CVE)
1. Update [dependency] from [current] to [fix] — CVE-YYYY-NNNNN
2. ...

### Short-term (EOL within 6 months)
1. Plan migration of [component] to [version]
2. ...

### Medium-term (technical debt)
1. Consider replacing [library] with [alternative]
2. ...

### ADR Candidates
- [Decision needed about X — should become ADR]
```

---

## STEP 5 — Output

Save to:
- `.github/mma/knowledge/dependencies.md` — updated inventory
- `docs/security/cve-audit-[date].md` — CVE report
- `.github/mma/knowledge/security-findings.md` — updated findings

```
✅ Dependency audit complete:
  - [N] dependencies inventoried
  - [N] CVEs found (C: [n], H: [n], M: [n], L: [n])
  - [N] EOL warnings
```

---

## Changelog

**v1.0.0 (2026-04-24)** — Skill created. Dependency inventory with CVE scan and EOL calendar.
