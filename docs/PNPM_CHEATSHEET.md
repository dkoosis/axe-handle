# pnpm Commands Cheatsheet for Axe Handle

This cheatsheet provides common pnpm commands for working with the Axe Handle project.

## Installation

```bash
# Install pnpm globally
npm install -g pnpm

# Install dependencies
pnpm install

# Install a new dependency
pnpm add <package-name>

# Install a development dependency
pnpm add -D <package-name>

# Update dependencies
pnpm update
```

## Project Scripts

```bash
# Run code validation
pnpm run validate

# Build the project
pnpm run build

# Run the development server
pnpm run dev

# Run tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Type check without emitting files
pnpm run type-check

# Lint code
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Fix path headers
pnpm run fix-paths

# Check path headers
pnpm run check-paths

# Clean build output
pnpm run clean
```

## Directory Structure Validation

```bash
# Check directory structure against snapshot
pnpm run check-structure

# Update directory structure snapshot
node utils/check-directory-structure.js --update
```

## Template Management

```bash
# Ensure template structure exists
node src/ensureProjectStructure.js
```

## Comparing with npm

| npm command | pnpm equivalent |
|-------------|-----------------|
| `npm install` | `pnpm install` |
| `npm install <pkg>` | `pnpm add <pkg>` |
| `npm install -D <pkg>` | `pnpm add -D <pkg>` |
| `npm run <script>` | `pnpm run <script>` |
| `npm update` | `pnpm update` |
| `npm outdated` | `pnpm outdated` |
| `npm uninstall <pkg>` | `pnpm remove <pkg>` |

## Advanced Features

```bash
# Install exact version
pnpm add <pkg>@<version> --save-exact

# Install with frozen lockfile (CI environments)
pnpm install --frozen-lockfile

# Clear cache
pnpm store prune
```

For more information, visit the [official pnpm documentation](https://pnpm.io/cli/add).
