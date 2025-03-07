// Path: src/parser/protocol/protocolCache.ts
// Parses the MCP protocol definition and provides a cached representation.

import * as ts from 'typescript';
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  McpProtocol, 
  McpOperation, 
  McpType, 
  McpField, 
  McpCapability
} from '@axe/schema/types';
import { createParserError } from '@utils/errorUtils';
import { logger, LogCategory } from '@utils/logger';
import { performance } from '@utils/performanceUtils';

/**
 * Path to the MCP protocol definition TypeScript file.
 */
const MCP_PROTOCOL_PATH = path.resolve(process.cwd(), 'schemas/mcp-spec/protocol.ts');

/**
 * Path to the cached MCP protocol definition JSON file.
 */
const MCP_PROTOCOL_CACHE_PATH = path.resolve(process.cwd(), 'schemas/mcp-spec/protocol.json');

/**
 * Default protocol version to use if none is found in the source.
 */
const DEFAULT_PROTOCOL_VERSION = '1.0.0';

/**
 * MCP Protocol Parser.
 * Responsible for parsing the MCP protocol definition and providing a cached representation.
 * Implemented as a singleton to allow caching of the parsed protocol across calls.
 */
class McpProtocolParser {
  private static instance: McpProtocolParser;
  
  private constructor() {}
  
  /**
   * Gets the singleton instance of the McpProtocolParser.
   * @returns The McpProtocolParser instance
   */
  public static getInstance(): McpProtocolParser {
    if (!McpProtocolParser.instance) {
      McpProtocolParser.instance = new McpProtocolParser();
    }
    return McpProtocolParser.instance;
  }

  /**
   * Parses the MCP protocol definition from the TypeScript file.
   * Tries to load from cache first, falls back to parsing from source if needed.
   */
  public async parseProtocol(): Promise<McpProtocol> {
    try {
      return await performance.track('parse-protocol', async () => {
        // Try to load from cache first
        const cachedProtocol = await this.loadFromCache();
        if (cachedProtocol) {
          logger.debug('Using cached MCP protocol', LogCategory.PARSER);
          return cachedProtocol;
        }
        
        // Parse from TypeScript source
        logger.debug('Parsing MCP protocol from source', LogCategory.PARSER);
        const parsedProtocol = await this.parseFromSource();
        
        // Cache the result
        await this.cacheProtocol(parsedProtocol);
        
        return parsedProtocol;
      });
    } catch (error) {
      if (error instanceof Error) {
        throw createParserError(
          1001,
          'Failed to parse MCP protocol definition',
          { path: MCP_PROTOCOL_PATH },
          error
        );
      }
      throw error;
    }
  }
  
  /**
   * Tries to load the MCP protocol definition from the cache file.
   * @returns The cached protocol or null if not available
   */
  private async loadFromCache(): Promise<McpProtocol | null> {
    try {
      // Check if cache exists
      try {
        await fs.access(MCP_PROTOCOL_CACHE_PATH);
      } catch {
        return null;
      }
      
      // Check if cache is newer than source
      const [cacheStats, sourceStats] = await Promise.all([
        fs.stat(MCP_PROTOCOL_CACHE_PATH),
        fs.stat(MCP_PROTOCOL_PATH)
      ]);
      
      if (cacheStats.mtime <= sourceStats.mtime) {
        logger.debug('Cache is older than source, will reparse', LogCategory.PARSER);
        return null; // Cache is older than source
      }
      
      // Load cache
      const cacheContent = await fs.readFile(MCP_PROTOCOL_CACHE_PATH, 'utf-8');
      const cachedProtocol = JSON.parse(cacheContent) as McpProtocol;
      
      return cachedProtocol;
    } catch (error) {
      // Cache loading failed, return null to trigger parsing from source
      logger.debug(`Cache loading failed: ${error instanceof Error ? error.message : String(error)}`, LogCategory.PARSER);
      return null;
    }
  }
  
  /**
   * Caches the parsed MCP protocol definition to a JSON file.
   * @param protocol The MCP protocol to cache
   */
  private async cacheProtocol(protocol: McpProtocol): Promise<void> {
    try {
      // Ensure directory exists
      const cacheDir = path.dirname(MCP_PROTOCOL_CACHE_PATH);
      await fs.mkdir(cacheDir, { recursive: true });
      
      // Write cache file
      await fs.writeFile(
        MCP_PROTOCOL_CACHE_PATH,
        JSON.stringify(protocol, null, 2),
        'utf-8'
      );
      
      logger.debug('MCP protocol cached successfully', LogCategory.PARSER);
    } catch (error) {
      // Caching failed, but we can still continue without the cache
      logger.warn('Failed to cache MCP protocol definition, continuing without cache', LogCategory.PARSER);
    }
  }
  
