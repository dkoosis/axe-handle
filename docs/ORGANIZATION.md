# Axe Handle Project Organization

## Directory Structure

```
axe-handle/
├── src/                          # Generator source code
│   ├── axe/                      # Core Axe Handle components
│   │   ├── engine/               # Code generation engine
│   │   ├── schema/               # Schema parsing and validation
│   │   └── mappings/             # Schema-to-server mappings
│   ├── generators/               # Generator implementations
│   │   ├── express/              # Express-specific generators
│   │   └── common/               # Shared generator components
│   ├── utils/                    # Shared utilities
│   ├── cli.ts                    # Command-line interface
│   └── index.ts                  # Main API
├── templates/                    # Templates for generated code
│   ├── mcp-server/               # MCP server templates
│   │   ├── express/              # Express framework templates
│   │   │   ├── src/              # Server source
│   │   │   ├── config/           # Server configuration
│   │   │   └── docs/             # Server documentation
│   │   └── [future frameworks]
│   └── common/                   # Shared templates
└── examples/                     # Example schemas and generated code
```

## Naming Conventions

- **Prefixes**:
  - `Axe*` for generator components (e.g., `AxeServerGenerator`)
  - `Mcp*` for generated server components (e.g., `McpResourceHandler`)

- **Suffixes**:
  - `*Generator.ts` for code generators
  - `*Parser.ts` for schema parsers
  - `*.eta` for templates (no .ts in template filenames)

## Component Overview

### Axe Handle (Generator)
- Schema parsing and validation
- Resource and service mapping
- Code generation engine
- Template system

### MCP Server (Generated)
- Express-based server implementation
- Resource handlers
- WebSocket support
- API documentation
