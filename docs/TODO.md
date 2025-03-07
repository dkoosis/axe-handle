# Axe-Handle TODO List

## Architecture & Organization
- [ ] Consolidate duplicate adapter/cache files in parsers/modelContextProtocol directory
- [ ] Rename protocol.json to spec.ts in parsers/modelContextProtocol
- [ ] Remove dist/ directory entirely (it should be git-ignored)
- [ ] Rename "generated" directory to "generatedServer"

## Template System
- [ ] Flatten template directory structure; all .eta files should be at root level
- [ ] Ensure consistent naming convention for all template files
- [ ] Remove duplicate templates across different directories

## Parsers
- [ ] Standardize on single source of truth for MCP protocol
- [ ] Ensure parsers properly handle all MCP schema variations
- [ ] Document schema format requirements in docs/

## Utils vs Build Scripts
- [ ] Keep runtime utilities in src/utils/
- [ ] Keep build/maintenance scripts in root /utils directory
- [ ] Consider standardizing script naming for easier discovery

## Documentation
- [ ] Complete project documentation in docs/
- [ ] Add JSDoc to all public functions
- [ ] Ensure README reflects current project structure
- [ ] Document CLI interface and options

## Tests
- [ ] Add unit tests for core functionality
- [ ] Add integration tests for end-to-end generation
- [ ] Set up test fixtures in tests/fixtures/

## Clean Up
- [ ] Remove unused dependencies in package.json
- [ ] Add proper .gitignore entries for build artifacts
- [ ] Standardize code formatting and linting
