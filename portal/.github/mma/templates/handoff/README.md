# M3A Team — Pipeline Handoff Protocol

Handoff files enable structured agent-to-agent communication in sequential pipelines.

## Purpose

Instead of passing full context to every agent in a gate, each agent writes a compact handoff file (≤ 500 tokens). The next agent reads ONLY this file as input.

**Token savings:** ~12% per multi-agent gate by eliminating context duplication.

## File naming

`handoff/[step]-[agent-name]-output.md`

Examples:
- `handoff/01-architect-output.md`
- `handoff/02-developer-output.md`
- `handoff/03-security-output.md`

## Usage

Files are created in `.github/mma/handoff/` during story-done and epic-done gates.
They are ephemeral — cleared after the gate closes.

## Template

See `templates/handoff/handoff-template.md`.
