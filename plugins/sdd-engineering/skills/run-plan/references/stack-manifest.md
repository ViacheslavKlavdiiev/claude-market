## SDD Stack Manifest

| Surface | Paved-path skills | Library skill | Test command | Typecheck command |
|---------|-------------------|---------------|--------------|--------------------|
| web (Angular)    | angular-developer, angular-new-app, angular-testing | angular-ui-primeng | <cmd> | <cmd> |
| api (NestJS)     | nestjs-best-practices, nestjs-architecture, nestjs-testing, nestjs-rest-swagger | nestjs-orm-drizzle | <cmd> | <cmd> |
| mobile (Flutter) | flutter-best-practices, flutter-architecture, flutter-testing | —                  | <cmd> | <cmd> |

`typescript-expert` (from `typescript-paved-path`) applies to every
TypeScript surface (Angular, NestJS).

### Layer map (for architecture-reviewer)
| Layer | Path glob |
|-------|-----------|
| core   | libs/core/** |
| shared | libs/shared-contracts/** |
| api    | apps/api/** |
| web    | apps/web/** |
| mobile | apps/mobile/** |

### Environment constraints
<free text: offline test requirement, DB test strategy, CI network policy, ...>

## Resolution rules

> **Stack Manifest resolution.** Read the `## SDD Stack Manifest` section of the project's `CLAUDE.md`.
> 1. For files under a surface's Layer-map paths, load that surface's Paved-path + Library skills before writing/reviewing that surface.
> 2. Use the surface's Test/Typecheck commands for verification.
> 3. Derive the architecture forbidden-import matrix from the Layer map.
> 4. If the manifest is absent, fall back to any stack guidance stated in prose in `CLAUDE.md`, else operate stack-neutrally (foundations skills only). Referencing a skill from an uninstalled plugin is NOT an error — note it and proceed with foundations only. Never invent requirements or violations from a missing manifest.
