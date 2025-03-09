# Contributing to Axe Handle

Thank you for considering contributing to Axe Handle! This document outlines the project's development practices and guidelines to ensure consistency and quality.

## Development Environment Setup

### Prerequisites

- Node.js 18.x or higher
- pnpm 8.x or higher (do not use npm)

### Installation

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

## Development Workflow

### Package Management

**IMPORTANT**: This project uses pnpm exclusively as its package manager. Please do not use npm or yarn.

- Adding dependencies:
  ```bash
  pnpm add <package>         # For dependencies
  pnpm add -D <package>      # For dev dependencies
  ```

- Updating dependencies:
  ```bash
  pnpm update
  ```

### Common Commands

- Type checking:
  ```bash
  pnpm run type-check
  ```

- Linting:
  ```bash
  pnpm run lint
  pnpm run lint:fix
  ```

- Validating path headers:
  ```bash
  pnpm run check-paths
  pnpm run fix-paths
  ```

- Building:
  ```bash
  pnpm run build
  ```

- Running the development server:
  ```bash
  pnpm run dev
  ```

- Running tests:
  ```bash
  pnpm run test
  ```

## Code Style and Structure

Please adhere to the project's established coding standards:

1. All TypeScript files must include a path header comment:
   ```typescript
   // Path: src/path/to/file.ts
   ```

2. Follow the directory structure outlined in [PROJECT_ORGANIZATION.md](./docs/PROJECT_ORGANIZATION.md).

3. Use functional error handling with neverthrow instead of throwing exceptions.

4. Document all public interfaces with JSDoc comments.

## Commit Guidelines

- Use descriptive commit messages that clearly explain the changes made.
- Pre-commit hooks will automatically validate and fix certain issues.
- Ensure all tests pass and code builds successfully before submitting a pull request.

## Pull Request Process

1. Create a branch with a descriptive name for your changes.
2. Make your changes, adhering to the code style guidelines.
3. Update documentation where necessary.
4. Run `pnpm run validate` to ensure all checks pass.
5. Create a pull request with a clear description of the changes.

Thank you for contributing to Axe Handle!
