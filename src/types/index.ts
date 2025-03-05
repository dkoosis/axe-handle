// Path: src/types/index.ts
// Contains shared TypeScript type definitions used throughout the project.

/**
 * Error code prefixes used throughout the application.
 * AXE-*: Internal Axe Handle errors
 * MCP-*: MCP protocol or generated server errors
 */
export enum ErrorPrefix {
  AXE = 'AXE',
  MCP = 'MCP',
}

/**
 * Error categories for Axe Handle.
 */
export enum AxeErrorCategory {
  PARSER = 1, // 1XXX
  CLI = 2,    // 2XXX
  GENERATOR = 3, // 3XXX
  MAPPER = 4, // 4XXX
}

/**
 * Error categories for MCP.
 */
export enum McpErrorCategory {
  PROTOCOL = 1, // 1XXX (was SPECIFICATION)
  RUNTIME = 4, // 4XXX (aligns with HTTP 4XX status codes)
}

/**
 * Structure of an error in the Axe Handle system.
 */
export interface AxeError {
  /** Unique error code (e.g., AXE-1001) */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional details about the error (e.g., file name, line number) */
  details?: Record<string, unknown>;
  /** Underlying error, if any */
  cause?: Error | AxeError;
}

/**
 * Options for the code generator.
 */
export interface GeneratorOptions {
  /** Input file path (Protobuf or OpenAPI) */
  inputFile: string;
  /** Output directory for generated code */
  outputDir: string;
  /** Optional configuration file path */
  configFile?: string;
  /** Whether to overwrite existing files */
  overwrite?: boolean;
  /** Whether to enable interactive mode with prompts */
  interactive?: boolean;
  /** Whether to generate documentation */  
  generateDocs?: boolean;
  /** Verbose output */
  verbose?: boolean;
}

/**
 * Represents a parsed MCP protocol definition.
 */
export interface McpProtocol {
  /** Version of the MCP protocol */
  version: string;
  /** Available operations */
  operations: McpOperation[];
  /** Available types */
  types: McpType[];
  /** Available capabilities */
  capabilities: McpCapability[];
}

/**
 * Represents an MCP operation.
 */
export interface McpOperation {
  /** Name of the operation */
  name: string;
  /** Description of the operation */
  description: string;
  /** Input type */
  inputType: string;
  /** Output type */
  outputType: string;
  /** Whether the operation is required */
  required: boolean;
}

/**
 * Represents an MCP type.
 */
export interface McpType {
  /** Name of the type */
  name: string;
  /** Description of the type */
  description: string;
  /** Fields of the type */
  fields: McpField[];
}

/**
 * Represents a field in an MCP type.
 */
export interface McpField {
  /** Name of the field */
  name: string;
  /** Type of the field */
  type: string;
  /** Whether the field is required */
  required: boolean;
  /** Whether the field is repeated (array) */
  repeated: boolean;
  /** Description of the field */
  description: string;
}

/**
 * Represents an MCP capability.
 */
export interface McpCapability {
  /** Name of the capability */
  name: string;
  /** Description of the capability */
  description: string;
  /** Whether the capability is required */
  required: boolean;
}

/**
 * Represents a parsed user service from a Protobuf service definition.
 */
export interface UserService {
  /** Name of the service */
  name: string;
  /** Package name */
  package: string;
  /** Resources defined in the service */
  resources: UserResource[];
  /** Custom types defined in the service */
  types: UserType[];
}

/**
 * Represents a resource in the user service.
 */
export interface UserResource {
  /** Name of the resource */
  name: string;
  /** Description of the resource from comments */
  description: string;
  /** Fields of the resource */
  fields: UserField[];
}

/**
 * Represents a custom type in the user service.
 */
export interface UserType {
  /** Name of the type */
  name: string;
  /** Description of the type from comments */
  description: string;
  /** Fields of the type */
  fields: UserField[];
}

/**
 * Represents a field in a user resource or type.
 */
export interface UserField {
  /** Name of the field */
  name: string;
  /** Type of the field */
  type: string;
  /** Whether the field is required */
  required: boolean;
  /** Whether the field is repeated (array) */
  repeated: boolean;
  /** Description of the field from comments */
  description: string;
  /** Field number in the Protobuf definition */
  fieldNumber: number;
}

/**
 * Mapped service ready for code generation.
 */
export interface MappedService {
  /** Name of the service */
  name: string;
  /** Original service from the user */
  originalService: UserService;
  /** Mapped resources with MCP operations */
  resources: MappedResource[];
  /** Generated types required for the MCP server */
  types: MappedType[];
}

/**
 * Mapped resource ready for code generation.
 */
export interface MappedResource {
  /** Name of the resource */
  name: string;
  /** Description of the resource */
  description: string;
  /** MCP operations available for this resource */
  operations: MappedOperation[];
  /** Fields of the resource */
  fields: MappedField[];
}

/**
 * Mapped operation ready for code generation.
 */
export interface MappedOperation {
  /** Name of the operation (e.g., Get, List, Create) */
  name: string;
  /** HTTP method for the operation */
  httpMethod: string;
  /** Route path for the operation */
  route: string;
  /** Input type for the operation */
  inputType: string;
  /** Output type for the operation */
  outputType: string;
  /** Description of the operation */
  description: string;
}

/**
 * Mapped type ready for code generation.
 */
export interface MappedType {
  /** Name of the type */
  name: string;
  /** Description of the type */
  description: string;
  /** Fields of the type */
  fields: MappedField[];
  /** Whether this is a resource type or a supporting type */
  isResource: boolean;
}

/**
 * Mapped field ready for code generation.
 */
export interface MappedField {
  /** Name of the field */
  name: string;
  /** TypeScript type for the field */
  tsType: string;
  /** Original Protobuf type */
  protoType: string;
  /** Whether the field is required */
  required: boolean;
  /** Whether the field is repeated (array) */
  repeated: boolean;
  /** Description of the field */
  description: string;
}