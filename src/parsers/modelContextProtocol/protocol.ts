/**
 * TypeScript interface definitions for the Model Context Protocol (MCP)
 * These are generated from the protocol.json schema definition
 */

export interface MCPResource {
  name: string;
  description?: string;
  fields: MCPField[];
  operations: MCPOperation[];
}

export interface MCPField {
  name: string;
  description?: string;
  type: string;
  required?: boolean;
  repeated?: boolean;
}

export interface MCPOperation {
  name: string;
  description?: string;
  inputType?: string;
  outputType: string;
  errors?: MCPError[];
}

export interface MCPError {
  name: string;
  description?: string;
  code?: number;
}

export interface MCPSchema {
  name: string;
  description?: string;
  version: string;
  resources: MCPResource[];
}

// Function to validate a schema against the MCP specification
export function validateMCPSchema(schema: any): boolean {
  // Basic validation checks
  if (!schema.name || !schema.version || !Array.isArray(schema.resources)) {
    return false;
  }

  // Additional validation could be implemented here
  
  return true;
}

// Function to get a specific resource from a schema
export function getResource(schema: MCPSchema, resourceName: string): MCPResource | undefined {
  return schema.resources.find(resource => resource.name === resourceName);
}

// Function to get a specific operation from a resource
export function getOperation(resource: MCPResource, operationName: string): MCPOperation | undefined {
  return resource.operations.find(operation => operation.name === operationName);
}
