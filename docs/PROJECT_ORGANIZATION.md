# Axe Handle Project Organization

This document describes the directory structure, organization patterns, and architectural components of the Axe Handle project.

## Table of Contents
- [Directory Structure](#directory-structure)
- [Naming Conventions](#naming-conventions)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [Template System](#template-system)
- [Generated Output](#generated-output)
- [Development Practices](#development-practices)

## Directory Structure

```
axe-handle/
├── docs/                          # Documentation
├── src/                           # Generator source code
│   ├── cli/                       # Command-line interface
│   ├── mcpServerGenerator/        # MCP server generator components
│   ├── parsers/                   # Parser implementations
│   │   └── modelContextProtocol/  # MCP protocol parsing
│   ├── utils/                     # Shared utilities
│   │   ├── core/                  # Core utilities
│   │   ├── errors/                # Error handling
│   │   ├── io/                    # Input/output utilities
│   │   └── templates/             # Template processing
│   └── index.ts                   # Main API
├── templates/                     # Templates for generated code
│   ├── mcp-server/               # MCP server templates
│   │   ├── express/              # Express framework templates
│   │   │   ├── src/              # Server source
│   │   │   ├── config/           # Server configuration
│   │   │   └── docs/             # Server documentation
│   └── common/                   # Shared templates
└── tests/                        # Test suite
    └── fixtures/                 # Test data
```

### Key Directories

- **`docs/`**: Contains high-level documentation for the project, such as design documents, user guides, and API references.
- **`src/`**: Contains all the source code for the project (written in TypeScript).
- **`templates/`**: Contains the actual template files used for code generation. These are `.eta` files.
- **`tests/`**: Contains the automated tests for the project. The structure within `tests/` mirrors the `src/` structure.

## Naming Conventions

### Prefixes and Suffixes

- **Prefixes**:
  - `Axe*` for generator components (e.g., `AxeServerGenerator`)
  - `Mcp*` for generated server components (e.g., `McpResourceHandler`)

- **Suffixes**:
  - `*Generator.ts` for code generators
  - `*Parser.ts` for schema parsers
  - `*.eta` for templates (no .ts in template filenames)

### File Extensions

- **`.ts`**: TypeScript source code files
- **`.eta`**: Template files using the Eta template engine
- **`.json`**: JSON data files (used for the MCP protocol schema)
- **`.proto`**: Protocol Buffers schema files (used for example input schemas)
- **`.md`**: Markdown files for documentation

## Component Architecture

The Axe Handle project consists of these main components:

### Generator (Axe Handle)

1. **Parser System**
   - Processes Protocol Buffer schemas
   - Validates schema against MCP requirements
   - Extracts resources, operations, and types

2. **Mapper System**
   - Maps parsed schema to MCP concepts
   - Resolves relationships between resources
   - Validates mapping for completeness

3. **Template System**
   - Loads templates from filesystem
   - Renders templates with mapped data
   - Writes generated code to output directory

4. **Code Generator**
   - Coordinates the end-to-end generation process
   - Handles command-line parameters
   - Manages output directory structure

### Generated Server (MCP)

1. **Express-based Server**
   - HTTP endpoints for MCP operations
   - WebSocket support for real-time communication
   - Error handling and validation

2. **Resource Handlers**
   - Operation implementations for each resource
   - Request validation and transformation
   - Response formatting

3. **Documentation**
   - API documentation for the MCP server
   - Resource and operation descriptions
   - Sample requests and responses

## Data Flow

The data flows through the system as follows:

1. **Input**: Protocol Buffer schema defining the service
2. **Parsing**: Schema is parsed into an intermediate representation
3. **Mapping**: Intermediate representation is mapped to MCP concepts
4. **Generation**: Code is generated from templates using mapped data
5. **Output**: Express.js server implementing the MCP protocol

## Template System

Templates are organized by target framework and component type:

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

## Generated Output

The generated server follows this structure:

```
generated/
├── src/
│   ├── handlers/         # Resource handlers
│   ├── types/            # TypeScript interfaces
│   ├── utils/            # Helper utilities
│   ├── server.ts         # Express server setup
│   └── index.ts          # Entry point
├── docs/                 # API documentation
├── package.json          # Dependencies
└── README.md             # Usage instructions
```

## Development Practices

### Package Management

**IMPORTANT**: This project uses pnpm exclusively as its package manager. Do not use npm or yarn.

- Adding dependencies:
  ```
  pnpm add <package>       # For runtime dependencies
  pnpm add -D <package>    # For dev dependencies
  ```

- Scripts should be run with pnpm:
  ```
  pnpm run build
  pnpm run test
  ```

### Code Quality Enforcement

The project uses several automated tools to enforce code quality:

1. **TypeScript** for type safety (using version 5.1.6)
2. **ESLint** with custom rules for code style
3. **Path Header Validation** to ensure files have proper headers
4. **Directory Structure Validation** to maintain proper organization
5. **Husky** for pre-commit hooks

These tools are run automatically through the project's CI/CD pipeline and before commits.
