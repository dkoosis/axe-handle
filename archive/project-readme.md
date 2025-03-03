# Axe Handle - MCP Server Generator

![Axe Handle Logo](assets/axe-handle-100x100.svg)

## Overview

Axe Handle is a powerful code generator for building Model Context Protocol (MCP) compliant servers. It streamlines the process of creating high-quality, TypeScript-based MCP servers by analyzing your schema definition and generating all the necessary boilerplate code.

## Key Features

- **Schema-Driven Code Generation**: Generate server code directly from TypeScript schema definitions
- **Multiple Framework Support**: Create servers using Express.js, NestJS, or Fastify
- **Comprehensive Implementation**: Handles the complete MCP protocol including initialization, capability negotiation, and message handling
- **Extensible Architecture**: Easily customize and extend the generated code to meet your specific needs
- **Developer-Friendly**: Clean, well-documented code with meaningful names and comments

## Installation

```bash
# Global installation
npm install -g axe-handle

# Local installation
npm install axe-handle
```

## Quick Start

```bash
# Initialize a new project
axe-handle init --name my-mcp-server

# Generate code from schema
axe-handle generate src/schema/mcp-protocol.ts

# Analyze a schema
axe-handle analyze src/schema/mcp-protocol.ts --output schema-docs.md
```

## Usage

### Command Line Interface

The `axe-handle` CLI provides three main commands:

#### Initialize a new project

```bash
axe-handle init [options]
```

Options:
- `-n, --name <name>` - Project name (default: "mcp-server")
- `-d, --description <description>` - Project description
- `-f, --framework <framework>` - Server framework to use (express, nestjs, fastify)
- `-o, --output <dir>` - Output directory

#### Generate code from schema

```bash
axe-handle generate <schema> [options]
```

Arguments:
- `schema` - Path to MCP schema file (TypeScript)

Options:
- `-o, --output <dir>` - Output directory (default: "./mcp-server")
- `-f, --framework <framework>` - Server framework to use (default: "express")
- `-c, --config <file>` - Path to configuration file
- `-y, --yes` - Skip confirmation prompts

#### Analyze a schema

```bash
axe-handle analyze <schema> [options]
```

Arguments:
- `schema` - Path to MCP schema file (TypeScript)

Options:
- `-o, --output <file>` - Output analysis to file

### Programmatic API

You can also use Axe Handle programmatically in your Node.js applications:

```javascript
const axeHandle = require('axe-handle');

// Generate server from schema
axeHandle.generate({
  schemaPath: './protocol.ts',
  outputDir: './server',
  framework: 'express',
  config: {
    projectName: 'my-mcp-server',
    version: '1.0.0'
  }
})
.then(() => console.log('Generation complete!'))
.catch(err => console.error('Error:', err));

// Parse schema
const schema = axeHandle.schema.parse('./protocol.ts');
console.log(`Found ${schema.summary.interfaceCount} interfaces`);
```

## Configuration

Axe Handle can be configured using a JSON file:

```json
{
  "projectName": "my-mcp-server",
  "version": "1.0.0",
  "description": "My custom MCP server",
  "author": "Your Name",
  "license": "MIT",
  "framework": "express"
}
```

## Templates

Axe Handle uses EJS templates to generate code. You can customize these templates by creating a `.axe-handle/templates` directory in your project:

```
.axe-handle/
  templates/
    express/
      src/
        server.ts.ejs
        handlers/
          connection-handler.ts.ejs
          message-handler.ts.ejs
```

## License

MIT
