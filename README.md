# Axe Handle Project

<!-- Path: README.md -->
<!-- Purpose: Top-level project overview and documentation index to help developers navigate the codebase -->

Axe Handle is a code generator for creating Model Context Protocol (MCP) servers. It takes a service definition as input and generates a TypeScript/Express.js implementation of an MCP-compliant server. This tool bridges the gap between existing services and AI agents by enabling seamless integration through the MCP standard.

## Documentation Map

The following diagram shows how the documentation is organized and how different documents relate to each other:

![Documentation Map](./docs/documentation-map.png)

For new contributors, we recommend starting with README.md, then exploring DEVELOPMENT_GUIDE.md, followed by CODE_STANDARDS.md.

## Getting Started

```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build

# Run validation
pnpm run validate
```

## Project Documentation

This project is documented through multiple specialized guides:

### Core Documentation

- [**Project Organization**](./docs/PROJECT_ORGANIZATION.md) - Architecture, directory structure, and component design
- [**Code Standards**](./docs/CODE_STANDARDS.md) - Coding guidelines and conventions
- [**Tool Decisions**](./docs/TOOL_DECISIONS.md) - Definitive decisions on tooling choices
- [**Development Guide**](./docs/DEVELOPMENT_GUIDE.md) - Complete guide to development workflow and tooling

### Project Management

- [**Roadmap**](./docs/ROADMAP.md) - Strategic vision, prioritized tasks, and future enhancements 
- [**PNPM Cheatsheet**](./docs/PNPM_CHEATSHEET.md) - Common PNPM commands for this project

## Key Features

- **Protocol Definition Input**: Takes Protocol Buffer (protobuf) schema as input
- **Express.js Output**: Generates a TypeScript/Express.js server implementation
- **MCP Compliance**: Ensures the generated server follows Model Context Protocol specifications
- **Template-based Generation**: Uses Eta templates for customizable output
- **Functional Error Handling**: Implements the Result pattern using neverthrow

## Technical Stack

- **TypeScript**: For type safety and improved developer experience
- **PNPM**: Package management (required for this project, do not use npm/yarn)
- **Eta**: Templating engine for code generation
- **Neverthrow**: Functional error handling
- **Express.js**: Target framework for generated servers

## Contributing

We welcome contributions to the Axe Handle project! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following our [Code Standards](./docs/CODE_STANDARDS.md)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

For detailed information on development environment setup, workflow, and quality standards, please refer to our [Development Guide](./docs/DEVELOPMENT_GUIDE.md).

## Project Status

Axe Handle is currently in active development. See the [Roadmap](./docs/ROADMAP.md) for current priorities and future plans.
