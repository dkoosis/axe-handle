Axe Handle: MCP Server Generator
Project Overview
Axe Handle is a code generator for creating Model Context Protocol (MCP) servers. It takes a service definition as input and generates a TypeScript/Express.js implementation of an MCP-compliant server. This tool bridges the gap between existing services and AI agents by enabling seamless integration through the MCP standard.
Core Architecture
Based on the files I've analyzed, here's an improved architectural foundation:
1. Input Processing Pipeline
CopyUser Schema (.proto) → Parser → Validator → Mapper → Generator → TypeScript Server

Parser: Processes the input schema (Protobuf format)
Validator: Ensures compliance with MCP specifications
Mapper: Transforms parsed schema into an intermediate representation
Generator: Creates server code from templates using the mapped data

2. Key Components

Template System: A flexible, cacheable template engine built around Eta
Validation Utilities: Comprehensive validation for inputs, paths, and schemas
Error Handling: Structured error types with detailed codes and messages
Result Pattern: Using neverthrow for functional error handling
Logging: Structured logging with categories and levels

3. Generated Server Structure
Copygenerated/
├── src/
│   ├── handlers/         # Resource and operation handlers
│   ├── utils/            # Utility functions
│   ├── models/           # Data models
│   ├── server.ts         # Express server setup
│   ├── index.ts          # Entry point
│   └── types.ts          # Type definitions
├── docs/                 # Generated documentation
└── package.json          # Dependencies and scripts
Technical Decisions

TypeScript for type safety and developer experience
Protobuf as the schema definition format
Express.js as the target server framework
Eta as the templating engine
Neverthrow for functional error handling
Structured Logging with categories and performance tracking

Development Standards

Directory Structure: Enforced through pre-commit hooks
File Headers: All source files must have proper path headers
Error Handling: Use Result pattern with neverthrow instead of exceptions
Documentation: JSDoc for all public interfaces
Testing: Unit tests for critical components (parser, mapper, generator)

Next Steps

Consolidate utility modules to improve maintainability
Add comprehensive test coverage
Create example schemas and generated outputs
Develop detailed documentation for both generator and generated code
Implement an interactive CLI experience 