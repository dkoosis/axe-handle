# Action Plan for Axe Handle

## TODO
* assess migratino to eta templating
* assess use of [neverthrow](https://github.com/supermacro/neverthro) error handling
* assess use of zod

## Plan

**Goal:** Create a TypeScript-based code generator for Express.js MCP servers.

**Principles:**

*   **Simple:**  Prioritize straightforward code.
*   **Schema-Driven:** Uses Protobuf schemas.
*   **Maintainable:** Clean code, testing, clear separation.
*   **Extensible:**  (Future) Hooks/plugins for custom logic.
*   **Developer-Friendly:** Easy workflow.
*   **MCP Compliant:** Follows the MCP specification.
*   **Robust Errors:** Clear error messages with codes.
*   **Version Resilient:**  Considers MCP versioning.
*   **Optimized TypeScript:** Readable, maintainable, best practices.

## 1. Schemas & Inputs

### 1.1. MCP Specification Schema (`schema.ts`)

*   **Source:** Official MCP Specification (TypeScript).
*   **Purpose:** Defines MCP structure.
*   **Usage:** Parsed (TypeScript Compiler API), cached as JSON (`schemas/mcp-spec/schema.json`).  Used for validation.
*   **Mutability:** Infrequent.

### 1.2. Service Description Schema (User-Provided)

*   **Source:** User-created Protobuf (`.proto`).
*   **Purpose:** Describes the specific service.
*   **Usage:** Parsed (`protobufjs`), validated against MCP spec.
*   **Mutability:** Frequent.
*   **Example:** (`schemas/examples/my-calendar.proto`)

    ```protobuf
    syntax = "proto3";
    package mycalendar;
    message Event {
      string id = 1;
      string title = 2;
      google.protobuf.Timestamp start_time = 3;
      google.protobuf.Timestamp end_time = 4;
    }
    message Calendar {
        string id = 1;
        string name = 2;
        repeated Event events = 3;
    }
    ```

### 1.3. OpenAPI Specification (Optional)

*   **Source:** User-provided (YAML or JSON).
*   **Purpose:**  Migration from REST APIs.
*   **Usage:** Parsed to generate a *suggested* Protobuf schema (with `// TODO:` comments).
*   **Mutability:** Depends on the REST API.

## 2. Project Structure

axe-handle/
├── src/
│   ├── parser/
│   │   ├── mcpSpecParser.ts  # Parses MCP spec (caching)
│   │   ├── serviceParser.ts  # Parses .proto (validation)
│   │   └── openapiParser.ts  # Parses OpenAPI (conversion)
│   ├── generator/
│   │   └── generator.ts     # Core generation (ejs)
│   ├── mcp/
│   │   └── mapper.ts        # Maps user schema to MCP
│   ├── cli.ts             # Command-line interface
│   ├── index.ts           # Main entry point
│   └── types.ts           # Shared types
├── templates/             # EJS templates
│   ├── server.ejs
│   ├── handler.ejs
│   └── types.ejs
├── test/                # Tests
│   ├── parser/
│   │   ├── mcpSpecParser.test.ts
│   │   ├── serviceParser.test.ts
│   │   └── openapiParser.test.ts
│   ├── generator.test.ts
│   └── mcp.test.ts
├── schemas/
│   ├── mcp-spec/
│   │   ├── schema.ts
│   │   └── schema.json      # CACHED parsed MCP spec
│   └── examples/
│       └── my-calendar.proto
├── generated/           # Output (gitignore this)
├── package.json
└── tsconfig.json


## 3. Development & Tooling

**Dependencies:** (Using `pnpm`)

*   `typescript`, `@types/node`, `@types/express`
*   `protobufjs`
*   `ejs`
*   `commander`
*   `chalk`
*   `jest`, `ts-jest`, `@types/jest`
*   `concurrently`
*   `nodemon`
*   `ts-node`

**`package.json` Scripts:**

```json
{
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "generate": "ts-node src/cli.ts",
    "start:generated": "node generated/server.js",
    "dev": "concurrently \"npm:watch\" \"npm:test:watch\"",
    "preinstall": "npx only-allow pnpm"
  }
}
pnpm run dev: Primary development command.
pnpm run generate <schema_file.proto> <output_dir>: Generates the server.
CLI Examples:

Bash

# Generate from my-calendar.proto
pnpm run generate schemas/examples/my-calendar.proto ./generated

# Generate with custom config
pnpm run generate schemas/examples/my-calendar.proto ./generated --config my-config.json

# Generate from OpenAPI (with warnings)
pnpm run generate openapi.yaml ./generated
4. Modules
4.1. mcpSpecParser.ts
Input: schemas/mcp-spec/schema.ts

Output: MCP spec representation (cached as schemas/mcp-spec/schema.json).

Tools: TypeScript Compiler API.

Tasks: Load, parse, cache, validate.

Errors:  AXE-1XXX (e.g., AXE-1001).

Testing: test/parser/mcpSpecParser.test.ts

File Header:

TypeScript

// src/parser/mcpSpecParser.ts
// Parses the MCP specification and caches it.
4.2. serviceParser.ts
Input: User .proto file.

Output: Service representation, with documentation.

Tools: protobufjs.

Tasks: Load, parse, validate (against MCP spec).

Errors: AXE-1002, MCP-1001 (detailed, with context).

Testing: test/parser/serviceParser.test.ts

File Header:

TypeScript

// src/parser/serviceParser.ts
// Parses and validates user Protobuf definitions.
4.3. openapiParser.ts
Input: OpenAPI spec (YAML/JSON).

Output: Suggested Protobuf (.proto) with // TODO: comments.

Tools: OpenAPI parsing library (e.g., swagger-parser).

Tasks: Parse, map to Protobuf, add warnings.

Errors: AXE-1003 (conversion limitations).

Testing: test/parser/openapiParser.test.ts

File Header:

TypeScript

// src/parser/openapiParser.ts
// Parses OpenAPI specs and generates suggested Protobuf.
4.4. mapper.ts
Input: Parsed user service (from serviceParser.ts), parsed MCP spec (from mcpSpecParser.ts).

Output: Data for code generation.

Tasks: Transform, map to MCP concepts.

Errors: AXE-1004 (inconsistencies).

Testing: test/mcp/mapper.test.ts

File Header:

TypeScript

// src/mcp/mapper.ts
// Maps the parsed service definition for code generation.
4.5. generator.ts
Input: Mapped data (from mapper.ts).
Output: Generated TypeScript code (Express.js server).
Tools: ejs.
Tasks: Load templates, generate code, write files.
Errors (Generated Code): MCP-4XXX (e.g., MCP-4004 - Not Found).
Testing: test/generator.test.ts (unit, snapshot).
File Header: typescript // src/generator/mcpServerGenerator.ts // Generates the TypeScript code for the server.
Generated Server Example:
  generated/
  ├── server.ts       // Express server setup
  ├── handlers/
  │   ├── resource1.ts // Resource handler
  │   └── resource2.ts // Resource handler
  ├── types.ts        // Shared types
  ├── index.ts        //Entry Point
  └── docs/
      └── api.md       // API documentation (Markdown)
4.6. cli.ts
Input: Command-line arguments.

Output: (Side effects: generates code). Central error reporting.

Tools: commander.

Tasks: Parse arguments, run generation.

Errors: AXE-2XXX (e.g., AXE-2001).

Testing: Integration tests.

File Header:

TypeScript

// src/cli.ts
// Command-line interface for Axe Handle.
4.7. types.ts
Shared TypeScript definitions.
File Header:
TypeScript

  // src/types.ts
  // Shared TypeScript type definitions.
5. Error Handling
AXE- prefix: Axe Handle errors.

AXE-1XXX: Parser errors.
AXE-2XXX: CLI errors.
AXE-3XXX: Generator errors.
AXE-4XXX: Mapper errors.
MCP- prefix: MCP/server errors.

MCP-1XXX: MCP spec violations.
MCP-4XXX: Runtime errors (e.g., 4004 - Not Found).
Messages: Informative, human-readable, actionable, consistent.

6. Testing
Unit Tests: Individual modules (Jest).
Integration Tests: Generate servers, send requests, verify responses.
Snapshot Tests: Consistent code generation.
Coverage: Aim for 80%+.
7. TypeScript Optimization
Strict Mode: Enabled ("strict": true).
Explicit Types: Avoid any.
Interfaces/Types: Use appropriately.
readonly: For immutable properties.
as const: For immutable values.
No Unused: Prevent unused variables/parameters.
Consistent Style: Linter (ESLint + Prettier).
8. Version Control & Workflow
Git Branching: Feature branches.

Pull Requests: Required for all changes.

Code Reviews: Required.

Commit Messages: Conventional Commits.

<type>[optional scope]: <description>
feat, fix, docs, style, refactor, test, chore.
9. Documentation
Internal: JSDoc comments (TypeDoc). Explain why, not just what.
User-Facing: Generated api.md (Markdown).
README: Clear instructions, examples, contribution guidelines.
10. Performance
Generated Code: Designed for performance.
Code Generation: Optimized process, caching.
Benchmarking: Track performance.
11. Roadmap
Phase 1 (MVP): Core functionality, testing, CLI, basic docs.
Phase 2 (Extensibility): Hooks/plugins, config options, improved docs.
Phase 3 (Advanced): Advanced MCP features, integrations, optimization.
Ongoing: MCP compliance, feedback, improvements.
12. Dependency Management & Security
pnpm: Dependency management.
Regular Updates: pnpm update.
Automated Updates: Dependabot/Renovate.
Security Audits: pnpm audit.


