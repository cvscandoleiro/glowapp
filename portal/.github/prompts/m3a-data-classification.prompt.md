---
description: "MMA Data Classification — Produces data classification policy, PII inventory, and data retention rules for the project's data model. Requires schema or DAO analysis from Codd."
agent: "agent"
---

# /m3a-data-classification — Data Classification Policy

> **Know your data. Classify it. Protect it.**
> PII inventory + classification levels + retention rules.

---

## Behavior Rule

- **Schema-driven** — reads actual database schema or data model
- **Regulation-aware** — considers GDPR, LGPD, or applicable regulation
- **Collaborative** — coordinates with DBA (Codd) for schema analysis
- **Actionable** — produces inventory tables, not just policies

---

## STEP 0 — Verify Context

```
IF .github/mma/config.yaml DOES NOT EXIST:
  → "⚠️ Run /m3a-init first."
  → STOP

Read:
  - .github/mma/config.yaml → stack, database type
  - .github/mma/knowledge/project-architecture.md → data layer overview
  - Database schema files or DAO/repository code
```

---

## STEP 1 — Data Model Discovery

Coordinate with DBA:
```
runSubagent("M3A: DBA", "schema analysis for data classification: list all tables/collections with columns/fields and data types")
```

---

## STEP 2 — Classification Levels

```markdown
# Data Classification Policy — {{PROJECT_NAME}}

**Date:** {{DATE}}
**Regulation:** [GDPR / LGPD / HIPAA / None specified]

## Classification Levels

| Level | Description | Examples | Handling |
|---|---|---|---|
| **Public** | Non-sensitive, freely shareable | Product names, public docs | No restrictions |
| **Internal** | Business-sensitive, org-internal | Employee IDs, internal metrics | Access control required |
| **Confidential** | PII or business-critical | Names, emails, addresses, salary | Encrypted, access-logged |
| **Restricted** | Highly sensitive | Passwords, tokens, SSN, health data | Encrypted at rest+transit, strict ACL |
```

---

## STEP 3 — PII Inventory

```markdown
## PII Inventory

| Table/Collection | Column/Field | Data Type | Classification | PII? | Encrypted? | Retention |
|---|---|---|---|---|---|---|
| users | email | varchar | Confidential | Yes | No → ACTION | 2 years |
| users | password_hash | varchar | Restricted | Yes | Yes (hashed) | Until deletion |
| orders | credit_card | varchar | Restricted | Yes | No → ACTION | 90 days |
```

---

## STEP 4 — Retention Rules

```markdown
## Data Retention Rules

| Data Category | Retention Period | Deletion Method | Legal Basis |
|---|---|---|---|
| User PII | 2 years after account deletion | Hard delete | GDPR Art. 17 |
| Transaction logs | 5 years | Archive then delete | Legal requirement |
| System logs | 90 days | Automatic rotation | Operational need |
| Backup data | 30 days | Automatic expiry | Disaster recovery |
```

---

## STEP 5 — Output

Save to: `.github/mma/knowledge/data-classification.md`

```
✅ Data classification complete:
  - [N] tables/collections analyzed
  - [N] PII fields identified
  - [N] fields requiring encryption action
```

---

## Changelog

**v1.0.0 (2026-04-24)** — Skill created. PII inventory with classification levels and retention rules.
