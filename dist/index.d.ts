import { GeneratorOptions } from './types';
/**
 * Initialize the application by setting up the template manager
 * and config manager with proper paths.
 */
export declare function initialize(): void;
/**
 * Main function for generating an MCP server from a Protobuf schema.
 * Wrapped with error handling for better error reporting.
 *
 * @param options Configuration options for the generator
 */
export declare const generateMcpServer: (options: GeneratorOptions) => Promise<void>;
export * from './types';
export * from './utils/errorUtils';
export * from './utils/configManager';
export * from './utils/templateManager';
export { mcpProtocolParser } from './parser/mcpProtocolParser';
export { serviceParser } from './parser/serviceParser';
export { generator } from './generator/generator';
export { mapper } from './mcp/mapper';
