# Axe Handle: MCP Server Generator

A robust, maintainable, and extensible TypeScript-based code generator for Model Context Protocol (MCP) servers, targeting Express.js.

## Overview

Axe Handle generates Express.js servers from user-provided Protobuf schemas that define the service. The generated code follows MCP protocols and provides a complete, production-ready server implementation.

## Features

- **Schema-Driven Development**: Define your service using Protobuf schemas
- **MCP Compliance**: Adherence to the official MCP protocol
- **TypeScript Optimization**: Generated code follows best practices for TypeScript
- **Robust Error Handling**: Clear, informative, and actionable error messages
- **Developer-Friendly Workflow**: Easy to build, run, test, and iterate

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/axe-handle.git
cd axe-handle

# Install dependencies
pnpm install

# Build the project
pnpm build
```

## Usage

Generate an MCP server from a Protobuf schema:

```bash
pnpm run generate schemas/examples/calendar.proto ./generated
```

Run the generated server:

```bash
cd generated
pnpm install
pnpm start
```

### Options

- `--config <file>`: Specify a configuration file
- `--overwrite`: Overwrite existing files
- `--docs`: Generate documentation (default: true)
- `--verbose`: Verbose output

## Development

```bash
# Run development mode (watch + tests)
pnpm dev

# Run tests
pnpm test
```

## Project Structure

```
axe-handle/
├── src/
│   ├── parser/
│   │   ├── mcpProtocolParser.ts  # Parses protocol.ts (TS Compiler API, caching)
│   │   ├── serviceParser.ts  # Parses .proto (protobufjs, detailed validation)
│   │   └── openapiParser.ts  # Parses OpenAPI (conversion, with warnings)
│   ├── generator/
│   │   └── mcpServerGenerator.ts     # Core generation (ejs, error handling)
│   ├── mcp/
│   │   └── mapper.ts        # Maps user schema to MCP
│   ├── cli.ts             # Command-line interface (commander)
│   ├── index.ts           # Main entry point
│   └── types.ts           # Shared TypeScript types
├── templates/             # EJS templates
│   ├── server.ejs
│   ├── handler.ejs
│   ├── types.ejs
│   ├── index.ejs
│   └── api.ejs
├── test/                  # Unit and integration tests
├── schemas/
│   ├── mcp-spec/         # MCP protocol
│   │   ├── protocol.ts
│   │   └── schema.json    # CACHED parsed MCP protocol
│   └── examples/
│       └── calendar.proto
└── generated/             # Output (gitignore this)
```

## Core Principles

- **Extensibility**: Hooks/plugins for custom logic injection
- **Maintainability**: Clean, modular code; extensive testing; clear separation of concerns
- **Robust Error Handling**: Clear, informative, and actionable error messages
- **Version Resilience**: Design with MCP versioning in mind
- **Simplicity**: Prioritize straightforward, easy-to-understand code over complex solutions

## Error Handling

Axe Handle uses a hierarchical error classification system:

- `AXE-`: Errors from the Axe Handle code generator
  - `AXE-1XXX`: Parser errors
  - `AXE-2XXX`: CLI errors
  - `AXE-3XXX`: Generator errors
  - `AXE-4XXX`: Mapper errors
- `MCP-`: Errors related to the MCP protocol or generated server
  - `MCP-1XXX`: MCP protocol violations
  - `MCP-4XXX`: Runtime errors (e.g., 4004 - Not Found)

## Contributing

Contributions are welcome! Please follow our coding standards and submit PRs for review.

## License

MIT