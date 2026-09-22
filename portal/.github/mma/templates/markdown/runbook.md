---
title: "Runbook: {{RUNBOOK_TITLE}}"
runbook_id: "RB-{{RUNBOOK_NUMBER}}"
version: "{{DOC_VERSION}}"
status: "{{DOC_STATUS}}"           # draft | review | approved | deprecated
date: "{{DOC_DATE}}"
project: "{{PROJECT_CODE}}"
organization: "{{ORG_LEGAL}}"
reviewed_by: "{{ENG_A}}"
applies_to: "{{STACK_OS}} / {{STACK_RUNTIME}}"
estimated_duration: "{{RUNBOOK_DURATION}}"  # e.g., "15-30 minutes"
---

# RB-{{RUNBOOK_NUMBER}}: {{RUNBOOK_TITLE}}

**Project:** {{PROJECT_NAME}}
**Environment:** `{{STACK_OS}}` / `{{STACK_RUNTIME}}`
**Estimated Duration:** {{RUNBOOK_DURATION}}
**Status:** {{DOC_STATUS}}
**Last Reviewed:** {{DOC_DATE}}

> ⚠️ **Read this runbook completely before executing any steps.**
> Do not start if prerequisites are not met.

---

## 1. Purpose

*[One-paragraph description of what this runbook accomplishes and when to use it.]*

**Triggers for this runbook:**
- *[When should an operator run this? Be specific.]*
- *[What event, alert, or scheduled need triggers execution?]*

---

## 2. Prerequisites

### System Access Required

- [ ] Access to `{{STACK_DEPLOY}}` environment
- [ ] SSH/CLI access to relevant nodes (or equivalent)
- [ ] *[Specific permissions or roles required]*

### Tools Required

- `{{STACK_RUNTIME}}` installed and in PATH
- *[Other tools: kubectl, psql, curl, etc.]*

### State Prerequisites

- [ ] System is in expected pre-run state: *[describe state]*
- [ ] Recent backup exists: *[describe backup verification]*
- [ ] No active incidents affecting this component

### Notifications Before Starting

- [ ] Notify: *[team or on-call channel]*
- [ ] Maintenance window approved (if applicable)

---

## 3. Step-by-Step Procedure

> Mark each step as complete (`[x]`) as you execute it.
> If a step fails, go to Section 5 (Rollback) immediately.

### Step 1: *[Step Name]*

**What this does:** *[Brief explanation — what and why.]*

```bash
# Command(s) to execute
{{STEP_1_COMMAND}}
```

**Expected output:**
```
{{STEP_1_EXPECTED_OUTPUT}}
```

**Failure indicator:** *[What does failure look like? Error message to watch for.]*

- [ ] Step 1 completed ✓

---

### Step 2: *[Step Name]*

**What this does:** *[Brief explanation.]*

```bash
{{STEP_2_COMMAND}}
```

**Expected output:**
```
{{STEP_2_EXPECTED_OUTPUT}}
```

- [ ] Step 2 completed ✓

---

### Step 3: *[Step Name]*

**What this does:** *[Brief explanation.]*

```bash
{{STEP_3_COMMAND}}
```

**Expected output:**
```
{{STEP_3_EXPECTED_OUTPUT}}
```

- [ ] Step 3 completed ✓

---

*[Add or remove steps as needed.]*

---

## 4. Verification

*[How to confirm the procedure completed successfully.]*

### Verification Checks

- [ ] **Check 1:** *[What to verify and how]*

  ```bash
  # Verification command
  {{VERIFY_COMMAND_1}}
  ```

  Expected: `{{VERIFY_EXPECTED_1}}`

- [ ] **Check 2:** *[What to verify and how]*
- [ ] **Check 3:** *[Service health check, endpoint ping, log grep, etc.]*

### Post-Run Notifications

- [ ] Notify *[team/channel]* that procedure is complete
- [ ] Update maintenance window status (if applicable)
- [ ] Log execution in incident ticket (if applicable)

---

## 5. Rollback

> **Stop all forward steps immediately if rollback is triggered.**

### When to Rollback

- *[Condition 1 — e.g., service fails to start after step 3]*
- *[Condition 2 — e.g., database returns errors after migration]*
- *[Any unexpected behavior not described in Step outputs]*

### Rollback Steps

**Step R1:** *[First rollback action]*

```bash
{{ROLLBACK_STEP_1_COMMAND}}
```

**Step R2:** *[Second rollback action]*

```bash
{{ROLLBACK_STEP_2_COMMAND}}
```

**Verify rollback:**

```bash
{{ROLLBACK_VERIFY_COMMAND}}
```

**After rollback:** Escalate to *[contact/team]* with:
- What step triggered rollback
- Error output observed
- Current system state

---

## 6. Escalation

| Escalation Level | Contact | When |
|---|---|---|
| Level 1 | *[On-call engineer]* | Any failure in steps 1–3 |
| Level 2 | {{ENG_A}} | Rollback required or unknown error |
| Level 3 | *[Team lead / management]* | Data loss risk or extended outage |

---

## 7. Known Issues and Edge Cases

| Issue | Symptoms | Resolution |
|---|---|---|
| *[Common issue 1]* | *[What you see]* | *[Fix or workaround]* |
| *[Common issue 2]* | *[What you see]* | *[Fix or workaround]* |

---

## 8. References

- *[Link to related ADR or architectural document]*
- *[Link to monitoring dashboard]*
- *[Link to related runbooks: RB-NNN]*

---

## 9. Document History

| Version | Date | Author | Change |
|---|---|---|---|
| {{DOC_VERSION}} | {{DOC_DATE}} | {{ENG_A}} | Initial version |

---

*Path: `docs/runbooks/RB-{{RUNBOOK_NUMBER}}-{{RUNBOOK_SLUG}}.md`*
*Maintained by {{ORG_LEGAL}} — {{TEAM_NAME}}*
