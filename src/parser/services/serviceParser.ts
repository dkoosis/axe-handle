// Path: src/parser/services/serviceParser.ts
// Parses user-provided Protobuf service definitions and validates them against the MCP protocol.

import * as protobuf from 'protobufjs';
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  UserService, 
  UserResource, 
  UserType, 
  UserField, 
  McpProtocol,
  AxeError,
  ErrorPrefix,
  AxeErrorCategory
} from "@axe/schema/types";

/**
 * Creates an AxeError specific to the service parser.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
function createParserError(
  code: number,
  message: string,
  details?: Record<string, unknown>,
  cause?: Error | AxeError
): AxeError {
  return {
    code: `${ErrorPrefix.AXE}-${AxeErrorCategory.PARSER}${String(code).padStart(3, '0')}`,
    message,
    details,
    cause,
  };
}

/**
 * Service Parser.
 * Responsible for parsing user-provided Protobuf service definitions
 * and validating them against the MCP protocol.
 */
class ServiceParser {
  private static instance: ServiceParser;
  
  private constructor() {}
  
  /**
   * Gets the singleton instance of the ServiceParser.
   * @returns The ServiceParser instance
   */
  public static getInstance(): ServiceParser {
    if (!ServiceParser.instance) {
      ServiceParser.instance = new ServiceParser();
    }
    return ServiceParser.instance;
  }
  
