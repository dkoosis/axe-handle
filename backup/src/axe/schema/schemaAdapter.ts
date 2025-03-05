// Path: src/parser/mcpSchemaAdapter.ts
// Creates a simplified MCP protocol from protocol.ts

import * as fs from 'fs/promises';
import * as ts from 'typescript';
import { McpProtocol } from "../axe/schema/types";
import { createParserError } from '../utils/errorUtils';

/**
 * Extracts a simplified MCP protocol from the protocol.ts file.
 * This adapter is more flexible than the full parser and works with different schema structures.
 */
export async function extractMcpProtocol(schemaPath: string): Promise<McpProtocol> {
  try {
    // Read the schema file
    const schemaContent = await fs.readFile(schemaPath, 'utf-8');
    
    // Parse the TypeScript content
    const sourceFile = ts.createSourceFile(
      schemaPath,
      schemaContent,
      ts.ScriptTarget.Latest,
      true
    );
    
    // Initialize the specification
    const spec: McpProtocol = {
      version: '1.0.0', // Default version
      operations: [],
      types: [],
      capabilities: []
    };
    
    // Find the protocol version
    const versionDeclaration = findVersionDeclaration(sourceFile);
    if (versionDeclaration) {
      spec.version = versionDeclaration;
    }
    
    // Extract operations from Request interfaces
    const requestInterfaces = findRequestInterfaces(sourceFile);
    for (const reqInterface of requestInterfaces) {
      const operationName = reqInterface.replace('Request', '');
      spec.operations.push({
        name: operationName,
        description: `MCP ${operationName} operation`,
        inputType: reqInterface,
        outputType: reqInterface.replace('Request', 'Result'),
        required: false
      });
    }
    
    // Extract types from other interfaces
    const typeInterfaces = findTypeInterfaces(sourceFile, requestInterfaces);
    for (const typeInterface of typeInterfaces) {
      spec.types.push({
        name: typeInterface,
        description: `MCP ${typeInterface} type`,
        fields: []  // We're simplifying by not extracting fields
      });
    }
    
    // Add basic capabilities
    spec.capabilities.push({
      name: 'resources',
      description: 'Server provides resources',
      required: false
    });
    
    spec.capabilities.push({
      name: 'tools',
      description: 'Server provides tools',
      required: false
    });
    
    // Perform basic validation
    if (spec.operations.length === 0) {
      throw createParserError(
        1002,
        'Failed to extract any operations from MCP schema',
        { schemaPath }
      );
    }
    
    return spec;
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error; // Rethrow existing AxeError
    }
    
    throw createParserError(
      1001,
      'Failed to extract MCP protocol',
      { schemaPath },
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Finds the protocol version declaration in the source file.
 */
function findVersionDeclaration(sourceFile: ts.SourceFile): string | undefined {
  let version: string | undefined;
  
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach(declaration => {
        if (
          ts.isIdentifier(declaration.name) &&
          (declaration.name.text === 'MCP_VERSION' || declaration.name.text === 'LATEST_PROTOCOL_VERSION') &&
          declaration.initializer &&
          ts.isStringLiteral(declaration.initializer)
        ) {
          version = declaration.initializer.text;
        }
      });
    }
  });
  
  return version;
}

/**
 * Finds all Request interfaces in the source file.
 */
function findRequestInterfaces(sourceFile: ts.SourceFile): string[] {
  const requestInterfaces: string[] = [];
  
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isInterfaceDeclaration(node)) {
      const interfaceName = node.name.text;
      if (interfaceName.endsWith('Request') && !interfaceName.startsWith('JSON')) {
        requestInterfaces.push(interfaceName);
      }
    }
  });
  
  return requestInterfaces;
}

/**
 * Finds all type interfaces (excluding request interfaces) in the source file.
 */
function findTypeInterfaces(sourceFile: ts.SourceFile, requestInterfaces: string[]): string[] {
  const typeInterfaces: string[] = [];
  
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isInterfaceDeclaration(node)) {
      const interfaceName = node.name.text;
      if (
        !interfaceName.endsWith('Request') && 
        !interfaceName.endsWith('Response') &&
        !interfaceName.endsWith('Notification') &&
        !requestInterfaces.includes(interfaceName)
      ) {
        typeInterfaces.push(interfaceName);
      }
    }
  });
  
  return typeInterfaces;
}
