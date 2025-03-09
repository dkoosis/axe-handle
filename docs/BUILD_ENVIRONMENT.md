# Build Environment Setup Guide

This guide explains how to set up and fix the build environment for the Axe Handle project.

## Prerequisites

- Node.js 18.x or higher
- pnpm 8.x or higher

## Initial Setup

1. Install pnpm if not already installed:
   ```bash
   npm install -g pnpm
   ```

2. Install project dependencies:
   ```bash
   pnpm install
   ```

## Fixing Build Issues

The following steps address common build issues in the project:

### 1. Fix ESLint Configuration

1. Update the ESLint configuration to support Node.js environment and neverthrow:
   ```bash
   pnpm add -D eslint-plugin-neverthrow @typescript-eslint/eslint-plugin @typescript-eslint/parser
   ```

2. Replace your `.eslintrc.json` with the updated configuration provided in this repository.

### 2. Fix Path Headers

Run the path header validation script to add or fix headers in all source files:

```bash
pnpm run fix-paths
```

For specific files:

```bash
node utils/validate-path-headers.js --file=src/path/to/file.ts --fix
```

### 3. Update Directory Structure

1. Update the directory structure snapshot:
   ```bash
   node utils/check-directory-structure.js --update
   ```

2. Create missing directories as needed:
   ```bash
   mkdir -p src/generators/common src/generators/express
   ```

### 4. Update TypeScript Path Aliases

1. Install tsc-alias if not already available:
   ```bash
   pnpm add -D tsc-alias
   ```

2. Verify path mappings in tsconfig.json match the import statements in the codebase.

### 5. Set Up Template Structure

Run the pre-build script to set up the required template structure:

```bash
node src/ensureProjectStructure.js
```

### 6. Update Package Scripts

Ensure all scripts in package.json use pnpm instead of npm.

## Downgrading TypeScript (If Needed)

If you need to downgrade TypeScript to version 5.1.6 for compatibility:

```bash
pnpm add -D typescript@5.1.6
```

## Running the Build

Once the environment is set up, run the build:

```bash
pnpm run build
```

## Troubleshooting

### ESlint Errors

If you continue to see ESLint errors related to global objects like `process` or `console`:

1. Check that the ESLint configuration has the Node.js environment enabled.
2. Try disabling specific rules for problematic files if necessary.

### Path Mapping Errors

If you see errors related to path mappings during compilation:

1. Verify that the path aliases in tsconfig.json are correct.
2. Ensure tsc-alias is properly installed and included in the build script.

### Template Missing Errors

If you encounter errors about missing templates:

1. Run the `ensureProjectStructure.js` script.
2. Manually create any missing template files in the templates directory.
