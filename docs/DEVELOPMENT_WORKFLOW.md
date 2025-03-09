# Axe Handle Development Workflow

This document describes the development workflow for the Axe Handle project, from environment setup to contribution guidelines.

<!--
EDITORIAL NOTE: This is a skeleton document created during consolidation
DECISION NEEDED: Should this be expanded now, or later as a separate task?
-->

## Table of Contents
- [Development Environment Setup](#development-environment-setup)
- [Building and Testing](#building-and-testing)
- [Development Cycle](#development-cycle)
- [Code Validation](#code-validation)
- [Git Workflow](#git-workflow)
- [Release Process](#release-process)

## Development Environment Setup

### Prerequisites
- Node.js (version 18 or later)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/axe-handle.git
cd axe-handle

# Install dependencies
npm install

# Set up git hooks
npx husky install
```

## Building and Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Building
npm run build

# Running tests
npm run test

# Development mode
npm run dev
```

## Development Cycle

1. **Select a task** from the [Roadmap](ROADMAP.md)
2. **Create a branch** for your feature or fix
3. **Implement changes** following the [Code Standards](CODE_STANDARDS.md)
4. **Validate your code** using the provided scripts
5. **Commit your changes** (pre-commit hooks will run validation)
6. **Create a pull request** for review

## Code Validation

Axe Handle uses several validation tools that run at different stages:

### Manual Validation

```bash
# Check path headers
npm run check-paths

# Fix path headers
npm run fix-paths

# Check directory structure
npm run check-structure

# Run all validation
npm run validate
```

### Automatic Validation

- **Pre-commit**: Path headers and linting
- **Pre-build**: Full validation suite
- **CI pipeline**: *(Planned)* Full validation and tests

## Git Workflow

### Branching Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features or enhancements
- `fix/*`: Bug fixes
- `docs/*`: Documentation updates

### Commit Messages

Follow conventional commit message format:

```
type(scope): short description

Longer description if needed
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Release Process

<!--
EDITORIAL NOTE: No information about the release process was found in the existing docs
DECISION NEEDED: What is the release process for Axe Handle?
-->