  /**
   * Parses a Protobuf service definition and validates it against the MCP protocol.
   * @param filePath Path to the Protobuf file
   * @param mcpSpec The MCP protocol to validate against
   * @returns The parsed user service
   */
  public async parseService(
    filePath: string,
    mcpSpec: McpProtocol
  ): Promise<UserService> {
    try {
      // Read the Protobuf file
      const fileContent = await fs.readFile(filePath, 'utf-8');
      
      // Parse the Protobuf file
      const root = await protobuf.parse(fileContent);
      if (!root || !root.root) {
        throw createParserError(
          101,
          'Failed to parse Protobuf file',
          { path: filePath }
        );
      }
      
      // Extract package name
      const packageName = root.package || '';
      
      // Extract service name from file name
      const serviceName = this.extractServiceName(filePath);
      
      // Extract resources and types
      const { resources, types } = await this.extractResourcesAndTypes(root.root);
      
      // Create the user service
      const userService: UserService = {
        name: serviceName,
        package: packageName,
        resources,
        types
      };
      
      // Validate the user service
      this.validateUserService(userService, mcpSpec, filePath);
      
      return userService;
      
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        // Error is already an AxeError, rethrow
        throw error;
      }
      
      throw createParserError(
        100,
        'Failed to parse service',
        { path: filePath },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Extracts the service name from the file path.
   * @param filePath Path to the Protobuf file
   * @returns The service name
   */
  private extractServiceName(filePath: string): string {
    const fileName = path.basename(filePath, path.extname(filePath));
    // Convert kebab-case or snake_case to PascalCase
    return fileName
      .split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
  
  /**
   * Extracts resources and types from the Protobuf root.
   * @param root The Protobuf root
   * @returns The extracted resources and types
   */
  private async extractResourcesAndTypes(
    root: protobuf.Root
  ): Promise<{ resources: UserResource[], types: UserType[] }> {
    const resources: UserResource[] = [];
    const types: UserType[] = [];
    
    // Get all message types
    const messageTypes = this.getAllMessageTypes(root);
    
    // Extract resources and types
    for (const messageType of messageTypes) {
      const isResource = this.isResource(messageType);
      
      if (isResource) {
        resources.push(this.convertMessageToResource(messageType));
      } else {
        types.push(this.convertMessageToType(messageType));
      }
    }
    
    return { resources, types };
  }
  
  /**
   * Gets all message types from the Protobuf root.
   * @param root The Protobuf root
   * @returns Array of message types
   */
  private getAllMessageTypes(root: protobuf.Root): protobuf.Type[] {
    const messageTypes: protobuf.Type[] = [];
    
    // Find all namespaces (including the root)
    const namespaces: protobuf.NamespaceBase[] = [root];
    let currentIndex = 0;
    
    while (currentIndex < namespaces.length) {
      const namespace = namespaces[currentIndex++];
      
      // Add nested namespaces to the queue, BUT EXCLUDE message types
      Object.values(namespace.nested || {}).forEach(nestedObject => {
        if (nestedObject instanceof protobuf.Namespace && !(nestedObject instanceof protobuf.Type)) {
          namespaces.push(nestedObject);
        }
      });
      
      // Add message types from this namespace
      Object.values(namespace.nested || {}).forEach(nestedObject => {
        if (nestedObject instanceof protobuf.Type) {
          messageTypes.push(nestedObject);
        }
      });
    }
    
    return messageTypes;
  }
  
  /**
   * Determines if a message type is a resource.
   * Resources are top-level message types that are expected to have CRUD operations.
   * @param messageType The message type
   * @returns True if the message type is a resource
   */
  private isResource(messageType: protobuf.Type): boolean {
    // For now, assume that top-level message types that aren't nested are resources
    // In the future, we could look for annotations or naming conventions
    return !messageType.name.includes('.');
  }
  
  /**
   * Converts a Protobuf message to a user resource.
   * @param messageType The message type
   * @returns The user resource
   */
  private convertMessageToResource(messageType: protobuf.Type): UserResource {
    return {
      name: messageType.name,
      description: this.extractCommentFromOptions(messageType.options),
      fields: this.extractFields(messageType)
    };
  }
  
  /**
   * Converts a Protobuf message to a user type.
   * @param messageType The message type
   * @returns The user type
   */
  private convertMessageToType(messageType: protobuf.Type): UserType {
    return {
      name: messageType.name,
      description: this.extractCommentFromOptions(messageType.options),
      fields: this.extractFields(messageType)
    };
  }
  
  /**
   * Extracts fields from a Protobuf message.
   * @param messageType The message type
   * @returns Array of user fields
   */
  private extractFields(messageType: protobuf.Type): UserField[] {
    const fields: UserField[] = [];
    
    for (const [fieldName, field] of Object.entries(messageType.fields)) {
      fields.push({
        name: fieldName,
        type: this.convertProtoTypeToTypeName(field.type, field.resolvedType),
        // field.optional === false means required in proto3
        required: !field.optional,
        // Use field.repeated to determine if it's an array
        repeated: field.repeated || false,
        description: this.extractCommentFromOptions(field.options),
        fieldNumber: field.id
      });
    }
    
    return fields;
  }
  
  /**
   * Converts a Protobuf type to a type name.
   * @param protoType The Protobuf type
   * @param resolvedType The resolved type (for message references)
   * @returns The type name
   */
  private convertProtoTypeToTypeName(
    protoType: string,
    resolvedType: protobuf.Type | protobuf.Enum | null
  ): string {
    if (resolvedType) {
      return resolvedType.fullName.replace(/^\./, '');
    }
    
    // Map Protobuf scalar types to TypeScript types
    const typeMap: Record<string, string> = {
      'double': 'number',
      'float': 'number',
      'int32': 'number',
      'int64': 'string', // Use string for 64-bit integers to avoid precision loss
      'uint32': 'number',
      'uint64': 'string',
      'sint32': 'number',
      'sint64': 'string',
      'fixed32': 'number',
      'fixed64': 'string',
      'sfixed32': 'number',
      'sfixed64': 'string',
      'bool': 'boolean',
      'string': 'string',
      'bytes': 'Uint8Array'
    };
    
    return typeMap[protoType] || protoType;
  }
  
  /**
   * Extracts comments from Protobuf options.
   * @param options The Protobuf options object
   * @returns The extracted comment or a default description
   */
  private extractCommentFromOptions(options: any): string {
    if (!options) {
      return '';
    }
    
    // Extract comments from options (if they exist)
    const comment = options['(comment)'] || '';
    return comment.toString().trim();
  }
  
  /**
   * Validates the user service against the MCP protocol.
   * @param userService The user service to validate
   * @param mcpSpec The MCP protocol
   * @param filePath Path to the Protobuf file (for error messages)
   * @throws Error if the service is invalid
   */
  private validateUserService(
    userService: UserService,
    mcpSpec: McpProtocol,
    filePath: string
  ): void {
    // Check for empty service
    if (userService.resources.length === 0) {
      throw createParserError(
        102,
        'Service does not define any resources',
        { path: filePath }
      );
    }
    
    // Validate resources
    for (const resource of userService.resources) {
      // Check for empty resource
      if (resource.fields.length === 0) {
        throw createParserError(
          103,
          `Resource "${resource.name}" does not define any fields`,
          { path: filePath, resource: resource.name }
        );
      }
      
      // Check for ID field
      const idField = resource.fields.find(field => field.name === 'id');
      if (!idField) {
        throw createParserError(
          104,
          `Resource "${resource.name}" does not have an "id" field`,
          { path: filePath, resource: resource.name }
        );
      }
      
      // Validate field types
      for (const field of resource.fields) {
        this.validateFieldType(field, userService, mcpSpec, filePath);
      }
    }
    
    // Validate types
    for (const type of userService.types) {
      // Check for empty type
      if (type.fields.length === 0) {
        throw createParserError(
          105,
          `Type "${type.name}" does not define any fields`,
          { path: filePath, type: type.name }
        );
      }
      
      // Validate field types
      for (const field of type.fields) {
        this.validateFieldType(field, userService, mcpSpec, filePath);
      }
    }
  }
  
  /**
   * Validates a field type against the MCP protocol.
   * @param field The field to validate
   * @param userService The user service
   * @param mcpSpec The MCP protocol
   * @param filePath Path to the Protobuf file (for error messages)
   * @throws Error if the field type is invalid
   */
  private validateFieldType(
    field: UserField,
    userService: UserService,
    mcpSpec: McpProtocol,
    filePath: string
  ): void {
    // Check for primitive types
    const primitiveTypes = [
      'number', 'string', 'boolean', 'Uint8Array', 'Date', 'Timestamp'
    ];
    
    if (primitiveTypes.includes(field.type)) {
      return; // Primitive type is valid
    }
    
    // Check for user-defined types
    const userTypes = [
      ...userService.resources.map(resource => resource.name),
      ...userService.types.map(type => type.name)
    ];
    
    if (userTypes.includes(field.type)) {
      return; // User-defined type is valid
    }
    
    // Check for fully qualified user-defined types
    if (userService.package && field.type.startsWith(userService.package + '.')) {
      const localType = field.type.substring(userService.package.length + 1);
      if (userTypes.includes(localType)) {
        return; // Fully qualified user-defined type is valid
      }
    }
    
    // Check for MCP-defined types
    const mcpTypes = mcpSpec.types.map(type => type.name);
    if (mcpTypes.includes(field.type)) {
      return; // MCP-defined type is valid
    }
    
    // For google.protobuf.Timestamp specifically
    if (field.type === 'google.protobuf.Timestamp') {
      return; // Allow this special type
    }
    
    // Instead of throwing an error for unknown types, just log a warning
    console.warn(`Warning: Unknown type "${field.type}" for field "${field.name}" in file ${filePath}`);
    console.warn(`This may cause issues in the generated code. Consider using a known type.`);
  }
}

// Export the singleton instance
export const serviceParser = ServiceParser.getInstance();