# Axe Handle Tooling Decisions

This document records definitive decisions about tooling choices for the Axe Handle project. It serves as the authoritative reference to prevent revisiting settled decisions and to maintain consistency across the codebase.

*[Return to main README](./README.md) | [View Code Standards](./docs/CODE_STANDARDS.md) | [View Project Structure](./docs/PROJECT_ORGANIZATION.md)*

## Quick Reference

| Tool | Function | Decision |
|------|----------|----------|
| PNPM | Package management | ✅ Selected |
| ESLint | Code linting and style enforcement | ✅ Selected |
| ESLint Complexity Plugin | Code complexity measurement | ✅ Selected |
| ESLint Neverthrow Plugin | Enforce functional error handling | ✅ Selected |
| Husky | Git hooks automation | ✅ Selected |
| Eta | Template engine | ✅ Selected |
| Neverthrow | Functional error handling | ✅ Selected |
| TypeScript + tsc | Language & compiler | ✅ Selected |
| GitHub Actions | CI/CD platform | ✅ Selected |
| Jest | Testing framework | ✅ Selected |
| Prettier | Code formatting | ✅ Selected |
| tsc-alias | Path alias resolution | ✅ Selected |
| lint-staged | Pre-commit file filtering | ✅ Selected |
| Chalk | Terminal styling | ✅ Selected |
| Glob | File pattern matching | ✅ Selected |
| Google TypeScript Style (GTS) | Opinionated TS configuration | ❌ Rejected |

## Package Management

### PNPM ✅

**Decision Date:** 2024-02-15

**Rationale:**
- Significantly faster installation than npm
- More efficient disk space usage with content-addressable storage
- Compatible with npm workflows but with better performance
- Built-in monorepo support that may be useful as the project grows

**Implementation Notes:**
- Use `pnpm-lock.yaml` as the source of truth for dependencies
- Project members should use pnpm exclusively (not mixing with npm/yarn)
- CI should use `pnpm install --frozen-lockfile` for consistent builds

*See also: [package.json](./package.json) for current dependencies*

## Code Quality

### ESLint ✅

**Decision Date:** 2024-02-15

**Rationale:**
- Industry standard for TypeScript/JavaScript linting
- Highly configurable with extensive plugin ecosystem
- Allows incremental adoption of rules

**Configuration:**
- Base config extends `eslint:recommended` and `plugin:@typescript-eslint/recommended`
- Node environment enabled to prevent `process is not defined` errors
- TypeScript-specific rules through `@typescript-eslint/eslint-plugin`

*See also: [.eslintrc.json](./.eslintrc.json) for current linting configuration*

### Google TypeScript Style (GTS) ❌

**Decision Date:** 2025-03-09

**Rationale:**
- Too opinionated and conflicts with project-specific standards
- Reduced flexibility for custom rules (especially neverthrow integration)
- Project has established its own code standards documented in CODE_STANDARDS.md
- Adds unnecessary complexity to the toolchain

**Implementation Notes:**
- Remove any GTS references from existing configuration files
- Maintain consistent use of custom ESLint rules
- Follow project-specific standards in CODE_STANDARDS.md

### ESLint Complexity Plugin ✅

**Decision Date:** 2024-02-18

**Rationale:**
- Enforces cyclomatic complexity limits to prevent overly complex functions
- Helps maintain maintainable code through quantitative metrics
- Catches potential reliability issues early

**Configuration:**
- Maximum cyclomatic complexity set to 10
- Applied to all functions and methods
- Part of CI pipeline validation

### ESLint Neverthrow Plugin ✅

**Decision Date:** 2024-03-01

**Rationale:**
- Enforces functional error handling patterns
- Prevents accidental use of throw statements
- Ensures consistent use of the Result pattern

**Configuration:**
- Rule `neverthrow/no-throw` enforces Result pattern usage
- Integrated with other ESLint rules to provide comprehensive guidance

### Husky (with pre-commit hooks) ✅

**Decision Date:** 2024-02-20

**Rationale:**
- Prevents problematic code from entering the repository
- Catches issues before CI, providing faster feedback
- Enforces consistent code style and quality standards automatically

**Configuration:**
- Pre-commit hook runs:
  1. Path header validation
  2. ESLint with auto-fixing where possible
  3. TypeScript type checking

*See also: [.husky/pre-commit](./.husky/pre-commit) for current hook configuration*

## Templating

### Eta ✅

**Decision Date:** 2024-02-10

**Rationale:**
- Lightweight and faster than alternatives like EJS
- Simple syntax with embedded JavaScript
- Good support for custom delimiters
- Low dependency footprint

**Implementation Notes:**
- All templates use `.eta` extension
- Template path convention: `templates/[framework]/[component]/[name].eta`
- Templates should be documented with a header comment

*See also: [templates/](./templates/) directory for our template structure*

## Error Handling

### Neverthrow ✅

**Decision Date:** 2024-03-01

**Rationale:**
- Promotes explicit error handling through the Result pattern
- Eliminates unexpected exceptions and improves code predictability
- Results can be composed with `andThen()` and other methods
- Provides type safety for error paths

