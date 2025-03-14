# Axe Handle Project TODO List

<!-- Path: docs/TODO.md -->
<!-- Purpose: Actionable tasks list optimized for both human developers and AI coding assistants -->

This document contains specific, actionable tasks for the Axe Handle project. Each task includes the context, files to modify, and implementation details to make it straightforward for developers and AI assistants to implement.

*[Return to README](../README.md) | [Project Organization](./PROJECT_ORGANIZATION.md) | [Code Standards](./CODE_STANDARDS.md) | [Strategic Roadmap](./ROADMAP.md) | [Development Guide](./DEVELOPMENT_GUIDE.md)*

> **Note:** This list will gradually be migrated to [GitHub Issues](https://github.com/dkoosis/axe-handle/issues) as the project matures. Please check there for the most up-to-date tasks and their status.

## Build Environment Tasks

### 1. ✅ Fix Path Header Validation Script

**Problem:** The validation script has a premature return statement that prevents execution.

**Solution Applied:**
- Removed the premature return statement from `utils/validate-path-headers.js`

**Status:** Fixed

### 2. ✅ Update Package Scripts to Use PNPM

**Problem:** Package scripts use npm instead of the required pnpm.

**Solution Applied:**
- Updated all npm references to pnpm in package.json scripts

**Status:** Fixed

### 3. ✅ Verify ESLint Configuration

**Problem:** ESLint config was reported to have duplicate plugins arrays and missing neverthrow rule.

**Solution Applied:**
- Verified that the current ESLint configuration already has the neverthrow plugin and rule
- Confirmed no duplicate plugins arrays exist

**Status:** Verified (No changes needed)

### 4. Fix Build Script in package.json

**Problem:** The build script is currently set to just echo 'BANANA' instead of performing the actual build.

**Files:**
- `package.json`

**Implementation:**
Replace the current build script with the proper build command:
```json
"build": "tsc && tsc-alias",
```

**Status:** Pending

### 5. Consolidate Header Validation Tools

**Problem:** Multiple tools exist for similar header validation functionality.

**Tasks:**
- Compare functionality between `utils/validate-path-headers.js` and `src/tools/validateHeaders.ts`
- Choose the more robust implementation (likely validateHeaders.ts)
- Update package.json scripts to reference a single tool
- Remove redundant implementations

**Status:** Pending

### 6. Setup Template Directory Structure

**Problem:** Template directories need to follow the structure defined in project documentation.

**Files:**
- Template directories (See structure details in [PROJECT_ORGANIZATION.md](./PROJECT_ORGANIZATION.md))

**Implementation:**
Create the directory structure as defined in docs/PROJECT_ORGANIZATION.md:
```
templates/
├── mcp-server/
│   ├── express/
│   │   ├── server/
│   │   ├── handler/
│   │   ├── types/
│   │   └── docs/
│   └── [future frameworks]/
└── common/
```

**Status:** Pending

### 7. Fix Directory Structure Issues

**Problem:** Several directories contain only a single file, violating the project's coding standards.

**Files:**
- Current directories with single files:
  - src/mcp/ (contains only mapper.ts)
  - src/parser/ (contains only two files)
  - src/mcpServerGenerator/ (contains only handlerGenerator.ts)
  - Others potentially

**Implementation Options:**
1. Flatten the structure by moving files to a higher level directory
2. Group related files together in a more meaningful way
3. Potentially add an automated check in `check-directory-structure.js` to flag directories with only one file

**Status:** Pending

## Documentation Tasks

### 8. Document Header Validation Systems

**Problem:** The dual header systems (path headers and JSDoc headers) need clarification.

**Files:**
- `docs/CODE_STANDARDS.md` (See [current version](./CODE_STANDARDS.md))

**Implementation:**
Add a section explaining both header types:

```markdown
## Header Systems

The project uses two complementary header systems:

### 1. Path Headers
Simple first-line comment for navigation and validation:
```
// Path: src/utils/example.ts
```
Required in all source files as the first non-shebang line.

### 2. JSDoc Headers
More detailed documentation block for complex files:
```
/**
 * @file src/utils/example.ts
 * @description Purpose of this file
 * @author Axe Handle Team
 * @created 2025-03-10
 * @copyright Copyright (c) 2025 Axe Handle Project
 * @license ISC
 */
```
Required for API implementation files and shared utilities.
```

**Status:** Pending

### 9. Update JSDoc Comments for Public APIs

**Problem:** Some public APIs lack comprehensive JSDoc comments.

**Files:**
- `src/index.ts`
- Other public API files

**Implementation:**
Ensure all public methods have proper JSDoc comments including:
- Description
- Parameters with types and descriptions
- Return values with types and descriptions
- Examples where appropriate

**Status:** Pending

## Notes for AI Assistants

When implementing these tasks, please refer to our [CODE_STANDARDS.md](./CODE_STANDARDS.md) and [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for more detailed guidance:

1. **For code changes:**
   - Preserve existing coding style
   - Follow the Result pattern from neverthrow for error handling
   - Add appropriate comments for non-obvious changes

2. **For documentation:**
   - Use consistent terminology
   - Include examples for clarity
   - Reference existing project conventions

3. **General guidance:**
   - Keep directory structure simple and practical
   - Don't create directories with only one file
   - Maintain a consistent style across related files
   - Use pnpm exclusively, never npm or yarn
