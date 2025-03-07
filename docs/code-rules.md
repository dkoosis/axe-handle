# Axe-Handle Code Quality Guidelines

This document outlines the code quality rules enforced in the Axe-Handle project.

## AI Agent TypeScript Optimization Rules

**Filenames:**

1.  Filenames must be descriptive. Replace generic names (e.g., `util.ts`) with specific names (e.g., `authenticationService.ts`).
2.  Organize files by feature, not by type.
3.  Keep filenames concise.

**Variable Naming:**

4.  Use camelCase for all variable names.
5.  Variable names must be descriptive and self-explanatory. Avoid cryptic abbreviations.
6.  Prefix boolean variables with `is` or `has`.

**Function and Method Naming:**

7.  Use camelCase for function and method names (PascalCase for constructors/classes).
8.  Start function names with verbs indicating the function's action.
9.  Function names must be specific, avoiding generic names like `process()`.
10. Prefix boolean-returning methods with `is` or `has`.

**Comments and Documentation:**

11. Use JSDoc or TSDoc for all functions, classes, and interfaces.
12. Explain why the code is written, not just what it does, in comments.
13. Document business rules and edge cases in comments.
14. Always include the path and filename in the header comment.

**Type Definitions and Interfaces:**

15. Use PascalCase for interface and type names.
16. Type names must be descriptive nouns or noun phrases.
17. Use JSDoc comments to document interface properties.
18. Type definitions must be accurate and complete.

**Code Structure and File Size:**

19. Each file must adhere to the Single Responsibility Principle.
20. Use modular design with clear separation of concerns.
21. Avoid large files.
22. Use consistent file organization based on features or modules.
23. Enable and leverage TypeScript's strict mode.
24. Optimize code for tree shaking.

**Practical Implementation:**

25. Always use TypeScript's strict mode.
26. Avoid using the `any` type.
27. Implement consistent error handling patterns.
28. Use advanced TypeScript features to improve type definitions.

## Directory Structure

The project structure is enforced to maintain organized code. Run `npm run check-structure` to validate directory structure. If legitimate changes need to be saved, run `npm run update-structure`.

## File Headers

All source files must include a path header comment as the first line (after shebang if present):

```typescript
// Path: src/utils/example.ts
```

Run `npm run fix-paths` to automatically add or fix path headers.

## TypeScript Rules

We follow Google TypeScript Style (GTS) with additional rules:

1. **Interface and Type Names**: Must use PascalCase
2. **Boolean Variables**: Should use prefixes (is, has, should, can, will, does)
3. **Function Size**: Keep under 80 lines to maintain readability
4. **Complexity**: Keep cyclomatic complexity under 10
5. **Documentation**: Functions, classes, and interfaces should have JSDoc comments

## Neverthrow Error Handling

We use the `neverthrow` library for functional error handling:

1. **No Direct Throws**: Use `err()` from resultUtils instead of throwing errors
2. **Result Handling**: Always properly handle Result objects
3. **Checked Catches**: Use proper error handling in catch blocks

See `src/utils/resultUtils.ts` for helper functions like:
- `runOperation` and `runAsyncOperation` for wrapping try/catch blocks
- `okResult` and `errResult` for creating Result objects

## Pre-Build Checks

All rules are enforced during build and development:

- `npm run check-all`: Runs all checks
- `npm run check-structure`: Validates directory structure
- `npm run check-paths`: Validates file path headers
- `npm run lint`: Runs ESLint checks including neverthrow rules

## Fixing Issues

- `npm run update-structure`: Updates directory structure snapshot
- `npm run fix-paths`: Fixes file path headers
- `npm run lint:fix`: Fixes ESLint issues where possible