**Implementation Notes:**
- Use `AxeResult<T>` for functions that can fail
- Use `runOperation` and `runAsyncOperation` helpers for wrapping try/catch
- Use `okResult` and `errResult` for creating Result objects
- Chain operations with `andThen()` instead of using exception handling

*For error handling standards, see: [CODE_STANDARDS.md - Error Handling section](./docs/CODE_STANDARDS.md#error-handling)*

## Build System

### TypeScript + tsc ✅

**Decision Date:** 2024-02-05

**Rationale:**
- Native TypeScript compiler is sufficient for our needs
- Simpler setup than alternatives like Webpack or Rollup
- Direct mapping from source to output for easier debugging

**Configuration:**
- Target ES2020 for modern Node.js support
- CommonJS modules for Node.js compatibility
- Strict mode enabled to maximize type safety benefits
- TypeScript version 5.1.6 for compatibility with ESLint plugins

*See also: [tsconfig.json](./tsconfig.json) for current TypeScript configuration*

### tsc-alias ✅

**Decision Date:** 2025-02-10

**Rationale:**
- Resolves TypeScript path aliases during build
- Preserves the path aliasing structure in output code
- Simplifies import statements with the `@/*` pattern
- Lightweight and purpose-built for this specific need

**Implementation:**
- Used in post-compilation step to resolve `@/*` imports
- Integrated into build process via npm scripts

## Testing

### Jest ✅

**Decision Date:** 2025-01-15

**Rationale:**
- Industry standard testing framework for TypeScript/JavaScript
- Robust feature set with mocking capabilities
- Good integration with TypeScript via ts-jest
- Built-in code coverage reporting

**Configuration:**
- Node.js test environment
- TypeScript integration via ts-jest
- Test files use pattern `**/*.test.ts`
- Coverage thresholds set at 70-80% for various metrics

*See also: [jest.config.js](./jest.config.js) for current testing configuration*

## Code Formatting

### Prettier ✅

**Decision Date:** 2025-01-30

**Rationale:**
- Opinionated code formatter that ensures consistent style
- Integrates well with ESLint
- Reduces code review time spent on style issues
- Popular and widely used in the ecosystem

**Configuration:**
- Single quotes for strings
- 100 character line width
- 2 spaces for indentation
- Trailing commas in all multi-line constructs

*See also: [.prettierrc.json](./.prettierrc.json) for current formatting configuration*

## CI/CD

### GitHub Actions ✅

**Decision Date:** 2024-03-05

**Rationale:**
- Tight integration with GitHub repository
- Free for open source projects
- Simple configuration through YAML files
- Supports matrix testing across Node.js versions

**Implementation:**
- Run validation, lint, build, and test on PR and main branch changes
- Cache dependencies to speed up workflows
- Use Node.js 18.x as the baseline version

*See also: [.github/workflows/](./.github/workflows/) for CI configuration*

## Development Workflow

### lint-staged ✅

**Decision Date:** 2025-02-20

**Rationale:**
- Optimizes pre-commit hooks by only checking staged files
- Significantly improves performance over running checks on all files
- Enables quick feedback for code quality issues
- Works well with Husky for git hook integration

**Configuration:**
- Runs ESLint, Prettier, and path validation only on changed files
- Used in pre-commit hook to ensure code quality

### Chalk ✅

**Decision Date:** 2025-02-25

**Rationale:**
- Provides terminal string styling for better user experience
- Makes CLI output more readable with color-coded messages
- Simple API with minimal overhead
- De facto standard for terminal styling in Node.js

**Implementation:**
- Used in CLI tools and utility scripts for highlighting important information
- Color scheme: errors in red, warnings in yellow, success in green, info in cyan

### Glob ✅

**Decision Date:** 2025-02-28

**Rationale:**
- Efficient pattern matching for file operations
- Standard way to handle file path patterns in Node.js
- Required for path validation and file discovery
- Lightweight and focused functionality

**Implementation:**
- Used in validation scripts to find files matching specific patterns
- Integrated with path header validation and other file system operations

## Dependencies

### Minimized Direct Dependencies ✅

**Decision Date:** 2024-03-15

**Rationale:**
- Reduces security exposure
- Improves build times
- Simplifies maintenance

**Guidelines:**
- Any dependency with >5MB of dependencies requires team discussion
- Prefer native Node.js solutions when reasonable
- Regular dependency audits scheduled quarterly

## Revisiting Decisions

A decision recorded here can only be changed through a formal proposal that:
1. Clearly states the new alternative
2. Provides specific rationale for the change
3. Addresses migration costs and compatibility issues
4. Is documented in this file with a clear revision history

All team members should refer to this document when making implementation choices to ensure consistency with agreed-upon tooling decisions.

*For more detailed information on our development practices, see:*
- [CODE_STANDARDS.md](./docs/CODE_STANDARDS.md) - Detailed coding guidelines
- [PROJECT_ORGANIZATION.md](./docs/PROJECT_ORGANIZATION.md) - Project structure overview
- [TODO.md](./docs/TODO.md) - Current development priorities

<!--
metadata:
  path: docs/TOOL_DECISIONS.md
  purpose: Decision log to prevent revisiting settled tooling choices
  audience: Project contributors and maintainers
-->