  /**
   * Parses the MCP protocol definition from the TypeScript source file.
   * @returns The parsed MCP protocol
   */
  private async parseFromSource(): Promise<McpProtocol> {
    // Read TypeScript source
    const sourceText = await fs.readFile(MCP_PROTOCOL_PATH, 'utf-8');
    
    // Create TypeScript program
    const fileName = MCP_PROTOCOL_PATH;
    const sourceFile = ts.createSourceFile(
      fileName,
      sourceText,
      ts.ScriptTarget.Latest,
      true
    );
    
    // Initialize protocol
    const protocol: McpProtocol = {
      version: DEFAULT_PROTOCOL_VERSION, // Default version, will be updated if found in source
      operations: [],
      types: [],
      capabilities: []
    };
    
    // Visit each node in the source file
    ts.forEachChild(sourceFile, (node) => {
      // Look for version declaration
      if (ts.isVariableStatement(node)) {
        node.declarationList.declarations.forEach(declaration => {
          if (
            ts.isIdentifier(declaration.name) &&
            declaration.name.text === 'LATEST_PROTOCOL_VERSION' &&
            declaration.initializer &&
            ts.isStringLiteral(declaration.initializer)
          ) {
            protocol.version = declaration.initializer.text;
          }
        });
      }
      
      // Look for interface declarations
      if (ts.isInterfaceDeclaration(node)) {
        const interfaceName = node.name.text;
        
        // Look for Request interfaces to determine available operations
        if (interfaceName.endsWith('Request') && 
            !interfaceName.includes('JSON') && 
            !interfaceName.includes('Paginated')) {
          const operation: McpOperation = {
            name: interfaceName.replace('Request', ''),
            description: this.getJSDocComment(node) || `MCP ${interfaceName.replace('Request', '')} operation`,
            inputType: interfaceName,
            outputType: interfaceName.replace('Request', 'Result'),
            required: true
          };
          
          protocol.operations.push(operation);
        }
        
        // Parse MCP types
        if (interfaceName.endsWith('Type') && interfaceName !== 'McpType') {
          const mcpType = this.parseTypeInterface(node);
          if (mcpType) {
            protocol.types.push(mcpType);
          }
        }
        
        // Parse MCP capabilities
        if (interfaceName === 'ServerCapabilities' || interfaceName === 'ClientCapabilities') {
          this.parseCapabilitiesInterface(node, protocol.capabilities);
        }
      }
    });
    
    // Validate the parsed protocol
    this.validateProtocol(protocol);
    
    return protocol;
  }
    
