# Axe Handle Development Guide

<!-- Path: docs/DEVELOPMENT_GUIDE.md -->
<!-- Purpose: Comprehensive guide to development tooling, environment setup, workflow, and quality standards -->

This guide explains the complete development process for the Axe Handle project, including environment setup, tooling, quality standards enforcement, and workflow.

## Table of Contents
- [Environment Setup](#environment-setup)
- [Development Workflow](#development-workflow)
- [Quality Standards Enforcement](#quality-standards-enforcement)
- [Build Process](#build-process)
- [Testing Strategy](#testing-strategy)
- [Troubleshooting](#troubleshooting)

## Environment Setup

### Prerequisites
- Node.js 18.x or higher
- pnpm 8.x or higher (this project does not use npm or yarn)

### Core Tooling

This project relies on specific tools that are essential to understand:

1. **TypeScript (v5.1.6)** - Statically typed JavaScript with interfaces, generics, and more
   - Used for all source code with strict type checking
   - Configured via `tsconfig.json`

2. **neverthrow** - Functional error handling library
   - Used instead of traditional try/catch/throw for error handling
   - Provides `Result` type, `ok()`, and `err()` functions
   - Enforced via ESLint rules

3. **Eta** - Lightweight template engine
   - Used for code generation templates
   - Templates stored in `templates/` directory with `.eta` extension
   - Configured for whitespace preservation

4. **ESLint & Plugins** - Code quality enforcement
   - `@typescript-eslint/eslint-plugin` for TypeScript-specific rules
   - `eslint-plugin-neverthrow` to enforce functional error patterns
   - Other plugins for code formatting and consistency

5. **Jest** - Testing framework
   - Used for unit and integration tests
   - Configured via `jest.config.js`
   - Typescript support via `ts-jest`

6. **Husky** - Git hooks
   - Pre-commit hooks for validation
   - Pre-push hooks for testing
   - Located in `.husky/` directory

### Initial Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/axe-handle.git
   cd axe-handle
   ```

2. Install dependencies with pnpm:
   ```bash
   pnpm install
   ```

3. Install Git hooks:
   ```bash
   pnpm run prepare
   ```

### IDE Configuration
We recommend using Visual Studio Code with the following extensions:
- ESLint
- Prettier
- TypeScript Hero
- Path Intellisense

The project includes VS Code settings to ensure consistent editor behavior.

## Development Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features or enhancements
- `fix/*`: Bug fixes
- `docs/*`: Documentation updates

### Development Cycle

1. **Select a task** from the [TODO list](./TODO.md)
2. **Create a branch** for your feature or fix
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Implement changes** following the [Code Standards](./CODE_STANDARDS.md)
4. **Validate your code** using the provided scripts
5. **Commit your changes** (pre-commit hooks will run validation)
6. **Create a pull request** for review

### Common Commands

```bash
# Type checking
pnpm run type-check

# Linting
pnpm run lint
pnpm run lint:fix

# Validating path headers
pnpm run check-paths
pnpm run fix-paths

# Building
pnpm run build

# Running tests
pnpm run test
```

## Quality Standards Enforcement

Axe Handle uses multiple automated tools to enforce code quality. This approach is designed to ensure our core quality principles:

1. **Functional Error Handling** - No exceptions, use Result pattern
2. **Consistent File Organization** - Files in correct directories
3. **Self-Documenting Code** - Headers, comments, and type definitions
4. **Type Safety** - Strong typing throughout the codebase

Here's how our tools work together to enforce these principles:

### 1. Directory Structure Enforcement
- **Script:** `utils/check-directory-structure.js`
- **When it runs:** Pre-build, manual check
- **What it checks:** Validates that project directories maintain expected structure
- **Commands:** 
  - `pnpm run check-structure` - Checks structure against snapshot
  - `pnpm run update-structure` - Updates snapshot with current structure

### 2. Path Header Validation
- **Script:** `utils/validate-path-headers.js`
- **When it runs:** Pre-build, git hooks, manual check
- **What it checks:** Ensures every source file has proper path header comment
- **Commands:**
  - `pnpm run check-paths` - Checks all file headers
  - `pnpm run fix-paths` - Automatically fixes headers

### 3. ESLint with Neverthrow Rules
- **Configuration:** `.eslintrc.js`
- **When it runs:** Pre-build, git hooks, manual check
- **What it checks:**
  - TypeScript naming conventions
  - Function length and complexity
  - Documentation requirements
  - Neverthrow functional error handling patterns
- **Commands:**
  - `pnpm run lint` - Runs linter on all files
  - `pnpm run lint:fix` - Attempts to fix lint issues

### 4. Git Pre-commit Hook
- **Script:** `.husky/pre-commit`
- **When it runs:** Every git commit
- **What it checks:** Runs path header and lint checks against staged files
- **Auto-fixes:** Yes, and re-stages fixes

### Check Severity Levels

| Check Type | Failed Build | Warning | Info Only |
|------------|--------------|---------|-----------|
| Directory Structure | ✓ | | |
| Path Headers | ✓ | | |
| Neverthrow Errors | ✓ | | |
| Function Length | | ✓ | |
| Boolean Naming | | ✓ | |
| JSDoc Comments | | ✓ | |

## Tool-Specific Guidelines

### Using neverthrow for Error Handling

This project uses the functional error handling approach with neverthrow instead of exceptions:

```typescript
import { Result, ok, err } from 'neverthrow';
import { AppError, ErrorType, createError } from './errors';

// Instead of throwing errors:
function riskyOperation(): Result<string, AppError> {
  if (someCondition) {
    // Don't do this: throw new Error('Something went wrong');
    
    // Do this instead:
    return err(createError(ErrorType.VALIDATION, 'Something went wrong'));
  }
  
  return ok('Success result');
}

// Chaining operations:
const result = riskyOperation()
  .andThen(value => anotherOperation(value))
  .map(value => transformValue(value))
  .mapErr(error => logAndEnhanceError(error));
```

### Working with Eta Templates

Template files use the `.eta` extension and are stored in the `templates/` directory:

```typescript
import * as eta from 'eta';
import { renderTemplate } from './templateUtils';

// Configure the template engine
configureTemplateEngine('templates/');

// Render a template
const result = renderTemplate('componentName.eta', { 
  name: 'MyComponent',
  props: ['title', 'description']
});
```

### Path Headers

Every source file must include a path header as the first line (after shebang if present):

```typescript
// Path: src/utils/example.ts
```

## Build Process

The build process transforms TypeScript code into JavaScript and prepares it for distribution:

1. **Pre-build Validation**
   - Path headers are checked
   - Directory structure is validated
   - TypeScript compilation is verified

2. **Compilation**
   - TypeScript is compiled to JavaScript
   - Declaration files are generated
   - Source maps are created

3. **Post-build Steps**
   - Templates are copied to the output directory
   - Package.json is updated for distribution

### Build Script

```bash
pnpm run build
```

The build script combines these steps:
```json
"scripts": {
  "prebuild": "pnpm run validate",
  "build": "tsc && tsc-alias",
  "postbuild": "pnpm run copy-templates"
}
```

## Testing Strategy

The project uses Jest for testing:

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test interaction between components
3. **End-to-End Tests**: Test complete generation process

### Running Tests

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage
```

## Troubleshooting

### Fixing Build Issues

If you encounter build errors:

1. **ESLint Configuration Issues**
   ```bash
   pnpm add -D eslint-plugin-neverthrow @typescript-eslint/eslint-plugin @typescript-eslint/parser
   ```

2. **Path Header Errors**
   ```bash
   pnpm run fix-paths
   ```

3. **TypeScript Compilation Errors**
   - Check TypeScript version compatibility:
   ```bash
   pnpm add -D typescript@5.1.6
   ```

### Common Issues

1. **Missing Path Headers**
   - Run `pnpm run fix-paths` to automatically add headers

2. **Neverthrow Linting Issues**
   - Replace throw statements with `err()` from neverthrow
   - Use `Result` type for functions that can fail

3. **Directory Structure Validation Failures**
   - Check your file locations against [PROJECT_ORGANIZATION.md](./PROJECT_ORGANIZATION.md)
   - Run `pnpm run check-structure` to identify issues
