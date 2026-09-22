---
description: "MMA Quality Gates — Defines Definition of Done checklists per delivery type (feature, hotfix, migration, infrastructure, documentation). Generates quality-gates.md per the template."
agent: "agent"
---

# /m3a-quality-gates — Define Quality Gates

> **Clear, measurable criteria for what 'done' means — per delivery type.**
> No ambiguity. No "it works on my machine."

---

## Behavior Rule

- **Template-driven** — uses `templates/markdown/quality-gates.md`
- **Customizable** — adapts to project stack and team conventions
- **Enforced** — agents reference these gates in story-done and epic-done reviews
- **Living document** — updated as team matures

---

## STEP 0 — Verify Context

```
IF .github/mma/config.yaml DOES NOT EXIST:
  → "⚠️ Run /m3a-init first."
  → STOP

Read:
  - .github/mma/config.yaml → stack, team size, CI/CD platform
  - .github/mma/knowledge/project-conventions.md → existing conventions
```

---

## STEP 1 — Delivery Types

```
"Which delivery types does your project use?

[1] Feature — new functionality
[2] Hotfix — production bug fix
[3] Migration — data or stack migration
[4] Infrastructure — infra/DevOps changes
[5] Documentation — docs-only changes
[6] All of the above (recommended)

Select the types to define gates for:"
```

---

## STEP 2 — Generate Quality Gates

For each delivery type, generate a DoD checklist:

```markdown
# Quality Gates — {{PROJECT_NAME}}

**Date:** {{DATE}}
**Status:** Active
**Applies to:** All stories and epics

---

## Feature Delivery

### Code Quality
- [ ] Code reviewed by at least 1 peer
- [ ] No compiler warnings introduced
- [ ] Follows project coding conventions
- [ ] No TODO/FIXME left without a linked story

### Testing
- [ ] Unit tests written for new code
- [ ] Integration tests for new endpoints/services
- [ ] All existing tests pass (zero regressions)
- [ ] Test coverage does not decrease

### Security
- [ ] No OWASP Top 10 vulnerabilities introduced
- [ ] No secrets/credentials in code
- [ ] Input validation on all new endpoints

### Documentation
- [ ] API documentation updated (if applicable)
- [ ] Knowledge base updated (if architectural change)
- [ ] CHANGELOG entry added

### Build & Deploy
- [ ] Build passes in CI/CD pipeline
- [ ] No new dependency with known CRITICAL/HIGH CVE
- [ ] Deploy tested in staging (if applicable)

---

## Hotfix Delivery

### Mandatory
- [ ] Root cause identified and documented
- [ ] Fix is minimal — no feature creep
- [ ] Regression test added for the specific bug
- [ ] All existing tests pass
- [ ] Deployed to staging before production

---

## Migration Delivery

### Mandatory
- [ ] Rollback procedure documented and tested
- [ ] Data integrity verified post-migration
- [ ] Performance benchmarks before/after
- [ ] Zero data loss confirmed

---

## Infrastructure Delivery

### Mandatory
- [ ] Infrastructure as Code (IaC) reviewed
- [ ] Rollback procedure documented
- [ ] Monitoring/alerting updated
- [ ] Security groups/policies reviewed

---

## Documentation Delivery

### Mandatory
- [ ] Spell-checked and grammar-reviewed
- [ ] Links verified (no broken references)
- [ ] Screenshots/diagrams current
- [ ] i18n keys added (if trilingual project)
```

---

## STEP 3 — Output

Save to: `docs/quality-gates.md`

```
✅ Quality gates defined: docs/quality-gates.md
  Delivery types covered: [list]
```

---

## Changelog

**v1.0.0 (2026-04-24)** — Skill created. DoD checklists per delivery type.
