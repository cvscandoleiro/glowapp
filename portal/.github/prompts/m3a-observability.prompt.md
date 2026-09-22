---
description: "MMA Observability — Defines logging, metrics, and distributed tracing standards for the project stack. Recommends tools and patterns appropriate to the configured runtime and deploy target."
agent: "agent"
---

# /m3a-observability — Observability Standards

> **Logging + Metrics + Tracing — the three pillars.**
> Stack-aware recommendations. Standards, not opinions.

---

## Behavior Rule

- **Stack-aware** — reads runtime, framework, deploy target from config
- **Standards-based** — recommends proven patterns per stack
- **Non-prescriptive** — presents options, human decides tooling
- **Actionable** — outputs configuration templates, not just theory

---

## STEP 0 — Verify Context

```
IF .github/mma/config.yaml DOES NOT EXIST:
  → "⚠️ Run /m3a-init first."
  → STOP

Read:
  - .github/mma/config.yaml → stack, deploy target (K8s, VM, serverless)
  - .github/mma/knowledge/project-architecture.md → services and components
```

---

## STEP 1 — Observability Scope

```
"Which observability pillars do you need?

[1] Logging only
[2] Metrics only
[3] Distributed tracing only
[4] All three pillars (recommended)
[5] Custom — describe your needs

Current deploy target: [from config]"
```

---

## STEP 2 — Stack-Specific Recommendations

### Logging

| Stack | Recommended | Format |
|---|---|---|
| Java/Spring | SLF4J + Logback | JSON structured |
| Node.js | Winston / Pino | JSON structured |
| Python | Python logging + structlog | JSON structured |
| .NET | Serilog | JSON structured |

### Metrics

| Stack | Recommended | Exposition |
|---|---|---|
| Java/Spring | Micrometer + Actuator | Prometheus endpoint |
| Node.js | prom-client | Prometheus endpoint |
| Python | prometheus_client | Prometheus endpoint |
| .NET | prometheus-net | Prometheus endpoint |

### Tracing

| Stack | Recommended | Protocol |
|---|---|---|
| Any | OpenTelemetry SDK | OTLP |

---

## STEP 3 — Generate Standards Document

```markdown
# Observability Standards — {{PROJECT_NAME}}

**Date:** {{DATE}}
**Stack:** {{STACK_RUNTIME}} / {{STACK_FRAMEWORK}}
**Deploy:** [target]

## Logging Standards
- Format: JSON structured
- Library: [recommended]
- Levels: ERROR, WARN, INFO, DEBUG (DEBUG disabled in production)
- Mandatory fields: timestamp, level, service, traceId, message
- Sensitive data: NEVER log PII, credentials, tokens

## Metrics Standards
- Library: [recommended]
- Naming: [convention]
- Mandatory metrics:
  - `http_requests_total` — request count by method, path, status
  - `http_request_duration_seconds` — request latency histogram
  - `db_query_duration_seconds` — database query latency
  - `jvm_memory_used_bytes` / `process_resident_memory_bytes`

## Tracing Standards
- Library: OpenTelemetry SDK
- Propagation: W3C TraceContext
- Sampling: 100% in staging, 10% in production (configurable)
- Span naming: `{service}.{operation}`

## Dashboard Recommendations
- [Tool recommendations based on deploy target]
```

---

## STEP 4 — Output

Save to: `docs/observability-standards.md`

```
✅ Observability standards defined: docs/observability-standards.md
```

---

## Changelog

**v1.0.0 (2026-04-24)** — Skill created. Three-pillar observability standards per stack.
