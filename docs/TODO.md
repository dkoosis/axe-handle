# Axe Handle Project: Next Steps

## For Code Assistants

This project follows specific conventions and architectural decisions that should be maintained in all contributions:

- **Error Handling**: Uses the Result pattern from neverthrow instead of throwing exceptions
- **Path Headers**: Every source file must begin with `// Path: path/to/file.ts`
- **Code Organization**: Files are organized by feature, not by type
- **Templates**: Uses Eta templating engine with a specific directory structure
- **Style Guide**: Follow TypeScript best practices defined in `docs/CODE_STANDARDS.md`

Before modifying any file, please review the relevant sections in `docs/PROJECT_ORGANIZATION.md` and existing code patterns in similar files. When adding new features, follow the established module boundaries and separation of concerns.

---

This document maintains a prioritized list of tasks for the Axe Handle project, designed to be accessible to both human developers and AI coding assistants.

## Active Tasks

### High Priority
- [ ] **Fix ESLint Configuration**
  - Update `.eslintrc.json` with proper neverthrow rules and Node.js environment
  - Files: `.eslintrc.json`, `package.json`
  - Context: Current linting fails with "Definition for rule 'neverthrow/no-throw' was not found"
  - Implementation: Add Node environment and fix plugin configuration

- [ ] **Complete Path Header Validation**
  - Ensure all source files have correct path headers
  - Files: `utils/validate-path-headers.js`
  - Command: `npm run fix-all-paths`
  - Context: Path headers are required for all source files to aid navigation and validation

- [ ] **Ensure Template Directory Structure**
  - Validate and create template structure before builds
  - Files: `src/ensureProjectStructure.ts`
  - Context: Templates must follow the structure in `docs/PROJECT_ORGANIZATION.md`
  - Command: `npm run ensureTemplates`

### Medium Priority
- [ ] **Update Package Dependencies**
  - Update dependencies in package.json to match the latest requirements
  - Add lint-staged and other missing development dependencies
  - Files: `package.json`
  - Context: Several dependencies are missing or have incorrect versions

- [ ] **Simplify Git Hooks**
  - Replace complex pre-commit hook with streamlined version using lint-staged
  - Files: `.husky/pre-commit`
  - Context: Current pre-commit hook contains redundant operations

- [ ] **Fix Circular Dependencies**
  - Review and eliminate circular imports
  - Areas to check: utils/logger.ts, templateProcessor modules
  - Context: Circular dependencies can cause unpredictable behavior and complicate builds

- [ ] **Downgrade TypeScript for Compatibility**
  - Ensure TypeScript version is 5.1.6 for compatibility with @typescript-eslint
  - Files: `package.json`, `tsconfig.json`
  - Context: See linting errors in `docs/lint.txt`

### Low Priority
- [ ] **Improve Test Coverage**
  - Add unit tests for core components
  - Prioritize testing template processing and error handling
  - Files: `tests/` directory
  - Context: Test coverage enhances reliability and documents expected behavior

- [ ] **Enhance Documentation**
  - Update architecture diagrams
  - Add more examples to README.md
  - Improve JSDoc comments for public APIs
  - Context: Good documentation makes the codebase more accessible to new contributors

## Completed Tasks
- [x] **Created Build Environment Plan**
  - Identified key issues and created structured improvement plan
  - Updated package.json with proper scripts and dependencies
  - Created simplified pre-commit hook
  - Completed: March 8, 2025

## Reference Documentation
- Architecture: `docs/PROJECT_ORGANIZATION.md`
- Code Standards: `docs/CODE_STANDARDS.md`
- Project Overview: `docs/README.md`
- Data Flow: See diagrams in `/assets`

## Working with this Codebase
When making changes, please ensure:
1. All files have proper path headers (`// Path: path/to/file.ts`)
2. Follow the error handling pattern using neverthrow (avoid throwing exceptions)
3. Run validation before commits: `npm run validate`
4. Keep this TODO document updated as tasks are completed or new ones are identified

### For AI Assistants
When tackling a task:
1. Review the relevant documentation first
2. Use the established code patterns in the existing codebase
3. Focus on the specific task, but note any related issues you discover
4. Add context to your changes by updating comments and this TODO document

### Key Architectural Principles
- Use the Result pattern from neverthrow for error handling
- Organize code by feature, not by type
- Maintain separation between parsing, mapping, and generation
- Ensure all public interfaces have proper JSDoc documentation