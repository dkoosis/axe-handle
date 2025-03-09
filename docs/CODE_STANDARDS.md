# Axe Handle Code Standards

This document outlines the code quality standards and guidelines for the Axe Handle project. These standards can be used by both human developers and AI code reviewers to ensure consistent, maintainable code.

## Table of Contents
- [Naming Conventions](#naming-conventions)
  - [Filenames](#filenames)
  - [Variables](#variables)
  - [Functions and Methods](#functions-and-methods)
  - [Types and Interfaces](#types-and-interfaces)
- [Documentation](#documentation)
- [Code Structure](#code-structure)
- [Error Handling](#error-handling)
- [Path Headers](#path-headers)
- [Package Management](#package-management)
- [Pre-commit Checks](#pre-commit-checks)

## Naming Conventions

### Filenames
1. **Descriptive Names**: Replace generic names (e.g., `util.ts`) with specific names (e.g., `authenticationService.ts`)
2. **Organization**: Organize files by feature, not by type
3. **Conciseness**: Keep filenames concise but clear
4. **Conventions**:
   - `*Generator.ts` for code generators
   - `*Parser.ts` for schema parsers
   - `*.eta` for templates (no .ts in template filenames)

### Variables
1. **Case**: Use camelCase for all variable names
2. **Descriptiveness**: Names must be descriptive and self-explanatory
3. **Abbreviations**: Avoid cryptic abbreviations
4. **Booleans**: Prefix boolean variables with `is`, `has`, `should`, `can`, `will`, or `does`

### Functions and Methods
1. **Case**: Use camelCase for function and method names
2. **Action-Oriented**: Start function names with verbs indicating the function's action
3. **Specificity**: Function names must be specific, avoiding generic names like `process()`
4. **Boolean Returns**: Prefix boolean-returning methods with `is` or `has`
5. **Size**: Keep under 80 lines to maintain readability

### Types and Interfaces
1. **Case**: Use PascalCase for interface and type names
2. **Descriptiveness**: Type names must be descriptive nouns or noun phrases
3. **Prefixing**:
   - `Axe*` for generator components (e.g., `AxeServerGenerator`)
   - `Mcp*` for generated server components (e.g., `McpResourceHandler`)

## Documentation

1. **JSDoc Comments**: Use JSDoc or TSDoc for all functions, classes, and interfaces
2. **Property Documentation**: Document interface properties with JSDoc comments
3. **Context**: Explain why the code is written, not just what it does
4. **Business Rules**: Document business rules and edge cases in comments
5. **Path Headers**: Every file must include path header comment (see [Path Headers](#path-headers))

## Code Structure

1. **Single Responsibility**: Each file must adhere to the Single Responsibility Principle
2. **Module Design**: Use modular design with clear separation of concerns
3. **File Size**: 
   - Keep files under 400 lines of code when possible
   - Split files that exceed 500 lines into multiple focused modules
   - Consider AI tool compatibility when determining file size (large files may be difficult for AI assistants to process effectively)
4. **Organization**: Use consistent file organization based on features or modules
5. **Complexity**: Keep cyclomatic complexity under 10

## Error Handling

We use the `neverthrow` library for functional error handling:

1. **No Direct Throws**: Use `err()` from resultUtils instead of throwing errors
2. **Result Handling**: Always properly handle Result objects
3. **Checked Catches**: Use proper error handling in catch blocks
4. **Helper Functions**: Use the provided helpers when possible:
   - `runOperation` and `runAsyncOperation` for wrapping try/catch blocks
   - `okResult` and `errResult` for creating Result objects
   - `combineResults` for handling multiple Results

## Path Headers

All source files must include a path header comment as the first line (after shebang if present):

```typescript
// Path: src/utils/example.ts
```

This header is used for:
- Ensuring correct imports
- Validating file organization
- Maintaining consistent structure

## Package Management

**IMPORTANT**: This project exclusively uses pnpm as its package manager:

1. **Adding Dependencies**:
   ```bash
   pnpm add <package>         # For dependencies
   pnpm add -D <package>      # For dev dependencies
   ```

2. **Installing Dependencies**:
   ```bash
   pnpm install
   ```

3. **Running Scripts**:
   ```bash
   pnpm run <script-name>
   ```

4. **DO NOT use npm or yarn** for any operations within this project

## Pre-commit Checks

The following checks run automatically on commit:

1. **Path Headers**: Validates that files have correct headers
2. **ESLint**: Runs linting rules including neverthrow compliance
3. **Directory Structure**: Ensures files are in the correct locations

You can run these checks manually:
- `pnpm run check-paths`: Validates file headers
- `pnpm run lint`: Runs ESLint checks
- `pnpm run check-structure`: Validates directory structure

To automatically fix issues:
- `pnpm run fix-paths`: Automatically adds or fixes path headers
- `pnpm run lint:fix`: Attempts to fix linting issues
