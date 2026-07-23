# typescript-paved-path

Advanced TypeScript guidance shared across TS stacks (strict config, type-level programming, utility types, diagnostics).

## Overview

This plugin provides a shared TypeScript skill loaded per TypeScript surface via the Stack Manifest. It delivers stack-neutral TypeScript expertise currently used by the NestJS plugin and planned for Angular.

## What's inside

| Component | Type | Description |
| --------- | ---- | ----------- |
| `typescript-expert` | skill | Advanced TypeScript expertise covering type-level programming, performance optimization, monorepo management, migration strategies, strict configuration, and diagnostics. |

## Features

- **Strict tsconfig reference** (`references/tsconfig-strict.json`) — production-ready strict TypeScript configuration
- **TypeScript cheatsheet** — quick reference for type patterns and modern features
- **Utility types reference** — commonly used type-level programming patterns
- **Diagnostic script** (`scripts/ts_diagnostic.py`) — one-shot project analyzer for TypeScript/Node versions, tsconfig strictness, tooling ecosystem, monorepo setup, type errors, and compilation performance

## Installation

```
/plugin marketplace add ViacheslavKlavdiiev/claude-market
/plugin install typescript-paved-path@claude-market
```

No dependencies — the plugin is self-contained.

## What it executes

Documentation-only content (prompts). The included diagnostic script runs locally on demand to analyze project configuration; no external network access or binaries required.

## Versioning

SemVer per marketplace conventions; release notes in [CHANGELOG.md](CHANGELOG.md).
