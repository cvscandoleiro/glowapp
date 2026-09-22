---
adr_number: "ADR-{{ADR_NUMBER}}"
title: "{{ADR_TITLE}}"
status: "{{ADR_STATUS}}"           # proposed | accepted | rejected | deprecated | superseded
date: "{{DOC_DATE}}"
project: "{{PROJECT_CODE}}"
organization: "{{ORG_LEGAL}}"
authors: ["{{ENG_A}}"]
supersedes: ""                     # ADR-NNN (if replaces an existing decision)
superseded_by: ""                  # ADR-NNN (if later replaced)
tags: []                           # e.g., [architecture, database, security]
---

# ADR-{{ADR_NUMBER}}: {{ADR_TITLE}}

**Project:** {{PROJECT_NAME}}
**Status:** {{ADR_STATUS}}
**Date:** {{DOC_DATE}}
**Authors:** {{ENG_A}}

---

## Context

*[Describe the situation, forces, and constraints that led to this decision.]*
*[What is happening in the project that requires a decision?]*
*[What are the technical, business, or organizational constraints?]*
*[Keep this factual and neutral — do not advocate for any option here.]*

---

## Decision

*[State the decision clearly in one or two sentences.]*

> **We will** *[do X]* **because** *[key reason]*.

---

## Rationale

*[Explain why this option was chosen over the alternatives.]*
*[Connect back to the constraints described in Context.]*
*[Reference any data, benchmarks, or analysis used to support the decision.]*

**Key factors that drove this decision:**

- *[Factor 1: e.g., backward compatibility with existing DAO layer]*
- *[Factor 2: e.g., no license cost change]*
- *[Factor 3: e.g., team expertise already present]*

---

## Alternatives Considered

> ⚠️ This section is mandatory. An ADR without rejected alternatives is incomplete.

### Option A: [Name of this option — the chosen option]

**Description:** *[What this option entails]*

**Pros:**
- *[Advantage 1]*
- *[Advantage 2]*

**Cons:**
- *[Disadvantage 1]*
- *[Disadvantage 2]*

**Assessment:** ✅ Selected

---

### Option B: [Name of alternative]

**Description:** *[What this option entails]*

**Pros:**
- *[Advantage 1]*

**Cons:**
- *[Why this was rejected]*
- *[Specific risk or cost that ruled it out]*

**Assessment:** ❌ Rejected — *[one-line rejection reason]*

---

### Option C: [Name of alternative]

**Description:** *[What this option entails]*

**Pros:**
- *[Advantage 1]*

**Cons:**
- *[Why this was rejected]*

**Assessment:** ❌ Rejected — *[one-line rejection reason]*

---

## Consequences

### Positive Consequences

- *[Expected benefit 1]*
- *[Expected benefit 2]*

### Negative Consequences / Trade-offs

- *[Trade-off or accepted downside 1]*
- *[Trade-off or accepted downside 2]*

### Tasks Required

- [ ] *[Implementation task that follows from this decision]*
- [ ] *[Documentation update required]*
- [ ] *[Dependent team to notify]*

---

## Review Notes

*[Optional: Record any dissenting opinions or conditions under which this decision should be revisited.]*

**Revisit if:**
- *[Condition under which this decision should be re-evaluated]*

---

## References

- *[Link to relevant issue, PR, or discussion]*
- *[Link to external documentation, RFC, or benchmark]*
- *[Related ADRs: ADR-NNN]*

---

*Document maintained by {{ORG_LEGAL}} — {{TEAM_NAME}}*
*Path: `.github/mma/decisions/ADR-{{ADR_NUMBER}}-{{ADR_SLUG}}.md`*