  /**
   * Parses an MCP type interface to extract type definition.
   * @param node The interface declaration node
   * @returns The parsed MCP type or undefined if parsing failed
   */
  private parseTypeInterface(node: ts.InterfaceDeclaration): McpType | undefined {
    const typeName = node.name.text;
    const description = this.getJSDocComment(node);
    const fields: McpField[] = [];
    
    node.members.forEach(member => {
      if (ts.isPropertySignature(member)) {
        const fieldName = member.name.getText().replace(/['"]/g, '');
        const fieldDescription = this.getJSDocComment(member);
        const isRepeated = this.isRepeatedType(member.type);
        
        const field: McpField = {
          name: fieldName,
          type: this.extractFieldType(member.type),
          required: member.questionToken === undefined,
          repeated: isRepeated,
          description: fieldDescription || `${fieldName} field`
        };
        
        fields.push(field);
      }
    });
    
    if (fields.length === 0) {
      return undefined; // Skip empty types
    }
    
    return {
      name: typeName,
      description: description || `MCP ${typeName}`,
      fields
    };
  }
  
  /**
   * Parses the McpCapabilities interface to extract capability definitions.
   * @param node The interface declaration node
   * @param capabilities Array to populate with parsed capabilities
   */
  private parseCapabilitiesInterface(node: ts.InterfaceDeclaration, capabilities: McpCapability[]): void {
    node.members.forEach(member => {
      if (ts.isPropertySignature(member)) {
        const capabilityName = member.name.getText().replace(/['"]/g, '');
        const description = this.getJSDocComment(member);
        
        const capability: McpCapability = {
          name: capabilityName,
          description: description || `MCP ${capabilityName} capability`,
          required: member.questionToken === undefined
        };
        
        capabilities.push(capability);
      }
    });
  }
    
  /**
   * Extracts the field type from a type node.
   * @param typeNode The type node
   * @returns The field type name
   */
  private extractFieldType(typeNode: ts.TypeNode | undefined): string {
    if (!typeNode) {
      return 'any';
    }
    
    // Handle array types
    if (this.isRepeatedType(typeNode)) {
      if (ts.isArrayTypeNode(typeNode)) {
        return this.extractFieldType(typeNode.elementType);
      } else if (
        ts.isTypeReferenceNode(typeNode) && 
        typeNode.typeName.getText() === 'Array' && 
        typeNode.typeArguments && 
        typeNode.typeArguments.length > 0
      ) {
        return this.extractFieldType(typeNode.typeArguments[0]);
      }
    }
    
    // Handle regular types
    if (ts.isTypeReferenceNode(typeNode)) {
      return typeNode.typeName.getText();
    }
    
    // Handle union types
    if (ts.isUnionTypeNode(typeNode)) {
      // For simplicity, use the first type in the union
      return this.extractFieldType(typeNode.types[0]);
    }
    
    // Handle primitive types
    return typeNode.getText();
  }
  
  /**
   * Determines if a type node represents a repeated (array) type.
   * @param typeNode The type node
   * @returns True if the type is an array type
   */
  private isRepeatedType(typeNode: ts.TypeNode | undefined): boolean {
    if (!typeNode) {
      return false;
    }
    
    if (ts.isArrayTypeNode(typeNode)) {
      return true;
    }
    
    if (
      ts.isTypeReferenceNode(typeNode) && 
      typeNode.typeName.getText() === 'Array' && 
      typeNode.typeArguments && 
      typeNode.typeArguments.length > 0
    ) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Extracts the JSDoc comment for a node.
   * @param node The TypeScript node
   * @returns The JSDoc comment text or undefined if not found
   */
  private getJSDocComment(node: ts.Node): string | undefined {
    const jsDocComments = ts.getJSDocCommentsAndTags(node);
    if (jsDocComments && jsDocComments.length > 0) {
      const jsDocComment = jsDocComments[0];
      if (ts.isJSDoc(jsDocComment)) {
        // Fix the type issue with the comment property
        return jsDocComment.comment as string | undefined;
      }
    }
    return undefined;
  }
  
  /**
   * Validates the parsed MCP protocol.
   * @param protocol The MCP protocol to validate
   * @throws Error if the protocol is invalid
   */
  private validateProtocol(protocol: McpProtocol): void {
    // Check for required components
    if (protocol.operations.length === 0) {
      throw createParserError(
        1002,
        'MCP protocol definition does not define any operations',
        { path: MCP_PROTOCOL_PATH }
      );
    }
    
    if (protocol.types.length === 0) {
      // Instead of throwing an error, add some basic types
      protocol.types.push({
        name: 'String',
        description: 'String type',
        fields: []
      });
      
      protocol.types.push({
        name: 'Number',
        description: 'Number type',
        fields: []
      });
      
      protocol.types.push({
        name: 'Boolean',
        description: 'Boolean type',
        fields: []
      });
      
      logger.warn('No types found in MCP protocol definition, using basic types', LogCategory.PARSER);
    }
    
    // Some basic CRUD operations should be available
    const basicOperations = ['Get', 'List', 'Create', 'Update', 'Delete'];
    const foundBasicOps = basicOperations.filter(op => 
      protocol.operations.some(protocolOp => protocolOp.name.includes(op))
    );
    
    if (foundBasicOps.length === 0) {
      logger.warn('No basic CRUD operations found in MCP protocol definition', LogCategory.PARSER);
    }
    
    // Check for required capabilities
    if (protocol.capabilities.length === 0) {
      // Add default capabilities instead of throwing an error
      protocol.capabilities.push({
        name: 'resources',
        description: 'Server can provide resources',
        required: false
      });
      
      protocol.capabilities.push({
        name: 'tools',
        description: 'Server can provide tools',
        required: false
      });
      
      logger.warn('No capabilities found in MCP protocol definition, using default capabilities', LogCategory.PARSER);
    }
  }
}

// Export the singleton instance
export const mcpProtocolParser = McpProtocolParser.getInstance();
