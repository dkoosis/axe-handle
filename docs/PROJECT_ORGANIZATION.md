# Axe Handle Project Organization

<!-- Path: docs/PROJECT_ORGANIZATION.md -->
<!-- Purpose: Comprehensive overview of project architecture, directory structure, and component design -->

This document describes the architecture, directory structure, organization patterns, and components of the Axe Handle project.

## Overview

Axe Handle is a code generator for creating Model Context Protocol (MCP) servers. It takes a service definition as input and generates a TypeScript/Express.js implementation of an MCP-compliant server.

## Table of Contents
- [Core Architecture](#core-architecture)
- [Directory Structure](#directory-structure)
- [Naming Conventions](#naming-conventions)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [Template System](#template-system)
- [Generated Output](#generated-output)

## Core Architecture

Axe Handle follows a pipeline architecture for transforming input schemas into generated code:

```
User Schema (.proto) → Parser → Validator → Mapper → Generator → TypeScript Server
```

### Key Components

1. **Parser**
   - Processes the input schema (Protobuf format)
   - Extracts resources, operations, and types

2. **Validator**
   - Ensures compliance with MCP specifications
   - Validates schema against business rules

3. **Mapper**
   - Transforms parsed schema into an intermediate representation
   - Resolves relationships between resources

4. **Generator**
   - Creates server code from templates using the mapped data
   - Manages output directory structure

### Supporting Systems

1. **Template System**
   - A flexible, cacheable template engine built around Eta
   - Templates organized by target framework and component type

2. **Validation Utilities**
   - Comprehensive validation for inputs, paths, and schemas
   - Ensures data integrity throughout the pipeline

3. **Error Handling**
   - Structured error types with detailed codes and messages
   - Using neverthrow for functional error handling through Result pattern

4. **Logging**
   - Structured logging with categories and levels
   - Performance tracking for generation steps

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

### Data Flow Diagram

```
┌───────────┐    ┌──────────┐    ┌──────────────┐    ┌───────────┐    ┌───────────┐
│           │    │          │    │              │    │           │    │           │
│  Protobuf │───>│  Parser  │───>│ Intermediate │───>│  Mapper   │───>│  Context  │
│  Schema   │    │          │    │ Representation│    │           │    │ Model     │
│           │    │          │    │              │    │           │    │           │
└───────────┘    └──────────┘    └──────────────┘    └───────────┘    └─────┬─────┘
                                                                            │
                                                                            ▼
┌───────────┐    ┌──────────┐    ┌──────────────┐    ┌───────────┐    ┌───────────┐
│           │    │          │    │              │    │           │    │           │
│  Output   │<───│ Generated│<───│  Rendered    │<───│ Template  │<───│ Template  │
│  Server   │    │  Files   │    │  Templates   │    │ Engine    │    │ Loader    │
│           │    │          │    │              │    │           │    │           │
└───────────┘    └──────────┘    └──────────────┘    └───────────┘    └───────────┘
```

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

### Template Engine

The project uses Eta as its template engine with the following configuration:

- Templates are cached in production mode
- Whitespace is preserved for better readability
- Each template can include other templates
- Data passed to templates is strongly typed

### Template Helpers

A set of helper functions is available within templates:

- Type conversion helpers (camelCase, PascalCase, etc.)
- Code generation helpers (indent, wrapComment, etc.)
- Validation helpers for generated code

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

The generated code includes:

- TypeScript interfaces for all resources
- Express.js routes for all operations
- Handler implementations with validation
- Documentation for the generated API
- Configuration for the Express.js server
- Middleware for authentication and logging
