import { GeneratorOptions } from './types';
/**
 * Main function for generating an MCP server from a Protobuf schema.
 * @param options Configuration options for the generator
 */
export declare function generateMcpServer(options: GeneratorOptions): Promise<void>;
export * from './types';
export { mcpSpecParser } from './parser/mcpSpecParser';
export { serviceParser } from './parser/serviceParser';
export { generator } from './generator/generator';
export { mapper } from './mcp/mapper';
