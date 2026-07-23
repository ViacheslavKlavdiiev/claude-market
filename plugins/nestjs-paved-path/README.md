# nestjs-paved-path

NestJS engineering skills: best practices, clean/layered architecture,
REST + Swagger, and testing.

## Overview

There is **no official NestJS agent-skill**. Every skill in this plugin is
authored from [docs.nestjs.com](https://docs.nestjs.com), with a community
skill (`Kadajett/agent-nestjs-skills`) consulted purely as a corroborating
reference where noted in each skill's Sources section — authority always
stays with the official docs.

This plugin is the NestJS surface of the stack-agnostic SDD (spec-driven
development) workflow: it fills in the framework-specific rules that
`engineering-foundations` (clean architecture, security) and
`typescript-paved-path` (TypeScript expertise) leave stack-neutral.

## What's inside

| Component | Type | Description |
| --------- | ---- | ----------- |
| `nestjs-best-practices` | skill | Modules, providers/DI, thin controllers, DTO validation, config, exception handling, interceptors, guards, lifecycle, plus security/operational additions (rate limiting, sanitization, health checks, async error handling, DI scope). |
| `nestjs-architecture` | skill | Domain/application/infrastructure/presentation layering for NestJS, repository ports via DI tokens, DTO vs. entity vs. persistence-row placement; specializes `engineering-foundations:clean-architecture`. |
| `nestjs-rest-swagger` | skill | REST conventions (routing, status codes, versioning, pagination) plus `@nestjs/swagger` setup, DTO-driven schema, and error-response docs. |
| `nestjs-testing` | skill | Unit tests stubbing repository ports, supertest e2e with the same global pipes/filters as `main.ts`, ValidationPipe security tests, and real-Postgres repository tests. Jest default, Vitest noted. |

This release ships all four skills: `nestjs-best-practices`,
`nestjs-architecture`, `nestjs-rest-swagger`, and `nestjs-testing`.

## Dependencies

- `engineering-foundations@^0.1.0` — supplies `clean-architecture` (the
  stack-neutral layering skill `nestjs-architecture` specializes) and
  `security`.
- `typescript-paved-path@^0.1.0` — supplies `typescript-expert`, the
  stack-neutral TypeScript skill this plugin's NestJS-specific rules
  build on top of.

Install both dependency plugins alongside this one.

## Installation

```
/plugin marketplace add ViacheslavKlavdiiev/claude-market
/plugin install nestjs-paved-path@claude-market
```

## What it executes

Documentation-only content (prompts). No hooks, no MCP servers, no
external binaries, no network access.

## Versioning

SemVer per marketplace conventions; release notes in
[CHANGELOG.md](CHANGELOG.md).
