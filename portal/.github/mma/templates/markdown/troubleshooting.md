---
title: "{{PROJECT_NAME}} — Troubleshooting Guide"
topic: "{{TROUBLESHOOTING_TOPIC}}"
version: "{{DOC_VERSION}}"
status: "{{DOC_STATUS}}"
date: "{{DOC_DATE}}"
project: "{{PROJECT_CODE}}"
organization: "{{ORG_LEGAL}}"
stack: "{{STACK_RUNTIME}} / {{STACK_OS}} / {{STACK_DB}}"
---

# Troubleshooting: {{TROUBLESHOOTING_TOPIC}}

**Project:** {{PROJECT_NAME}}
**Stack:** `{{STACK_RUNTIME}}` / `{{STACK_OS}}` / `{{STACK_DB}}`
**Last Updated:** {{DOC_DATE}}

---

## Quick Reference

*[If you know your symptom, jump directly to the relevant section below.]*

| Symptom | Section |
|---|---|
| *[Symptom 1 — one line]* | [3.1 — Issue Name](#31-issue-name) |
| *[Symptom 2 — one line]* | [3.2 — Issue Name](#32-issue-name) |
| *[Symptom 3 — one line]* | [3.3 — Issue Name](#33-issue-name) |

---

## 1. Diagnostic Approach

Before jumping to fixes, follow this diagnostic sequence:

```
1. Identify the symptom clearly (what is failing, how, where)
   ↓
2. Check recent changes (last deployment, config change, dependency update)
   ↓
3. Check logs (application, system, database)
   ↓
4. Narrow scope (which component, module, or layer)
   ↓
5. Apply targeted fix from this guide
   ↓
6. Verify fix (does the symptom disappear?)
   ↓
7. Record findings in .github/mma/knowledge/ (Law 4)
```

### Log Locations

| Component | Log Path | Key Level |
|---|---|---|
| Application | *[path/to/app.log]* | ERROR, WARN |
| Database | *[path/to/db.log]* | ERROR |
| *[Component N]* | *[path]* | *[level]* |

---

## 2. Common Environment Check

Run these before debugging any specific issue:

```bash
# Check runtime version
{{RUNTIME_VERSION_COMMAND}}
# Expected: {{STACK_RUNTIME_VERSION}}

# Check service status
{{SERVICE_STATUS_COMMAND}}
# Expected: active / running

# Check disk space (low disk is a common silent culprit)
df -h

# Check memory
free -h  # Linux
# or: Get-CimInstance Win32_OperatingSystem | Select-Object FreePhysicalMemory  # Windows

# Check database connectivity
{{DB_CONNECTIVITY_COMMAND}}
# Expected: successful connection
```

---

## 3. Issue Catalog

---

### 3.1 *[Issue Name / Category]*

**Symptom:**
*[Describe the symptom as the operator experiences it — what they see, what fails.]*

**Probable Causes:**

1. *[Most likely cause — check this first]*
2. *[Second most likely cause]*
3. *[Less common cause]*

**Diagnosis Steps:**

```bash
# Step 1: Check [X]
{{DIAGNOSIS_COMMAND_1}}
```

*If output shows `[pattern]`, proceed to Fix A.*
*If output shows `[pattern]`, proceed to Fix B.*

**Fix A: *[Fix Name]***

```bash
{{FIX_A_COMMAND}}
```

**Fix B: *[Fix Name]***

```bash
{{FIX_B_COMMAND}}
```

**Verification:**

```bash
{{VERIFICATION_COMMAND_1}}
# Expected: {{EXPECTED_OUTPUT_1}}
```

**Prevention:**
*[How to prevent this issue from recurring.]*

---

### 3.2 *[Issue Name / Category]*

**Symptom:**
*[Describe the symptom.]*

**Probable Causes:**

1. *[Most likely cause]*
2. *[Second most likely cause]*

**Diagnosis Steps:**

```bash
{{DIAGNOSIS_COMMAND_2}}
```

**Fix:**

```bash
{{FIX_COMMAND_2}}
```

**Verification:**

```bash
{{VERIFICATION_COMMAND_2}}
```

**Prevention:**
*[Prevention note.]*

---

### 3.3 *[Issue Name / Category]*

*[Repeat pattern for each issue category.]*

---

## 4. When to Escalate

**Escalate immediately if:**

- *[Condition 1 — e.g., data corruption suspected]*
- *[Condition 2 — e.g., security breach indicators]*
- *[Condition 3 — e.g., issue persists after all fixes above]*
- Issue not covered in this guide

**Escalation contacts:**

| Level | Contact | Channel |
|---|---|---|
| L1 | On-call engineer | *[Slack / Teams / email]* |
| L2 | {{ENG_A}} | *[Contact method]* |
| L3 | *[Management / vendor]* | *[Escalation procedure]* |

---

## 5. Contributing to this Guide

When you solve an issue not in this guide:

1. Document it in Section 3 using the standard format
2. Update the Quick Reference table
3. Record the learning in `.github/mma/knowledge/` (Law 4):
   ```
   **[YYYY-MM-DD] [AgentName]:** [Learning] | Context: [troubleshooting session]
   ```

---

## 6. Document History

| Version | Date | Author | Change |
|---|---|---|---|
| {{DOC_VERSION}} | {{DOC_DATE}} | {{ENG_A}} | Initial version |

---

*Path: `docs/troubleshooting-{{TROUBLESHOOTING_SLUG}}.md`*
*Maintained by {{ORG_LEGAL}} — {{TEAM_NAME}}*
