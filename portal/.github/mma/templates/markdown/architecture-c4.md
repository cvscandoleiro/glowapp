---
title: "{{PROJECT_NAME}} — Architecture C4 Diagrams"
version: "{{DOC_VERSION}}"
status: "{{DOC_STATUS}}"
date: "{{DOC_DATE}}"
organization: "{{ORG_LEGAL}}"
---

# {{PROJECT_NAME}} — Architecture

> C4 Model: Context, Container, Component
> Stack: {{STACK_RUNTIME}} | {{STACK_OS}} | {{STACK_DB}} | {{STACK_DEPLOY}}

---

## 1. System Context (Level 1)

*Answers: What does the system do? Who uses it? What external systems does it interact with?*

```mermaid
C4Context
  title System Context — {{PROJECT_NAME}}

  Person(user, "{{PROJECT_NAME}} User", "Primary system user")
  Person(admin, "Administrator", "System administration")

  System(system, "{{PROJECT_NAME}}", "{{PROJECT_DESCRIPTION}}")

  System_Ext(external1, "External System 1", "Description of external dependency")
  System_Ext(external2, "External System 2", "Description of external dependency")

  Rel(user, system, "Uses")
  Rel(admin, system, "Administers")
  Rel(system, external1, "Calls / Integrates")
  Rel(system, external2, "Reads / Writes")
```

*[Replace placeholders above with actual actor names, system name, and real external dependencies.]*

---

## 2. Container Diagram (Level 2)

*Answers: What are the deployable units? What technologies do they use? How do they communicate?*

```mermaid
C4Container
  title Container Diagram — {{PROJECT_NAME}}

  Person(user, "User")

  System_Boundary(system_boundary, "{{PROJECT_NAME}}") {
    Container(web_app, "Web Application", "{{STACK_RUNTIME}}", "Primary user interface")
    Container(api_server, "API Server", "{{STACK_RUNTIME}}", "Business logic and REST API")
    Container(job_server, "Job Server", "{{STACK_RUNTIME}}", "Background jobs and scheduling")
    ContainerDb(database, "Database", "{{STACK_DB}}", "Primary data store")
    Container(message_broker, "Message Broker", "ActiveMQ / Kafka", "Async messaging")
  }

  System_Ext(external, "External System", "External dependency")

  Rel(user, web_app, "Uses", "HTTPS")
  Rel(web_app, api_server, "Calls", "REST/HTTP")
  Rel(api_server, database, "Reads/Writes", "JDBC")
  Rel(api_server, message_broker, "Publishes/Subscribes", "JMS/AMQP")
  Rel(job_server, database, "Reads/Writes", "JDBC")
  Rel(api_server, external, "Calls", "REST/SOAP")
```

*[Add, remove, or rename containers to match actual deployment architecture.]*

---

## 3. Component Diagram (Level 3)

*Answers: What are the major components within a container? How do they interact?*

*Select the most complex or architecturally significant container to diagram at this level.*

### 3.1 [Container Name] Components

```mermaid
C4Component
  title Component Diagram — [Container Name]

  Container_Boundary(container_boundary, "[Container Name]") {
    Component(controller, "Controller Layer", "Struts2 / Spring MVC", "Handles HTTP requests")
    Component(service, "Service Layer", "Java", "Business logic")
    Component(dao, "DAO Layer", "JDBC", "Data access objects")
    Component(model, "Domain Model", "Java POJOs", "Entity and value objects")
  }

  ContainerDb(db, "Database", "{{STACK_DB}}")
  Container(ext, "Another Container", "External")

  Rel(controller, service, "Delegates to")
  Rel(service, dao, "Uses")
  Rel(dao, model, "Maps to/from")
  Rel(dao, db, "Queries", "JDBC")
  Rel(service, ext, "Calls", "REST")
```

---

## 4. Deployment Diagram

*Describes the infrastructure environment: servers, containers, networking.*

```mermaid
graph TB
  subgraph deploy["Deployment: {{STACK_DEPLOY}}"]
    subgraph node1["Node / Pod 1"]
      web["Web Application\n{{STACK_RUNTIME}}"]
      api["API Server\n{{STACK_RUNTIME}}"]
    end
    subgraph node2["Node / Pod 2"]
      job["Job Server\n{{STACK_RUNTIME}}"]
    end
    subgraph data["Data Tier"]
      db["{{STACK_DB}}"]
      broker["Message Broker"]
    end
  end

  user["User"] -->|HTTPS| web
  web -->|REST/HTTP| api
  api -->|JDBC| db
  api -->|JMS| broker
  job -->|JDBC| db
  job -->|JMS| broker
```

---

## 5. Architecture Decisions

*Key architectural decisions that shaped this design.*

| Decision | ADR Reference | Date |
|---|---|---|
| *[Decision description]* | ADR-001 | {{DOC_DATE}} |

*Full decision log: `.github/mma/decisions/decisions-log.md`*

---

## 6. Known Constraints and Risks

| Constraint/Risk | Impact | Notes |
|---|---|---|
| *[e.g., Legacy OS EOL]* | *[High/Medium/Low]* | *[Mitigation or note]* |
| *[e.g., Library CVE]* | *[High/Medium/Low]* | *[Mitigation or note]* |

---

## 7. Document History

| Version | Date | Author | Summary |
|---|---|---|---|
| {{DOC_VERSION}} | {{DOC_DATE}} | {{ENG_A}} | Initial C4 architecture document |

---

*Document maintained by {{ORG_LEGAL}} — {{TEAM_NAME}}*
*Generated with M3A Team — Minsait Multi Agents Framework*
