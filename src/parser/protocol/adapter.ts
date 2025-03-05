// Path: src/parser/protocol/adapter.ts
// Creates a simplified MCP protocol from protocol.ts

import * as fs from 'fs/promises';
import * as ts from 'typescript';
import { McpProtocol, McpOperation, McpType } from '@axe/schema/types';
import { createParserError } from '@utils/errorUtils';
import { logger, LogCategory } from '@utils/logger';
import { performance } from '@utils/performanceUtils';

/**
 * Default protocol version to use if none is found in the source.
 */
const DEFAULT_PROTOCOL_VERSION = '1.0.0';

/**
 * Extracts a simplified MCP protocol from the protocol.ts file.
 * This adapter is more flexible than the full parser and works with different schema structures.
 * 
 * @param schemaPath Path to the MCP schema file
 * @returns Promise with the extracted MCP protocol
 * @throws Error if extraction fails
 */
export async function extractMcpProtocol(schemaPath: string): Promise<McpProtocol> {
  return performance.track('extract-mcp-protocol', async () => {
    try {
      logger.debug(`Extracting MCP protocol from ${schemaPath}`, LogCategory.PARSER);
      
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
        version: DEFAULT_PROTOCOL_VERSION, // Default version
        operations: [],
        types: [],
        capabilities: []
      };
      
      // Find the protocol version
      const versionDeclaration = findVersionDeclaration(sourceFile);
      if (versionDeclaration) {
        spec.version = versionDeclaration;
        logger.debug(`Found protocol version: ${versionDeclaration}`, LogCategory.PARSER);
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
      
      logger.debug(`Extracted ${spec.operations.length} operations`, LogCategory.PARSER);
      
      // Extract types from other interfaces
      const typeInterfaces = findTypeInterfaces(sourceFile, requestInterfaces);
      for (const typeInterface of typeInterfaces) {
        spec.types.push({
          name: typeInterface,
          description: `MCP ${typeInterface} type`,
          fields: []  // We're simplifying by not extracting fields
        });
      }
      
      logger.debug(`Extracted ${spec.types.length} types`, LogCategory.PARSER);
      
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
      
      logger.success('MCP protocol extracted successfully', LogCategory.PARSER);
      return enrichProtocol(spec);
      
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
  });
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
          (declaration.name.text === 'MCP_VERSION' || 
           declaration.name.text === 'LATEST_PROTOCOL_VERSION' || 
           declaration.name.text === 'PROTOCOL_VERSION') &&
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
      if (interfaceName.endsWith('Request') && 
          !interfaceName.startsWith('JSON') && 
          !interfaceName.includes('Paginated')) {
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
        !requestInterfaces.includes(interfaceName) &&
        !interfaceName.startsWith('JSON')
      ) {
        typeInterfaces.push(interfaceName);
      }
    }
  });
  
  return typeInterfaces;
}

/**
 * Enriches a basic protocol with additional inferred information.
 */
function enrichProtocol(protocol: McpProtocol): McpProtocol {
  // Add standard CRUD operations if none exist
  if (protocol.operations.length === 0) {
    addStandardCrudOperations(protocol);
  }
  
  // Ensure basic types exist
  ensureBasicTypes(protocol);
  
  return protocol;
}

/**
 * Adds standard CRUD operations to a protocol.
 */
function addStandardCrudOperations(protocol: McpProtocol): void {
  const standardOperations: McpOperation[] = [
    {
      name: 'GetResource',
      description: 'Get a resource by ID',
      inputType: 'GetResourceRequest',
      outputType: 'GetResourceResult',
      required: true
    },
    {
      name: 'ListResources',
      description: 'List resources with pagination',
      inputType: 'ListResourcesRequest',
      outputType: 'ListResourcesResult',
      required: true
    },
    {
      name: 'CreateResource',
      description: 'Create a new resource',
      inputType: 'CreateResourceRequest',
      outputType: 'CreateResourceResult',
      required: true
    },
    {
      name: 'UpdateResource',
      description: 'Update an existing resource',
      inputType: 'UpdateResourceRequest',
      outputType: 'UpdateResourceResult',
      required: true
    },
    {
      name: 'DeleteResource',
      description: 'Delete a resource',
      inputType: 'DeleteResourceRequest',
      outputType: 'DeleteResourceResult',
      required: true
    }
  ];
  
  protocol.operations.push(...standardOperations);
  logger.debug('Added standard CRUD operations to protocol', LogCategory.PARSER);
}

/**
 * Ensures basic types exist in a protocol.
 */
function ensureBasicTypes(protocol: McpProtocol): void {
  // Check if we need to add basic types
  if (protocol.types.length === 0) {
    const basicTypes: McpType[] = [
      {
        name: 'Resource',
        description: 'Base resource type',
        fields: [
          {
            name: 'id',
            type: 'string',
            required: true,
            repeated: false,
            description: 'Unique identifier for the resource'
          },
          {
            name: 'name',
            type: 'string',
            required: true,
            repeated: false,
            description: 'Name of the resource'
          },
          {
            name: 'description',
            type: 'string',
            required: false,
            repeated: false,
            description: 'Description of the resource'
          }
        ]
      },
      {
        name: 'StringType',
        description: 'String type',
        fields: []
      },
      {
        name: 'NumberType',
        description: 'Number type',
        fields: []
      },
      {
        name: 'BooleanType',
        description: 'Boolean type',
        fields: []
      }
    ];
    
    protocol.types.push(...basicTypes);
    logger.debug('Added basic types to protocol', LogCategory.PARSER);
  }
}