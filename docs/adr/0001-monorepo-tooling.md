# ADR 0001: Monorepo Tooling and Technical Stack

**Date:** 2026-09-13  
**Status:** Accepted  
**Deciders:** Architect, Engineer  

## Context

Mahjong Academy is a learning platform for American Mahjong that requires:
- Clear package boundaries between game logic, UI, and content
- Deterministic behavior (no AI/LLM - everything testable)
- Property-based testing for correctness
- Strong type safety across the codebase
- Content as data (YAML/JSON), not code

The project needs a monorepo structure with 9+ packages, a PWA web app, and content directories.

## Decision

### Package Manager: pnpm

**Rationale:**
- **Strict by default**: Packages cannot import from transitive dependencies they didn't declare. This catches accidental coupling at install time rather than review time.
- **Content-addressable store**: Meaningfully faster CI installs
- **Workspace support**: First-class monorepo features

**Alternatives considered:**
- npm workspaces: No boundary enforcement, no caching
- yarn (Berry): Adds cognitive overhead without benefits at this scale
- Nx/Moon: Heavier than needed at scaffold time

### Task Runner: Turborepo

**Rationale:**
- Handles task graph and content-hashed caching
- Composes with pnpm (doesn't replace it)
- Simple configuration for `build`, `test`, `typecheck`, `lint` tasks
- Remote caching can be added later when needed

**Configuration:**
- Tasks depend on upstream builds (`^build`)
- Cached by default for deterministic tasks
- Persistent mode for dev servers

### TypeScript Configuration

**Base config** (`tsconfig.base.json`):
- `strict: true` - All strict type checks enabled
- `noUncheckedIndexedAccess: true` - Array access safety
- `noImplicitOverride: true` - Explicit override keyword
- `exactOptionalPropertyTypes: true` - Stricter optional handling
- `noFallthroughCasesInSwitch: true` - Switch statement safety
- `moduleResolution: "Bundler"` - Modern module resolution
- ESM only (`"type": "module"` everywhere)
- Project references for incremental builds

**Emit:**
- `.d.ts` + `.d.ts.map` for editor go-to-definition
- Source consumed directly in dev, bundled from `dist/` in production

**Target:**
- Node 20 LTS minimum runtime
- ES2022 output

### Test Runner: Vitest

**Rationale:**
- Native ESM+TS support (no Jest transformer stack)
- First-class monorepo/workspace mode
- Mirrors Jest API for familiarity
- Fast and modern

**Testing approach:**
- Unit tests in `*.test.ts` co-located with source
- Property-based tests via `fast-check`
- Golden file snapshots for regression tests
- v8 coverage provider
- Fixed PRNG seed in CI for reproducibility

### Linting & Formatting

**ESLint:**
- `@typescript-eslint` for TypeScript rules
- `eslint-plugin-import-x` with `no-restricted-paths` for package boundary enforcement
- `no-restricted-globals` to ban `Math.random()` in engine packages (determinism requirement)

**Prettier:**
- Formatting only (no style rules in ESLint)
- Standard config: single quotes, 100 print width, 2 space indent

**Additional tools:**
- `syncpack` to keep dependency versions aligned

### Package Boundaries

**Enforced via:**
- pnpm's strict peer dependencies
- ESLint `no-restricted-paths` rules
- Explicit package.json dependencies

**Key boundaries:**
1. UI cannot import from game engines
2. Rules engine must be pure (no UI/DOM)
3. Bot engine only depends on rules + hand-evaluator
4. Content validators run in CI on every PR

### Apps/Web: PWA Shell

**Framework:** React 18  
**Build tool:** Vite  
**PWA:** vite-plugin-pwa (wraps Workbox)

**Rationale:**
- No SSR framework (Next/Remix/Astro) - this is a client-heavy, offline-capable game
- Vite for fast dev experience and ESM-native build
- PWA features: installable, offline-capable, auto-update

**State management:**
- Strict reducer/state-machine boundary (XState recommended for turn state)
- Game state must NOT leak into UI framework hooks

### CI Pipeline

**GitHub Actions** running on PRs:
- `lint`: ESLint + Prettier check
- `typecheck`: TypeScript compilation via `tsc -b`
- `test`: Vitest test suite
- `validate-content`: Card schema validation over YAML files (placeholder for #3)

**Node version:** 20 LTS  
**Cache:** pnpm store  
**Jobs run:** Parallel for speed

## Cross-Cutting Decisions

### Determinism
- No `Math.random()` in engine packages (ESLint enforced)
- Inject seeded PRNG where randomness needed
- Property tests use fixed seeds in CI

### i18n
- ICU MessageFormat via `@formatjs/intl` or `messageformat`
- Source strings in English
- Per-locale JSON files in `content/lessons/`

### Content Validation
- CI must fail if any `content/` file fails `card-schema` validation
- Schema drift is caught pre-merge, not post-deploy

## Consequences

### Positive
- **Strong boundaries**: Package coupling caught at install time
- **Type safety**: Strict TypeScript across all packages
- **Deterministic tests**: Property-based + golden files + no randomness
- **Fast feedback**: Turborepo caching makes incremental builds fast
- **PWA-first**: Offline capability and installability from day one

### Negative
- **Learning curve**: Developers new to pnpm/Turborepo/project references need ramp-up
- **Strictness overhead**: Strict TypeScript catches more bugs but requires more explicit typing

### Neutral
- **No framework lock-in**: Vite + React is swappable if needed
- **Remote caching optional**: Can add Vercel/self-hosted remote cache later

## Future Considerations

- **Monorepo scaling**: If we exceed ~20 packages, revisit Turborepo vs. Nx
- **State management**: Choose XState vs. plain reducer once turn logic is implemented
- **UI framework**: React is a placeholder - Solid/Svelte could work equally well
- **Remote caching**: Add when CI times become a bottleneck

## References

- Product design doc: `docs/product-design.md`
- Architect review: Issue #1, comment by @didi178
- pnpm workspace docs: https://pnpm.io/workspaces
- Turborepo docs: https://turbo.build/repo/docs
- Vitest docs: https://vitest.dev/
- fast-check docs: https://fast-check.dev/
